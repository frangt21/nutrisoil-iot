// Pantalla Login con Supabase Auth

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error.message || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }
      
      // Si el login fue exitoso, el AuthContext ya actualizó el estado
      // Navegar al dashboard (el loading se resetea al navegar)
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center login-container" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px'}}>
        <Card.Body>
          <h2 className="text-center mb-4" style={{ color: '#28a745' }}>🌱 NutriSoil IoT</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu email"
                required
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                disabled={loading}
              />
            </Form.Group>
            <Button variant="success" type="submit" className="w-100" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Form>
          <p className="text-center mt-3 text-muted">
            Usa tu email y contraseña de Supabase
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;