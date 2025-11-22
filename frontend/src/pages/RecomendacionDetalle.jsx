import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Spinner, Alert, Badge, Button } from 'react-bootstrap'; // Importar Button
import { getRecomendacionDetail } from '../services/api';
import { showToast } from '../utils/toast'; // Importar showToast
import { formatNumber } from '../utils/formatters';

// Gráficos (usaremos una librería sencilla o incluso CSS si es muy básico)
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const RecomendacionDetalle = () => {
    const { id } = useParams();
    const [recomendacion, setRecomendacion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRecomendacion = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getRecomendacionDetail(id);
            setRecomendacion(data);
            setError(null);
        } catch (err) {
            console.error("Error al cargar la recomendación:", err);
            showToast("Error al cargar el detalle de la recomendación.", 'error');
            setError("Error al cargar el detalle de la recomendación."); // Mantener para el Alert en pantalla
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchRecomendacion();
    }, [fetchRecomendacion]);

    const handleEmail = () => {
        showToast("Funcionalidad 'Enviar por correo' en desarrollo.", 'info');
    };

    const handleExportPdf = () => {
        showToast("Funcionalidad 'Exportar PDF' en desarrollo.", 'info');
    };

    if (loading) {
        return <Container className="text-center mt-5"><Spinner animation="border" variant="success" /></Container>;
    }

    if (error) {
        return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    }

    if (!recomendacion) {
        return <Container className="mt-5"><Alert variant="info">No se encontró la recomendación.</Alert></Container>;
    }

    // Acceder a los detalles del predio
    const predio = recomendacion.predio_detalle;

    // Datos para el gráfico de Justificación Visual
    const chartData = {
        labels: ['pH', 'Nitrógeno (ppm)', 'Fósforo (ppm)', 'Potasio (cmol/kg)'],
        datasets: [
            {
                label: 'Tu Medición',
                data: [
                    recomendacion.ph_promedio,
                    recomendacion.n_promedio,
                    recomendacion.p_promedio,
                    recomendacion.k_promedio
                ],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Comparación de Tu Medición con Rangos',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    const getBadgeVariant = (tipo) => {
        switch (tipo) {
            case 'critico': return 'danger';
            case 'advertencia': return 'warning';
            case 'optimo': return 'success';
            case 'informativo': return 'info';
            default: return 'secondary';
        }
    };

    return (
        <Container className="py-4">
            <Row className="align-items-center mb-4">
                <Col>
                    <h2 className="mb-0">Recomendación para {predio.nombre}</h2>
                    <p className="text-muted mb-0">Generada el: {new Date(recomendacion.fecha_calculo).toLocaleString('es-CL')}</p>
                </Col>
                <Col xs="auto">
                    <Button variant="outline-secondary" className="me-2" onClick={handleEmail}>
                        Enviar por correo
                    </Button>
                    <Button variant="outline-primary" onClick={handleExportPdf}>
                        Exportar PDF
                    </Button>
                </Col>
            </Row>

            {/* Resumen del Predio */}
            <Row className="mb-5">
                <Col md={12}>
                    <Card className="shadow-sm">
                        <Card.Header as="h4" className="bg-light text-dark">Detalles del Predio</Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <p><strong>Nombre del Predio:</strong> {predio.nombre}</p>
                                    <p><strong>Zona:</strong> {predio.zona}</p>
                                    <p><strong>Tipo de Suelo:</strong> {predio.tipo_suelo}</p>
                                </Col>
                                <Col md={6}>
                                    <p><strong>Cultivo Actual:</strong> {predio.cultivo_actual || 'No especificado'}</p>
                                    <p><strong>Superficie:</strong> {formatNumber(predio.superficie)} ha</p>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Detalles de la Medición */}
            <Row className="mb-5">
                <Col md={12}>
                    <Card className="shadow-sm">
                        <Card.Header as="h4" className="bg-info text-white">Detalles de la Medición</Card.Header>
                        <Card.Body>
                            <Row className="text-center">
                                <Col md={2} sm={4} className="mb-3">
                                    <Card className="h-100 border-0 bg-light">
                                        <Card.Body>
                                            <h6 className="text-muted">pH</h6>
                                            <h3>{recomendacion.ph_promedio != null ? formatNumber(recomendacion.ph_promedio) : <span className="text-muted fs-6">No hay Datos</span>}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={2} sm={4} className="mb-3">
                                    <Card className="h-100 border-0 bg-light">
                                        <Card.Body>
                                            <h6 className="text-muted">Temperatura</h6>
                                            <h3>{recomendacion.temp_promedio != null ? `${formatNumber(recomendacion.temp_promedio)} °C` : <span className="text-muted fs-6">No hay Datos</span>}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={2} sm={4} className="mb-3">
                                    <Card className="h-100 border-0 bg-light">
                                        <Card.Body>
                                            <h6 className="text-muted">Humedad</h6>
                                            <h3>{recomendacion.humedad_promedio != null ? `${formatNumber(recomendacion.humedad_promedio)} %` : <span className="text-muted fs-6">No hay Datos</span>}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={2} sm={4} className="mb-3">
                                    <Card className="h-100 border-0 bg-light">
                                        <Card.Body>
                                            <h6 className="text-muted">Nitrógeno</h6>
                                            <h3>{recomendacion.n_promedio != null ? `${formatNumber(recomendacion.n_promedio)} ppm` : <span className="text-muted fs-6">No hay Datos</span>}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={2} sm={4} className="mb-3">
                                    <Card className="h-100 border-0 bg-light">
                                        <Card.Body>
                                            <h6 className="text-muted">Fósforo</h6>
                                            <h3>{recomendacion.p_promedio != null ? `${formatNumber(recomendacion.p_promedio)} ppm` : <span className="text-muted fs-6">No hay Datos</span>}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={2} sm={4} className="mb-3">
                                    <Card className="h-100 border-0 bg-light">
                                        <Card.Body>
                                            <h6 className="text-muted">Potasio</h6>
                                            <h3>{recomendacion.k_promedio != null ? `${formatNumber(recomendacion.k_promedio)} cmol/kg` : <span className="text-muted fs-6">No hay Datos</span>}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mb-5">
                <Col md={12}>
                    <Card className="shadow-sm">
                        <Card.Header as="h4" className="bg-primary text-white">1. El Plan de Acción</Card.Header>
                        <Card.Body>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Fertilizante</th>
                                        <th>Cantidad por Hectárea (kg/ha)</th>
                                        <th>Cantidad Total para {predio.superficie} ha (kg)</th>
                                        <th>Momento de Aplicación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Urea</td>
                                        <td>{formatNumber(recomendacion.urea_kg_ha)}</td>
                                        <td>{formatNumber(recomendacion.urea_total)}</td>
                                        <td>100% Pre-siembra</td>
                                    </tr>
                                    <tr>
                                        <td>Superfosfato Triple</td>
                                        <td>{formatNumber(recomendacion.superfosfato_kg_ha)}</td>
                                        <td>{formatNumber(recomendacion.superfosfato_total)}</td>
                                        <td>100% Pre-siembra</td>
                                    </tr>
                                    <tr>
                                        <td>Muriato de Potasio</td>
                                        <td>{formatNumber(recomendacion.muriato_potasio_kg_ha)}</td>
                                        <td>{formatNumber(recomendacion.muriato_potasio_total)}</td>
                                        <td>100% Pre-siembra</td>
                                    </tr>
                                    <tr>
                                        <td>Cal Agrícola</td>
                                        <td>{formatNumber(recomendacion.cal_kg_ha)}</td>
                                        <td>{formatNumber(recomendacion.cal_total)}</td>
                                        <td>Al momento de la preparación del suelo</td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mb-5">
                <Col md={12}>
                    <Card className="shadow-sm">
                        <Card.Header as="h4" className="bg-success text-white">2. Justificación Visual</Card.Header>
                        <Card.Body>
                            <Bar data={chartData} options={chartOptions} />
                            <Alert variant="info" className="mt-3">
                                Nota: Los rangos óptimos se detallan en la sección de Alertas y Observaciones.
                            </Alert>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mb-5">
                <Col md={12}>
                    <Card className="shadow-sm">
                        <Card.Header as="h4" className="bg-warning text-dark">3. Alertas y Observaciones</Card.Header>
                        <Card.Body>
                            {recomendacion.alertas && recomendacion.alertas.length > 0 ? (
                                recomendacion.alertas.map((alert, index) => (
                                    <Alert key={index} variant={getBadgeVariant(alert.tipo)}>
                                        <strong>{alert.parametro}:</strong> {alert.mensaje}
                                    </Alert>
                                ))
                            ) : (
                                <Alert variant="info">No hay alertas ni observaciones específicas para esta recomendación.</Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default RecomendacionDetalle;
