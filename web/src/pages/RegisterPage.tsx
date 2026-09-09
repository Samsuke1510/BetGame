// -----------------------------------------------------------------------------
// RegisterPage.tsx — the "Create account" form
// -----------------------------------------------------------------------------
// Nearly identical to the login page, but hits the register endpoint. A new
// account starts with €30 virtual balance (added automatically by the server).
// -----------------------------------------------------------------------------

import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api";
import type { User } from "../types";

interface Props {
  onRegister: (user: User) => void;
}

export default function RegisterPage({ onRegister }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const { token, user } = await register(username, password);
      localStorage.setItem("token", token);
      onRegister(user);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Something went wrong");
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create account</h1>

        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-primary" type="submit">Sign up</button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}