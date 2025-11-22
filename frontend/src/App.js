import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Mediciones from './pages/Mediciones';
import PrediosPage from './pages/PrediosPage';
import Reportes from './pages/Reportes';
import Perfil from './pages/Perfil';
import AdminUsersPage from './pages/AdminUsersPage';
import RecomendacionDetalle from './pages/RecomendacionDetalle'; // Importar el nuevo componente
import MainLayout from './layouts/MainLayout';
import { Spinner } from 'react-bootstrap';
import { Container } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify'; // Importar ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Importar CSS

// Componente para proteger rutas
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="success" />
      </Container>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="success" />
      </Container>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      {/* Rutas protegidas */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout><Dashboard /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/predios"
        element={
          <ProtectedRoute>
            <MainLayout><PrediosPage /></MainLayout> {/* Changed to PrediosPage */}
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <ProtectedRoute>
            <MainLayout><Reportes /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <MainLayout><Perfil /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/predios/:predioId/mediciones"
        element={
          <ProtectedRoute>
            <MainLayout><Mediciones /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <MainLayout><AdminUsersPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recomendaciones/:id"
        element={
          <ProtectedRoute>
            <MainLayout><RecomendacionDetalle /></MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      </AuthProvider>
    </Router>
  );
}

export default App;