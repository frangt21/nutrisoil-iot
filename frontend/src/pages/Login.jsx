// Pantalla Login

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { login } from '../services/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(username, password);
      localStorage.setItem('token', response.token);
      navigate('/dashboard');
    } catch (error) {
      alert('Error de login: ' + error.message);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center login-container" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px'}}>
        <Card.Body>
          <h2 className="text-center mb-4" style={{ color: '#28a745' }}>🌱 NutriSoil IoT</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Usuario</Form.Label>
              <Form.Control 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
              />
            </Form.Group>
            <Button variant="success" type="submit" className="w-100">
              Iniciar Sesión
            </Button>
          </Form>
          <p className="text-center mt-3 text-muted">
            Usuario demo: admin | Contraseña: admin
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;