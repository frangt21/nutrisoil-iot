// src/pages/Perfil.jsx
import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function Perfil() {
    const navigate = useNavigate();

    // Estado para los datos del perfil
    const [formData, setFormData] = useState({
        username: 'admin',
        email: 'admin@nutrisoil.com',
        first_name: 'Usuario',
        last_name: 'Demo'
    });

    // Estado para el cambio de contraseña
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        // Lógica de actualización de perfil (actualmente es un mock)
        alert('Perfil actualizado correctamente (modo demo)');
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            alert('Las nuevas contraseñas no coinciden');
            return;
        }
        if (passwordData.new.length < 6) {
            alert('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }
        // Lógica de cambio de contraseña (actualmente es un mock)
        alert('Contraseña actualizada correctamente (modo demo)');
        setPasswordData({ current: '', new: '', confirm: '' });
    };

    const handleLogout = () => {
        // Lógica de cierre de sesión
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <Container fluid>
            <h2 className="mb-4">Mi Perfil</h2>
            <Row>
                {/* --- Columna Izquierda: Información Personal y de Cuenta --- */}
                <Col md={6} className="mb-4">
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title className="text-success mb-3">Información Personal</Card.Title>
                            <Form onSubmit={handleUpdateProfile}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Usuario</Form.Label>
                                    <Form.Control type="text" value={formData.username} disabled />
                                    <Form.Text>El nombre de usuario no se puede cambiar.</Form.Text>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre</Form.Label>
                                    <Form.Control type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Apellido</Form.Label>
                                    <Form.Control type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                                </Form.Group>
                                <Button variant="success" type="submit" className="w-100">
                                    Guardar Cambios
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* --- Columna Derecha: Contraseña y Cerrar Sesión --- */}
                <Col md={6} className="mb-4">
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title className="text-success mb-3">Cambiar Contraseña</Card.Title>
                            <Form onSubmit={handleChangePassword}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Contraseña Actual</Form.Label>
                                    <Form.Control type="password" required value={passwordData.current} onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nueva Contraseña</Form.Label>
                                    <Form.Control type="password" required minLength={6} value={passwordData.new} onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Confirmar Nueva Contraseña</Form.Label>
                                    <Form.Control type="password" required value={passwordData.confirm} onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })} />
                                </Form.Group>
                                <Button variant="success" type="submit" className="w-100">
                                    Cambiar Contraseña
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                    
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-danger">Cerrar Sesión</Card.Title>
                            <p className="text-muted">Sal de tu cuenta de forma segura.</p>
                            <Button variant="danger" onClick={handleLogout} className="w-100">
                                Cerrar Sesión
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* --- Fila Inferior: Información de la Cuenta --- */}
            <Row>
                <Col>
                    <Card>
                        <Card.Body>
                            <Card.Title>Información de la Cuenta</Card.Title>
                            <Row className="mt-3">
                                <Col md={4}><p><strong>Tipo de cuenta:</strong> Usuario Estándar</p></Col>
                                <Col md={4}><p><strong>Miembro desde:</strong> Noviembre 2024</p></Col>
                                <Col md={4}><p><strong>Último acceso:</strong> Hoy</p></Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Perfil;