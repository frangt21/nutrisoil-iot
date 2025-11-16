import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Mediciones from './pages/Mediciones';
import Predios from './pages/Predios';
import Reportes from './pages/Reportes';
import Perfil from './pages/Perfil';
import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Rutas que usan el MainLayout */}
        <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/predios" element={<MainLayout><Predios /></MainLayout>} />
        <Route path="/reportes" element={<MainLayout><Reportes /></MainLayout>} />
        <Route path="/perfil" element={<MainLayout><Perfil /></MainLayout>} />
        {/* Agrega una ruta para las mediciones de un predio específico */}
        <Route path="/predios/:predioId/mediciones" element={<MainLayout><Mediciones /></MainLayout>} />
      </Routes>
    </Router>
  );
}

export default App;