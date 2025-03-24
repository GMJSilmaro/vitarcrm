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
      //* Customers
      {
        source: '/customers',
        destination: '/dashboard/customers/list',
      },
      {
        source: '/customers/create',
        destination: '/dashboard/customers/create',
      },
      {
        source: '/customers/view/:id',
        destination: '/dashboard/customers/view/:id',
      },
      {
        source: '/customers/edit-customer/:customerId',
        destination: '/dashboard/customers/:customerId',
      },
      {
        source: '/customers/:customerId/equipment',
        destination: '/dashboard/customers/:customerId/equipment',
      },
      {
        source: '/customers/:customerId/equipment/create',
        destination: '/dashboard/customers/:customerId/equipment/create',
      },
      {
        source: '/customers/:customerId/equipment/edit-customer-equipment/:equipmentId',
        destination:
          '/dashboard/customers/:customerId/equipment/edit-customer-equipment/:equipmentId',
      },

      //404
      {
        source: '/404',
        destination: '/404',
      },
      // SITES
      {
        source: '/sites',
        destination: '/dashboard/sites/list',
      },
      {
        source: '/sites/view/:siteId',
        destination: '/dashboard/sites/view/:siteId',
      },
      {
        source: '/sites/create',
        destination: '/dashboard/sites/create',
      },
      {
        source: '/sites/edit-site/:siteId',
        destination: '/dashboard/sites/edit-site/:siteId',
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
        destination: '/dashboard/jobs/list',
      },
      {
        source: '/jobs/view/:jobId',
        destination: '/dashboard/jobs/view/:jobId', // Rewrite to /dashboard/jobs/{jobId}
      },
      {
        source: '/jobs/edit-jobs/:jobId',
        destination: '/dashboard/jobs/edit-jobs/:jobId',
      },
      {
        source: '/jobs/create',
        destination: '/dashboard/jobs/create',
      },
      {
        source: '/jobs/create',
        destination: '/dashboard/jobs/create?',
      },

      //* Calibration
      {
        source: '/jobs/:jobId/calibrations',
        destination: '/dashboard/jobs/:jobId/calibrations/list',
      },
      {
        source: '/jobs/:jobId/calibrations/view/:calibrateId',
        destination: '/dashboard/jobs/:jobId/calibrations/view/:calibrateId',
      },
      {
        source: '/jobs/:jobId/calibrations/create',
        destination: '/dashboard/jobs/:jobId/calibrations/create',
      },
      {
        source: '/jobs/:jobId/calibrations/edit-calibrations/:calibrateId',
        destination: '/dashboard/jobs/:jobId/calibrations/edit-calibrations/:calibrateId',
      },

      //* equipments
      {
        source: '/reference-equipment/:category',
        destination: '/dashboard/reference-equipment/:category',
      },
      {
        source: '/reference-equipment/:category/view/:inventoryId',
        destination: '/dashboard/reference-equipment/:category/view/:inventoryId',
      },

      //* calibration references
      {
        source: '/calibration-references/mechanical/cuswd',
        destination: '/dashboard/calibration-references/mechanical/cuswd/list',
      },
      {
        source: '/calibration-references/mechanical/mpe',
        destination: '/dashboard/calibration-references/mechanical/mpe/list',
      },
      {
        source: '/calibration-references/mechanical/ck',
        destination: '/dashboard/calibration-references/mechanical/ck/list',
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

      //* technician page
      {
        source: '/user/:workerId',
        destination: '/dashboard/user/:workerId',
      },
      {
        source: '/user/:workerId/schedule',
        destination: '/dashboard/user/:workerId/schedule',
      },
      {
        source: '/user/:workerId/jobs/:jobId',
        destination: '/dashboard/user/:workerId/jobs/:jobId',
      },
      {
        source: '/user/:workerId/jobs/view/:jobId',
        destination: '/dashboard/user/:workerId/jobs/view/:jobId',
      },
      {
        source: '/user/:workerId/jobs/:jobId/calibrations',
        destination: '/dashboard/user/:workerId/jobs/:jobId/calibrations/list',
      },
      {
        source: '/user/:workerId/jobs/:jobId/calibrations/create',
        destination: '/dashboard/user/:workerId/jobs/:jobId/calibrations/create',
      },
      {
        source: '/user/:workerId/jobs/:jobId/calibrations/:calibrateId',
        destination: '/dashboard/user/:workerId/jobs/:jobId/calibrations/:calibrateId',
      },
      {
        source: '/user/:workerId/jobs/:jobId/calibrations/view/:calibrateId',
        destination: '/dashboard/user/:workerId/jobs/:jobId/calibrations/view/:calibrateId',
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
