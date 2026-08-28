import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConfigWorkflowNotificationTables1700000000051 implements MigrationInterface {
  name = 'AddConfigWorkflowNotificationTables1700000000051';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Configuration - System Config
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "config_system" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "key" VARCHAR(200) NOT NULL,
        "value" TEXT NOT NULL,
        "value_type" VARCHAR(20) NOT NULL DEFAULT 'STRING',
        "description" TEXT,
        "scope" VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
        "is_encrypted" BOOLEAN NOT NULL DEFAULT FALSE,
        "category" VARCHAR(100),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "UQ_config_system_key" UNIQUE ("key")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_config_system_category" ON "config_system" ("category")`);

    // Configuration - Tenant Config
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "config_tenant" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "key" VARCHAR(200) NOT NULL,
        "value" TEXT NOT NULL,
        "value_type" VARCHAR(20) NOT NULL DEFAULT 'STRING',
        "description" TEXT,
        "category" VARCHAR(100),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "UQ_config_tenant_tenant_key" UNIQUE ("tenant_id", "key")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_config_tenant_tenant_category" ON "config_tenant" ("tenant_id", "category")`);

    // Configuration - Feature Flags
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "config_feature_flags" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "key" VARCHAR(100) NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "state" VARCHAR(20) NOT NULL DEFAULT 'DISABLED',
        "percentage" INTEGER NOT NULL DEFAULT 100,
        "allowed_tenant_ids" TEXT,
        "allowed_roles" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "UQ_config_feature_flags_key" UNIQUE ("key")
      )
    `);

    // Workflow - Workflows
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workflows" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "entity_type" VARCHAR(100) NOT NULL,
        "steps" JSONB NOT NULL DEFAULT '[]',
        "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workflows_tenant_entity" ON "workflows" ("tenant_id", "entity_type")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workflows_tenant_status" ON "workflows" ("tenant_id", "status")`);

    // Workflow - Workflow Instances
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workflow_instances" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "workflow_id" UUID NOT NULL,
        "entity_type" VARCHAR(100) NOT NULL,
        "entity_id" UUID NOT NULL,
        "initiated_by" UUID NOT NULL,
        "data" JSONB NOT NULL DEFAULT '{}',
        "status" VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
        "current_step_index" INTEGER NOT NULL DEFAULT 0,
        "actions" JSONB NOT NULL DEFAULT '[]',
        "completed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workflow_instances_tenant_workflow" ON "workflow_instances" ("tenant_id", "workflow_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workflow_instances_tenant_entity" ON "workflow_instances" ("tenant_id", "entity_type", "entity_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workflow_instances_tenant_status" ON "workflow_instances" ("tenant_id", "status")`);

    // Notification - Enhance existing notifications table
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "channel" VARCHAR(20) NOT NULL DEFAULT 'IN_APP'`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL'`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING'`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "data" JSONB NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "template_id" UUID`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "template_variables" JSONB NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "sent_at" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMPTZ`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_tenant_user" ON "notifications" ("tenant_id", "user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_tenant_status" ON "notifications" ("tenant_id", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_tenant_channel" ON "notifications" ("tenant_id", "channel")`);

    // Notification - Templates
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_templates" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "channel" VARCHAR(20) NOT NULL,
        "subject" VARCHAR(255),
        "body_template" TEXT NOT NULL,
        "variables" TEXT NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "UQ_notification_templates_tenant_name" UNIQUE ("tenant_id", "name")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notification_templates_tenant_channel" ON "notification_templates" ("tenant_id", "channel")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "notification_templates"');
    await queryRunner.query('ALTER TABLE "notifications" DROP COLUMN IF EXISTS "channel"');
    await queryRunner.query('ALTER TABLE "notifications" DROP COLUMN IF EXISTS "priority"');
    await queryRunner.query('ALTER TABLE "notifications" DROP COLUMN IF EXISTS "status"');
    await queryRunner.query('ALTER TABLE "notifications" DROP COLUMN IF EXISTS "data"');
    await queryRunner.query('ALTER TABLE "notifications" DROP COLUMN IF EXISTS "template_id"');
    await queryRunner.query('ALTER TABLE "notifications" DROP COLUMN IF EXISTS "template_variables"');
    await queryRunner.query('ALTER TABLE "notifications" DROP COLUMN IF EXISTS "sent_at"');
    await queryRunner.query('ALTER TABLE "notifications" DROP COLUMN IF EXISTS "read_at"');
    await queryRunner.query('DROP TABLE IF EXISTS "workflow_instances"');
    await queryRunner.query('DROP TABLE IF EXISTS "workflows"');
    await queryRunner.query('DROP TABLE IF EXISTS "config_feature_flags"');
    await queryRunner.query('DROP TABLE IF EXISTS "config_tenant"');
    await queryRunner.query('DROP TABLE IF EXISTS "config_system"');
  }
}
