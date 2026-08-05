import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

const DEMO_USER_IDS = [
  'b0000000-0000-0000-0000-000000000015',
  'b0000000-0000-0000-0000-000000000016',
];

export class RotateDemoUserPasswords1700000000021 implements MigrationInterface {
  name = 'RotateDemoUserPasswords1700000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const id of DEMO_USER_IDS) {
      const randomPassword = randomBytes(24).toString('base64');
      const hash = await argon2.hash(randomPassword);
      await queryRunner.query(
        `UPDATE "users" SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [hash, id],
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // The previous demo password hash is intentionally not restored.
  }
}
