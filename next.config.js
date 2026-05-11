/** @type {import('next').NextConfig} */

// CACHE TOGGLE: Set to true to disable all caching site-wide (forces refresh for all users)
// Very useful when making changes and students' mobile devices (which don't have hard refresh) are stuck on old versions.
const DISABLE_CACHE = false;

const nextConfig = {
<<<<<<< HEAD
  /* config options here */
  // Production optimizations for security
=======
  // Production optimizations for security and performance
>>>>>>> 16d5d685 (Performance optimizations)
  productionBrowserSourceMaps: false, // Disable source maps in production
  
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
    serverActions: {
<<<<<<< HEAD
      bodySizeLimit: '100mb',
    },
=======
      bodySizeLimit: '10mb', // Reduced from 100mb to prevent server OOM
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      'gsap',
    ],
  },

  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|woff2|woff|ttf|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
>>>>>>> 16d5d685 (Performance optimizations)
  },
  
  // Production webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Only apply in production builds
    if (!dev && !isServer) {
      // Minimize and obfuscate code
      config.optimization = {
        ...config.optimization,
        minimize: true,
        usedExports: true,
        sideEffects: false,
      }
      
      // Next.js already uses Terser by default with good settings
      // Just ensure console.logs are removed
      if (config.optimization.minimizer) {
        config.optimization.minimizer.forEach((plugin) => {
          if (plugin.constructor.name === 'TerserPlugin') {
            plugin.options.terserOptions = {
              ...plugin.options.terserOptions,
              compress: {
                ...plugin.options.terserOptions?.compress,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
              },
            }
          }
        })
      }
    }
    return config
  },
  
  images: {
<<<<<<< HEAD
=======
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
>>>>>>> 16d5d685 (Performance optimizations)
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
      }
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
      // Prevent clickjacking attacks
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      // Prevent MIME type sniffing
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      // Control referrer information
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      // Restrict browser features
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      // XSS Protection (legacy browsers)
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      // Content Security Policy
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
      // Force HTTPS (only in production)
      ...(process.env.NODE_ENV === 'production'
        ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }]
        : []),
    ];

    if (DISABLE_CACHE) {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
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
      // Cache quiz JSON files aggressively (they rarely change)
      {
        source: '/quizzes/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Cache images aggressively
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, s-maxage=604800, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },

  // CORS Proxy for Lottie
  async rewrites() {
    return [
      {
        source: '/lottie-proxy/:path*',
        destination: 'https://lottie.host/:path*',
      },
    ]
  },
};

export default nextConfig;
