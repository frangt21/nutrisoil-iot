import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Spinner, ListGroup, Accordion } from 'react-bootstrap';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDashboardStats } from '../services/api';
import { showToast } from '../utils/toast';
import { formatNumber } from '../utils/formatters'; // Importar formatNumber

function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    const axisColor = '#6c757d'; 
    const gridColor = '#e9ecef';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getDashboardStats();
                setDashboardData(data);
            } catch (error) {
                console.error("Error al cargar datos para el dashboard:", error);
                showToast("No se pudieron cargar los datos del dashboard.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const { 
        ultima_medicion_kpis, 
        tendencia_npk, 
        comparativa_predios, 
        alertas 
    } = dashboardData || {};

    // Agrupar alertas por tipo
    const groupedAlerts = useMemo(() => {
        if (!alertas) return {};
        return alertas.reduce((acc, alert) => {
            const tipo = alert.tipo;
            if (!acc[tipo]) {
                acc[tipo] = [];
            }
            acc[tipo].push(alert);
            return acc;
        }, {});
    }, [alertas]);

    const getAlertVariant = (tipo) => {
        const variants = {
            critico: 'danger',
            advertencia: 'warning',
            optimo: 'success',
            informativo: 'info',
        };
        return variants[tipo] || 'secondary';
    };
    
    if (loading) {
        return <Container className="text-center mt-5"><Spinner animation="border" variant="success" /></Container>;
    }

    if (!dashboardData) {
        return <Container className="text-center mt-5"><h3>No hay datos para mostrar.</h3></Container>;
    }

    return (
        <Container fluid>
            <h2 className="mb-4">Dashboard Principal</h2>

            {/* SECCIÓN 1: KPIs de la Última Medición */}
            <div className="mb-4">
                <h5 className="text-muted">
                    Última Medición Registrada
                    {ultima_medicion_kpis && ` en ${ultima_medicion_kpis.predio_nombre} (${ultima_medicion_kpis.predio_zona})`}
                </h5>
                <Row>
                    <Col md={2} className="mb-3"><Card><Card.Body className="text-center"><Card.Title>pH</Card.Title><h3 className="text-success">{formatNumber(ultima_medicion_kpis?.ph, 1)}</h3></Card.Body></Card></Col>
                    <Col md={2} className="mb-3"><Card><Card.Body className="text-center"><Card.Title>Temperatura</Card.Title><h3 className="text-success">{formatNumber(ultima_medicion_kpis?.temperatura, 1)}°C</h3></Card.Body></Card></Col>
                    <Col md={2} className="mb-3"><Card><Card.Body className="text-center"><Card.Title>Humedad</Card.Title><h3 className="text-success">{formatNumber(ultima_medicion_kpis?.humedad, 1)}%</h3></Card.Body></Card></Col>
                    <Col md={2} className="mb-3"><Card><Card.Body className="text-center"><Card.Title>Nitrógeno (N)</Card.Title><h3 className="text-success">{formatNumber(ultima_medicion_kpis?.nitrogeno, 2)} ppm</h3></Card.Body></Card></Col>
                    <Col md={2} className="mb-3"><Card><Card.Body className="text-center"><Card.Title>Fósforo (P)</Card.Title><h3 className="text-success">{formatNumber(ultima_medicion_kpis?.fosforo, 2)} ppm</h3></Card.Body></Card></Col>
                    <Col md={2} className="mb-3"><Card><Card.Body className="text-center"><Card.Title>Potasio (K)</Card.Title><h3 className="text-success">{formatNumber(ultima_medicion_kpis?.potasio, 2)} cmol/kg</h3></Card.Body></Card></Col>
                </Row>
            </div>

            {/* SECCIÓN 2: Gráficos de Tendencias */}
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>Tendencia de Nutrientes (NPK) - Últimos 30 días</Card.Title>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={tendencia_npk}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="fecha" stroke={axisColor} tickFormatter={(tick) => new Date(tick).toLocaleDateString('es-CL')} />
                            <YAxis stroke={axisColor} />
                            <Tooltip />
                            <Legend wrapperStyle={{ color: axisColor }} />
                            <Line type="monotone" name="Nitrógeno (ppm)" dataKey="nitrogeno" stroke="#28a745" strokeWidth={2} dot={false} />
                            <Line type="monotone" name="Fósforo (ppm)" dataKey="fosforo" stroke="#fd7e14" strokeWidth={2} dot={false} />
                            <Line type="monotone" name="Potasio (cmol/kg)" dataKey="potasio" stroke="#0d6efd" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card.Body>
            </Card>

            {/* SECCIÓN 3: Alertas */}
            <Card className="mb-4">
                <Card.Header>Alertas y Notificaciones</Card.Header>
                <Card.Body>
                    <Accordion defaultActiveKey={[]} alwaysOpen>
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>Alertas Críticas ({groupedAlerts['critico']?.length || 0})</Accordion.Header>
                            <Accordion.Body>
                                <ListGroup variant="flush">
                                    {groupedAlerts['critico']?.map((alert, index) => (
                                     <ListGroup.Item key={index} variant={getAlertVariant(alert.tipo)}>{alert.mensaje}</ListGroup.Item>
                                    )) || <ListGroup.Item>No hay alertas críticas.</ListGroup.Item>}
                                </ListGroup>
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="1">
                            <Accordion.Header>Advertencias ({groupedAlerts['advertencia']?.length || 0})</Accordion.Header>
                            <Accordion.Body>
                                <ListGroup variant="flush">
                                    {groupedAlerts['advertencia']?.map((alert, index) => (
                                     <ListGroup.Item key={index} variant={getAlertVariant(alert.tipo)}>{alert.mensaje}</ListGroup.Item>
                                    )) || <ListGroup.Item>No hay advertencias.</ListGroup.Item>}
                                </ListGroup>
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="2">
                            <Accordion.Header>Óptimos ({groupedAlerts['optimo']?.length || 0 })</Accordion.Header>
                            <Accordion.Body>
                                <ListGroup variant="flush">
                                    {groupedAlerts['optimo']?.map((alert, index) => (
                                     <ListGroup.Item key={`opt-${index}`} variant={getAlertVariant(alert.tipo)}>{alert.mensaje}</ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Card.Body>
            </Card>

            {/* SECCIÓN 4: Comparativas */}
            <Row>
                <Col md={12} className="mb-4">
                    <Card>
                        <Card.Body>
                            <Card.Title>Comparativa de Nitrógeno por Predio (Última Medición)</Card.Title>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={comparativa_predios}>
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
                <Col md={12} className="mb-4">
                    <Card>
                        <Card.Body>
                            <Card.Title>Comparativa de Fósforo por Predio (Última Medición)</Card.Title>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={comparativa_predios}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                    <XAxis dataKey="name" stroke={axisColor} />
                                    <YAxis stroke={axisColor} />
                                    <Tooltip />
                                    <Bar dataKey="fosforo" name="Fósforo (ppm)" fill="#fd7e14" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={12} className="mb-4">
                    <Card>
                        <Card.Body>
                            <Card.Title>Comparativa de Potasio por Predio (Última Medición)</Card.Title>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={comparativa_predios}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                    <XAxis dataKey="name" stroke={axisColor} />
                                    <YAxis stroke={axisColor} />
                                    <Tooltip />
                                    <Bar dataKey="potasio" name="Potasio (cmol/kg)" fill="#0d6efd" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

        </Container>
    );
}

export default Dashboard;