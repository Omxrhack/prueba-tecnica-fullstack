// frontend/src/components/AlumnoDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { getMisCalificaciones, type CalificacionAlumno, type MateriaPorSemestre } from '../services/alumno.service';

const AlumnoDashboard: React.FC = () => {
    const [calificaciones, setCalificaciones] = useState<CalificacionAlumno[]>([]);
    const [materiasCursando, setMateriasCursando] = useState<CalificacionAlumno[]>([]);
    const [materiasPorSemestre, setMateriasPorSemestre] = useState<{ [key: number]: MateriaPorSemestre }>({});
    const [promedio, setPromedio] = useState<number>(0);
    const [promedioGeneralSemestres, setPromedioGeneralSemestres] = useState<number>(0);
    const [alumnoInfo, setAlumnoInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [semestreActivo, setSemestreActivo] = useState<number | null>(null);

    const loadData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            setError(null);

            const califsData = await getMisCalificaciones();

            setCalificaciones(califsData.calificaciones);
            setMateriasCursando(califsData.materias_cursando || []);
            setMateriasPorSemestre(califsData.materias_por_semestre || {});
            setPromedio(califsData.promedio_general);
            setPromedioGeneralSemestres(califsData.promedio_general_semestres);
            setAlumnoInfo(califsData.alumno);
            setSemestreActivo(califsData.alumno.semestre_actual);
        } catch (e: any) {
            console.error('Error al cargar datos:', e);
            if (!silent) {
                setError('Error al cargar tus calificaciones: ' + (e.response?.data?.message || e.message || 'Desconocido'));
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        // Auto-refresh cada 10 segundos de forma silenciosa
        const interval = setInterval(() => {
            loadData(true); // Modo silencioso (no muestra loading)
        }, 10000);

        return () => clearInterval(interval);
    }, [loadData]);

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

    const semestresDisponibles = Object.keys(materiasPorSemestre).map(Number).sort((a, b) => a - b);
    const semestresParaMostrar = semestreActivo ? Array.from({ length: semestreActivo }, (_, i) => i + 1) : semestresDisponibles;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-neutral-900 mb-2">Mis Calificaciones</h1>
                {alumnoInfo && (
                    <div className="text-neutral-600 mb-4">
                        <p className="text-lg font-semibold">{alumnoInfo.nombre}</p>
                        <p className="text-sm">Matrícula: {alumnoInfo.matricula} • Grupo: {alumnoInfo.grupo} • Semestre Actual: {alumnoInfo.semestre_actual}</p>
                    </div>
                )}

                {/* Promedio General */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-neutral-600 mb-2">Promedio General</p>
                            <p className={`text-4xl font-bold mb-1 ${promedio >= 7 ? 'text-green-600' : promedio >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {promedio.toFixed(2)}
                            </p>
                            <p className="text-xs text-neutral-500">Promedio de semestres: {promedioGeneralSemestres.toFixed(2)}</p>
                        </div>
                        <div className="text-6xl opacity-10">
                            <svg className="w-20 h-20 text-neutral-900" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección: Materias Cursando (Activas) */}
            {materiasCursando.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b border-neutral-200 bg-blue-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-neutral-900"> Materias Cursando ({materiasCursando.length})</h3>
                            <span className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-700 rounded-lg">
                                {materiasCursando.filter(m => m.activa === 1).length} activas
                            </span>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {materiasCursando.map(calif => {
                                const activa = calif.activa === 1;
                                const tieneNotas = calif.unidades && calif.unidades.some(u => u.nota > 0);

                                return (
                                    <div key={calif.materia.id} className={`border-2 rounded-lg p-4 transition-all ${activa ? 'border-blue-300 bg-blue-50/30' : 'border-neutral-200 bg-neutral-50'}`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h5 className="text-base font-bold text-neutral-900">{calif.materia.nombre}</h5>
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${activa ? 'bg-blue-200 text-blue-800' : 'bg-neutral-200 text-neutral-600'}`}>
                                                        {activa ? 'ACTIVA' : 'INACTIVA'}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${activa ? 'bg-green-200 text-green-800' : 'bg-neutral-200 text-neutral-600'}`}>
                                                        {activa ? '1' : '0'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded">
                                                        {calif.materia.codigo}
                                                    </span>
                                                    {calif.materia.semestre && (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                                                            Sem. {calif.materia.semestre}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {tieneNotas && (
                                                <span className={`text-lg font-bold px-2 py-1 rounded ${calif.promedio_materia >= 7 ? 'bg-green-100 text-green-700' :
                                                    calif.promedio_materia >= 6 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {calif.promedio_materia.toFixed(2)}
                                                </span>
                                            )}
                                            {!tieneNotas && activa && (
                                                <span className="text-sm font-medium px-2 py-1 rounded bg-blue-100 text-blue-700">
                                                    Sin calificaciones
                                                </span>
                                            )}
                                        </div>
                                        {calif.maestro && (
                                            <p className="text-xs text-neutral-600 mb-2 font-medium">Maestro: {calif.maestro.nombre}</p>
                                        )}
                                        {calif.unidades && calif.unidades.length > 0 && (
                                            <div className="flex gap-1 flex-wrap mt-2">
                                                {calif.unidades
                                                    .sort((a, b) => a.unidad - b.unidad)
                                                    .map(unidad => (
                                                        <span
                                                            key={unidad.unidad}
                                                            className={`text-xs px-1.5 py-0.5 rounded ${unidad.nota > 0 ? (
                                                                unidad.nota >= 7 ? 'bg-green-200 text-green-800' :
                                                                    unidad.nota >= 6 ? 'bg-yellow-200 text-yellow-800' :
                                                                        'bg-red-200 text-red-800'
                                                            ) : 'bg-neutral-200 text-neutral-500'}`}
                                                            title={`Unidad ${unidad.unidad}: ${unidad.nota.toFixed(1)}${unidad.observaciones ? ` - ${unidad.observaciones}` : ''}`}
                                                        >
                                                            U{unidad.unidad}: {unidad.nota > 0 ? unidad.nota.toFixed(1) : '0.0'}
                                                        </span>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}



            {/* Materias por Semestre */}
            <div className="space-y-6">
                {semestresParaMostrar.length > 0 && semestresParaMostrar.some(sem => {
                    const datos = materiasPorSemestre[sem];
                    return datos && (datos.cursando?.length > 0 || datos.cursadas.length > 0 || datos.faltantes.length > 0);
                }) ? (
                    semestresParaMostrar.map(semestre => {
                        const datosSemestre = materiasPorSemestre[semestre];
                        if (!datosSemestre || (datosSemestre.cursando?.length === 0 && datosSemestre.cursadas.length === 0 && datosSemestre.faltantes.length === 0)) {
                            return null;
                        }

                        const { cursadas, faltantes, promedio_semestre } = datosSemestre;

                        return (
                            <div key={semestre} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                                {/* Header del Semestre */}
                                <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-xl font-bold text-neutral-900">Semestre {semestre}</h3>
                                            {promedio_semestre > 0 && (
                                                <span className={`px-3 py-1 text-sm font-bold rounded-lg ${promedio_semestre >= 7 ? 'bg-green-50 text-green-700' :
                                                    promedio_semestre >= 6 ? 'bg-yellow-50 text-yellow-700' :
                                                        'bg-red-50 text-red-700'
                                                    }`}>
                                                    Promedio: {promedio_semestre.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-neutral-500">
                                            {datosSemestre.cursando ? datosSemestre.cursando.length : 0} cursando • {cursadas.length} cursadas • {faltantes.length} faltantes
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Materias Cursando (Activas) */}
                                    {datosSemestre.cursando && datosSemestre.cursando.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-4 flex items-center gap-2">

                                                Materias Cursando ({datosSemestre.cursando.length})
                                            </h4>
                                            <div className="space-y-4">
                                                {datosSemestre.cursando.map((calif) => {
                                                    const activa = calif.activa === 1;
                                                    return (
                                                        <div key={calif.materia.id} className={`border-2 rounded-lg p-4 transition-all ${activa ? 'border-blue-300 bg-blue-50/30' : 'border-neutral-200'}`}>
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                        <h5 className="text-base font-bold text-neutral-900">{calif.materia.nombre}</h5>
                                                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${activa ? 'bg-blue-200 text-blue-800' : 'bg-neutral-200 text-neutral-600'}`}>
                                                                            {activa ? 'ACTIVA (1)' : 'INACTIVA (0)'}
                                                                        </span>
                                                                        <span className="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded">
                                                                            {calif.materia.codigo}
                                                                        </span>
                                                                        {calif.promedio_materia > 0 && (
                                                                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${calif.promedio_materia >= 7 ? 'bg-green-50 text-green-700' :
                                                                                calif.promedio_materia >= 6 ? 'bg-yellow-50 text-yellow-700' :
                                                                                    'bg-red-50 text-red-700'
                                                                                }`}>
                                                                                {calif.promedio_materia.toFixed(2)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {calif.maestro && (
                                                                        <p className="text-xs text-neutral-500 mb-2">Maestro: {calif.maestro.nombre}</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Unidades */}
                                                            {calif.unidades && calif.unidades.length > 0 && (
                                                                <div>
                                                                    <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">Calificaciones por Unidad</p>
                                                                    <div className="grid grid-cols-5 gap-2 mt-2">
                                                                        {calif.unidades
                                                                            .sort((a, b) => a.unidad - b.unidad)
                                                                            .map(unidad => (
                                                                                <div
                                                                                    key={unidad.unidad}
                                                                                    className={`p-2 rounded-lg border text-center text-xs ${unidad.nota > 0 ? (
                                                                                        unidad.nota >= 7 ? 'bg-green-50 border-green-200' :
                                                                                            unidad.nota >= 6 ? 'bg-yellow-50 border-yellow-200' :
                                                                                                'bg-red-50 border-red-200'
                                                                                    ) : 'bg-neutral-100 border-neutral-300'}`}
                                                                                    title={`Unidad ${unidad.unidad}: ${unidad.nota.toFixed(1)}${unidad.observaciones ? ` - ${unidad.observaciones}` : ''}`}
                                                                                >
                                                                                    <div className="font-semibold text-neutral-600">U{unidad.unidad}</div>
                                                                                    <div className={`font-bold mt-1 ${unidad.nota > 0 ? (
                                                                                        unidad.nota >= 7 ? 'text-green-700' :
                                                                                            unidad.nota >= 6 ? 'text-yellow-700' :
                                                                                                'text-red-700'
                                                                                    ) : 'text-neutral-500'}`}>
                                                                                        {unidad.nota > 0 ? unidad.nota.toFixed(1) : '0.0'}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}



                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
                        <svg className="mx-auto h-16 w-16 text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-neutral-500 text-lg font-medium mb-2">No tienes materias registradas aún</p>
                        <p className="text-neutral-400 text-sm">Las materias aparecerán aquí cuando se te asignen</p>
                    </div>
                )}
            </div>

            {/* Resumen */}
            <div className='flex container mx-auto content-center justify-center'>
                <div className="mt-6 items-center justify-center content-center grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Materias Cursando</p>
                        <p className="text-2xl font-bold text-blue-600">{materiasCursando.length}</p>
                        <p className="text-xs text-neutral-400 mt-1">
                            {materiasCursando.filter(m => m.activa === 1).length} activas
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Promedio General</p>
                        <p className={`text-2xl font-bold ${promedio >= 7 ? 'text-green-600' : promedio >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {promedio.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Semestre Actual</p>
                        <p className="text-2xl font-bold text-neutral-900">{alumnoInfo?.semestre_actual || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Semestres Restantes</p>
                        <p className="text-2xl font-bold text-neutral-900">
                            {alumnoInfo?.semestre_actual ? Math.max(0, 8 - alumnoInfo.semestre_actual) : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlumnoDashboard;
