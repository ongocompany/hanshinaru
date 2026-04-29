import { defineConfig } from 'astro/config';

// 운영(jinas)에 SSR Node 서버 미설치 — 모든 페이지를 정적 prerender로 빌드.
// 동적 라우트는 [slug].astro에서 getStaticPaths로 모든 경로 미리 생성 필요.
// 향후 SSR Node를 jinas에 살리면 hybrid 모드로 전환 가능.
export default defineConfig({
  site: 'https://hanshinaru.kr',
  output: 'static',
  build: {
    assets: '_assets',
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
