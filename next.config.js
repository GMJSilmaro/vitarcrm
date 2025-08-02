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
  webpack: (config) => {
    config.module.rules.push({
      test: /\.ttf$/i,
      type: 'asset/resource',
    });
    return config;
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
      //* notifications
      {
        source: '/notifications',
        destination: '/dashboard/notifications/list',
      },

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

      //* profile
      {
        source: '/profile/:uid',
        destination: '/dashboard/profile/:uid',
      },

      // WORKERS
      {
        source: '/workers/create',
        destination: '/dashboard/workers/create',
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
        source: '/workers/edit-workers/:workerId',
        destination: '/dashboard/workers/edit-workers/:workerId',
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
      {
        source: '/job-requests',
        destination: '/dashboard/job-requests/list',
      },
      {
        source: '/job-requests/view/:jobRequestId',
        destination: '/dashboard/job-requests/view/:jobRequestId',
      },
      {
        source: '/job-requests/edit-job-requests/:jobRequestId',
        destination: '/dashboard/job-requests/edit-job-requests/:jobRequestId',
      },
      {
        source: '/job-requests/create',
        destination: '/dashboard/job-requests/create',
      },

      //* Jobs
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
      {
        source: '/jobs/duplicate/:jobId',
        destination: '/dashboard/jobs/duplicate/:jobId',
      },
      //* job customer notification
      {
        source: '/job-cns',
        destination: '/dashboard/job-cns/list',
      },
      {
        source: '/job-cns/view/:jobCnId',
        destination: '/dashboard/job-cns/view/:jobCnId',
      },
      {
        source: '/job-cns/create',
        destination: '/dashboard/job-cns/create',
      },
      {
        source: '/job-cns/edit-job-cns/:jobCnId',
        destination: '/dashboard/job-cns/edit-job-cns/:jobCnId',
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
        source: '/calibration-references/mass/cuswd',
        destination: '/dashboard/calibration-references/mass/cuswd/list',
      },
      {
        source: '/calibration-references/mass/cuswd/create',
        destination: '/dashboard/calibration-references/mass/cuswd/create',
      },
      {
        source: '/calibration-references/mass/cuswd/edit-cuswd/:refId',
        destination: '/dashboard/calibration-references/mass/cuswd/edit-cuswd/:refId',
      },
      {
        source: '/calibration-references/mass/cuswd/view/:refId',
        destination: '/dashboard/calibration-references/mass/cuswd/view/:refId',
      },
      {
        source: '/calibration-references/mass/mpe',
        destination: '/dashboard/calibration-references/mass/mpe/list',
      },
      {
        source: '/calibration-references/mass/mpe/create',
        destination: '/dashboard/calibration-references/mass/mpe/create',
      },

      {
        source: '/calibration-references/mass/mpe/edit-mpe/:refId',
        destination: '/dashboard/calibration-references/mass/mpe/edit-mpe/:refId',
      },
      {
        source: '/calibration-references/mass/mpe/view/:refId',
        destination: '/dashboard/calibration-references/mass/mpe/view/:refId',
      },
      {
        source: '/calibration-references/mass/ck',
        destination: '/dashboard/calibration-references/mass/ck/list',
      },
      {
        source: '/calibration-references/mass/ck/create',
        destination: '/dashboard/calibration-references/mass/ck/create',
      },
      {
        source: '/calibration-references/mass/ck/edit-ck/:refId',
        destination: '/dashboard/calibration-references/mass/ck/edit-ck/:refId',
      },
      {
        source: '/calibration-references/mass/ck/view/:refId',
        destination: '/dashboard/calibration-references/mass/ck/view/:refId',
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
        source: '/user/:workerId/jobs/edit-jobs/:jobId',
        destination: '/dashboard/user/:workerId/jobs/edit-jobs/:jobId',
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
        source: '/user/:workerId/jobs/:jobId/calibrations/edit-calibrations/:calibrateId',
        destination:
          '/dashboard/user/:workerId/jobs/:jobId/calibrations/edit-calibrations/:calibrateId',
      },
      {
        source: '/user/:workerId/jobs/:jobId/calibrations/view/:calibrateId',
        destination: '/dashboard/user/:workerId/jobs/:jobId/calibrations/view/:calibrateId',
      },
      {
        source: '/user/:workerId/notifications',
        destination: '/dashboard/user/:workerId/notifications',
      },
      {
        source: '/user/:workerId/job-cns/create',
        destination: '/dashboard/user/:workerId/job-cns/create',
      },
      {
        source: '/user/:workerId/job-cns/edit-job-cns/:jobCnId',
        destination: '/dashboard/user/:workerId/job-cns/edit-job-cns/:jobCnId',
      },
      {
        source: '/user/:workerId/job-cns/view/:jobCnId',
        destination: '/dashboard/user/:workerId/job-cns/view/:jobCnId',
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
