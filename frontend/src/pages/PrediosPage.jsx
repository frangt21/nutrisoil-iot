import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Modal,
    Form,
    Accordion,
    Spinner,
    Alert
} from 'react-bootstrap';
import { getPredios, createPredio, updatePredio, deletePredio } from '../services/api';
import { showToast } from '../utils/toast'; // Importar showToast

const PrediosPage = () => {
    // --- ESTADOS ---
    const [predios, setPredios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Mantener para el Alert en pantalla
    const [showModal, setShowModal] = useState(false);
    const [editingPredio, setEditingPredio] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        superficie: '',
        zona: 'Osorno',
        tipo_suelo: 'Andisol',
        cultivo_actual: ''
    });

    // --- LÓGICA DE DATOS ---
    useEffect(() => {
        fetchPredios();
    }, []);

    const fetchPredios = async () => {
        try {
            setLoading(true);
            const data = await getPredios();
            setPredios(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching predios:", err);
            showToast("Error al cargar los predios.", 'error');
            setError("Error al cargar los predios."); // Mantener para el Alert en pantalla
        } finally {
            setLoading(false);
        }
    };

    // Hook useMemo para agrupar los predios por zona.
    const prediosPorZona = useMemo(() => {
        return predios.reduce((acc, predio) => {
            const zona = predio.zona || 'Sin Zona Asignada';
            if (!acc[zona]) {
                acc[zona] = [];
            }
            acc[zona].push(predio);
            return acc;
        }, {});
    }, [predios]);

    // --- MANEJADORES DE EVENTOS (HANDLERS) ---
    const handleShowCreate = () => {
        setEditingPredio(null);
        setFormData({
            nombre: '',
            superficie: '',
            zona: 'Osorno',
            tipo_suelo: 'Andisol',
            cultivo_actual: ''
        });
        setShowModal(true);
    };

    const handleShowEdit = (predio) => {
        setEditingPredio(predio);
        setFormData({
            nombre: predio.nombre,
            superficie: predio.superficie,
            zona: predio.zona,
            tipo_suelo: predio.tipo_suelo,
            cultivo_actual: predio.cultivo_actual
        });
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPredio) {
                await updatePredio(editingPredio.id, formData);
                showToast("Predio actualizado correctamente.", 'success');
            } else {
                await createPredio(formData);
                showToast("Predio creado correctamente.", 'success');
            }
            fetchPredios();
            handleCloseModal();
        } catch (err) {
            console.error("Error saving predio:", err);
            showToast("Error al guardar el predio.", 'error');
            setError("Error al guardar el predio."); // Mantener para el Alert en pantalla
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar este predio?")) {
            try {
                await deletePredio(id);
                showToast("Predio eliminado correctamente.", 'success');
                fetchPredios();
            } catch (err) {
                console.error("Error deleting predio:", err);
                showToast("Error al eliminar el predio.", 'error');
                setError("Error al eliminar el predio."); // Mantener para el Alert en pantalla
            }
        }
    };

    // --- RENDERIZADO ---
    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" variant="success" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
                <p className="mt-2">Cargando predios...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 mb-0 text-gray-800">Mis Predios</h1>
                <Button variant="success" onClick={handleShowCreate}>
                    <i className="bi bi-plus-lg me-2"></i>Nuevo Predio
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {predios.length > 0 ? (
                <Accordion defaultActiveKey={['0']} alwaysOpen>
                    {Object.entries(prediosPorZona).map(([zona, listaPredios], index) => (
                        <Accordion.Item eventKey={index.toString()} key={zona} className="mb-2 shadow-sm">
                            <Accordion.Header>
                                {zona} - <span className="text-muted ms-2">{listaPredios.length} predio(s)</span>
                            </Accordion.Header>
                            <Accordion.Body>
                                <Row>
                                    {listaPredios.map(predio => (
                                        <Col md={6} lg={4} key={predio.id} className="mb-4">
                                            <Card className="h-100 border-0 shadow-sm">
                                                <Card.Body className="d-flex flex-column">
                                                    <Card.Title className="text-success fw-bold">{predio.nombre}</Card.Title>
                                                    <Card.Text className="flex-grow-1">
                                                        <strong>Superficie:</strong> {predio.superficie} ha<br />
                                                        <strong>Tipo de suelo:</strong> {predio.tipo_suelo}<br />
                                                        <strong>Cultivo actual:</strong> {predio.cultivo_actual || 'Sin asignar'}
                                                    </Card.Text>
                                                    <div className="mt-auto d-flex gap-2">
                                                        <Link to={`/predios/${predio.id}/mediciones`} className="w-100">
                                                            <Button variant="outline-success" size="sm" className="w-100">
                                                                Ver Mediciones
                                                            </Button>
                                                        </Link>
                                                        <Button variant="outline-primary" size="sm" className="w-100" onClick={() => handleShowEdit(predio)}>
                                                            Editar
                                                        </Button>
                                                        <Button variant="outline-danger" size="sm" className="w-100" onClick={() => handleDelete(predio.id)}>
                                                            Eliminar
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
            ) : (
                <div className="text-center mt-5 p-5 bg-white rounded shadow-sm">
                    <h4 className="text-muted mb-3">No tienes predios registrados</h4>
                    <p className="text-muted mb-4">Haz clic en "Nuevo Predio" para comenzar a monitorear tu campo.</p>
                    <Button variant="success" size="lg" onClick={handleShowCreate}>Comenzar ahora</Button>
                </div>
            )}

            {/* Modal Create/Edit */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingPredio ? 'Editar Predio' : 'Nuevo Predio'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre</Form.Label>
                            <Form.Control
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                required
                                placeholder="Ej: Parcela Norte"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Superficie (hectáreas)</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                name="superficie"
                                value={formData.superficie}
                                onChange={handleInputChange}
                                required
                                placeholder="Ej: 15.5"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Zona</Form.Label>
                            <Form.Select
                                name="zona"
                                value={formData.zona}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Seleccione una zona...</option>
                                <option value="Puerto Montt">Puerto Montt</option>
                                <option value="Osorno">Osorno</option>
                                <option value="Río Bueno">Río Bueno</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Tipo de Suelo</Form.Label>
                            <Form.Select
                                name="tipo_suelo"
                                value={formData.tipo_suelo}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Seleccione un tipo de suelo...</option>
                                <option value="Andisol">Andisol</option>
                                <option value="Ultisol">Ultisol</option>
                                <option value="Alfisol">Alfisol</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Cultivo Actual</Form.Label>
                            <Form.Select
                                name="cultivo_actual"
                                value={formData.cultivo_actual}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Seleccione un cultivo...</option>
                                <option value="Papa temprana">Papa temprana</option>
                                <option value="Avena forrajera">Avena forrajera</option>
                                <option value="Ballica perenne">Ballica perenne</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit">
                            {editingPredio ? 'Guardar Cambios' : 'Guardar Predio'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default PrediosPage;
