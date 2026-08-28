import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiInteractions1700000000054 implements MigrationInterface {
  name = 'AddAiInteractions1700000000054';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS "ai_interactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid,
        "module" VARCHAR(50) NOT NULL,
        "feature" VARCHAR(20),
        "message" TEXT NOT NULL,
        "response" TEXT,
        "context_summary" VARCHAR(255),
        "feedback" VARCHAR(10),
        "latency_ms" INTEGER,
        "provider" VARCHAR(20),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS "IDX_ai_interactions_tenant_module" ON "ai_interactions" ("tenant_id", "module")`);
    await qr.query(`CREATE INDEX IF NOT EXISTS "IDX_ai_interactions_tenant_feature" ON "ai_interactions" ("tenant_id", "feature")`);
    await qr.query(`CREATE INDEX IF NOT EXISTS "IDX_ai_interactions_tenant_created" ON "ai_interactions" ("tenant_id", "created_at")`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS "ai_interactions"`);
  }
}
