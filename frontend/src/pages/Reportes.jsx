import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Button, Row, Col, Form, Spinner, Table } from 'react-bootstrap';
import { getMediciones, getPredios } from '../services/api';

function Reportes() {
    // --- ESTADOS ---
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [allPredios, setAllPredios] = useState([]);
    const [selectedZonas, setSelectedZonas] = useState([]);
    const [reportFilters, setReportFilters] = useState({
        predioIds: [],
        fechaInicio: '',
        fechaFin: '',
    });
    const [reportData, setReportData] = useState(null);

    // --- LÓGICA DE DATOS ---
    useEffect(() => {
        const cargarDatosIniciales = async () => {
            setLoading(true);
            try {
                const prediosData = await getPredios();
                setAllPredios(prediosData);
            } catch (error) {
                console.error("Error al cargar predios:", error);
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

        } catch (error) {
            console.error("Error generando el reporte:", error);
            alert("No se pudo generar el reporte.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportPDF = () => {
        alert('Función de exportar PDF en desarrollo.\nEn la versión final se generará un PDF completo con los datos de este reporte.');
    };

    // --- RENDERIZADO ---
    if (loading) {
        return <Container className="text-center mt-5"><Spinner animation="border" variant="success" /></Container>;
    }

    return (
        <Container>
            {!reportData && (
                <Card>
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
            )}

            {reportData && (
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2>Resultado del Reporte</h2>
                        <div>
                            <Button variant="secondary" className="me-2" onClick={() => setReportData(null)}>Crear Nuevo Reporte</Button>
                            <Button variant="success" onClick={handleExportPDF}>Exportar a PDF</Button>
                        </div>
                    </div>

                    <Row className="mb-4">
                        <Col md={2} className="mb-3"><Card body className="text-center"><h6>Total Análisis</h6><h3 className="text-success">{reportData.summary.totalAnalisis}</h3></Card></Col>
                        <Col md={2} className="mb-3"><Card body className="text-center"><h6>pH Promedio</h6><h3 className="text-success">{reportData.summary.avgPh}</h3></Card></Col>
                        <Col md={2} className="mb-3"><Card body className="text-center"><h6>N Promedio</h6><h3 className="text-success">{reportData.summary.avgN} ppm</h3></Card></Col>
                        <Col md={2} className="mb-3"><Card body className="text-center"><h6>P Promedio</h6><h3 className="text-success">{reportData.summary.avgP} ppm</h3></Card></Col>
                        <Col md={2} className="mb-3"><Card body className="text-center"><h6>K Promedio</h6><h3 className="text-success">{reportData.summary.avgK} cmol/kg</h3></Card></Col>
                        <Col md={2} className="mb-3"><Card body className="text-center"><h6>Periodo</h6><small>{reportData.summary.periodo}</small></Card></Col>
                    </Row>

                    <Card>
                        <Card.Header>Historial de Recomendaciones</Card.Header>
                        <Card.Body>
                             <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Predio</th>
                                        <th>Urea (kg/ha)</th>
                                        <th>Superfosfato (kg/ha)</th>
                                        <th>Muriato K (kg/ha)</th>
                                        <th>Cal (kg/ha)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.details.length > 0 ? reportData.details.map(m => (
                                        <tr key={m.id}>
                                            <td>{new Date(m.fecha).toLocaleDateString('es-CL')}</td>
                                            <td>{m.predio_nombre}</td>
                                            <td>{m.recomendacion.urea_kg_ha.toFixed(0)}</td>
                                            <td>{m.recomendacion.superfosfato_kg_ha.toFixed(0)}</td>
                                            <td>{m.recomendacion.muriato_potasio_kg_ha.toFixed(0)}</td>
                                            <td>{m.recomendacion.cal_kg_ha.toFixed(0)}</td>
                                        </tr>
                                    )) : <tr><td colSpan="6" className="text-center">No hay datos para los filtros seleccionados.</td></tr>}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </div>
            )}
        </Container>
    );
}

export default Reportes;