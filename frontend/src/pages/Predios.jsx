import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom'; // Para navegar a las mediciones
import { 
    Container, 
    Row, 
    Col, 
    Card, 
    Button, 
    Modal, 
    Form,
    Accordion, // ¡Importamos Accordion!
    Spinner // Para un mejor feedback de carga
} from 'react-bootstrap';
import { getPredios, createPredio } from '../services/api';
// Importa un icono de Bootstrap si quieres usarlo en el botón
// Asegúrate de tener 'npm install react-bootstrap-icons' si lo usas
// import { PlusCircle } from 'react-bootstrap-icons';

function Predios() {
    // --- ESTADOS ---
    const [predios, setPredios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        superficie: '',
        zona: 'Osorno',
        tipo_suelo: 'Andisol',
        cultivo_actual: ''
    });

    // --- LÓGICA DE DATOS ---
    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            try {
                const data = await getPredios();
                setPredios(data);
            } catch (error) {
                console.error("Error al cargar los predios:", error);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, []);

    // Hook useMemo para agrupar los predios por zona.
    // Este cálculo solo se re-ejecuta si la lista de predios cambia.
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
    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createPredio(formData);
            handleCloseModal();
            // Refrescar la lista de predios
            const data = await getPredios();
            setPredios(data);
            alert('Predio creado correctamente');
            // Limpiar formulario
            setFormData({ nombre: '', superficie: '', zona: 'Osorno', tipo_suelo: 'Andisol', cultivo_actual: '' });
        } catch (error) {
            console.error("Error al crear el predio:", error);
            alert('Error al crear el predio');
        }
    };
    
    // --- RENDERIZADO ---
    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" variant="success" />
                <p className="mt-2">Cargando predios...</p>
            </Container>
        );
    }

    return (
        <>
            <Container>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Mis Predios</h2>
                    <Button variant="success" onClick={handleShowModal}>
                        {/* <PlusCircle className="me-2" /> */}
                        Agregar Predio
                    </Button>
                </div>

                {predios.length > 0 ? (
                    <Accordion defaultActiveKey={['0']} alwaysOpen>
                        {Object.entries(prediosPorZona).map(([zona, listaPredios], index) => (
                            <Accordion.Item eventKey={index.toString()} key={zona} className="mb-2 accordion-item-dark">
                                <Accordion.Header>
                                    {zona} - <span className="text-muted ms-2">{listaPredios.length} predio(s)</span>
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        {listaPredios.map(predio => (
                                            <Col md={6} lg={4} key={predio.id} className="mb-4">
                                                <Card className="h-100">
                                                    <Card.Body className="d-flex flex-column">
                                                        <Card.Title className="text-success">{predio.nombre}</Card.Title>
                                                        <Card.Text className="flex-grow-1">
                                                            <strong>Superficie:</strong> {predio.superficie} ha<br/>
                                                            <strong>Tipo de suelo:</strong> {predio.tipo_suelo}<br/>
                                                            <strong>Cultivo actual:</strong> {predio.cultivo_actual || 'Sin asignar'}
                                                        </Card.Text>
                                                        <div className="mt-auto d-flex gap-2">
                                                            {/* El botón ahora navega a la página de mediciones correcta */}
                                                            <Link to={`/predios/${predio.id}/mediciones`} className="w-100">
                                                                <Button variant="outline-success" size="sm" className="w-100">
                                                                    Ver Mediciones
                                                                </Button>
                                                            </Link>
                                                            <Button variant="outline-secondary" size="sm" className="w-100">
                                                                Editar
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
                    <div className="text-center mt-5 p-4" style={{backgroundColor: 'var(--card-bg)', borderRadius: '8px'}}>
                        <h4 className="text-muted">No tienes predios registrados</h4>
                        <p className="text-muted">Haz clic en "Agregar Predio" para comenzar a monitorear tu campo.</p>
                        <Button variant="success" onClick={handleShowModal}>Comenzar ahora</Button>
                    </div>
                )}
            </Container>

            {/* --- Modal para agregar predio (sin cambios estructurales) --- */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Agregar Nuevo Predio</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        {/* Tu formulario aquí, tal como lo tenías */}
                        {/* ... */}
                        <div className="d-flex gap-2 mt-4">
                            <Button variant="success" type="submit" className="w-50">
                                Guardar Predio
                            </Button>
                            <Button variant="secondary" onClick={handleCloseModal} className="w-50">
                                Cancelar
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default Predios;