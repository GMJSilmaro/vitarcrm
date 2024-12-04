// Cache duration constants
export const CACHE_DURATIONS = {
  SHORT: 5 * 60 * 1000,    // 5 minutes
  MEDIUM: 30 * 60 * 1000,  // 30 minutes
  LONG: 60 * 60 * 1000,    // 1 hour
  DAY: 24 * 60 * 60 * 1000 // 24 hours
};

// Cache keys
export const CACHE_KEYS = {
  CUSTOMERS: 'vitar_customers_cache',
  LOCATIONS: 'vitar_locations_cache',
  COUNTRIES: 'vitar_countries_cache'
};

// Maximum number of items per cache chunk
const CHUNK_SIZE = 100;

// Cache helper functions
const cacheHelpers = {
  get: async (key) => {
    try {
      const cachedData = localStorage.getItem(key);
      if (!cachedData) return null;

      const { data, timestamp } = JSON.parse(cachedData);
      const now = new Date().getTime();

      if (now - timestamp > 30 * 60 * 1000) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  set: (key, data) => {
    const prepareCache = () => ({
      data,
      timestamp: new Date().getTime()
    });

    try {
      const cacheData = prepareCache();
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded. Clearing old cache.');
        localStorage.clear(); // Clear all storage
        try {
          const cacheData = prepareCache(); // Create new cache data
          localStorage.setItem(key, JSON.stringify(cacheData)); // Retry setting the item
        } catch (retryError) {
          console.error('Failed to set cache after clearing:', retryError);
        }
      } else {
        console.error('Cache set error:', error);
      }
    }
  },

  clear: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
};

export default cacheHelpers; 