import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_DAR = 'a0000000-0000-0000-0000-000000000002';

// ── Parent category IDs (from migration 1700000000028) ──
const PARENTS = {
  FOOD_SERVICES: 'd0000000-0000-0000-0000-000000000030',
  FRESH_PRODUCE: 'd0000000-0000-0000-0000-000000000031',
  HOME_GARDEN:   'd0000000-0000-0000-0000-000000000032',
  LAUNDRY:       'd0000000-0000-0000-0000-000000000033',
  TAILORING:     'd0000000-0000-0000-0000-000000000034',
  GENERAL:       'd0000000-0000-0000-0000-000000000035',
  CARGO:         'd0000000-0000-0000-0000-000000000036',
  USED:          'd0000000-0000-0000-0000-000000000018',
};

interface MarketingSeed {
  tagline: string;
  benefits: string[];
  emoji: string;
}

const MARKETING: Record<string, MarketingSeed> = {
  [PARENTS.FOOD_SERVICES]: {
    tagline: 'Chakula kitamu kwa dakika chache tu',
    benefits: ['Huduma ya haraka mlangoni', 'Wapishi bora wa nyumbani', 'Bei nafuu na za uhakika'],
    emoji: '🍲',
  },
  [PARENTS.FRESH_PRODUCE]: {
    tagline: 'Mboga na matunda ya asili kila siku',
    benefits: ['Fresh kila asubuhi', 'Kinafikishwa mlangoni', 'Bei za jumla kwa biashara'],
    emoji: '🥬',
  },
  [PARENTS.HOME_GARDEN]: {
    tagline: 'Usafi na bustani nzuri kwa nyumba yako',
    benefits: ['Huduma za usafi za uhakika', 'Vifaa na zana za bustani', 'Wataalamu waliofunzwa'],
    emoji: '🧹',
  },
  [PARENTS.LAUNDRY]: {
    tagline: 'Nguo safi, upesi, bila usumbufu',
    benefits: ['Mama fua wa karibu nawe', 'Kufua na kupiga pasi', 'Utoaji na ufikishaji nyumbani'],
    emoji: '🧺',
  },
  [PARENTS.TAILORING]: {
    tagline: 'Ushonaji bora kwa mtindo wako',
    benefits: ['Nguo za kiume na kike', 'Vazi la harusi na sherehe', 'Uniforms na workwear'],
    emoji: '✂️',
  },
  [PARENTS.GENERAL]: {
    tagline: 'Mahitaji yote ya jumla, sehemu moja',
    benefits: ['Electronics na simu', 'Vifaa vya nyumbani na fanicha', 'Ujenzi, michezo na masomo'],
    emoji: '🛍️',
  },
  [PARENTS.CARGO]: {
    tagline: 'Tuma mizigo haraka na usalama',
    benefits: ['Express delivery ndani ya jiji', 'Cargo ya ndani na nje', 'Kukodisha lori na cherehe'],
    emoji: '🚚',
  },
  [PARENTS.USED]: {
    tagline: 'Vitu vizuri vya used kwa bei nafuu',
    benefits: ['Nguo na electronics za used', 'Fanicha na mitambo bora', 'Bei ya kuaminika na inayojadiliwa'],
    emoji: '♻️',
  },
};

const ADVERTS: Array<{ title: string; body: string; emoji: string; ctaLabel: string; ctaUrl: string; sortOrder: number }> = [
  {
    title: 'Tuma Mizigo kwa Express',
    body: 'Express Delivery na Cargo ya uhakika. Bei nafuu, usalama mkubwa, na wako mlangoni upesi.',
    emoji: '🚚',
    ctaLabel: 'Anza Sasa',
    ctaUrl: '/cargo',
    sortOrder: 10,
  },
  {
    title: 'Chakula cha Mjini',
    body: 'Wali na Nyama Choma, Pilau, Ugali na Samaki... Agiza chakula kitamu, kifike upesi kwako.',
    emoji: '🍲',
    ctaLabel: 'Agiza Chakula',
    ctaUrl: '/vendors?category=food&parentId=d0000000-0000-0000-0000-000000000030',
    sortOrder: 20,
  },
  {
    title: 'Mboga na Matunda Fresh',
    body: 'Mboga na matunda ya asili kila siku, yanafikishwa mlangoni mwako. Bei nzuri kwa jumla.',
    emoji: '🥬',
    ctaLabel: 'Nunua Fresh',
    ctaUrl: '/vendors?category=grocery&parentId=d0000000-0000-0000-0000-000000000031',
    sortOrder: 30,
  },
  {
    title: 'Vitu vya Used Nafuu',
    body: 'Nguo, electronics, mitambo na fanicha za used zilizoko hali nzuri kwa bei nafuu.',
    emoji: '♻️',
    ctaLabel: 'Tazama Used',
    ctaUrl: '/used-goods',
    sortOrder: 40,
  },
];

export class AddMarketingCatalogAndAdverts1700000000032 implements MigrationInterface {
  name = 'AddMarketingCatalogAndAdverts1700000000032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Marketing columns on product_categories ──
    await queryRunner.query(`
      ALTER TABLE "product_categories"
        ADD COLUMN IF NOT EXISTS "tagline" text NULL,
        ADD COLUMN IF NOT EXISTS "benefits" jsonb NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "emoji" varchar(8) NULL;
    `);

    // ── 2. Seed marketing data per parent category ──
    for (const [id, m] of Object.entries(MARKETING)) {
      await queryRunner.query(
        `UPDATE "product_categories"
           SET tagline = $1, benefits = $2, emoji = $3, updated_at = NOW()
         WHERE id = $4 AND tenant_id = $5`,
        [m.tagline, JSON.stringify(m.benefits), m.emoji, id, TENANT_DAR],
      );
    }

    // ── 3. Adverts table ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "adverts" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "title" varchar(200) NOT NULL,
        "body" text NULL,
        "emoji" varchar(8) NULL,
        "image_url" text NULL,
        "cta_label" varchar(100) NULL,
        "cta_url" text NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "starts_at" TIMESTAMP WITH TIME ZONE NULL,
        "ends_at" TIMESTAMP WITH TIME ZONE NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_adverts_id" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "IDX_adverts_tenant_active"
        ON "adverts" ("tenant_id", "is_active", "sort_order");
    `);

    // ── 4. Seed sample adverts ──
    for (const a of ADVERTS) {
      await queryRunner.query(
        `INSERT INTO "adverts"
           (tenant_id, title, body, emoji, cta_label, cta_url, is_active, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [TENANT_DAR, a.title, a.body, a.emoji, a.ctaLabel, a.ctaUrl, a.sortOrder],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "adverts"`);
    await queryRunner.query(`
      ALTER TABLE "product_categories"
        DROP COLUMN IF EXISTS "tagline",
        DROP COLUMN IF EXISTS "benefits",
        DROP COLUMN IF EXISTS "emoji";
    `);
  }
}
