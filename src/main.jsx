import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";

import "./index.css";
import App from "./App";
import Admin from "./Admin";

const isAdminPage = window.location.pathname === "/admin";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAdminPage ? <Admin /> : <App />}
    <Toaster
      position="bottom-right"
      richColors
      closeButton
    />
  </React.StrictMode>
);