// -----------------------------------------------------------------------------
// main.tsx — the very first thing the browser loads for our app
// -----------------------------------------------------------------------------
// It mounts our top-level <App /> component into the <div id="root"> element
// that exists in index.html, and wires up React Router so pages can navigate.
// -----------------------------------------------------------------------------

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);