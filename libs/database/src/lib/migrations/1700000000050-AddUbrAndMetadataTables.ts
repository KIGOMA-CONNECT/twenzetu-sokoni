import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUbrAndMetadataTables1700000000050 implements MigrationInterface {
  name = 'AddUbrAndMetadataTables1700000000050';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Universal Business Registry - Registered Entities
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ubr_registered_entities" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "entity_type" VARCHAR(100) NOT NULL,
        "entity_category" VARCHAR(50) NOT NULL,
        "display_name" VARCHAR(255) NOT NULL,
        "state" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "attributes" JSONB NOT NULL DEFAULT '{}',
        "tags" TEXT,
        "parent_entity_id" UUID,
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_by" UUID,
        "updated_by" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "IDX_ubr_entities_tenant_type" ON "ubr_registered_entities" ("tenant_id", "entity_type");
      CREATE INDEX IF NOT EXISTS "IDX_ubr_entities_tenant_category" ON "ubr_registered_entities" ("tenant_id", "entity_category");
      CREATE INDEX IF NOT EXISTS "IDX_ubr_entities_tenant_state" ON "ubr_registered_entities" ("tenant_id", "state");
      CREATE INDEX IF NOT EXISTS "IDX_ubr_entities_tenant_name" ON "ubr_registered_entities" ("tenant_id", "display_name");
    `);

    // Universal Business Registry - Entity Relationships
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ubr_entity_relationships" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "source_entity_type" VARCHAR(100) NOT NULL,
        "target_entity_type" VARCHAR(100) NOT NULL,
        "relationship_type" VARCHAR(50) NOT NULL,
        "label" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "cardinality" VARCHAR(30) NOT NULL DEFAULT 'ONE_TO_MANY',
        "state" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "properties" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "IDX_ubr_rel_source_target" ON "ubr_entity_relationships" ("source_entity_type", "target_entity_type");
      CREATE INDEX IF NOT EXISTS "IDX_ubr_rel_type" ON "ubr_entity_relationships" ("relationship_type");
    `);

    // Metadata Engine - Field Metadata
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "metadata_fields" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "entity_type" VARCHAR(100) NOT NULL,
        "field_name" VARCHAR(100) NOT NULL,
        "field_type" VARCHAR(30) NOT NULL,
        "label" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "is_required" BOOLEAN NOT NULL DEFAULT FALSE,
        "is_unique" BOOLEAN NOT NULL DEFAULT FALSE,
        "is_read_only" BOOLEAN NOT NULL DEFAULT FALSE,
        "is_hidden" BOOLEAN NOT NULL DEFAULT FALSE,
        "default_value" JSONB,
        "options" JSONB NOT NULL DEFAULT '[]',
        "validation" JSONB NOT NULL DEFAULT '[]',
        "field_order" INTEGER NOT NULL DEFAULT 0,
        "field_group" VARCHAR(100),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "UQ_metadata_fields_entity_field" UNIQUE ("tenant_id", "entity_type", "field_name")
      );
      CREATE INDEX IF NOT EXISTS "IDX_metadata_fields_entity" ON "metadata_fields" ("tenant_id", "entity_type");
    `);

    // Metadata Engine - Form Metadata
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "metadata_forms" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "entity_type" VARCHAR(100) NOT NULL,
        "form_name" VARCHAR(100) NOT NULL,
        "label" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "layout" VARCHAR(20) NOT NULL DEFAULT 'GRID',
        "sections" JSONB NOT NULL DEFAULT '[]',
        "columns" INTEGER NOT NULL DEFAULT 1,
        "submit_label" VARCHAR(50) NOT NULL DEFAULT 'Save',
        "cancel_label" VARCHAR(50) NOT NULL DEFAULT 'Cancel',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "UQ_metadata_forms_entity_form" UNIQUE ("tenant_id", "entity_type", "form_name")
      );
      CREATE INDEX IF NOT EXISTS "IDX_metadata_forms_entity" ON "metadata_forms" ("tenant_id", "entity_type");
    `);

    // Metadata Engine - Entity Permissions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "metadata_permissions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "entity_type" VARCHAR(100) NOT NULL,
        "role" VARCHAR(50) NOT NULL,
        "actions" TEXT NOT NULL,
        "scope" VARCHAR(20) NOT NULL DEFAULT 'ALL',
        "conditions" JSONB NOT NULL DEFAULT '{}',
        "fields" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "UQ_metadata_permissions_entity_role" UNIQUE ("tenant_id", "entity_type", "role")
      );
      CREATE INDEX IF NOT EXISTS "IDX_metadata_permissions_entity" ON "metadata_permissions" ("tenant_id", "entity_type");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "metadata_permissions"');
    await queryRunner.query('DROP TABLE IF EXISTS "metadata_forms"');
    await queryRunner.query('DROP TABLE IF EXISTS "metadata_fields"');
    await queryRunner.query('DROP TABLE IF EXISTS "ubr_entity_relationships"');
    await queryRunner.query('DROP TABLE IF EXISTS "ubr_registered_entities"');
  }
}
