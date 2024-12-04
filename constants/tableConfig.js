// Create a new constants file for table configurations
export const TABLE_CONFIG = {
  PAGE_SIZES: {
    DEFAULT: 10,
    OPTIONS: [5, 10, 25, 50, 100]
  },
  
  TOAST_MESSAGES: {
    PAGE_SIZE: {
      LOADING: (size) => ({
        title: 'Updating View',
        message: `Loading ${size} entries...`
      }),
      SUCCESS: (size, type) => ({
        title: 'View Updated',
        message: `Now showing ${size} ${type} entries`
      }),
      ERROR: {
        title: 'Update Failed',
        message: 'Could not change the number of entries'
      }
    }
  },
  
  VIEWS: {
    CUSTOMERS: {
      name: 'customers',
      singular: 'customer',
      plural: 'customers'
    },
    JOBS: {
      name: 'jobs',
      singular: 'job',
      plural: 'jobs'
    },
    ENQUIRIES: {
      name: 'enquiries',
      singular: 'enquiry',
      plural: 'enquiries'
    }
  }
}; 