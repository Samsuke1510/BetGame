// -----------------------------------------------------------------------------
// App.tsx — top-level component: routing + auth protection
// -----------------------------------------------------------------------------
// This decides which page to show. If the user is logged in they see the
// Dashboard; if not they're sent to the Login page. The user object and a
// refresh token are stored in React state here and passed down so every page
// can access the current user.
// -----------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { fetchMe } from "./api";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import type { User } from "./types";

export default function App() {
  // "user" starts as null (nobody logged in). We load it from the token on
  // first render. "ready" lets us wait before rendering so we don't flash the
  // login page at logged-in users.
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Called once when the page loads.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setReady(true); // no token -> definitely logged out
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => localStorage.removeItem("token")) // bad token -> clear it
      .finally(() => setReady(true));
  }, []);

  // Until we know if the token is valid, show nothing to avoid flicker.
  if (!ready) return null;

  return (
    <>
      {/* Navbar only makes sense once someone is logged in. */}
      {user && <Navbar user={user} onLogout={() => { localStorage.removeItem("token"); setUser(null); }} />}

      <Routes>
        {/* Public pages */}
        <Route path="/login" element={<LoginPage onLogin={setUser} />} />
        <Route path="/register" element={<RegisterPage onRegister={setUser} />} />

        {/* The main logged-in page */}
        <Route
          path="/"
          element={user ? <Dashboard user={user} onUserUpdate={setUser} /> : <Navigate to="/login" replace />}
        />

        {/* Anything unknown goes to the dashboard or login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}