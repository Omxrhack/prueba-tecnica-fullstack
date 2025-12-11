// /frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Función para verificar si el usuario está autenticado
const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// Componente Wrapper para proteger rutas
const ProtectedRoute = ({ element: Element, ...rest }: { element: React.FC }) => {
  return isAuthenticated() ? <Element {...rest} /> : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Ruta protegida */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute element={Dashboard} />}
        />

        {/* Redirección por defecto */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />}
        />

        {/* TODO: Agregar aquí la ruta de Reportes del Admin /admin/reporte */}

      </Routes>
    </BrowserRouter>
  );
};

export default App;