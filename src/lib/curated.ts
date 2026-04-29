// 큐레이션 데이터 빌드 타임 fetch (Supabase hansi_curated_*)
// 시대 페이지 prerender에서 사용. RLS anon 읽기 정책으로 publishable key fetch.

import { sbFetch } from './supabase';

export interface CuratedPoet {
  jds_id: number;
  country: 'CN' | 'KR';
  era_slug: string;
  name_ko: string;
  name_zh: string | null;
  life_birth: number | null;
  life_death: number | null;
  life_raw: string | null;
  slug: string | null;
  era_period: string | null;
  poem_count: number | null;
  bio_ko: string | null;
  sort_order: number;
}

export interface CuratedPoem {
  jds_id: number;
  poet_jds_id: number;
  country: 'CN' | 'KR';
  era_slug: string;
  title_ko: string | null;
  title_zh: string | null;
  body_zh: string | null;
  translation_ko: string | null;
  commentary_ko: string | null;
  is_notable: boolean;
  quality: string | null;
  in_daily_pool: boolean;
  sort_order: number;
}

export async function getEraPoets(eraSlug: string): Promise<CuratedPoet[]> {
  return sbFetch<CuratedPoet>(
    'hansi_curated_poets',
    `era_slug=eq.${eraSlug}&order=sort_order.asc&select=*`,
  );
}

export async function getEraPoems(eraSlug: string, limit = 12): Promise<CuratedPoem[]> {
  return sbFetch<CuratedPoem>(
    'hansi_curated_poems',
    `era_slug=eq.${eraSlug}&order=sort_order.asc&limit=${limit}&select=*`,
  );
}
