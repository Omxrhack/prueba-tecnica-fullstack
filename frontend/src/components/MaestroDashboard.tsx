// frontend/src/components/MaestroDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    getMateriasAsignadas,
    getAlumnosPorMateria,
    registrarCalificacion,
    type MateriaAsignada,
    type AlumnoPorMateria
} from '../services/maestro.service';
import api from '../services/api';

// Spinner Component
const Spinner: React.FC = () => (
    <div className="flex items-center justify-center p-12">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    </div>
);

const MaestroDashboard: React.FC = () => {
    const [materiasAsignadas, setMateriasAsignadas] = useState<MateriaAsignada[]>([]);
    const [selectedMateriaId, setSelectedMateriaId] = useState<number | null>(null);
    const [alumnos, setAlumnos] = useState<AlumnoPorMateria[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingAlumnos, setLoadingAlumnos] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Modal de calificación
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAlumno, setSelectedAlumno] = useState<AlumnoPorMateria | null>(null);
    const [selectedUnidad, setSelectedUnidad] = useState<number>(1);
    const [nota, setNota] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [saving, setSaving] = useState(false);

    // Filtros de búsqueda
    const [filtroMateriaMaestro, setFiltroMateriaMaestro] = useState('');
    const [filtroAlumnoMaestro, setFiltroAlumnoMaestro] = useState('');

    // Cargar materias asignadas
    useEffect(() => {
        const loadMaterias = async () => {
            setLoading(true);
            setError(null);
            try {
                const materias = await getMateriasAsignadas();
                setMateriasAsignadas(materias || []);
            } catch (e: any) {
                console.error('Error al cargar materias:', e);
                setError('Error al cargar materias asignadas: ' + (e.message || 'Desconocido'));
                setMateriasAsignadas([]);
            } finally {
                setLoading(false);
            }
        };
        loadMaterias();
    }, []);

    // Cargar alumnos cuando se selecciona una materia
    const loadAlumnos = useCallback(async (materiaId: number) => {
        setLoadingAlumnos(true);
        setError(null);
        try {
            const alumnosData = await getAlumnosPorMateria(materiaId);
            setAlumnos(alumnosData);
        } catch (e: any) {
            setError('Error al cargar alumnos: ' + (e.message || 'Desconocido'));
            setAlumnos([]);
        } finally {
            setLoadingAlumnos(false);
        }
    }, []);

    useEffect(() => {
        if (selectedMateriaId) {
            loadAlumnos(selectedMateriaId);
        } else {
            setAlumnos([]);
        }
    }, [selectedMateriaId, loadAlumnos]);

    const handleMateriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = Number(e.target.value);
        setSelectedMateriaId(id === 0 ? null : id);
        setSuccessMsg(null);
    };

    const openModal = (alumno: AlumnoPorMateria, unidad?: number) => {
        setSelectedAlumno(alumno);
        // Si se pasa una unidad específica, usar esa; si no, usar la unidad 1 o la primera no calificada
        if (unidad) {
            setSelectedUnidad(unidad);
            const califUnidad = alumno.calificaciones.find(c => c.unidad === unidad);
            setNota(califUnidad?.nota?.toString() || '');
            setObservaciones(califUnidad?.observaciones || '');
        } else {
            setSelectedUnidad(1);
            setNota('');
            setObservaciones('');
        }
        setError(null);
        setSuccessMsg(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedAlumno(null);
        setSelectedUnidad(1);
        setNota('');
        setObservaciones('');
    };

    const handleSaveCalificacion = async () => {
        if (!selectedAlumno || !selectedMateriaId) return;

        const notaNumerica = parseFloat(nota);
        if (isNaN(notaNumerica) || notaNumerica < 0 || notaNumerica > 10) {
            setError('La nota debe ser un número entre 0 y 10.');
            return;
        }

        if (!selectedUnidad || selectedUnidad < 1 || selectedUnidad > 5) {
            setError('La unidad debe ser un número entre 1 y 5.');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await registrarCalificacion(
                selectedMateriaId,
                selectedAlumno.alumno.id,
                notaNumerica,
                selectedUnidad,
                observaciones || undefined
            );
            setSuccessMsg(`Calificación de unidad ${selectedUnidad} guardada con éxito.`);
            closeModal();
            // Recargar alumnos
            await loadAlumnos(selectedMateriaId);
        } catch (e: any) {
            setError('Error al guardar calificación: ' + (e.response?.data?.message || e.message || 'Desconocido'));
        } finally {
            setSaving(false);
        }
    };

    const selectedMateria = materiasAsignadas.find(m => m.id === selectedMateriaId);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-900">
                <div className="text-center animate-fade-in">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mb-6"></div>
                    <p className="text-white font-semibold text-lg text-shadow">Cargando materias...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
                {/* Header Minimalista */}
                <div className="mb-8 animate-fade-in-down">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-neutral-900 mb-2">Panel del Maestro</h1>
                            <p className="text-neutral-600">Gestiona y registra calificaciones de tus alumnos</p>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-neutral-200">
                                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Total Materias</p>
                                <p className="text-2xl font-bold text-neutral-900">{materiasAsignadas.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mensajes */}
                {(error || successMsg) && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 animate-fade-in-up border ${error
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : 'bg-green-50 border-green-200 text-green-900'
                        }`}>
                        <div className={`p-2 rounded-lg ${error ? 'bg-red-100' : 'bg-green-100'}`}>
                            <svg className={`w-5 h-5 ${error ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {error ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                            </svg>
                        </div>
                        <div className="flex-1">
                            <span className="font-semibold text-sm">{error ? 'Error:' : 'Éxito:'}</span>
                            <span className="ml-2 text-sm">{error || successMsg}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar Minimalista */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sticky top-6">
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-neutral-900 mb-1">Materias</h2>
                                <p className="text-xs text-neutral-500">Selecciona una materia</p>
                            </div>

                            {/* Selector de Materia */}
                            <div className="mb-4">
                                <select
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-900 bg-white hover:border-neutral-400 focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgNy41TDEwIDEyLjVMMTUgNy41IiBzdHJva2U9IiM3MzczNzciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=')] bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat pr-10"
                                    onChange={handleMateriaChange}
                                    value={selectedMateriaId || 0}
                                    disabled={materiasAsignadas.length === 0}
                                >
                                    <option value={0}>
                                        {materiasAsignadas.length === 0 ? 'No hay materias disponibles' : 'Seleccionar materia'}
                                    </option>
                                    {materiasAsignadas.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.nombre} ({m.codigo})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Advertencia si no hay materias */}
                            {materiasAsignadas.length === 0 && !loading && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-xs text-amber-800 font-medium">
                                        No tienes materias asignadas. Contacta al administrador.
                                    </p>
                                </div>
                            )}

                            {/* Info de materia seleccionada */}
                            {selectedMateria && (
                                <div className="mt-4 pt-4 border-t border-neutral-200">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-neutral-500">Cupo Máximo</span>
                                            <span className="text-sm font-bold text-neutral-900">{selectedMateria.cupo_maximo}</span>
                                        </div>
                                        {selectedMateria.codigo && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-neutral-500">Código</span>
                                                <span className="text-sm font-semibold text-neutral-700">{selectedMateria.codigo}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contenido Principal */}
                    <div className="lg:col-span-9">
                        {!selectedMateriaId ? (
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-16 text-center">
                                <div className="max-w-sm mx-auto">
                                    <div className="w-20 h-20 mx-auto mb-6 bg-neutral-100 rounded-2xl flex items-center justify-center">
                                        <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Selecciona una materia</h3>
                                    <p className="text-sm text-neutral-600">Elige una materia del panel lateral para comenzar a gestionar calificaciones</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                                {/* Header Minimalista */}
                                <div className="px-6 py-5 border-b border-neutral-200 bg-neutral-50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-neutral-900">{selectedMateria?.nombre}</h2>
                                            <p className="text-sm text-neutral-500 mt-0.5">{selectedMateria?.codigo}</p>
                                        </div>
                                        <div className="px-4 py-2 bg-white border border-neutral-200 rounded-lg">
                                            <span className="text-sm font-semibold text-neutral-900">{alumnos.length} alumnos</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contenido de Alumnos */}
                                <div className="p-6">
                                    {loadingAlumnos ? (
                                        <div className="flex justify-center py-12">
                                            <Spinner />
                                        </div>
                                    ) : alumnos.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-xl flex items-center justify-center">
                                                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-neutral-600 font-medium">No hay alumnos inscritos en esta materia</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Barra de búsqueda */}
                                            <div className="mb-6">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar por nombre, matrícula o grupo..."
                                                        value={filtroAlumnoMaestro}
                                                        onChange={(e) => setFiltroAlumnoMaestro(e.target.value)}
                                                        className="w-full px-4 py-2.5 pl-10 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all"
                                                    />
                                                    <svg className="absolute left-3 top-3 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                {filtroAlumnoMaestro && (
                                                    <p className="mt-2 text-xs text-neutral-500">
                                                        {alumnos.filter(item => {
                                                            const filtro = filtroAlumnoMaestro.toLowerCase();
                                                            return item.alumno.nombre.toLowerCase().includes(filtro) ||
                                                                item.alumno.matricula.toLowerCase().includes(filtro) ||
                                                                item.alumno.grupo.toLowerCase().includes(filtro);
                                                        }).length} resultado(s)
                                                    </p>
                                                )}
                                            </div>

                                            {/* Lista de Alumnos - Diseño Moderno con Unidades */}
                                            <div className="space-y-3">
                                                {alumnos
                                                    .filter(item => {
                                                        if (!filtroAlumnoMaestro) return true;
                                                        const filtro = filtroAlumnoMaestro.toLowerCase();
                                                        return item.alumno.nombre.toLowerCase().includes(filtro) ||
                                                            item.alumno.matricula.toLowerCase().includes(filtro) ||
                                                            item.alumno.grupo.toLowerCase().includes(filtro);
                                                    })
                                                    .map((item) => {
                                                        const unidadesCalificadas = item.calificaciones || [];
                                                        const unidadesDisponibles = Array.from({ length: 5 }, (_, i) => i + 1);

                                                        return (
                                                            <div
                                                                key={item.alumno.id}
                                                                className="border border-neutral-200 rounded-lg hover:border-neutral-300 hover:shadow-sm transition-all bg-white overflow-hidden"
                                                            >
                                                                {/* Header del Alumno */}
                                                                <div className="flex items-center justify-between p-4 bg-neutral-50 border-b border-neutral-200">
                                                                    <div className="flex items-center gap-4 flex-1">
                                                                        <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                                            <span className="text-neutral-800 font-bold text-sm">{item.alumno.nombre.charAt(0)}</span>
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className="text-sm font-semibold text-neutral-900">{item.alumno.nombre}</h4>
                                                                            <div className="flex items-center gap-3 mt-1">
                                                                                <span className="text-xs text-neutral-500">{item.alumno.matricula}</span>
                                                                                <span className="text-xs text-neutral-400">•</span>
                                                                                <span className="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded">{item.alumno.grupo}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-4 text-right">
                                                                        <div className="text-xs text-neutral-500 mb-1">Promedio</div>
                                                                        <div className={`text-lg font-bold ${item.promedio_materia >= 7 ? 'text-green-600' : item.promedio_materia >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                            {item.promedio_materia.toFixed(2)}
                                                                        </div>
                                                                        <div className="text-xs text-neutral-400 mt-1">{item.unidades_calificadas || 0}/5 unidades</div>
                                                                    </div>
                                                                </div>

                                                                {/* Unidades */}
                                                                <div className="p-4">
                                                                    <div className="grid grid-cols-5 gap-2 mb-3">
                                                                        {unidadesDisponibles.map(unidad => {
                                                                            const califUnidad = unidadesCalificadas.find(c => c.unidad === unidad);
                                                                            const nota = califUnidad ? parseFloat(califUnidad.nota.toString()) : null;

                                                                            return (
                                                                                <button
                                                                                    key={unidad}
                                                                                    onClick={() => openModal(item, unidad)}
                                                                                    className={`p-2 rounded-lg text-xs font-semibold transition-all ${nota !== null
                                                                                        ? nota >= 7
                                                                                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                                                                            : nota >= 6
                                                                                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                                                                                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                                                                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200'
                                                                                        }`}
                                                                                    title={nota !== null ? `Unidad ${unidad}: ${nota}` : `Calificar Unidad ${unidad}`}
                                                                                >
                                                                                    <div className="font-bold">{unidad}</div>
                                                                                    <div className="text-[10px]">{nota !== null ? nota.toFixed(1) : '-'}</div>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => openModal(item)}
                                                                        className="w-full px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors"
                                                                    >
                                                                        Calificar Nueva Unidad
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal de Calificación - Diseño Minimalista */}
                {isModalOpen && selectedAlumno && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto transform transition-all scale-100 border border-neutral-200">
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-neutral-200">
                                <h3 className="text-lg font-bold text-neutral-900">Calificar Alumno</h3>
                                <p className="text-sm text-neutral-600 mt-1">{selectedAlumno.alumno.nombre}</p>
                            </div>

                            {/* Formulario */}
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Unidad</label>
                                    <select
                                        value={selectedUnidad}
                                        onChange={(e) => {
                                            const unidad = parseInt(e.target.value);
                                            setSelectedUnidad(unidad);
                                            // Si ya existe una calificación para esta unidad, cargar sus datos
                                            const califUnidad = selectedAlumno?.calificaciones.find(c => c.unidad === unidad);
                                            if (califUnidad) {
                                                setNota(califUnidad.nota.toString());
                                                setObservaciones(califUnidad.observaciones || '');
                                            } else {
                                                setNota('');
                                                setObservaciones('');
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all"
                                    >
                                        {Array.from({ length: 5 }, (_, i) => i + 1).map(u => (
                                            <option key={u} value={u}>
                                                Unidad {u}
                                                {selectedAlumno?.calificaciones.find(c => c.unidad === u)
                                                    ? ` (Ya calificada: ${selectedAlumno.calificaciones.find(c => c.unidad === u)?.nota})`
                                                    : ''
                                                }
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Nota (0 - 10)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="10"
                                        value={nota}
                                        onChange={(e) => setNota(e.target.value)}
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all"
                                        placeholder="Ej: 8.5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Observaciones</label>
                                    <textarea
                                        rows={4}
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all resize-none"
                                        placeholder="Observaciones sobre el desempeño del alumno..."
                                    />
                                </div>

                                {(error || successMsg) && (
                                    <div className={`p-3 rounded-lg text-sm border ${error ? 'bg-red-50 border-red-200 text-red-900' : 'bg-green-50 border-green-200 text-green-900'}`}>
                                        {error || successMsg}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3 rounded-b-xl">
                                <button
                                    onClick={closeModal}
                                    className="px-5 py-2 text-sm font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveCalificacion}
                                    disabled={saving}
                                    className="px-5 py-2 text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Guardando...' : 'Guardar Calificación'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MaestroDashboard;
