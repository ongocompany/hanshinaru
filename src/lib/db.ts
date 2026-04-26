import postgres from 'postgres';

const connectionString = import.meta.env.HANSHINARU_DATABASE_URL ?? process.env.HANSHINARU_DATABASE_URL;

if (!connectionString) {
  throw new Error('HANSHINARU_DATABASE_URL is not set. See .env.example.');
}

export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
  prepare: false,
});

export interface Poem {
  id: number;
  poet_id: number | null;
  poem_no: number | null;
  volume: number | null;
  title_zh: string;
  title_ko: string | null;
  category: string | null;
  genre: string | null;
  body_zh: string;
  preface_zh: string | null;
  translation_ko: string | null;
  commentary_ko: string | null;
  pinyin: string | null;
  status: string;
  country: string | null;
}

export interface Poet {
  id: number;
  title_id: string | null;
  name_zh: string;
  name_ko: string | null;
  life_birth: number | null;
  life_death: number | null;
  life_raw: string | null;
  bio_ko: string | null;
  era_period: string | null;
  country: string | null;
  slug: string | null;
  poem_count: number;
}

export async function getPoem(id: number): Promise<Poem | null> {
  const rows = await sql<Poem[]>`
    SELECT id, poet_id, poem_no, volume, title_zh, title_ko, category, genre,
           body_zh, preface_zh, translation_ko, commentary_ko, pinyin, status, country
    FROM poems
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getPoet(id: number): Promise<Poet | null> {
  const rows = await sql<Poet[]>`
    SELECT id, title_id, name_zh, name_ko, life_birth, life_death, life_raw,
           bio_ko, era_period, country, slug, poem_count
    FROM poets
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getPoetBySlug(slug: string): Promise<Poet | null> {
  const rows = await sql<Poet[]>`
    SELECT id, title_id, name_zh, name_ko, life_birth, life_death, life_raw,
           bio_ko, era_period, country, slug, poem_count
    FROM poets
    WHERE slug = ${slug}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export interface PoemSummary {
  id: number;
  title_zh: string;
  title_ko: string | null;
  volume: number | null;
  poem_no: number | null;
  has_translation: boolean;
}

export async function getPoemsByPoet(poetId: number, limit = 50, offset = 0): Promise<PoemSummary[]> {
  const rows = await sql<PoemSummary[]>`
    SELECT id, title_zh, title_ko, volume, poem_no,
           (translation_ko IS NOT NULL AND translation_ko <> '') AS has_translation
    FROM poems
    WHERE poet_id = ${poetId}
    ORDER BY volume NULLS LAST, poem_no NULLS LAST, id
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows;
}

export interface Book {
  id: number;
  slug: string;
  title_zh: string;
  title_ko: string | null;
  country: string;
  era_period: string | null;
  compiler_id: number | null;
  intro_ko: string | null;
  has_full_volumes: boolean;
  poem_count: number;
}

export async function getBooks(): Promise<Book[]> {
  const rows = await sql<Book[]>`
    SELECT id, slug, title_zh, title_ko, country, era_period,
           compiler_id, intro_ko, has_full_volumes, poem_count
    FROM books
    ORDER BY country, id
  `;
  return rows;
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  const rows = await sql<Book[]>`
    SELECT id, slug, title_zh, title_ko, country, era_period,
           compiler_id, intro_ko, has_full_volumes, poem_count
    FROM books
    WHERE slug = ${slug}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getBookAnnotationCount(bookId: number): Promise<number> {
  const rows = await sql<{ cnt: number }[]>`
    SELECT COUNT(*)::int AS cnt FROM poem_annotations WHERE book_id = ${bookId}
  `;
  return rows[0]?.cnt ?? 0;
}

export interface PoemAnnotation {
  id: number;
  poem_id: number | null;
  book_id: number;
  position: string | null;
  title_zh: string | null;
  title_ko: string | null;
  category: string | null;
  juan: string | null;
  body_zh_variant: string | null;
  translation_ko: string | null;
  commentary_ko: string | null;
  jipyeong_zh: string | null;
  notes: AnnotationNote[] | null;
  book_slug: string;
  book_title_zh: string;
  book_title_ko: string | null;
}

export interface AnnotationNote {
  no?: string;
  head?: string;
  headKo?: string;
  headZh?: string;
  text?: string;
}

export async function getAnnotationsByPoem(poemId: number): Promise<PoemAnnotation[]> {
  const rows = await sql<PoemAnnotation[]>`
    SELECT pa.id, pa.poem_id, pa.book_id, pa.position,
           pa.title_zh, pa.title_ko, pa.category, pa.juan,
           pa.body_zh_variant, pa.translation_ko, pa.commentary_ko, pa.jipyeong_zh,
           pa.notes,
           b.slug AS book_slug, b.title_zh AS book_title_zh, b.title_ko AS book_title_ko
    FROM poem_annotations pa
    JOIN books b ON b.id = pa.book_id
    WHERE pa.poem_id = ${poemId}
    ORDER BY b.id
  `;
  return rows;
}

export async function getAnnotationByBookPosition(
  bookSlug: string,
  position: string,
): Promise<PoemAnnotation | null> {
  const rows = await sql<PoemAnnotation[]>`
    SELECT pa.id, pa.poem_id, pa.book_id, pa.position,
           pa.title_zh, pa.title_ko, pa.category, pa.juan,
           pa.body_zh_variant, pa.translation_ko, pa.commentary_ko, pa.jipyeong_zh,
           pa.notes,
           b.slug AS book_slug, b.title_zh AS book_title_zh, b.title_ko AS book_title_ko
    FROM poem_annotations pa
    JOIN books b ON b.id = pa.book_id
    WHERE b.slug = ${bookSlug} AND pa.position = ${position}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getBookAnnotations(bookId: number): Promise<PoemAnnotation[]> {
  const rows = await sql<PoemAnnotation[]>`
    SELECT pa.id, pa.poem_id, pa.book_id, pa.position,
           pa.title_zh, pa.title_ko, pa.category, pa.juan,
           pa.body_zh_variant, pa.translation_ko, pa.commentary_ko, pa.jipyeong_zh,
           pa.notes,
           b.slug AS book_slug, b.title_zh AS book_title_zh, b.title_ko AS book_title_ko
    FROM poem_annotations pa
    JOIN books b ON b.id = pa.book_id
    WHERE pa.book_id = ${bookId}
    ORDER BY pa.position
  `;
  return rows;
}

export interface VolumeGroup {
  juan: string;
  poem_count: number;
  categories: { category: string; cnt: number }[];
}

export async function getBookVolumes(bookId: number): Promise<VolumeGroup[]> {
  const rows = await sql<{ juan: string; category: string; cnt: number }[]>`
    SELECT pa.juan, pa.category, COUNT(*)::int AS cnt
    FROM poem_annotations pa
    WHERE pa.book_id = ${bookId} AND pa.juan IS NOT NULL
    GROUP BY pa.juan, pa.category
    ORDER BY pa.juan, pa.category
  `;

  const map = new Map<string, VolumeGroup>();
  for (const r of rows) {
    if (!map.has(r.juan)) {
      map.set(r.juan, { juan: r.juan, poem_count: 0, categories: [] });
    }
    const g = map.get(r.juan)!;
    g.poem_count += r.cnt;
    g.categories.push({ category: r.category, cnt: r.cnt });
  }
  return Array.from(map.values());
}

export interface AnnotationListItem {
  id: number;
  position: string;
  title_zh: string | null;
  title_ko: string | null;
  category: string | null;
  juan: string | null;
  poem_id: number | null;
  poet_name_zh: string | null;
  poet_slug: string | null;
}

export async function getAnnotationsByVolume(
  bookId: number,
  juan: string,
): Promise<AnnotationListItem[]> {
  const rows = await sql<AnnotationListItem[]>`
    SELECT pa.id, pa.position, pa.title_zh, pa.title_ko, pa.category, pa.juan,
           pa.poem_id,
           pt.name_zh AS poet_name_zh, pt.slug AS poet_slug
    FROM poem_annotations pa
    LEFT JOIN poems p ON p.id = pa.poem_id
    LEFT JOIN poets pt ON pt.id = p.poet_id
    WHERE pa.book_id = ${bookId} AND pa.juan = ${juan}
    ORDER BY pa.position
  `;
  return rows;
}

export interface PoetListItem {
  id: number;
  name_zh: string;
  name_ko: string | null;
  era_period: string | null;
  country: string | null;
  slug: string | null;
  poem_count: number;
  actual_poem_count: number;
}

export interface PoetListOptions {
  country?: 'CN' | 'KR';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PoetListResult {
  items: PoetListItem[];
  total: number;
}

export async function getPoetsList(opts: PoetListOptions = {}): Promise<PoetListResult> {
  const limit = Math.min(opts.limit ?? 50, 200);
  const offset = Math.max(opts.offset ?? 0, 0);
  const country = opts.country ?? null;
  const search = opts.search?.trim() ?? '';
  const searchPattern = search ? `%${search}%` : null;

  const items = await sql<PoetListItem[]>`
    SELECT po.id, po.name_zh, po.name_ko, po.era_period, po.country, po.slug,
           po.poem_count,
           COALESCE(pc.cnt, 0)::int AS actual_poem_count
    FROM poets po
    LEFT JOIN (
      SELECT poet_id, COUNT(*) AS cnt FROM poems WHERE poet_id IS NOT NULL GROUP BY poet_id
    ) pc ON pc.poet_id = po.id
    WHERE (${country}::text IS NULL OR po.country = ${country})
      AND (${searchPattern}::text IS NULL
           OR po.name_zh ILIKE ${searchPattern}
           OR po.name_ko ILIKE ${searchPattern}
           OR po.slug ILIKE ${searchPattern})
    ORDER BY COALESCE(pc.cnt, 0) DESC, po.id ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const totalRows = await sql<{ cnt: number }[]>`
    SELECT COUNT(*)::int AS cnt FROM poets po
    WHERE (${country}::text IS NULL OR po.country = ${country})
      AND (${searchPattern}::text IS NULL
           OR po.name_zh ILIKE ${searchPattern}
           OR po.name_ko ILIKE ${searchPattern}
           OR po.slug ILIKE ${searchPattern})
  `;

  return { items, total: totalRows[0]?.cnt ?? 0 };
}

export interface PoetWithCount {
  id: number;
  name_zh: string;
  name_ko: string | null;
  slug: string | null;
  era_period: string | null;
  life_raw: string | null;
  bio_ko: string | null;
  poem_count: number;
}

export async function getPoetsByEra(
  country: 'CN' | 'KR',
  matchPeriods: string[],
  limit = 30,
): Promise<PoetWithCount[]> {
  if (country === 'CN' && matchPeriods.includes('당')) {
    const rows = await sql<PoetWithCount[]>`
      SELECT po.id, po.name_zh, po.name_ko, po.slug, po.era_period, po.life_raw, po.bio_ko,
             COALESCE(pc.cnt, 0)::int AS poem_count
      FROM poets po
      LEFT JOIN (
        SELECT poet_id, COUNT(*) AS cnt FROM poems WHERE poet_id IS NOT NULL GROUP BY poet_id
      ) pc ON pc.poet_id = po.id
      WHERE po.country = 'CN'
      ORDER BY COALESCE(pc.cnt, 0) DESC
      LIMIT ${limit}
    `;
    return rows;
  }

  const rows = await sql<PoetWithCount[]>`
    SELECT po.id, po.name_zh, po.name_ko, po.slug, po.era_period, po.life_raw, po.bio_ko,
           COALESCE(pc.cnt, 0)::int AS poem_count
    FROM poets po
    LEFT JOIN (
      SELECT poet_id, COUNT(*) AS cnt FROM poems WHERE poet_id IS NOT NULL GROUP BY poet_id
    ) pc ON pc.poet_id = po.id
    WHERE po.country = ${country}
      AND po.era_period = ANY(${matchPeriods}::text[])
    ORDER BY COALESCE(pc.cnt, 0) DESC, po.id ASC
    LIMIT ${limit}
  `;
  return rows;
}

export async function getTopPoemsByPoet(poetId: number, limit = 5): Promise<PoemSummary[]> {
  const rows = await sql<PoemSummary[]>`
    SELECT id, title_zh, title_ko, volume, poem_no,
           (translation_ko IS NOT NULL AND translation_ko <> '') AS has_translation
    FROM poems
    WHERE poet_id = ${poetId}
    ORDER BY is_notable DESC, volume NULLS LAST, poem_no NULLS LAST, id
    LIMIT ${limit}
  `;
  return rows;
}

export async function getFeaturedPoetsByEra(eraSlug: string): Promise<PoetWithCount[]> {
  const rows = await sql<PoetWithCount[]>`
    SELECT po.id, po.name_zh, po.name_ko, po.slug, po.era_period, po.life_raw, po.bio_ko,
           po.poem_count
    FROM featured_poets fp
    JOIN poets po ON po.id = fp.poet_id
    WHERE fp.era_slug = ${eraSlug}
    ORDER BY fp.rank ASC
  `;
  return rows;
}

export async function getFeaturedPoemsByPoet(
  eraSlug: string,
  poetId: number,
  limit = 8,
): Promise<PoemSummary[]> {
  const rows = await sql<PoemSummary[]>`
    SELECT p.id, p.title_zh, p.title_ko, p.volume, p.poem_no,
           (p.translation_ko IS NOT NULL AND p.translation_ko <> '') AS has_translation
    FROM featured_poems fp
    JOIN poems p ON p.id = fp.poem_id
    WHERE fp.era_slug = ${eraSlug} AND fp.poet_id = ${poetId}
    ORDER BY fp.rank ASC
    LIMIT ${limit}
  `;
  return rows;
}

export async function countPoetsByEra(
  country: 'CN' | 'KR',
  matchPeriods: string[],
): Promise<number> {
  if (country === 'CN' && matchPeriods.includes('당')) {
    const rows = await sql<{ cnt: number }[]>`
      SELECT COUNT(*)::int AS cnt FROM poets WHERE country = 'CN'
    `;
    return rows[0]?.cnt ?? 0;
  }
  const rows = await sql<{ cnt: number }[]>`
    SELECT COUNT(*)::int AS cnt FROM poets
    WHERE country = ${country} AND era_period = ANY(${matchPeriods}::text[])
  `;
  return rows[0]?.cnt ?? 0;
}
