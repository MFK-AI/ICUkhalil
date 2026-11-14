import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://icukhalil.com',
  trailingSlash: 'never',
  build: { format: 'file', assets: 'assets' },
  integrations: [sitemap({ filter: (page) => !page.includes('/thanks') && !page.includes('/404') })],
  compressHTML: true,
});
