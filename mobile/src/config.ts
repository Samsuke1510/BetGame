// -----------------------------------------------------------------------------
// config.ts — the few settings the mobile app needs
// -----------------------------------------------------------------------------
// The web app cheats: Vite forwards every "/api" call to the backend for free.
// On mobile there is no proxy, so we connect to the backend's address directly.

// The address of the backend server. Choose the right one for where the app is
// running (they all point at the SAME server on port 4000):
//
//   * Browser preview (Expo web) on this PC  -> http://localhost:4000  (default)
//   * Android emulator                      -> http://10.0.2.2:4000
//       (10.0.2.2 is the emulator's special name for the host computer)
//   * Physical phone using the Expo Go app  -> http://<your-PC's-LAN-IP>:4000
//       (find your PC's IP with `ipconfig` on Windows; looks like 192.168.x.x.
//        Phone and PC must be on the SAME Wi-Fi network.)
export const API_BASE_URL = "http://localhost:4000";