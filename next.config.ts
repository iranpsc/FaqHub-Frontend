import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

function resolveApiConfig() {
  const clientApiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api.faqhub.ir/api"
      : "http://localhost:8000/api");

  const isRelativeApiUrl = clientApiUrl.startsWith("/");

  const backendApiUrl =
    process.env.SERVER_API_URL ||
    (isRelativeApiUrl
      ? process.env.NODE_ENV === "production"
        ? "https://api.faqhub.ir/api"
        : "http://localhost:8000/api"
      : clientApiUrl);

  const backendOrigin = new URL(backendApiUrl).origin;
  const backendRemotePattern = {
    protocol: new URL(backendApiUrl).protocol.replace(":", "") as "http" | "https",
    hostname: new URL(backendApiUrl).hostname,
  };

  return {
    clientApiUrl,
    isRelativeApiUrl,
    backendApiUrl,
    backendOrigin,
    backendRemotePattern,
  };
}

const {
  clientApiUrl,
  isRelativeApiUrl,
  backendApiUrl,
  backendOrigin,
  backendRemotePattern,
} = resolveApiConfig();

const nextConfig: NextConfig = {
  // Production optimizations
  // Standalone output for minimal Docker images (copies only traced deps)
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    remotePatterns: [
      backendRemotePattern,
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'irpsc.com',
      },
      {
        protocol: 'https',
        hostname: '*.irpsc.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // API proxy to avoid CORS issues
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
  
  // Security headers
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';

    // Content Security Policy
    // Note: 'unsafe-inline' is needed for Next.js and CKEditor styles
    // 'unsafe-eval' is needed for CKEditor in development
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      `img-src 'self' data: blob: ${backendOrigin} https://ui-avatars.com https://irpsc.com https://*.irpsc.com`,
      `connect-src 'self'${isRelativeApiUrl ? "" : ` ${backendOrigin}`} https://fonts.googleapis.com https://fonts.gstatic.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io`,
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ];
    
    return [
      {
        source: '/(.*)',
        headers: [
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; '),
          },
        ],
      },
    ];
  },
  
  // Webpack configuration (also used when not using --turbopack)
  // Note: Turbopack will ignore this config when using --turbopack flag
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
  
  // Environment variables with sensible defaults per environment
  env: {
    NEXT_PUBLIC_API_URL: clientApiUrl,
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/sentry-tunnel",
});
