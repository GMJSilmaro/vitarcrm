// Cache duration constants
export const CACHE_DURATIONS = {
  SHORT: 5 * 60 * 1000,    // 5 minutes
  MEDIUM: 30 * 60 * 1000,  // 30 minutes
  LONG: 60 * 60 * 1000,    // 1 hour
  DAY: 24 * 60 * 60 * 1000 // 24 hours
};

// Cache keys specific to customers
export const CUSTOMER_CACHE_KEYS = {
  LIST: 'vitar_customers_list',
  DETAILS: 'vitar_customer_details',
  LOCATIONS: 'vitar_customer_locations'
};

// Cache helper functions for customers
export const customerCacheHelpers = {
  get: async (key) => {
    try {
      const cachedData = localStorage.getItem(key);
      if (!cachedData) return null;

      const { data, timestamp } = JSON.parse(cachedData);
      const now = new Date().getTime();

      // Check if cache is expired (30 minutes)
      if (now - timestamp > CACHE_DURATIONS.MEDIUM) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Customer cache get error:', error);
      return null;
    }
  },

  set: (key, data) => {
    try {
      const cacheData = {
        data,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Clear only customer-related cache if quota is exceeded
        Object.values(CUSTOMER_CACHE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });
        try {
          // Retry setting the cache
          localStorage.setItem(key, JSON.stringify({
            data,
            timestamp: new Date().getTime()
          }));
        } catch (retryError) {
          console.error('Failed to set customer cache after clearing:', retryError);
        }
      } else {
        console.error('Customer cache set error:', error);
      }
    }
  },

  clear: (key) => {
    try {
      if (key) {
        localStorage.removeItem(key);
      } else {
        // Clear all customer-related cache
        Object.values(CUSTOMER_CACHE_KEYS).forEach(cacheKey => {
          localStorage.removeItem(cacheKey);
        });
      }
    } catch (error) {
      console.error('Customer cache clear error:', error);
    }
  }
}; 