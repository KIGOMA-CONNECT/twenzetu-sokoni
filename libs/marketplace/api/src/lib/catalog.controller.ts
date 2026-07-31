import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EntityManager } from 'typeorm';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { MatchCatalogDto } from './dto/match-catalog.dto';

const SWAHILI_ALIASES: Record<string, string[]> = {
  matunda: ['matunda', 'fruit', 'fruits', 'banana', 'ndizi', 'mango', 'embe', 'pawpaw', 'papaya', 'orange', 'apple', 'avocado', 'parachichi'],
  nyanya: ['nyanya', 'tomato'],
  mchele: ['mchele', 'rice'],
  wali: ['wali', 'rice', 'pilau'],
  mboga: ['mboga', 'vegetable', 'vegetables', 'spinach', 'mchicha', 'cabbage', 'kabichi', 'sukuma', 'sukumawiki'],
  mayai: ['mayai', 'egg', 'eggs'],
  samaki: ['samaki', 'fish'],
  kuku: ['kuku', 'chicken'],
  nyama: ['nyama', 'beef', 'meat', 'goat', 'mutton'],
  sabuni: ['sabuni', 'soap'],
  mkate: ['mkate', 'bread'],
  maharage: ['maharage', 'beans'],
  sukari: ['sukari', 'sugar'],
  mafuta: ['mafuta', 'oil', 'cooking oil'],
  maji: ['maji', 'water'],
  chai: ['chai', 'tea'],
  kahawa: ['kahawa', 'coffee'],
  simu: ['simu', 'phone', 'mobile', 'smartphone'],
  ndizi: ['ndizi', 'banana', 'plantain', 'matoke'],
  karanga: ['karanga', 'groundnuts', 'peanuts'],
  viazi: ['viazi', 'potato', 'potatoes'],
};

function expandTerms(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const expanded: string[] = [q];
  for (const word of q.split(/\s+/)) {
    const aliases = SWAHILI_ALIASES[word];
    if (aliases) {
      expanded.push(...aliases);
    }
  }
  return Array.from(new Set(expanded));
}

interface CatalogMatch {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  unit: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  vendorId: string;
  vendorName: string;
  vendorRating: string | null;
}

@ApiTags('Catalog')
@Controller('catalog')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CatalogController {
  constructor(
    @Inject(EntityManager) private readonly entityManager: EntityManager,
  ) {}

  @Post('match')
  @ApiOperation({ summary: 'Match a shopping list of items to vendors and products with prices' })
  public async match(@CurrentUser() user: JwtPayload, @Body() dto: MatchCatalogDto) {
    const items = dto.items.map((i) => i.trim()).filter(Boolean);
    const results: Array<{ query: string; matches: CatalogMatch[] }> = [];
    const unmatched: string[] = [];

    for (const item of items) {
      const terms = expandTerms(item);
      const matches = terms.length === 0 ? [] : await this.matchItem(user.tenantId, terms);
      if (matches.length === 0) {
        unmatched.push(item);
      }
      results.push({ query: item, matches });
    }

    return {
      data: {
        results,
        totalItems: items.length,
        matchedItems: results.filter((r) => r.matches.length > 0).length,
        unmatched,
      },
    };
  }

  private async matchItem(tenantId: string, terms: string[]): Promise<CatalogMatch[]> {
    const likeParams = terms.map((t) => `%${t}%`);
    const orClause = terms
      .map((_, i) => `(p.name ILIKE $${i + 3} OR p.description ILIKE $${i + 3})`)
      .join(' OR ');
    const prefixParam = `%${terms[0]}%`;
    const limitIndex = terms.length + 3;

    const rows = await this.entityManager.query(
      `SELECT p.id, p.name, p.description, p.price, p.currency, p.unit, p.image_url,
              p.category_id AS "categoryId",
              v.id AS "vendorId", v.shop_name AS "vendorName", v.average_rating AS "vendorRating"
       FROM products p
       JOIN vendors v ON v.id = p.vendor_id
       WHERE p.tenant_id = $1 AND p.status = 'ACTIVE' AND v.status = 'ACTIVE'
         AND (${orClause})
       ORDER BY CASE WHEN p.name ILIKE $2 THEN 0 ELSE 1 END, p.price ASC
       LIMIT $${limitIndex}`,
      [tenantId, prefixParam, ...likeParams, 5],
    );
    return rows as CatalogMatch[];
  }
}
