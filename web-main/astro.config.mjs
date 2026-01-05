import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://stokoe.example.com',
  integrations: [
    mdx({
      shikiConfig: {
        theme: 'nord',
        wrap: true
      }
    }),
    tailwind({
      applyBaseStyles: false
    })
  ],
  markdown: {
    shikiConfig: {
      theme: 'nord',
      wrap: true
    }
  }
});
