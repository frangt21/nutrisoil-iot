import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { getAdminUsers, createAdminUser, updateAdminUser, suspendAdminUser } from '../services/api';
import { showToast } from '../utils/toast'; // Importar showToast
import { validateRut } from '../utils/formatters';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        new_email: '',
        password: '',
        nombre: '',
        apellido: '',
        rut: '',
        empresa: '',
        role: 'usuario'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await getAdminUsers();
            setUsers(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar usuarios');
            console.error(err);
            showToast('Error al cargar usuarios', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                nombre: user.nombre || '',
                apellido: user.apellido || '',
                rut: user.rut || '',
                empresa: user.empresa || '',
                role: user.role || 'usuario',
                new_email: user.email, // Mostrar email actual
                password: '' // No mostrar password
            });
        } else {
            setEditingUser(null);
            setFormData({
                new_email: '',
                password: '',
                nombre: '',
                apellido: '',
                rut: '',
                empresa: '',
                role: 'usuario'
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación de RUT
        if (formData.rut && !validateRut(formData.rut)) {
            showToast('El RUT ingresado no es válido.', 'error');
            return;
        }

        // Validación de Contraseña (Solo al crear o si se está cambiando)
        if (!editingUser || formData.password) {
            const pwd = formData.password;
            const minLength = 6;
            const hasUpperCase = /[A-Z]/.test(pwd);
            const hasLowerCase = /[a-z]/.test(pwd);
            const hasNumbers = /\d/.test(pwd);

            if (pwd.length < minLength) {
                showToast('La contraseña debe tener al menos 6 caracteres.', 'error');
                return;
            }
            if (!hasUpperCase) {
                showToast('La contraseña debe tener al menos una letra mayúscula.', 'error');
                return;
            }
            if (!hasLowerCase) {
                showToast('La contraseña debe tener al menos una letra minúscula.', 'error');
                return;
            }
            if (!hasNumbers) {
                showToast('La contraseña debe tener al menos un número.', 'error');
                return;
            }
        }

        try {
            if (editingUser) {
                await updateAdminUser(editingUser.id, formData);
                showToast('Usuario actualizado correctamente', 'success');
            } else {
                await createAdminUser(formData);
                showToast('Usuario creado correctamente', 'success');
            }
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            showToast('Error al guardar usuario: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleSuspend = async (id) => {
        if (window.confirm('¿Estás seguro de suspender a este usuario?')) {
            try {
                await suspendAdminUser(id);
                showToast('Usuario suspendido correctamente', 'success');
                fetchUsers();
            } catch (err) {
                showToast('Error al suspender usuario: ' + (err.response?.data?.error || err.message), 'error');
            }
        }
    };

    if (loading) return <Container className="mt-5">Cargando...</Container>;

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestión de Usuarios</h2>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    + Nuevo Usuario
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Nombre</th>
                        <th>RUT</th>
                        <th>Empresa</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} style={{ opacity: user.is_active ? 1 : 0.5 }}>
                            <td>{user.email}</td>
                            <td>{`${user.nombre || ''} ${user.apellido || ''}`}</td>
                            <td>{user.rut}</td>
                            <td>{user.empresa}</td>
                            <td>
                                <Badge bg={user.role === 'admin' ? 'danger' : 'info'}>
                                    {user.role}
                                </Badge>
                            </td>
                            <td>
                                <Badge bg={user.is_active ? 'success' : 'secondary'}>
                                    {user.is_active ? 'Activo' : 'Suspendido'}
                                </Badge>
                            </td>
                            <td>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleOpenModal(user)}
                                >
                                    Editar
                                </Button>
                                {user.is_active && (
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleSuspend(user.id)}
                                    >
                                        Suspender
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={formData.new_email}
                                onChange={e => setFormData({ ...formData, new_email: e.target.value })}
                                required
                                disabled={!!editingUser} // No permitir cambiar email al editar por ahora para simplificar
                            />
                        </Form.Group>

                        {!editingUser && (
                            <Form.Group className="mb-3">
                                <Form.Label>Contraseña</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                />
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Nombre</Form.Label>
                            <Form.Control
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Apellido</Form.Label>
                            <Form.Control
                                value={formData.apellido}
                                onChange={e => setFormData({ ...formData, apellido: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>RUT</Form.Label>
                            <Form.Control
                                value={formData.rut}
                                onChange={e => setFormData({ ...formData, rut: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Empresa</Form.Label>
                            <Form.Control
                                value={formData.empresa}
                                onChange={e => setFormData({ ...formData, empresa: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Rol</Form.Label>
                            <Form.Select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="usuario">Usuario</option>
                                <option value="admin">Administrador</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit">
                            Guardar
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default AdminUsersPage;
