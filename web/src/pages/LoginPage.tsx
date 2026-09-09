// -----------------------------------------------------------------------------
// LoginPage.tsx — the "Welcome back" form
// -----------------------------------------------------------------------------
// Collects a username + password, calls the server, and on success saves the
// token and hands the user object up to App so the whole app knows they're in.
// -----------------------------------------------------------------------------

import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api";
import type { User } from "../types";

interface Props {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: Props) {
  // Controlled form state — whatever is in the boxes.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); // don't reload the page on submit
    try {
      const { token, user } = await login(username, password);
      localStorage.setItem("token", token); // remember the login
      onLogin(user);
      navigate("/"); // go to the dashboard
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Something went wrong");
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Log in</h1>

        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-primary" type="submit">Log in</button>

        <p className="auth-switch">
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}