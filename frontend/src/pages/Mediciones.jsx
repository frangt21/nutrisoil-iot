// src/pages/Mediciones.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Importa useCallback
import { useParams } from 'react-router-dom';
import { Container, Table, Button, Spinner } from 'react-bootstrap';
import { getMediciones, getPredios, generarRecomendacionSemanal } from '../services/api';

// Función para agrupar mediciones por semana (sin cambios)
const groupDataByWeek = (data) => {
    // ... (esta función se queda igual)
    const groups = data.reduce((acc, item) => {
        const date = new Date(item.fecha);
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        const weekKey = monday.toISOString().split('T')[0];
        if (!acc[weekKey]) acc[weekKey] = [];
        acc[weekKey].push(item);
        return acc;
    }, {});
    return Object.keys(groups).map(weekKey => {
        const weekData = groups[weekKey];
        const avg = (key) => (weekData.reduce((sum, item) => sum + parseFloat(item[key]), 0) / weekData.length).toFixed(1);
        return { id: weekKey, fechaSemana: weekKey, ph: avg('ph'), temperatura: avg('temperatura'), humedad: avg('humedad'), nitrogeno: avg('nitrogeno'), fosforo: avg('fosforo'), potasio: avg('potasio')};
    }).sort((a,b) => new Date(b.fechaSemana) - new Date(a.fechaSemana));
};

function Mediciones() {
    const { predioId } = useParams();
    const [predioName, setPredioName] = useState('');
    const [weeklyAverages, setWeeklyAverages] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- CAMBIO CLAVE: DEFINIMOS cargarDatos AQUÍ ---
    const cargarDatos = useCallback(async () => {
        setLoading(true);
        try {
            const allPredios = await getPredios();
            const currentPredio = allPredios.find(p => p.id.toString() === predioId);
            setPredioName(currentPredio ? currentPredio.nombre : 'Desconocido');

            const medicionesData = await getMediciones(predioId);
            const weeklyData = groupDataByWeek(medicionesData);
            setWeeklyAverages(weeklyData);
        } catch (error) {
            console.error("Error al cargar datos del predio:", error);
        } finally {
            setLoading(false);
        }
    }, [predioId]); // El array de dependencias para useCallback

    useEffect(() => {
        // Ahora el useEffect simplemente llama a la función que ya existe
        cargarDatos();
    }, [cargarDatos]); // La dependencia es la función misma

    const handleGenerateRecommendation = async (weekData) => {
        try {
            const resultado = await generarRecomendacionSemanal(
                predioId,
                weekData.fechaSemana
            );
            
            // Usamos \n para saltos de línea en el alert
            alert(`¡Recomendación generada exitosamente!\n\nUrea: ${resultado.urea_kg_ha} kg/ha\nSuperfosfato: ${resultado.superfosfato_kg_ha} kg/ha\nMuriato de Potasio: ${resultado.muriato_potasio_kg_ha} kg/ha\nCal: ${resultado.cal_kg_ha} kg/ha`);
            
            // Opcional: Recargar datos para reflejar si la recomendación se guardó en el backend
            // Esta llamada ahora es válida
            cargarDatos();
        } catch (error) {
            alert('Error al generar recomendación: ' + error.message);
        }
    };

    if (loading) {
        return <Container className="text-center mt-5"><Spinner animation="border" variant="success" /></Container>;
    }

    return (
        <Container>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Mediciones Semanales: {predioName}</h2>
                <Button variant="success">+ Nueva Medición Manual</Button>
            </div>

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Semana del</th>
                        <th>pH (Promedio)</th>
                        <th>Temp (Promedio)</th>
                        <th>Humedad (Promedio)</th>
                        <th>N (Promedio)</th>
                        <th>P (Promedio)</th>
                        <th>K (Promedio)</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {weeklyAverages.length > 0 ? (
                        weeklyAverages.map(week => (
                            <tr key={week.id}>
                                <td>{new Date(week.fechaSemana).toLocaleDateString('es-CL')}</td>
                                <td>{week.ph}</td>
                                <td>{week.temperatura}°C</td>
                                <td>{week.humedad}%</td>
                                <td>{week.nitrogeno} ppm</td>
                                <td>{week.fosforo} ppm</td>
                                <td>{week.potasio} cmol/kg</td>
                                <td>
                                    <Button variant="outline-success" size="sm" onClick={() => handleGenerateRecommendation(week)}>
                                        Generar Recomendación
                                    </Button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" className="text-center">No hay mediciones registradas para este predio.</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </Container>
    );
}

export default Mediciones;