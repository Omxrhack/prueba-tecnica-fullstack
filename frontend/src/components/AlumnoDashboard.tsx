// frontend/src/components/AlumnoDashboard.tsx
import React, { useState, useEffect } from 'react';
import { getMisCalificaciones, getMiPromedio, type CalificacionAlumno } from '../services/alumno.service';

const AlumnoDashboard: React.FC = () => {
    const [calificaciones, setCalificaciones] = useState<CalificacionAlumno[]>([]);
    const [promedio, setPromedio] = useState<number>(0);
    const [totalMaterias, setTotalMaterias] = useState<number>(0);
    const [alumnoInfo, setAlumnoInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPromedio, setShowPromedio] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [califsData, promedioData] = await Promise.all([
                getMisCalificaciones(),
                getMiPromedio()
            ]);

            setCalificaciones(califsData.calificaciones);
            setPromedio(califsData.promedio_general);
            setTotalMaterias(califsData.total_materias);
            setAlumnoInfo(califsData.alumno);
        } catch (e: any) {
            console.error('Error al cargar datos:', e);
            setError('Error al cargar tus calificaciones: ' + (e.response?.data?.message || e.message || 'Desconocido'));
        } finally {
            setLoading(false);
        }
    };

    const getNotaColor = (nota: number) => {
        if (nota >= 9) return 'text-green-600 bg-green-50 border-green-200';
        if (nota >= 7) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (nota >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getPromedioColor = (prom: number) => {
        if (prom >= 9) return 'from-green-500 to-emerald-600';
        if (prom >= 7) return 'from-blue-500 to-indigo-600';
        if (prom >= 6) return 'from-yellow-500 to-orange-500';
        return 'from-red-500 to-pink-600';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-neutral-50">
                <div className="text-center animate-fade-in">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-neutral-200 border-t-neutral-900 mb-6"></div>
                    <p className="text-neutral-700 font-semibold text-lg">Cargando tus calificaciones...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
            {/* Header Minimalista */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-4xl font-bold text-neutral-900 mb-2">Mis Calificaciones</h1>
                        {alumnoInfo && (
                            <div className="text-neutral-600">
                                <p className="text-lg font-semibold">{alumnoInfo.nombre}</p>
                                <p className="text-sm">Matrícula: {alumnoInfo.matricula} • Grupo: {alumnoInfo.grupo}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setShowPromedio(!showPromedio)}
                        className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg transition-colors"
                    >
                        {showPromedio ? 'Ocultar' : 'Ver'} Promedio
                    </button>
                </div>
            </div>

            {/* Tarjeta de Promedio General - Minimalista */}
            {showPromedio && (
                <div className={`mb-6 bg-white rounded-xl shadow-sm border border-neutral-200 p-6 animate-scale-in`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-neutral-600 mb-2">Promedio General</p>
                            <p className={`text-4xl font-bold mb-1 ${promedio >= 9 ? 'text-green-600' : promedio >= 7 ? 'text-green-700' : promedio >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {promedio.toFixed(2)}
                            </p>
                            <p className="text-sm text-neutral-500">de {totalMaterias} {totalMaterias === 1 ? 'materia' : 'materias'}</p>
                        </div>
                        <div className="text-6xl opacity-10">
                            <svg className="w-20 h-20 text-neutral-900" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de Calificaciones */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
                    <h3 className="text-lg font-bold text-neutral-900">
                        Calificaciones por Materia ({calificaciones.length})
                    </h3>
                </div>

                {calificaciones.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">No tienes calificaciones registradas aún</p>
                        <p className="text-gray-400 text-sm mt-2">Las calificaciones aparecerán aquí cuando tus maestros las registren</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-200">
                        {calificaciones.map((calif) => (
                            <div key={calif.id} className={`p-6 hover:bg-neutral-50 transition-all duration-200 border-l-4 ${getNotaColor(calif.nota)}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h4 className="text-lg font-bold text-neutral-900">{calif.materia.nombre}</h4>
                                            <span className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded">
                                                {calif.materia.codigo}
                                            </span>
                                        </div>
                                        {calif.materia.descripcion && (
                                            <p className="text-sm text-neutral-600 mb-2">{calif.materia.descripcion}</p>
                                        )}
                                        {calif.maestro && (
                                            <p className="text-sm text-neutral-500 mb-2">
                                                <span className="font-semibold">Maestro:</span> {calif.maestro.nombre}
                                            </p>
                                        )}
                                        {calif.observaciones && (
                                            <div className="mt-3 bg-neutral-50 border-l-2 border-neutral-300 p-3 rounded-lg">
                                                <p className="text-sm text-neutral-700 italic">"{calif.observaciones}"</p>
                                            </div>
                                        )}
                                        <p className="text-xs text-neutral-400 mt-3">
                                            Registrado: {new Date(calif.fecha_registro).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-xl font-bold ${getNotaColor(calif.nota)} border-2`}>
                                            {calif.nota.toFixed(1)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Resumen de Estadísticas */}
            {calificaciones.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Total Materias</p>
                        <p className="text-2xl font-bold text-neutral-900">{totalMaterias}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Promedio General</p>
                        <p className={`text-2xl font-bold ${promedio >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                            {promedio.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Última Actualización</p>
                        <p className="text-sm font-semibold text-neutral-900">
                            {calificaciones.length > 0
                                ? new Date(calificaciones[calificaciones.length - 1].fecha_registro).toLocaleDateString('es-ES')
                                : 'N/A'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlumnoDashboard;
