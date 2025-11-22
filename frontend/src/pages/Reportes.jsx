import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Form, Spinner, Table, Accordion } from 'react-bootstrap';
import { getMediciones, getPredios, getRecomendaciones } from '../services/api';
import { showToast } from '../utils/toast'; // Importar showToast

function Reportes() {
    // --- ESTADOS ---
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [allPredios, setAllPredios] = useState([]);
    const [recomendaciones, setRecomendaciones] = useState([]);
    const [selectedZonas, setSelectedZonas] = useState([]);
    const [reportFilters, setReportFilters] = useState({
        predioIds: [],
        fechaInicio: '',
        fechaFin: '',
    });
    const [reportData, setReportData] = useState(null);
    const navigate = useNavigate();

    // --- LÓGICA DE DATOS ---
    useEffect(() => {
        const cargarDatosIniciales = async () => {
            setLoading(true);
            try {
                const prediosData = await getPredios();
                setAllPredios(prediosData);
                const recomendacionesData = await getRecomendaciones();
                setRecomendaciones(recomendacionesData);
            } catch (error) {
                console.error("Error al cargar datos iniciales:", error);
                showToast("Error al cargar datos iniciales.", 'error');
            } finally {
                setLoading(false);
            }
        };
        cargarDatosIniciales();
    }, []);

    const zonasUnicas = useMemo(() => [...new Set(allPredios.map(p => p.zona))], [allPredios]);

    const prediosFiltradosPorZona = useMemo(() => {
        if (selectedZonas.length === 0) {
            return allPredios;
        }
        return allPredios.filter(p => selectedZonas.includes(p.zona));
    }, [allPredios, selectedZonas]);

    const recomendacionesPorPredio = useMemo(() => {
        return recomendaciones.reduce((acc, rec) => {
            const predioId = rec.predio;
            if (!acc[predioId]) {
                acc[predioId] = [];
            }
            acc[predioId].push(rec);
            return acc;
        }, {});
    }, [recomendaciones]);

    // --- MANEJADORES DE EVENTOS ---
    const handleZonaChange = (e) => {
        const options = e.target.options;
        const selectedValues = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedValues.push(options[i].value);
            }
        }
        setSelectedZonas(selectedValues);
        setReportFilters(prev => ({ ...prev, predioIds: [] })); // Limpia selección de predios
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        if (name === "predioIds") {
            const options = e.target.options;
            const selectedValues = [];
            for (let i = 0; i < options.length; i++) {
                if (options[i].selected) {
                    selectedValues.push(options[i].value);
                }
            }
            setReportFilters(prev => ({ ...prev, [name]: selectedValues }));
        } else {
            setReportFilters(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        setReportData(null);
        try {
            const allMediciones = await getMediciones();
            let filteredMediciones = allMediciones.filter(m => m.recomendacion);

            if (reportFilters.predioIds.length > 0) {
                filteredMediciones = filteredMediciones.filter(m => reportFilters.predioIds.includes(m.predio.toString()));
            }
            if (reportFilters.fechaInicio) {
                filteredMediciones = filteredMediciones.filter(m => new Date(m.fecha) >= new Date(reportFilters.fechaInicio));
            }
            if (reportFilters.fechaFin) {
                filteredMediciones = filteredMediciones.filter(m => new Date(m.fecha) <= new Date(reportFilters.fechaFin));
            }

            const totalAnalisis = filteredMediciones.length;
            const calculateAvg = (key) => totalAnalisis > 0
                ? (filteredMediciones.reduce((sum, m) => sum + parseFloat(m[key]), 0) / totalAnalisis).toFixed(1)
                : '--';

            setReportData({
                summary: {
                    totalAnalisis,
                    avgPh: calculateAvg('ph'),
                    avgTemp: calculateAvg('temperatura'),
                    avgN: calculateAvg('nitrogeno'),
                    avgP: calculateAvg('fosforo'),
                    avgK: calculateAvg('potasio'),
                    prediosCount: reportFilters.predioIds.length,
                    periodo: `${reportFilters.fechaInicio || 'Inicio'} a ${reportFilters.fechaFin || 'Fin'}`
                },
                details: filteredMediciones
            });
            showToast("Reporte generado correctamente.", 'success');
        } catch (error) {
            console.error("Error generando el reporte:", error);
            showToast("No se pudo generar el reporte.", 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportPDF = () => {
        showToast('Función de exportar PDF en desarrollo.\nEn la versión final se generará un PDF completo con los datos de este reporte.', 'info');
    };

    // --- RENDERIZADO ---
    if (loading) {
        return <Container className="text-center mt-5"><Spinner animation="border" variant="success" /></Container>;
    }

    return (
        <Container>
            <Card className="mb-4">
                <Card.Header as="h5">Generador de Reportes</Card.Header>
                <Card.Body>
                    <Card.Text>Selecciona los parámetros para crear un nuevo reporte de recomendaciones.</Card.Text>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>1. Selecciona la(s) Zona(s)</Form.Label>
                                <Form.Select multiple onChange={handleZonaChange} style={{ height: '150px' }}>
                                    {zonasUnicas.map(zona => <option key={zona} value={zona}>{zona}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>2. Selecciona el/los Predio(s)</Form.Label>
                                <Form.Select multiple name="predioIds" value={reportFilters.predioIds} onChange={handleFilterChange} style={{ height: '150px' }}>
                                    {prediosFiltradosPorZona.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </Form.Select>
                                <Form.Text>Mantén presionada la tecla Ctrl (o Cmd en Mac) para seleccionar varios.</Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>3. Selecciona el Periodo</Form.Label>
                                <Form.Control type="date" name="fechaInicio" value={reportFilters.fechaInicio} onChange={handleFilterChange} className="mb-2"/>
                                <Form.Control type="date" name="fechaFin" value={reportFilters.fechaFin} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Button variant="success" onClick={handleGenerateReport} disabled={isGenerating}>
                        {isGenerating ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Generando...</> : 'Generar Reporte'}
                    </Button>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header as="h5">Historial de Recomendaciones</Card.Header>
                <Card.Body>
                    <Accordion>
                        {zonasUnicas.map((zona, zonaIndex) => (
                            <Accordion.Item eventKey={zonaIndex.toString()} key={zonaIndex}>
                                <Accordion.Header>{zona}</Accordion.Header>
                                <Accordion.Body>
                                    <Accordion>
                                        {allPredios.filter(p => p.zona === zona).map((predio, predioIndex) => (
                                            <Accordion.Item eventKey={predioIndex.toString()} key={predioIndex}>
                                                <Accordion.Header>{predio.nombre}</Accordion.Header>
                                                <Accordion.Body>
                                                    <Table striped bordered hover responsive>
                                                        <thead>
                                                            <tr>
                                                                <th>Fecha de Cálculo</th>
                                                                <th>Semana de Medición</th>
                                                                <th>Acciones</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {recomendacionesPorPredio[predio.id] ? recomendacionesPorPredio[predio.id].map(rec => (
                                                                <tr key={rec.id}>
                                                                    <td>{new Date(rec.fecha_calculo).toLocaleDateString('es-CL')}</td>
                                                                    <td>{new Date(rec.semana_inicio).toLocaleDateString('es-CL')}</td>
                                                                    <td>
                                                                        <Button variant="primary" size="sm" onClick={() => navigate(`/recomendaciones/${rec.id}`)}>
                                                                            Ver Detalle
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            )) : (
                                                                <tr>
                                                                    <td colSpan="3" className="text-center">No hay recomendaciones para este predio.</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        ))}
                                    </Accordion>
                                </Accordion.Body>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default Reportes;