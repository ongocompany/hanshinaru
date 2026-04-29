const ZH_WIKISOURCE_ORIGIN = 'https://zh.wikisource.org';

export function extractWikisourceTitle(sourceUrl) {
  const url = new URL(sourceUrl);
  if (url.origin !== ZH_WIKISOURCE_ORIGIN) {
    throw new Error(`Unsupported Wikisource origin: ${url.origin}`);
  }
  const match = url.pathname.match(/^\/wiki\/(.+)$/);
  if (!match) {
    throw new Error(`Unsupported Wikisource path: ${url.pathname}`);
  }
  return decodeURIComponent(match[1]).replace(/_/g, ' ');
}

export function buildParseApiUrl(title) {
  const url = new URL('/w/api.php', ZH_WIKISOURCE_ORIGIN);
  url.searchParams.set('action', 'parse');
  url.searchParams.set('page', title);
  url.searchParams.set('prop', 'text|displaytitle|categories');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  return url;
}

export function buildWikisourcePageUrl(title) {
  return `${ZH_WIKISOURCE_ORIGIN}/wiki/${encodeURIComponent(title).replace(/%20/g, '_')}`;
}

export async function fetchWikisourcePageByTitle(title, fetchImpl = fetch) {
  return fetchWikisourcePage(buildWikisourcePageUrl(title), fetchImpl);
}

export async function fetchWikisourcePage(sourceUrl, fetchImpl = fetch) {
  const title = extractWikisourceTitle(sourceUrl);
  const apiUrl = buildParseApiUrl(title);
  const response = await fetchImpl(apiUrl, {
    headers: {
      'User-Agent': 'HanshinaruContentCollector/0.1 (local research; contact: repository owner)',
    },
  });
  if (!response.ok) {
    throw new Error(`Wikisource API failed ${response.status} ${response.statusText}: ${apiUrl}`);
  }
  const payload = await response.json();
  if (payload.error) {
    throw new Error(`Wikisource API error for ${title}: ${payload.error.info ?? payload.error.code}`);
  }
  return {
    title,
    apiUrl: apiUrl.toString(),
    displayTitle: payload.parse?.displaytitle ?? title,
    categories: payload.parse?.categories ?? [],
    html: payload.parse?.text ?? '',
  };
}
