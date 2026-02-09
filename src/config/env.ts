export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
};
