// 빌드 타임 Supabase REST fetch 유틸
// Astro static 모드에서 빌드 시점에 DB를 읽어옴

const SUPABASE_URL = 'https://iplxexvmrnzlqglfqrpg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SBqquD4OkM6a93H3dMPNRQ_X5JChwWI';

const REST_URL = `${SUPABASE_URL}/rest/v1`;
const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export async function sbFetch<T = any>(
  table: string,
  query: string = '',
): Promise<T[]> {
  const url = `${REST_URL}/${table}?${query}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`Supabase fetch failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export { SUPABASE_URL, SUPABASE_KEY };
