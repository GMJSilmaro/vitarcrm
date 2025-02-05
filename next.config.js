/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    SYNCFUSION_LICENSE_KEY: process.env.SYNCFUSION_LICENSE_KEY,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },

  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },

  images: {
    domains: ['firebasestorage.googleapis.com', 'localhost'], // Add the hostname you're using
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      // DASHBOARD/OVERVIEW
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
      },
      // CUSTOMERS
      {
        source: '/customers',
        destination: '/dashboard/customers/list',
      },
      {
        source: '/customers/view/:id',
        destination: '/dashboard/customers/view/:id',
      },
      {
        source: '/customers/edit-customer/:customerId',
        destination: '/dashboard/customers/:customerId',
      },
      //404
      {
        source: '/404',
        destination: '/404',
      },
      // SITES
      {
        source: '/sites',
        destination: '/dashboard/locations/list',
      },

      // WORKERS
      {
        source: '/workers/create',
        destination: '/dashboard/workers/create-worker',
      },
      {
        source: '/workers',
        destination: '/dashboard/workers/list',
      },
      {
        source: '/workers/view/:id',
        destination: '/dashboard/workers/view/:id',
      },
      {
        source: '/workers/edit-worker/:workerId',
        destination: '/dashboard/workers/:workerId',
      },

      // SCHEDULING
      {
        source: '/jobs/calendar',
        destination: '/dashboard/scheduling/jobs/calendar',
      },
      {
        source: '/schedule',
        destination: '/dashboard/scheduling/workers/schedules',
      },

      // JOBS
      {
        source: '/jobs',
        destination: '/dashboard/jobs/list-jobs',
      },
      {
        source: '/jobs/view/:jobId',
        destination: '/dashboard/jobs/:jobId', // Rewrite to /dashboard/jobs/{jobId}
      },
      {
        source: '/jobs/edit-jobs/:id',
        destination: '/dashboard/jobs/edit-jobs/:id',
      },
      {
        source: '/jobs/create',
        destination: '/dashboard/jobs/create-jobs',
      },
      {
        source: '/jobs/create-jobs',
        destination: '/dashboard/jobs/create-jobs?',
      },

      // AUTHENTICATION
      {
        source: '/sign-in',
        destination: '/authentication/sign-in',
      },
      {
        source: '/sign-up',
        destination: '/authentication/sign-up',
      },

      // WORKER PROFILE ROUTES
      {
        source: '/user/:workerId',
        destination: '/user/:workerId',
      },
      {
        source: '/user/list',
        destination: '/user/list',
      },
      {
        source: '/user/create',
        destination: '/user/create',
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
