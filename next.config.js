/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    STRIPE_PAYMENT_LINK_TEST: process.env.STRIPE_PAYMENT_LINK_TEST,
    STRIPE_PAYMENT_LINK_PROD: process.env.STRIPE_PAYMENT_LINK_PROD,
    STRIPE_SECRET_KEY_TEST: process.env.STRIPE_SECRET_KEY_TEST,
    STRIPE_SECRET_KEY_PROD: process.env.STRIPE_SECRET_KEY_PROD,
    ENV_TYPE: process.env.ENV_TYPE,
    STRIPE_SECRET_KEY: process.env.ENV_TYPE === 'production' ? process.env.STRIPE_SECRET_KEY_PROD : process.env.STRIPE_SECRET_KEY_TEST,
    STRIPE_PAYMENT_LINK: process.env.ENV_TYPE === 'production' ? process.env.STRIPE_PAYMENT_LINK_PROD : process.env.STRIPE_PAYMENT_LINK_TEST,
    STRIPE_WEBHOOK_SECRET: process.env.ENV_TYPE === 'production' ? process.env.STRIPE_WEBHOOK_SECRET_PROD : process.env.STRIPE_WEBHOOK_SECRET_TEST,
    //GOCARDLESS_SECRET_ID: process.env.ENV_TYPE === 'production' ? process.env.GOCARDLESS_SECRET_ID_PROD : process.env.GOCARDLESS_SECRET_ID_TEST,
    //GOCARDLESS_SECRET_KEY: process.env.ENV_TYPE === 'production' ? process.env.GOCARDLESS_SECRET_KEY_PROD : process.env.GOCARDLESS_SECRET_KEY_TEST,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      },
      {
        protocol: 'https',
        hostname: 'utfs.io'
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com'
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com'
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com'
      }
    ]
  },
  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg')
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/ // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ['@svgr/webpack']
      }
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  }
};

module.exports = nextConfig;