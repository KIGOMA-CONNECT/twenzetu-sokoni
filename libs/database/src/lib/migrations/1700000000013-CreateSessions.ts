import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Refresh-token sessions for JWT session persistence and force-logout.
 * Global table (no RLS) — auth precedes tenant resolution, mirroring the
 * `users`/`otps` posture in InitialSchema1700000000000.
 */
export class CreateSessions1700000000013 implements MigrationInterface {
  public name = 'CreateSessions1700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "tenant_id" UUID NOT NULL,
        "refresh_token_hash" VARCHAR(255) NOT NULL,
        "token_version" INTEGER NOT NULL DEFAULT 1,
        "device_name" VARCHAR(200),
        "ip_address" VARCHAR(45),
        "user_agent" TEXT,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "revoked_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_refresh_token_hash" ON "sessions" ("refresh_token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_expires_at" ON "sessions" ("expires_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sessions"`);
  }
}
