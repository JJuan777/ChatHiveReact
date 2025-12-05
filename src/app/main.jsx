// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./providers/AuthContext";
import "./styles/globals.css";

import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />

        <Toaster
          richColors
          closeButton
          position="top-right"
          theme="system" 
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
