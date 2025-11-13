export const ENV = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  wsUrl: import.meta.env.VITE_WS_URL,
  buildEnv: import.meta.env.VITE_BUILD_ENV || 'dev',
}
