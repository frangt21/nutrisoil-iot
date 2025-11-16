// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Button, ButtonGroup, ListGroup } from 'react-bootstrap';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getMediciones } from '../services/api';

function Dashboard() {
    const [mediciones, setMediciones] = useState([]);
    const [loading, setLoading] = useState(true);

    const axisColor = '#6c757d'; 
    const gridColor = '#dee2e6';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getMediciones();
                const sortedData = [...data].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                setMediciones(sortedData);
            } catch (error) {
                console.error("Error al cargar mediciones para el dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Datos de ejemplo para los nuevos gráficos (esto vendrá del backend en el futuro)
    const mockComparisonData = [
        { name: 'Potrero Norte', nitrogeno: 14.5, ph: 5.4 },
        { name: 'Lote Sur', nitrogeno: 16.0, ph: 5.5 },
        { name: 'Sector Este', nitrogeno: 12.0, ph: 6.1 },
    ];
    const mockAlerts = [
        { id: 1, text: 'pH bajo en Potrero Norte (5.4)', variant: 'warning' },
        { id: 2, text: 'Nivel de Potasio crítico en Sector Este', variant: 'danger' },
    ];

    if (loading) {
        return <Container className="text-center mt-5"><Spinner animation="border" variant="success" /></Container>;
    }

    const ultimaMedicion = mediciones.length > 0 ? mediciones[mediciones.length - 1] : {};

    return (
        <Container fluid>
            <h2 className="mb-4">Dashboard Principal</h2>

            {/* SECCIÓN 1: KPIs de la Última Medición */}
            <Row className="mb-4">
                <Col md={2} className="mb-3"><Card><Card.Body className="text-center"><Card.Title>pH</Card.Title><h3 className="text-success">{ultimaMedicion.ph || '--'}</h3></Card.Body></Card></Col>
                <Col md={2} className="mb-3"><Card><Card.Body className="text-center"><Card.Title>Temperatura</Card.Title><h3 className="text-success">{ultimaMedicion.temperatura || '--'}°C</h3></Card.Body></Card></Col>
                <Col md={2} className="mb-3"><Card><Card.Body className="text-center"><Card.Title>Humedad</Card.Title><h3 className="text-success">{ultimaMedicion.humedad || '--'}%</h3></Card.Body></Card></Col>
                <Col md={2} className="mb-3"><Card><Card.Body className="text-center"><Card.Title>Nitrógeno (N)</Card.Title><h3 className="text-success">{ultimaMedicion.nitrogeno || '--'} ppm</h3></Card.Body></Card></Col>
                <Col md={2} className="mb-3"><Card><Card.Body className="text-center"><Card.Title>Fósforo (P)</Card.Title><h3 className="text-success">{ultimaMedicion.fosforo || '--'} ppm</h3></Card.Body></Card></Col>
                <Col md={2} className="mb-3"><Card><Card.Body className="text-center"><Card.Title>Potasio (K)</Card.Title><h3 className="text-success">{ultimaMedicion.potasio || '--'} cmol/kg</h3></Card.Body></Card></Col>
            </Row>

            {/* SECCIÓN 2: Gráficos de Tendencias */}
            <Card className="mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Card.Title>Tendencia de Nutrientes (NPK)</Card.Title>
                        <ButtonGroup size="sm">
                            <Button variant="outline-secondary">Últimos 7 días</Button>
                            <Button variant="outline-secondary" active>Últimos 30 días</Button>
                        </ButtonGroup>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={mediciones}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="fecha" stroke={axisColor} />
                            <YAxis stroke={axisColor} />
                            <Tooltip />
                            <Legend wrapperStyle={{ color: axisColor }} />
                            <Line type="monotone" name="Nitrógeno (ppm)" dataKey="nitrogeno" stroke="#28a745" strokeWidth={2} />
                            <Line type="monotone" name="Fósforo (ppm)" dataKey="fosforo" stroke="#fd7e14" strokeWidth={2} />
                            <Line type="monotone" name="Potasio (cmol/kg)" dataKey="potasio" stroke="#0d6efd" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card.Body>
            </Card>

            {/* SECCIÓN 3: Comparativa y Alertas */}
            <Row>
                <Col md={8} className="mb-4">
                    <Card>
                        <Card.Body>
                            <Card.Title>Comparativa de Nitrógeno por Predio</Card.Title>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={mockComparisonData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                    <XAxis dataKey="name" stroke={axisColor} />
                                    <YAxis stroke={axisColor} />
                                    <Tooltip />
                                    <Bar dataKey="nitrogeno" name="Nitrógeno (ppm)" fill="#28a745" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-4">
                    <Card>
                        <Card.Body>
                            <Card.Title>Alertas y Notificaciones</Card.Title>
                            <ListGroup variant="flush">
                                {mockAlerts.map(alert => (
                                     <ListGroup.Item key={alert.id} variant={alert.variant}>
                                        {alert.text}
                                     </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Dashboard;