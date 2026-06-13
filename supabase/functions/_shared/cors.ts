// Shared CORS headers for the browser-facing Edge Functions.
// Tighten `Access-Control-Allow-Origin` to your real domain(s) before launch.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, APCA-API-KEY-ID, APCA-API-SECRET-KEY',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};
