// src/pages/Perfil.jsx
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext'; // Importar useAuth
import { updateProfile } from '../services/api';
import { showToast } from '../utils/toast'; // Importar showToast
import { validateRut } from '../utils/formatters';

function Perfil() {
    const { profile, signOut, loading: authLoading } = useAuth(); // Usar el perfil del contexto

    // Estado para los datos del perfil
    const [error, setError] = useState(null); // Mantener para el Alert en pantalla
    const [successMsg, setSuccessMsg] = useState(null); // Mantener para el Alert en pantalla

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        empresa: '',
        rut: '',
        email: ''
    });

    // Cargar datos del perfil desde el contexto
    useEffect(() => {
        if (profile) {
            setFormData({
                nombre: profile.nombre || '',
                apellido: profile.apellido || '',
                empresa: profile.empresa || '',
                rut: profile.rut || '',
                email: profile.email || ''
            });
        }
    }, [profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        if (formData.rut && !validateRut(formData.rut)) {
            setError('El RUT ingresado no es válido.');
            showToast('El RUT ingresado no es válido.', 'error');
            return;
        }

        try {
            const dataToUpdate = {
                nombre: formData.nombre,
                apellido: formData.apellido,
                empresa: formData.empresa,
                rut: formData.rut
            };

            await updateProfile(profile.id, dataToUpdate);
            showToast("Perfil actualizado correctamente.", 'success');
            // No necesitamos setProfile(updatedProfile) aquí porque el contexto ya se refresca
            // al detectar cambios en el perfil si el backend responde con los nuevos datos.
        } catch (err) {
            console.error("Error actualizando perfil:", err);
            showToast("Error al actualizar el perfil.", 'error');
            setError("Error al actualizar el perfil."); // Mantener para el Alert en pantalla
        }
    };

    const handleNotImplemented = (feature) => {
        showToast(`La funcionalidad de cambiar ${feature} se implementará en un futuro.`, 'info');
    };

    const handleLogout = async () => {
        try {
            await signOut();
            showToast("Sesión cerrada correctamente.", 'info');
            // La redirección es manejada por el router al cambiar el estado de autenticación
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            showToast('No se pudo cerrar la sesión.', 'error');
            setError('No se pudo cerrar la sesión.'); // Mantener para el Alert en pantalla
        }
    };

    if (authLoading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" variant="success" />
                <p className="mt-2">Cargando perfil...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="p-4">
            <h2 className="mb-4 text-gray-800">Mi Perfil</h2>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            {successMsg && <Alert variant="success" onClose={() => setSuccessMsg(null)} dismissible>{successMsg}</Alert>}

            <Row>
                {/* --- Columna Izquierda: Información Personal --- */}
                <Col md={8} lg={6} className="mb-4">
                    <Card className="h-100 shadow-sm border-0">
                        <Card.Body>
                            <Card.Title className="text-success mb-4 fw-bold">Información Personal</Card.Title>
                            <Form onSubmit={handleUpdateProfile}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Nombre</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="nombre"
                                                value={formData.nombre}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Apellido</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="apellido"
                                                value={formData.apellido}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Empresa</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="empresa"
                                        value={formData.empresa}
                                        onChange={handleInputChange}
                                        placeholder="Nombre de su empresa agrícola"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>RUT</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="rut"
                                        value={formData.rut}
                                        onChange={handleInputChange}
                                        placeholder="12.345.678-9"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="bg-light"
                                    />
                                    <Form.Text className="text-muted">
                                        El email no se puede editar directamente.
                                    </Form.Text>
                                </Form.Group>

                                <div className="d-grid gap-2 mt-4">
                                    <Button variant="success" type="submit">
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* --- Columna Derecha: Seguridad y Cuenta --- */}
                <Col md={4} lg={6} className="mb-4">
                    <Card className="mb-4 shadow-sm border-0">
                        <Card.Body>
                            <Card.Title className="text-primary mb-3 fw-bold">Seguridad</Card.Title>
                            <p className="text-muted small">Gestiona la seguridad de tu cuenta.</p>

                            <div className="d-grid gap-3">
                                <Button variant="outline-primary" onClick={() => handleNotImplemented('contraseña')}>
                                    Cambiar Contraseña
                                </Button>
                                <Button variant="outline-secondary" onClick={() => handleNotImplemented('correo electrónico')}>
                                    Cambiar Correo Electrónico
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <Card.Title className="text-danger mb-3 fw-bold">Zona de Peligro</Card.Title>
                            <p className="text-muted small">Cierra sesión en este dispositivo.</p>
                            <Button variant="danger" onClick={handleLogout} className="w-100">
                                Cerrar Sesión
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Perfil;