// src/App.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// Páginas
import LoginPage from "../features/auth/pages/LoginPage";
import HomePage from "../features/home/pages/HomePage";

// Layout general de la app
import AppLayout from "../ui/layout/AppLayout";

export default function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/"
          element={
            <AppLayout title="Inicio">
              <HomePage />
            </AppLayout>
          }
        />
      </Route>
    </Routes>
  );
}
