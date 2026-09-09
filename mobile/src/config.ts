// -----------------------------------------------------------------------------
// config.ts — the few settings the mobile app needs
// -----------------------------------------------------------------------------
// The web app cheats: Vite forwards every "/api" call to the backend for free.
// On mobile there is no proxy, so we connect to the backend's address directly.

// The address of the backend server. This points at the server deployed on
// Railway, so the app works from anywhere on the internet (no same-Wi-Fi
// requirement). If the Railway project changes, update this URL and rebuild.
export const API_BASE_URL = "https://moneygame-projet1-e785.up.railway.app";