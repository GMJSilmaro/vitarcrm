// Cache duration constants
export const CACHE_DURATIONS = {
  SHORT: 5 * 60 * 1000,    // 5 minutes
  MEDIUM: 30 * 60 * 1000,  // 30 minutes
  LONG: 60 * 60 * 1000,    // 1 hour
  DAY: 24 * 60 * 60 * 1000 // 24 hours
};

// Cache keys specific to locations
export const LOCATION_CACHE_KEYS = {
  LIST: 'vitar_locations_list',
  DETAILS: 'vitar_location_details'
};

// Cache keys
export const CACHE_KEYS = {
    CUSTOMERS: 'vitar_customers_cache',
    LOCATIONS: 'vitar_locations_cache',
    COUNTRIES: 'vitar_countries_cache'
  };

// Cache helper functions for locations
export const locationCacheHelpers = {
  get: async (key) => {
    try {
      const cachedData = localStorage.getItem(key);
      if (!cachedData) return null;

      const { data, timestamp } = JSON.parse(cachedData);
      const now = new Date().getTime();

      // Check if cache is expired (30 minutes)
      if (now - timestamp > 30 * 60 * 1000) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Location cache get error:', error);
      return null;
    }
  },

  set: (key, data) => {
    try {
      // Store all necessary fields
      const locationData = data.map(item => ({
        id: item.id,
        siteId: item.siteId,
        siteName: item.siteName,
        streetAddress1: item.streetAddress1,
        streetAddress2: item.streetAddress2,
        streetAddress3: item.streetAddress3,
        city: item.city,
        postalCode: item.postalCode,
        province: item.province,
        country: item.country
      }));

      const cacheData = {
        data: locationData,
        timestamp: new Date().getTime()
      };

      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Location cache set error:', error);
    }
  },

  clear: (key) => {
    try {
      if (key) {
        localStorage.removeItem(key);
      } else {
        // Clear all location-related cache
        Object.values(LOCATION_CACHE_KEYS).forEach(cacheKey => {
          localStorage.removeItem(cacheKey);
        });
      }
    } catch (error) {
      console.error('Location cache clear error:', error);
    }
  }
}; 