/** @type {import('next').NextConfig} */

// CACHE TOGGLE: Set to true to disable all caching site-wide
const DISABLE_CACHE = false;

const nextConfig = {
  // Production optimizations for security and performance
  productionBrowserSourceMaps: false,
  optimizeFonts: false,

  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      'gsap',
    ],
  },

  // Production webpack configuration
  webpack: (config, { dev, isServer }) => {
    const path = require('path')
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        usedExports: true,
        sideEffects: false,
      };

      if (config.optimization.minimizer) {
        config.optimization.minimizer.forEach((plugin) => {
          if (plugin.constructor.name === 'TerserPlugin') {
            plugin.options.terserOptions = {
              ...plugin.options.terserOptions,
              compress: {
                ...plugin.options.terserOptions?.compress,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: [
                  'console.log',
                  'console.info',
                  'console.debug',
                ],
              },
            };
          }
        });
      }
    }

    // (removed) framer-noop alias so the real `framer-motion` package is used

    return config;
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'morx-team.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lottiefiles.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.lottiefiles.com',
      },
      {
        protocol: 'https',
        hostname: 'lottie.host',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Security headers
  async headers() {
    const securityHeaders = [
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://www.gstatic.com https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://www.googletagservices.com https://unpkg.com https://cdn.jsdelivr.net",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https: blob: https://lottie.host https://*.lottiefiles.com",
          "connect-src 'self' https://*.supabase.co https://accounts.google.com https://www.googleapis.com https://docs.google.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://stats.g.doubleclick.net https://lottie.host https://*.lottiefiles.com",
          "frame-src 'self' https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com https://docs.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self' https://docs.google.com",
          "frame-ancestors 'none'",
        ].join('; '),
      },

      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
          ]
        : []),
    ];

    if (DISABLE_CACHE) {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value:
                'no-store, no-cache, must-revalidate, proxy-revalidate',
            },
            {
              key: 'Pragma',
              value: 'no-cache',
            },
            {
              key: 'Expires',
              value: '0',
            },
            ...securityHeaders,
          ],
        },
      ];
    }

    return [
      {
        source: '/quizzes/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value:
              'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },

      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value:
              'public, max-age=604800, s-maxage=604800, immutable',
          },
        ],
      },

      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  // CORS Proxy for Lottie
  async rewrites() {
    return [
      {
        source: '/lottie-proxy/:path*',
        destination: 'https://lottie.host/:path*',
      },
    ];
  },
};

module.exports = nextConfig;