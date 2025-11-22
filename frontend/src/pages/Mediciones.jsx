import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Table, Button, Spinner, Modal, Form, Row, Col, Alert, Pagination, Card } from 'react-bootstrap';
import {
    getMediciones,
    getPredios,
    createMedicion,
    updateMedicion,
    deleteMedicion,
    createRecomendacionIndividual
} from '../services/api';
import { showToast } from '../utils/toast';
import { formatNumber } from '../utils/formatters';

function Mediciones() {
    const { predioId } = useParams();
    const navigate = useNavigate();
    const [predioName, setPredioName] = useState('');

    // Estados para la tabla principal
    const [mediciones, setMediciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para paginación y filtros
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ fecha__gte: '', fecha__lte: '' });

    // Estados para el modal de edición/creación
    const [showModal, setShowModal] = useState(false);
    const [editingMedicion, setEditingMedicion] = useState(null);
    const [formData, setFormData] = useState({
        fecha: '', ph: '', temperatura: '', humedad: '',
        nitrogeno: '', fosforo: '', potasio: '', origen: 'manual'
    });

    const cargarDatos = async (page, appliedFilters) => {
        setLoading(true);
        try {
            if (!predioName) {
                const allPredios = await getPredios();
                const currentPredio = allPredios.find(p => p.id.toString() === predioId);
                setPredioName(currentPredio ? currentPredio.nombre : 'Desconocido');
            }

            const params = {
                predio: predioId,
                page: page,
                ...appliedFilters,
            };

            const medicionesData = await getMediciones(params);
            setMediciones(medicionesData.results);
            setTotalPages(Math.ceil(medicionesData.count / 10));
            setCurrentPage(page);

        } catch (error) {
            console.error("Error al cargar mediciones:", error);
            showToast("Error al cargar las mediciones.", 'error');
            setError("Error al cargar los datos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos(1, { fecha__gte: '', fecha__lte: '' });
    }, [predioId]);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleApplyFilters = () => {
        cargarDatos(1, filters);
    };

    const handlePageChange = (page) => {
        cargarDatos(page, filters);
    };

    const handleSyncWemos = () => {
        showToast("Buscando datos del sensor...", 'info');
        setTimeout(() => {
            showToast("No se encontraron nuevas mediciones del dispositivo.", 'info');
        }, 2000);
    };

    const handleShowModal = (medicion = null) => {
        setError(null);
        if (medicion) {
            setEditingMedicion(medicion);
            const date = new Date(medicion.fecha);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            const formattedDate = date.toISOString().slice(0, 16);

            setFormData({
                fecha: formattedDate,
                ph: medicion.ph,
                temperatura: medicion.temperatura,
                humedad: medicion.humedad,
                nitrogeno: medicion.nitrogeno || '',
                fosforo: medicion.fosforo || '',
                potasio: medicion.potasio || '',
                origen: medicion.origen
            });
        } else {
            setEditingMedicion(null);
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            const formattedNow = now.toISOString().slice(0, 16);

            setFormData({
                fecha: formattedNow,
                ph: '',
                temperatura: '',
                humedad: '',
                nitrogeno: '',
                fosforo: '',
                potasio: '',
                origen: 'manual'
            });
        }
        setShowModal(true);
    };
    const handleCloseModal = () => setShowModal(false);

    const [errors, setErrors] = useState({});

    const VALIDATION_RANGES = {
        ph: { min: 4.0, max: 9.0, label: 'pH' },
        temperatura: { min: -5, max: 45, label: 'Temperatura' },
        humedad: { min: 0, max: 100, label: 'Humedad' },
        nitrogeno: { min: 0, max: 100, label: 'Nitrógeno' },
        fosforo: { min: 0, max: 100, label: 'Fósforo' },
        potasio: { min: 0, max: 3.0, label: 'Potasio' }
    };

    const validateField = (name, value) => {
        if (value === '' || value === null) return null;
        const numValue = parseFloat(value);
        const range = VALIDATION_RANGES[name];

        if (range) {
            if (numValue < range.min || numValue > range.max) {
                return `El valor de ${range.label} debe estar entre ${range.min} y ${range.max}`;
            }
        }
        return null;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        const error = validateField(name, value);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar todos los campos antes de enviar
        const newErrors = {};
        let isValid = true;

        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            }
        });

        if (!isValid) {
            setErrors(newErrors);
            showToast("Por favor, corrija los errores en el formulario.", 'error');
            return;
        }

        try {
            const payload = { ...formData, predio: predioId };
            if (editingMedicion) {
                await updateMedicion(editingMedicion.id, payload);
                showToast("Medición actualizada correctamente.", 'success');
            } else {
                await createMedicion(payload);
                showToast("Medición creada correctamente.", 'success');
            }
            handleCloseModal();
            cargarDatos(currentPage, filters);
        } catch (err) {
            console.error("Error al guardar medición:", err);
            showToast("Error al guardar la medición.", 'error');
        }
    };
    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar esta medición?')) {
            try {
                showToast("Funcionalidad de 'Soft Delete' pendiente.", 'info');
            } catch (err) {
                showToast("Error al eliminar la medición.", 'error');
            }
        }
    };
    const handleGenerateIndividualRecommendation = async (medicionId) => {
        try {
            const recomendacion = await createRecomendacionIndividual(medicionId);
            showToast("Recomendación generada correctamente.", 'success');
            navigate(`/recomendaciones/${recomendacion.id}`);
        } catch (error) {
            showToast('Error al generar recomendación: ' + (error.response?.data?.error || error.message), 'error');
        }
    };


    if (loading && !mediciones.length) {
        return <Container className="text-center mt-5"><Spinner animation="border" variant="success" /></Container>;
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Mediciones: {predioName}</h2>
                    <p className="text-muted">Gestión y registro de datos de suelo y clima.</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="info" onClick={handleSyncWemos}>
                        Sincronizar con Dispositivo IoT
                    </Button>
                    <Button variant="success" onClick={() => handleShowModal()}>
                        + Nueva Medición Manual
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="mb-4">
                <Card.Body>
                    <Row className="align-items-end">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Filtrar desde:</Form.Label>
                                <Form.Control type="date" name="fecha__gte" value={filters.fecha__gte} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Filtrar hasta:</Form.Label>
                                <Form.Control type="date" name="fecha__lte" value={filters.fecha__lte} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={4} className="d-flex align-items-end">
                            <Button variant="primary" onClick={handleApplyFilters}>Aplicar Filtros</Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Origen</th>
                        <th>pH</th>
                        <th>Temp (°C)</th>
                        <th>Humedad (%)</th>
                        <th>N (ppm)</th>
                        <th>P (ppm)</th>
                        <th>K (cmol/kg)</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && <tr><td colSpan="9" className="text-center"><Spinner animation="border" size="sm" /></td></tr>}
                    {!loading && mediciones.map(m => (
                        <tr key={m.id}>
                            <td>{new Date(m.fecha).toLocaleString('es-CL')}</td>
                            <td>
                                <span className={`badge bg-${m.origen === 'manual' ? 'info' : 'warning'} text-dark`}>{m.origen}</span>
                            </td>
                            <td>{formatNumber(m.ph, 1)}</td>
                            <td>{formatNumber(m.temperatura, 1)}</td>
                            <td>{formatNumber(m.humedad, 1)}</td>
                            <td>{formatNumber(m.nitrogeno, 2)}</td>
                            <td>{formatNumber(m.fosforo, 2)}</td>
                            <td>{formatNumber(m.potasio, 2)}</td>
                            <td className="d-flex gap-2">
                                <Button variant="outline-primary" size="sm" onClick={() => handleShowModal(m)}>Editar</Button>
                                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(m.id)}>Eliminar</Button>
                                {m.nitrogeno && m.fosforo && m.potasio && (
                                    <Button variant="outline-success" size="sm" onClick={() => handleGenerateIndividualRecommendation(m.id)}>Generar Rec.</Button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {!loading && mediciones.length === 0 && (
                        <tr><td colSpan="9" className="text-center text-muted">No se encontraron mediciones para los filtros seleccionados.</td></tr>
                    )}
                </tbody>
            </Table>

            <Pagination>
                <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                {[...Array(totalPages).keys()].map(page => (
                    <Pagination.Item key={page + 1} active={page + 1 === currentPage} onClick={() => handlePageChange(page + 1)}>
                        {page + 1}
                    </Pagination.Item>
                ))}
                <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
            </Pagination>

            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingMedicion ? 'Editar Medición' : 'Nueva Medición'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Fecha y Hora</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="fecha"
                                        value={formData.fecha}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Origen</Form.Label>
                                    <Form.Select name="origen" value={formData.origen} onChange={handleInputChange}>
                                        <option value="manual">Ingreso Manual</option>
                                        <option value="wemos">Sensor Wemos</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <h5 className="mt-4 mb-3 text-success">Datos del Suelo</h5>
                        <Row className="mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>pH</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.1"
                                        name="ph"
                                        value={formData.ph}
                                        onChange={handleInputChange}
                                        required
                                        isInvalid={!!errors.ph}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.ph}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Temperatura (°C)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.1"
                                        name="temperatura"
                                        value={formData.temperatura}
                                        onChange={handleInputChange}
                                        required
                                        isInvalid={!!errors.temperatura}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.temperatura}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Humedad (%)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.1"
                                        name="humedad"
                                        value={formData.humedad}
                                        onChange={handleInputChange}
                                        required
                                        isInvalid={!!errors.humedad}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.humedad}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <h5 className="mt-4 mb-3 text-primary">Nutrientes (NPK)</h5>
                        <Row className="mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Nitrógeno (ppm)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="nitrogeno"
                                        value={formData.nitrogeno}
                                        onChange={handleInputChange}
                                        isInvalid={!!errors.nitrogeno}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.nitrogeno}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Fósforo (ppm)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="fosforo"
                                        value={formData.fosforo}
                                        onChange={handleInputChange}
                                        isInvalid={!!errors.fosforo}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.fosforo}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Potasio (cmol/kg)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.0001"
                                        name="potasio"
                                        value={formData.potasio}
                                        onChange={handleInputChange}
                                        isInvalid={!!errors.potasio}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.potasio}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                        <Button variant="success" type="submit">{editingMedicion ? 'Guardar Cambios' : 'Crear Medición'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}

export default Mediciones;