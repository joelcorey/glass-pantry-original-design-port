import type { NextConfig } from 'next';
const config: NextConfig = {
 poweredByHeader: false,
 experimental: { serverSourceMaps: false },
 outputFileTracingExcludes: { '/*': ['./data/objects/**/*', './public/archive-assets/**/*'] },
 outputFileTracingIncludes: { '/*': ['./data/runtime/*.gz', './data/manifest.json', './data/static-extensions.json'] },
};
export default config;
