// -----------------------------------------------------------------------------
// Navbar.tsx — the top bar with the user's name, balance, and logout button
// -----------------------------------------------------------------------------

import type { User } from "../types";

interface Props {
  user: User;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: Props) {
  return (
    <nav className="navbar">
      <span className="navbar-brand">⚾ BetGame</span>

      <div className="navbar-right">
        {/* Live balance, straight from the server-held user object. */}
        <span className="balance">Balance: €{user.balance.toFixed(2)}</span>
        <span className="username">{user.username}</span>
        <button className="btn btn-outline" onClick={onLogout}>
          Log out
        </button>
      </div>
    </nav>
  );
}