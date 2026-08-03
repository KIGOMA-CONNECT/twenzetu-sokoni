import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { GlobalUnitOfWork } from '@abms/database';
import { Email, EntityId, TenantId } from '@abms/kernel';
import { Tenant, User } from '@abms/identity-domain';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { IDENTITY_ENTITIES } from '../identity-entities';
import { ArgonPasswordHasher } from '../password/argon-password-hasher';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { TypeOrmTenantRepository } from './typeorm-tenant.repository';
import { TypeOrmUserRepository } from './typeorm-user.repository';

interface PolicyRow {
  policyname: string;
}

describe('Identity tables correctness (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let unitOfWork: GlobalUnitOfWork;
  const passwordHasher = new ArgonPasswordHasher();
  const jwtService = new JwtService({ secret: 'a'.repeat(32), signOptions: { expiresIn: '1h' } });
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const config = new AppConfigService(process.env);

    ownerDataSource = new DataSource({
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      username: config.database.ownerUser,
      password: config.database.ownerPassword,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      logging: false,
    });
    await ownerDataSource.initialize();

    runtimeDataSource = new DataSource({
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      username: config.database.runtimeUser,
      password: config.database.runtimePassword,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      logging: false,
      entities: IDENTITY_ENTITIES,
    });
    await runtimeDataSource.initialize();

    unitOfWork = new GlobalUnitOfWork(runtimeDataSource);
  });

  afterAll(async () => {
    // No RLS on these tables (see ADR-0005) — plain deletes, no tenant GUC needed.
    if (createdEmails.length > 0) {
      await ownerDataSource.query(`DELETE FROM "user" WHERE "email" = ANY($1)`, [createdEmails]);
    }
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('registers a tenant + user, logs in, and issues a JWT with correct claims', async () => {
    const email = Email.create('integration-ceo@afribiz.co.tz').getValue();
    createdEmails.push(email.value);

    const { tenant, user } = await unitOfWork.withTransaction(async (ctx) => {
      const tenantRepository = new TypeOrmTenantRepository(ctx.manager);
      const userRepository = new TypeOrmUserRepository(ctx.manager);

      const newTenant = Tenant.create({ name: 'Integration Test Business' });
      await tenantRepository.save(newTenant);

      const passwordHash = await passwordHasher.hash('StrongPass1');
      const newUser = User.create({
        tenantId: TenantId.create(newTenant.id.toValue()).getValue(),
        email,
        passwordHash,
        role: 'CEO',
      });
      await userRepository.save(newUser);

      return { tenant: newTenant, user: newUser };
    });

    // "Login": re-fetch by email (as the real LoginHandler does) and verify the password.
    const foundUser = await unitOfWork.withTransaction((ctx) =>
      new TypeOrmUserRepository(ctx.manager).findByEmail(email),
    );
    expect(foundUser).not.toBeNull();
    expect(foundUser?.id.equals(user.id)).toBe(true);

    const passwordMatches = await passwordHasher.verify(foundUser!.passwordHash, 'StrongPass1');
    expect(passwordMatches).toBe(true);

    const payload: JwtPayload = {
      sub: foundUser!.id.toValue(),
      tenantId: foundUser!.tenantId.value,
      role: foundUser!.role,
      email: foundUser!.email.value,
    };
    const accessToken = jwtService.sign(payload);
    const decoded = jwtService.verify<JwtPayload>(accessToken);

    expect(decoded.sub).toBe(user.id.toValue());
    expect(decoded.tenantId).toBe(tenant.id.toValue());
    expect(decoded.role).toBe('CEO');
    expect(decoded.email).toBe(email.value);
  });

  it('rejects a duplicate email at the DB level', async () => {
    const email = Email.create('integration-duplicate@afribiz.co.tz').getValue();
    createdEmails.push(email.value);

    const makeUser = () =>
      User.create({
        tenantId: TenantId.create(EntityId.create().toValue()).getValue(),
        email,
        passwordHash: 'irrelevant-hash',
        role: 'TEAM_MEMBER',
      });

    await unitOfWork.withTransaction((ctx) => new TypeOrmUserRepository(ctx.manager).save(makeUser()));

    await expect(
      unitOfWork.withTransaction((ctx) => new TypeOrmUserRepository(ctx.manager).save(makeUser())),
    ).rejects.toThrow();
  });

  it('has no RLS policy on the tenant or user tables', async () => {
    const tenantPolicies: PolicyRow[] = await ownerDataSource.query(
      `SELECT policyname FROM pg_policies WHERE tablename = 'tenant'`,
    );
    const userPolicies: PolicyRow[] = await ownerDataSource.query(
      `SELECT policyname FROM pg_policies WHERE tablename = 'user'`,
    );

    expect(tenantPolicies).toHaveLength(0);
    expect(userPolicies).toHaveLength(0);
  });
});
