// /frontend/src/components/AdminDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    getReporteGlobal,
    updateCalificacionAdmin,
    deleteCalificacionAdmin,
    asignarMateriaMaestro,
    crearMateria,
    crearUsuario,
    asignarAlumnosAMateria,
    type CrearMateriaPayload,
    type CrearUsuarioPayload,
} from '../services/admin.service';
import { getMaterias, getMaestros, getAlumnos, type AlumnoListItem } from '../services/general.service';
import api from '../services/api';
import type { Materia } from '../types';
import type { ReporteItem, CalificacionMateriaItem } from '../services/admin.service'; // Tipos del admin service
import type { MaestroListItem } from '../services/general.service'; // Tipo del general service

// --- Spinner Component ---
const Spinner: React.FC = () => (
    <div className="flex items-center justify-center p-6">
        <svg className="animate-spin h-8 w-8 text-neutral-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
    </div>
);

const AdminDashboard: React.FC = () => {
    // --- Estados de Datos ---
    const [reporteGlobal, setReporteGlobal] = useState<ReporteItem[]>([]);
    const [materiasList, setMateriasList] = useState<Materia[]>([]);
    const [maestrosList, setMaestrosList] = useState<MaestroListItem[]>([]);
    const [alumnosList, setAlumnosList] = useState<AlumnoListItem[]>([]);

    // --- Estado de la Vista Principal (Filtrado por Materia) ---
    const [selectedMateriaId, setSelectedMateriaId] = useState<number | null>(null);
    const [calificacionesMateria, setCalificacionesMateria] = useState<CalificacionMateriaItem[] | null>(null);
    const [maestroAsignado, setMaestroAsignado] = useState<{ id: number; nombre: string } | null>(null);

    // --- Estados de UI ---
    const [loading, setLoading] = useState(true);
    const [loadingMateria, setLoadingMateria] = useState(false); // Spinner específico para la tabla
    const [gestionError, setGestionError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // --- Formulario de Asignación ---
    const [asignacionForm, setAsignacionForm] = useState({
        maestro_id: '',
        materia_id: '',
        cupo_maximo: 40,
    });
    const [asignacionSaving, setAsignacionSaving] = useState(false);

    // --- Modales ---
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editMeta, setEditMeta] = useState<{ alumnoID: number; currentNota: number; currentObs: string } | null>(null);
    const [editNota, setEditNota] = useState('');
    const [editObs, setEditObs] = useState('');
    const [saving, setSaving] = useState(false);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteMeta, setDeleteMeta] = useState<{ alumnoID: number } | null>(null);
    const [deleting, setDeleting] = useState(false);

    // --- Formularios de Creación ---
    const [isCreateMateriaOpen, setIsCreateMateriaOpen] = useState(false);
    const [materiaForm, setMateriaForm] = useState<CrearMateriaPayload>({
        nombre: '',
        codigo: '',
        descripcion: '',
        maestro_id: undefined,
        cupo_maximo: 40
    });
    const [selectedAlumnos, setSelectedAlumnos] = useState<number[]>([]);
    const [savingMateria, setSavingMateria] = useState(false);

    // Filtros de búsqueda
    const [filtroMaestro, setFiltroMaestro] = useState('');
    const [filtroAlumno, setFiltroAlumno] = useState('');
    const [filtroSemestreCrearMateria, setFiltroSemestreCrearMateria] = useState('todos');
    const [filtroMaestroAsignacion, setFiltroMaestroAsignacion] = useState('');
    const [filtroMateriaAsignacion, setFiltroMateriaAsignacion] = useState('');
    const [filtroMateriaSelector, setFiltroMateriaSelector] = useState('');

    // Modal para asignar alumnos a materia existente
    const [isAsignarAlumnosOpen, setIsAsignarAlumnosOpen] = useState(false);
    const [selectedAlumnosAsignacion, setSelectedAlumnosAsignacion] = useState<number[]>([]);
    const [filtroAlumnoAsignacion, setFiltroAlumnoAsignacion] = useState('');
    const [filtroSemestreAsignacion, setFiltroSemestreAsignacion] = useState('todos');
    const [savingAsignacion, setSavingAsignacion] = useState(false);

    // Handler para asignar alumnos a materia existente
    const handleAsignarAlumnos = async () => {
        if (!selectedMateriaId || selectedAlumnosAsignacion.length === 0) {
            setGestionError('Debes seleccionar al menos un alumno para asignar.');
            return;
        }

        if (!maestroAsignado) {
            setGestionError('La materia debe tener un maestro asignado para poder asignar alumnos.');
            return;
        }

        setSavingAsignacion(true);
        setGestionError(null);
        try {
            await asignarAlumnosAMateria(selectedMateriaId, {
                alumno_ids: selectedAlumnosAsignacion,
                maestro_id: maestroAsignado.id
            });
            setSuccessMsg(`${selectedAlumnosAsignacion.length} alumno(s) asignado(s) exitosamente a la materia.`);
            setIsAsignarAlumnosOpen(false);
            setSelectedAlumnosAsignacion([]);
            setFiltroAlumnoAsignacion('');
            setFiltroSemestreAsignacion('todos');
            await loadMateriaDetails(selectedMateriaId);
        } catch (e: any) {
            setGestionError('Error al asignar alumnos: ' + (e.response?.data?.message || e.message));
        } finally {
            setSavingAsignacion(false);
        }
    };

    const [isCreateUsuarioOpen, setIsCreateUsuarioOpen] = useState(false);
    const [usuarioForm, setUsuarioForm] = useState<CrearUsuarioPayload>({
        nombre: '',
        email: '',
        password: '',
        rol: 'MAESTRO',
        matricula: '',
        grupo: '',
        semestre: undefined,
        fecha_nacimiento: ''
    });
    const [savingUsuario, setSavingUsuario] = useState(false);

    // 1. Carga Inicial (Selectores y Reporte Global)
    const loadInitialData = useCallback(async () => {
        setLoading(true);
        setGestionError(null);
        try {
            const [reporteData, materiasData, maestrosData, alumnosData] = await Promise.all([
                getReporteGlobal(),
                getMaterias(),
                getMaestros(),
                getAlumnos()
            ]);
            setReporteGlobal(reporteData);
            setMateriasList(materiasData);
            setMaestrosList(maestrosData);
            setAlumnosList(alumnosData);
        } catch (e: any) {
            setGestionError('Error al cargar catálogos iniciales.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // Función auxiliar para cargar detalles de la materia
    const loadMateriaDetails = useCallback(async (materiaId: number) => {
        setLoadingMateria(true);
        setGestionError(null);
        try {
            // LLAMADA REAL AL BACKEND
            const response = await api.get(`/controlescolar/reporte/${materiaId}`);
            const { data: calificaciones, maestro } = response.data;

            setCalificacionesMateria(calificaciones || []);

            // Usar el maestro de la respuesta directa, o buscar en las calificaciones
            if (maestro) {
                setMaestroAsignado(maestro);
            } else if (calificaciones && calificaciones.length > 0 && calificaciones[0].maestro) {
                setMaestroAsignado(calificaciones[0].maestro);
            } else {
                setMaestroAsignado(null);
            }
        } catch (e: any) {
            setGestionError(e.message || 'Error al cargar calificaciones de la materia.');
            setCalificacionesMateria([]);
            setMaestroAsignado(null);
        } finally {
            setLoadingMateria(false);
        }
    }, []);

    // 2. Carga Dinámica al Seleccionar Materia
    useEffect(() => {
        if (!selectedMateriaId) {
            setCalificacionesMateria(null);
            setMaestroAsignado(null);
            return;
        }

        loadMateriaDetails(selectedMateriaId);
    }, [selectedMateriaId, loadMateriaDetails]);


    // --- Handlers ---
    const handleMateriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = Number(e.target.value);
        setSelectedMateriaId(id === 0 ? null : id);
        setSuccessMsg(null); // Limpiar mensajes previos
    };

    const handleAsignacionChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setAsignacionForm({ ...asignacionForm, [e.target.name]: e.target.value });
    };

    const handleAsignacionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { maestro_id, materia_id, cupo_maximo } = asignacionForm;
        if (!maestro_id || !materia_id) return;

        setAsignacionSaving(true);
        setGestionError(null);
        setSuccessMsg(null);

        try {
            await asignarMateriaMaestro({
                maestro_id: Number(maestro_id),
                materia_id: Number(materia_id),
                cupo_maximo: Number(cupo_maximo),
            });

            setSuccessMsg('Asignación realizada con éxito.');
            setAsignacionForm({ maestro_id: '', materia_id: '', cupo_maximo: 40 });

            // Si la materia asignada está seleccionada, recargar los detalles
            if (Number(materia_id) === selectedMateriaId) {
                // Recargar los detalles completos de la materia (esto actualizará el maestro)
                await loadMateriaDetails(Number(materia_id));
            }
        } catch (e: any) {
            setGestionError('Error en la asignación: ' + (e.message || 'Desconocido'));
        } finally {
            setAsignacionSaving(false);
        }
    };

    // --- Modales Handlers ---
    const openEdit = (item: CalificacionMateriaItem) => {
        if (!selectedMateriaId) return;
        setEditMeta({ alumnoID: item.alumno.id, currentNota: parseFloat(item.nota), currentObs: item.observaciones });
        setEditNota(item.nota);
        setEditObs(item.observaciones || '');
        setGestionError(null);
        setSuccessMsg(null);
        setIsEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editMeta || !selectedMateriaId) return;
        const parsed = parseFloat(editNota);

        if (isNaN(parsed) || parsed < 0 || parsed > 10) {
            setGestionError('La nota debe ser un número entre 0 y 10.');
            return;
        }

        setSaving(true);
        setGestionError(null);
        try {
            await updateCalificacionAdmin(selectedMateriaId, editMeta.alumnoID, parsed, editObs);
            setSuccessMsg('Calificación actualizada.');
            setIsEditOpen(false);
            // Recargar los detalles de la materia
            await loadMateriaDetails(selectedMateriaId);
        } catch (e: any) {
            setGestionError('Error al actualizar: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const openConfirmDelete = (alumnoID: number) => {
        setDeleteMeta({ alumnoID });
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteMeta || !selectedMateriaId) return;
        setDeleting(true);
        try {
            await deleteCalificacionAdmin(selectedMateriaId, deleteMeta.alumnoID);
            setSuccessMsg('Calificación eliminada.');
            setIsConfirmOpen(false);
            // Recargar los detalles de la materia
            await loadMateriaDetails(selectedMateriaId);
        } catch (e: any) {
            setGestionError('Error al eliminar: ' + e.message);
        } finally {
            setDeleting(false);
        }
    };

    // --- Handlers para Crear Materia ---
    const handleCreateMateria = async () => {
        if (!materiaForm.nombre || !materiaForm.codigo) {
            setGestionError('Nombre y código son obligatorios');
            return;
        }

        setSavingMateria(true);
        setGestionError(null);
        try {
            const response = await crearMateria(materiaForm);
            const materiaId = response.data?.materia?.id;

            if (!materiaId) {
                setGestionError('Error: No se pudo obtener el ID de la materia creada.');
                return;
            }

            setSuccessMsg('Materia creada con éxito' + (materiaForm.maestro_id ? ' y asignada al maestro.' : '.'));

            // Si se seleccionaron alumnos y hay un maestro asignado, asignarlos
            if (selectedAlumnos.length > 0 && materiaForm.maestro_id) {
                try {
                    const asignacionResponse = await asignarAlumnosAMateria(materiaId, {
                        alumno_ids: selectedAlumnos,
                        maestro_id: materiaForm.maestro_id
                    });
                    setSuccessMsg(`Materia creada, asignada al maestro y ${asignacionResponse.data.alumnos_asignados} alumno(s) asignado(s).`);
                } catch (e: any) {
                    setGestionError('Materia creada pero error al asignar alumnos: ' + (e.response?.data?.message || e.message));
                }
            } else if (selectedAlumnos.length > 0 && !materiaForm.maestro_id) {
                setGestionError('Para asignar alumnos, primero debes asignar un maestro a la materia.');
            }

            // Recargar listas
            const [materiasData, maestrosDataRefresh] = await Promise.all([
                getMaterias(),
                getMaestros()
            ]);
            setMateriasList(materiasData);
            setMaestrosList(maestrosDataRefresh);

            // Resetear formulario
            setIsCreateMateriaOpen(false);
            setMateriaForm({ nombre: '', codigo: '', descripcion: '', maestro_id: undefined, cupo_maximo: 40 });
            setSelectedAlumnos([]);
            setFiltroMaestro('');
            setFiltroAlumno('');
            setFiltroSemestreCrearMateria('todos');
        } catch (e: any) {
            setGestionError('Error al crear materia: ' + (e.response?.data?.message || e.message));
        } finally {
            setSavingMateria(false);
        }
    };

    // --- Handlers para Crear Usuario ---
    const handleCreateUsuario = async () => {
        if (!usuarioForm.nombre || !usuarioForm.email || !usuarioForm.password || !usuarioForm.rol) {
            setGestionError('Nombre, email, password y rol son obligatorios');
            return;
        }
        if (usuarioForm.rol === 'ALUMNO' && (!usuarioForm.matricula || !usuarioForm.grupo)) {
            setGestionError('Para crear un alumno, matrícula y grupo son obligatorios');
            return;
        }
        setSavingUsuario(true);
        setGestionError(null);
        try {
            await crearUsuario(usuarioForm);
            setSuccessMsg(`Usuario ${usuarioForm.rol} creado con éxito`);
            setIsCreateUsuarioOpen(false);
            setUsuarioForm({
                nombre: '',
                email: '',
                password: '',
                rol: 'MAESTRO',
                matricula: '',
                grupo: '',
                fecha_nacimiento: ''
            });
            // Recargar lista de maestros si es necesario
            const maestrosData = await getMaestros();
            setMaestrosList(maestrosData);
        } catch (e: any) {
            setGestionError('Error al crear usuario: ' + (e.response?.data?.message || e.message));
        } finally {
            setSavingUsuario(false);
        }
    };

    // --- Render de Vista Materia ---
    const renderMateriaView = () => {
        if (loading) return <Spinner />;

        if (!selectedMateriaId) return (
            <div className="flex flex-col items-center justify-center p-12 bg-white border-2 border-dashed border-gray-300 rounded-2xl">
                <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <p className="text-gray-500 text-lg font-medium">Selecciona una materia arriba para comenzar la gestión.</p>
            </div>
        );

        const materia = materiasList.find(m => m.id === selectedMateriaId);

        return (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="bg-neutral-900 text-white p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold mb-1">{materia?.nombre}</h2>
                            <p className="text-neutral-300 text-sm">{materia?.codigo}</p>
                        </div>
                        <span className="bg-white/20 px-3 py-1.5 rounded-lg text-xs font-semibold">Vista Detallada</span>
                    </div>
                </div>

                <div className="p-6">
                    {/* Info Maestro y Botón Asignar Alumnos */}
                    <div className="mb-6 flex gap-4 items-center">
                        <div className="flex-1 p-5 bg-neutral-50 border-l-4 border-neutral-800 rounded-xl flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="bg-neutral-200 p-3 rounded-lg">
                                    <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-neutral-600 font-semibold uppercase text-xs tracking-wider mb-1">Maestro Asignado</p>
                                    <p className="text-neutral-900 font-bold text-lg">{maestroAsignado?.nombre || 'No asignado / No identificado'}</p>
                                </div>
                            </div>
                            {maestroAsignado && (
                                <div className="bg-white text-neutral-700 border border-neutral-300 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                    ID: {maestroAsignado.id}
                                </div>
                            )}
                        </div>
                        {maestroAsignado && (
                            <button
                                onClick={() => {
                                    setSelectedAlumnosAsignacion([]);
                                    setFiltroAlumnoAsignacion('');
                                    setIsAsignarAlumnosOpen(true);
                                }}
                                className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Asignar Alumnos
                            </button>
                        )}
                    </div>

                    {/* Tabla */}
                    {loadingMateria ? (
                        <Spinner />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Alumno</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Matrícula</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Nota</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Observaciones</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {calificacionesMateria && calificacionesMateria.length > 0 ? (
                                        calificacionesMateria.map((item) => (
                                            <tr key={item.id} className="hover:bg-indigo-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                            <span className="text-indigo-600 font-bold">{item.alumno.nombre.charAt(0)}</span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-bold text-gray-900">{item.alumno.nombre}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.alumno.matricula}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`px-4 py-2 inline-flex text-sm font-bold rounded-lg ${parseFloat(item.nota) >= 7
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {item.nota}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={item.observaciones}>
                                                    {item.observaciones || <span className="text-gray-400 italic">N/A</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => openEdit(item)} className="bg-neutral-900 hover:bg-neutral-800 text-white p-2 rounded-lg transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => openConfirmDelete(item.alumno.id)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all transform hover:scale-110 shadow-md">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center">
                                                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    <p className="text-gray-500 text-lg font-medium">No hay alumnos calificados en esta materia.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
                {/* Header Minimalista */}
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-neutral-900 mb-2">Panel de Control Escolar</h1>
                    <p className="text-neutral-600">Gestión integral de asignaciones y calificaciones</p>
                </div>

                {/* Mensajes Globales */}
                {(gestionError || successMsg) && (
                    <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 animate-fade-in-up ${gestionError
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : 'bg-green-50 border-green-200 text-green-900'
                        }`}>
                        <div className={`p-2 rounded-lg ${gestionError ? 'bg-red-100' : 'bg-green-100'}`}>
                            <svg className={`w-5 h-5 ${gestionError ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {gestionError ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                            </svg>
                        </div>
                        <div className="flex-1">
                            <span className="font-semibold text-sm">{gestionError ? 'Error:' : 'Éxito:'}</span>
                            <span className="ml-2 text-sm">{gestionError || successMsg}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna Izquierda: Controles y Asignación */}
                    <div className="lg:col-span-1 space-y-8">

                        {/* Selector de Materia */}
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-neutral-100 p-2 rounded-lg">
                                    <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900">1. Seleccionar Materia</h3>
                            </div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Materia a Gestionar</label>
                            <div className="relative mb-2">
                                <input
                                    type="text"
                                    placeholder="Buscar materia por nombre o código..."
                                    value={filtroMateriaSelector}
                                    onChange={(e) => setFiltroMateriaSelector(e.target.value)}
                                    className="input-field pl-10 text-sm font-medium"
                                />
                                <svg className="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <select
                                className="input-field text-sm font-medium"
                                onChange={handleMateriaChange}
                                value={selectedMateriaId || 0}
                                disabled={loading}
                            >
                                <option value={0}>— Elegir Materia —</option>
                                {materiasList
                                    .filter(m => {
                                        if (!filtroMateriaSelector) return true;
                                        const filtro = filtroMateriaSelector.toLowerCase();
                                        return m.nombre.toLowerCase().includes(filtro) ||
                                            (m.codigo && m.codigo.toLowerCase().includes(filtro));
                                    })
                                    .map(m => (
                                        <option key={m.id} value={m.id}>{m.nombre} {m.codigo && `(${m.codigo})`}</option>
                                    ))
                                }
                            </select>
                            {filtroMateriaSelector && materiasList.filter(m => {
                                const filtro = filtroMateriaSelector.toLowerCase();
                                return m.nombre.toLowerCase().includes(filtro) ||
                                    (m.codigo && m.codigo.toLowerCase().includes(filtro));
                            }).length === 0 && (
                                    <p className="mt-1 text-xs text-gray-500">No se encontraron materias</p>
                                )}
                            <div className="mt-3 space-y-2">
                                <button
                                    onClick={loadInitialData}
                                    className="w-full text-primary-600 text-sm font-semibold hover:text-primary-700 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Refrescar catálogos
                                </button>
                                <button
                                    onClick={() => setIsCreateMateriaOpen(true)}
                                    className="flex items-center justify-center gap-2 text-center text-nowrap whitespace-nowrap h-[3.5rem] w-full px-4  py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold  rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Crear Materia
                                </button>
                                <button
                                    onClick={() => setIsCreateUsuarioOpen(true)}
                                    className="flex items-center justify-center gap-2 text-center text-nowrap whitespace-nowrap h-[3.5rem] w-full px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Crear Usuario
                                </button>
                            </div>
                        </div>

                        {/* Formulario de Asignación */}
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-neutral-100 p-2 rounded-lg">
                                    <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">2. Asignar Materia</h3>
                            </div>
                            <form onSubmit={handleAsignacionSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Maestro</label>
                                    <div className="relative mb-2">
                                        <input
                                            type="text"
                                            placeholder="Buscar maestro por nombre..."
                                            value={filtroMaestroAsignacion}
                                            onChange={(e) => setFiltroMaestroAsignacion(e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                        />
                                        <svg className="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <select name="maestro_id" value={asignacionForm.maestro_id} onChange={handleAsignacionChange} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" required>
                                        <option value="">Seleccionar maestro...</option>
                                        {maestrosList
                                            .filter(m => !filtroMaestroAsignacion || m.nombre.toLowerCase().includes(filtroMaestroAsignacion.toLowerCase()))
                                            .map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)
                                        }
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Materia</label>
                                    <div className="relative mb-2">
                                        <input
                                            type="text"
                                            placeholder="Buscar materia por nombre o código..."
                                            value={filtroMateriaAsignacion}
                                            onChange={(e) => setFiltroMateriaAsignacion(e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                        />
                                        <svg className="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <select name="materia_id" value={asignacionForm.materia_id} onChange={handleAsignacionChange} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" required>
                                        <option value="">Seleccionar materia...</option>
                                        {materiasList
                                            .filter(m => {
                                                if (!filtroMateriaAsignacion) return true;
                                                const filtro = filtroMateriaAsignacion.toLowerCase();
                                                return m.nombre.toLowerCase().includes(filtro) ||
                                                    (m.codigo && m.codigo.toLowerCase().includes(filtro));
                                            })
                                            .map(m => <option key={m.id} value={m.id}>{m.nombre} {m.codigo && `(${m.codigo})`}</option>)
                                        }
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Cupo Máximo</label>
                                    <input type="number" name="cupo_maximo" min={1} value={asignacionForm.cupo_maximo} onChange={handleAsignacionChange} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" required />
                                </div>
                                <button type="submit" disabled={asignacionSaving} className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3 rounded-lg transition-colors font-semibold disabled:opacity-50">
                                    {asignacionSaving ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                            </svg>
                                            Guardando...
                                        </span>
                                    ) : (
                                        'Crear Asignación'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Columna Derecha: Vista Principal */}
                    <div className="lg:col-span-2">
                        {renderMateriaView()}

                        {/* Reporte Global Mini */}
                        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-neutral-100 p-2 rounded-lg">
                                    <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-neutral-900 font-bold text-xl">Reporte General de Promedios</h3>
                            </div>
                            <div className="overflow-x-auto max-h-96 rounded-lg border border-neutral-200">
                                <table className="min-w-full divide-y divide-neutral-200">
                                    <thead className="bg-neutral-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Alumno</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Grupo</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Promedio</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {reporteGlobal.map(r => (
                                            <tr key={r.alumno.id} className="hover:bg-neutral-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-600">{r.alumno.id}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-gray-900">{r.alumno.nombre}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-neutral-100 text-neutral-800">{r.alumno.grupo}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-lg font-bold text-purple-600">{r.promedio_general}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modales (Edit & Delete) */}
                {isEditOpen && editMeta && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all scale-100">
                            <div className="bg-neutral-900 p-6 rounded-t-xl text-white">
                                <h3 className="text-2xl font-bold">Editar Calificación</h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nota (0 - 10)</label>
                                        <input type="number" step="0.01" min="0" max="10" value={editNota} onChange={e => setEditNota(e.target.value)} className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Observaciones</label>
                                        <textarea rows={4} value={editObs} onChange={e => setEditObs(e.target.value)} className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                                <button onClick={() => setIsEditOpen(false)} className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all">Cancelar</button>
                                <button onClick={handleSaveEdit} disabled={saving} className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50">
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isConfirmOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
                            <div className="p-6 text-center">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                    <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar calificación?</h3>
                                <p className="text-sm text-gray-500">Esta acción borrará lógicamente el registro. Podrá no ser visible en reportes futuros.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-center space-x-3">
                                <button onClick={() => setIsConfirmOpen(false)} className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all">Cancelar</button>
                                <button onClick={handleDelete} disabled={deleting} className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg font-medium transition-all disabled:opacity-50">
                                    {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Crear Materia */}
                {isCreateMateriaOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="bg-neutral-900 text-white p-6 rounded-t-xl">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Crear Nueva Materia
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                                        <input
                                            type="text"
                                            value={materiaForm.nombre}
                                            onChange={(e) => setMateriaForm({ ...materiaForm, nombre: e.target.value })}
                                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Ej: Matemáticas Avanzadas"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Código *</label>
                                        <input
                                            type="text"
                                            value={materiaForm.codigo}
                                            onChange={(e) => setMateriaForm({ ...materiaForm, codigo: e.target.value })}
                                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Ej: MAT101"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                                    <textarea
                                        value={materiaForm.descripcion || ''}
                                        onChange={(e) => setMateriaForm({ ...materiaForm, descripcion: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        rows={2}
                                        placeholder="Descripción opcional de la materia"
                                    />
                                </div>

                                {/* Separador */}
                                <div className="border-t border-gray-200 my-4"></div>

                                {/* Asignación de Maestro */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Maestro (Opcional)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Buscar maestro por nombre..."
                                                value={filtroMaestro}
                                                onChange={(e) => setFiltroMaestro(e.target.value)}
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                                            />
                                            <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <select
                                            value={materiaForm.maestro_id || ''}
                                            onChange={(e) => setMateriaForm({
                                                ...materiaForm,
                                                maestro_id: e.target.value ? parseInt(e.target.value) : undefined
                                            })}
                                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="">Seleccionar maestro...</option>
                                            {maestrosList
                                                .filter(m => !filtroMaestro || m.nombre.toLowerCase().includes(filtroMaestro.toLowerCase()))
                                                .map(m => (
                                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                                ))
                                            }
                                        </select>
                                        {filtroMaestro && maestrosList.filter(m =>
                                            m.nombre.toLowerCase().includes(filtroMaestro.toLowerCase())
                                        ).length === 0 && (
                                                <p className="mt-1 text-xs text-gray-500">No se encontraron maestros</p>
                                            )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cupo Máximo
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={materiaForm.cupo_maximo || 40}
                                            onChange={(e) => setMateriaForm({
                                                ...materiaForm,
                                                cupo_maximo: parseInt(e.target.value) || 40
                                            })}
                                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="40"
                                        />
                                    </div>
                                </div>

                                {/* Asignación de Alumnos */}
                                {materiaForm.maestro_id && (
                                    <>
                                        <div className="border-t border-gray-200 my-4"></div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Alumnos a Asignar (Opcional)
                                            </label>
                                            <div className="relative mb-3">
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por nombre, matrícula o grupo..."
                                                    value={filtroAlumno}
                                                    onChange={(e) => setFiltroAlumno(e.target.value)}
                                                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                                <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            {/* Dropdown para seleccionar por grupo y filtro por semestre */}
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Seleccionar por Grupo</label>
                                                    <select
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                const alumnosGrupo = alumnosList
                                                                    .filter(alumno => {
                                                                        // Aplicar filtros actuales
                                                                        const cumpleFiltroTexto = !filtroAlumno ||
                                                                            alumno.nombre.toLowerCase().includes(filtroAlumno.toLowerCase()) ||
                                                                            alumno.matricula.toLowerCase().includes(filtroAlumno.toLowerCase()) ||
                                                                            (alumno.grupo && alumno.grupo.toLowerCase().includes(filtroAlumno.toLowerCase()));
                                                                        const cumpleFiltroSemestre = filtroSemestreCrearMateria === 'todos' ||
                                                                            (filtroSemestreCrearMateria && alumno.semestre === parseInt(filtroSemestreCrearMateria));
                                                                        return alumno.grupo?.toUpperCase() === e.target.value.toUpperCase() &&
                                                                            cumpleFiltroTexto &&
                                                                            cumpleFiltroSemestre;
                                                                    })
                                                                    .map(alumno => alumno.id);
                                                                setSelectedAlumnos(prev => {
                                                                    const nuevos = alumnosGrupo.filter(id => !prev.includes(id));
                                                                    return [...prev, ...nuevos];
                                                                });
                                                                e.target.value = ''; // Resetear el select
                                                            }
                                                        }}
                                                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    >
                                                        <option value="">-- Seleccionar Grupo --</option>
                                                        {Array.from(new Set(alumnosList.map(a => a.grupo).filter(Boolean))).sort().map(grupo => (
                                                            <option key={grupo} value={grupo}>Grupo {grupo}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Filtrar por Semestre</label>
                                                    <select
                                                        value={filtroSemestreCrearMateria}
                                                        onChange={(e) => {
                                                            setFiltroSemestreCrearMateria(e.target.value);
                                                        }}
                                                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    >
                                                        <option value="todos">Todos los semestres</option>
                                                        {Array.from(new Set(alumnosList.map(a => a.semestre).filter((s): s is number => s !== undefined && s !== null))).sort((a, b) => a - b).map(semestre => (
                                                            <option key={semestre} value={semestre.toString()}>{semestre}° Semestre</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="border-2 border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                                                {(() => {
                                                    // Filtrar alumnos con todos los criterios
                                                    const alumnosFiltrados = alumnosList.filter(alumno => {
                                                        // Filtro de texto
                                                        if (filtroAlumno) {
                                                            const filtro = filtroAlumno.toLowerCase();
                                                            const cumpleTexto = alumno.nombre.toLowerCase().includes(filtro) ||
                                                                alumno.matricula.toLowerCase().includes(filtro) ||
                                                                (alumno.grupo && alumno.grupo.toLowerCase().includes(filtro));
                                                            if (!cumpleTexto) return false;
                                                        }

                                                        // Filtro de semestre
                                                        if (filtroSemestreCrearMateria && filtroSemestreCrearMateria !== 'todos') {
                                                            const semestreFiltro = parseInt(filtroSemestreCrearMateria);
                                                            if (alumno.semestre !== semestreFiltro) return false;
                                                        }

                                                        return true;
                                                    });

                                                    if (alumnosList.length === 0) {
                                                        return (
                                                            <p className="text-sm text-gray-500 text-center py-4">
                                                                No hay alumnos disponibles. Crea alumnos primero.
                                                            </p>
                                                        );
                                                    }

                                                    if (alumnosFiltrados.length === 0) {
                                                        return (
                                                            <p className="text-sm text-gray-500 text-center py-4">
                                                                No se encontraron alumnos con ese criterio
                                                            </p>
                                                        );
                                                    }

                                                    return (
                                                        <div className="space-y-2">
                                                            {alumnosFiltrados.map(alumno => (
                                                                <label
                                                                    key={alumno.id}
                                                                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedAlumnos.includes(alumno.id)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setSelectedAlumnos([...selectedAlumnos, alumno.id]);
                                                                            } else {
                                                                                setSelectedAlumnos(selectedAlumnos.filter(id => id !== alumno.id));
                                                                            }
                                                                        }}
                                                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                                    />
                                                                    <span className="text-sm text-gray-700 flex-1">
                                                                        {alumno.nombre} - {alumno.matricula}
                                                                        {alumno.grupo && <span className="text-neutral-600 font-semibold"> (Grupo: {alumno.grupo})</span>}
                                                                        {alumno.semestre && <span className="text-purple-600 font-semibold"> - {alumno.semestre}° Semestre</span>}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            {selectedAlumnos.length > 0 && (
                                                <div className="mt-2 flex items-center justify-between">
                                                    <p className="text-sm text-gray-600">
                                                        {selectedAlumnos.length} alumno(s) seleccionado(s)
                                                        {materiaForm.cupo_maximo && selectedAlumnos.length > materiaForm.cupo_maximo && (
                                                            <span className="text-red-600 ml-2">
                                                                ⚠️ Excede el cupo máximo de {materiaForm.cupo_maximo}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <button
                                                        onClick={() => setSelectedAlumnos([])}
                                                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                                                    >
                                                        Limpiar selección
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsCreateMateriaOpen(false);
                                        setMateriaForm({ nombre: '', codigo: '', descripcion: '', maestro_id: undefined, cupo_maximo: 40 });
                                        setSelectedAlumnos([]);
                                        setFiltroMaestro('');
                                        setFiltroAlumno('');
                                        setFiltroSemestreCrearMateria('todos');
                                    }}
                                    className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateMateria}
                                    disabled={savingMateria || (selectedAlumnos.length > 0 && !materiaForm.maestro_id)}
                                    className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {savingMateria ? 'Creando...' : 'Crear Materia'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Crear Usuario */}
                {isCreateUsuarioOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="bg-neutral-800 hover:bg-neutral-700 text-white transition-colors p-6 rounded-t-2xl">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Crear Nuevo Usuario
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                                    <input
                                        type="text"
                                        value={usuarioForm.nombre}
                                        onChange={(e) => setUsuarioForm({ ...usuarioForm, nombre: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Nombre completo"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={usuarioForm.email}
                                        onChange={(e) => setUsuarioForm({ ...usuarioForm, email: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="usuario@escuela.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña *</label>
                                    <input
                                        type="password"
                                        value={usuarioForm.password}
                                        onChange={(e) => setUsuarioForm({ ...usuarioForm, password: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rol *</label>
                                    <select
                                        value={usuarioForm.rol}
                                        onChange={(e) => setUsuarioForm({ ...usuarioForm, rol: e.target.value as any, matricula: '', grupo: '', semestre: undefined })}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        <option value="MAESTRO">Maestro</option>
                                        <option value="CONTROL_ESCOLAR">Control Escolar (Admin)</option>
                                        <option value="ALUMNO">Alumno</option>
                                    </select>
                                </div>
                                {usuarioForm.rol === 'ALUMNO' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Matrícula *</label>
                                            <input
                                                type="text"
                                                value={usuarioForm.matricula || ''}
                                                onChange={(e) => setUsuarioForm({ ...usuarioForm, matricula: e.target.value })}
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="Ej: A1001"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Grupo *</label>
                                            <select
                                                value={usuarioForm.grupo || ''}
                                                onChange={(e) => setUsuarioForm({ ...usuarioForm, grupo: e.target.value })}
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                <option value="">Seleccionar grupo...</option>
                                                <option value="A">Grupo A</option>
                                                <option value="B">Grupo B</option>
                                                <option value="C">Grupo C</option>
                                                <option value="D">Grupo D</option>
                                            </select>
                                            <p className="mt-1 text-xs text-gray-500">El grupo permite organizar y filtrar alumnos</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Semestre</label>
                                            <select
                                                value={usuarioForm.semestre || ''}
                                                onChange={(e) => setUsuarioForm({ ...usuarioForm, semestre: e.target.value ? parseInt(e.target.value) : undefined })}
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                <option value="">Seleccionar semestre...</option>
                                                <option value="1">1° Semestre</option>
                                                <option value="2">2° Semestre</option>
                                                <option value="3">3° Semestre</option>
                                                <option value="4">4° Semestre</option>
                                                <option value="5">5° Semestre</option>
                                                <option value="6">6° Semestre</option>
                                                <option value="7">7° Semestre</option>
                                                <option value="8">8° Semestre</option>
                                            </select>
                                            <p className="mt-1 text-xs text-gray-500">Semestre actual del alumno (opcional)</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
                                            <input
                                                type="date"
                                                value={usuarioForm.fecha_nacimiento || ''}
                                                onChange={(e) => setUsuarioForm({ ...usuarioForm, fecha_nacimiento: e.target.value })}
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsCreateUsuarioOpen(false);
                                        setUsuarioForm({
                                            nombre: '',
                                            email: '',
                                            password: '',
                                            rol: 'MAESTRO',
                                            matricula: '',
                                            grupo: '',
                                            semestre: undefined,
                                            fecha_nacimiento: ''
                                        });
                                    }}
                                    className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateUsuario}
                                    disabled={savingUsuario}
                                    className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                                >
                                    {savingUsuario ? 'Creando...' : 'Crear Usuario'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Asignar Alumnos a Materia Existente */}
                {isAsignarAlumnosOpen && selectedMateriaId && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="bg-neutral-900 text-white p-6 rounded-t-xl">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Asignar Alumnos a Materia
                                </h3>
                                <p className="text-green-100 text-sm mt-1">
                                    {materiasList.find(m => m.id === selectedMateriaId)?.nombre} ({materiasList.find(m => m.id === selectedMateriaId)?.codigo})
                                </p>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Filtro de búsqueda */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, matrícula o grupo..."
                                        value={filtroAlumnoAsignacion}
                                        onChange={(e) => setFiltroAlumnoAsignacion(e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                    <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>

                                {/* Dropdown para seleccionar por grupo y filtro por semestre */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Seleccionar por Grupo</label>
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const alumnosGrupo = alumnosList
                                                        .filter(alumno => {
                                                            const yaAsignado = calificacionesMateria?.some(c => c.alumno.id === alumno.id);
                                                            // Aplicar filtros actuales
                                                            const cumpleFiltroTexto = !filtroAlumnoAsignacion ||
                                                                alumno.nombre.toLowerCase().includes(filtroAlumnoAsignacion.toLowerCase()) ||
                                                                alumno.matricula.toLowerCase().includes(filtroAlumnoAsignacion.toLowerCase()) ||
                                                                (alumno.grupo && alumno.grupo.toLowerCase().includes(filtroAlumnoAsignacion.toLowerCase()));
                                                            const cumpleFiltroSemestre = filtroSemestreAsignacion === 'todos' ||
                                                                (filtroSemestreAsignacion && alumno.semestre === parseInt(filtroSemestreAsignacion));
                                                            return !yaAsignado &&
                                                                alumno.grupo?.toUpperCase() === e.target.value.toUpperCase() &&
                                                                cumpleFiltroTexto &&
                                                                cumpleFiltroSemestre;
                                                        })
                                                        .map(alumno => alumno.id);
                                                    setSelectedAlumnosAsignacion(prev => {
                                                        const nuevos = alumnosGrupo.filter(id => !prev.includes(id));
                                                        return [...prev, ...nuevos];
                                                    });
                                                    e.target.value = ''; // Resetear el select
                                                }
                                            }}
                                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        >
                                            <option value="">-- Seleccionar Grupo --</option>
                                            {Array.from(new Set(alumnosList
                                                .filter(a => {
                                                    const yaAsignado = calificacionesMateria?.some(c => c.alumno.id === a.id);
                                                    return !yaAsignado && a.grupo;
                                                })
                                                .map(a => a.grupo)
                                                .filter(Boolean)
                                            )).sort().map(grupo => (
                                                <option key={grupo} value={grupo}>Grupo {grupo}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Filtrar por Semestre</label>
                                        <select
                                            value={filtroSemestreAsignacion}
                                            onChange={(e) => {
                                                setFiltroSemestreAsignacion(e.target.value);
                                            }}
                                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        >
                                            <option value="todos">Todos los semestres</option>
                                            {Array.from(new Set(alumnosList
                                                .filter(a => {
                                                    const yaAsignado = calificacionesMateria?.some(c => c.alumno.id === a.id);
                                                    return !yaAsignado && a.semestre !== undefined && a.semestre !== null;
                                                })
                                                .map(a => a.semestre)
                                                .filter((s): s is number => s !== undefined && s !== null)
                                            )).sort((a, b) => a - b).map(semestre => (
                                                <option key={semestre} value={semestre.toString()}>{semestre}° Semestre</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Lista de alumnos */}
                                <div className="border-2 border-gray-200 rounded-lg p-3 max-h-96 overflow-y-auto">
                                    {(() => {
                                        // Filtrar alumnos disponibles (no asignados)
                                        const alumnosDisponibles = alumnosList.filter(alumno => {
                                            const yaAsignado = calificacionesMateria?.some(c => c.alumno.id === alumno.id);
                                            if (yaAsignado) return false;

                                            // Aplicar filtro de texto
                                            if (filtroAlumnoAsignacion) {
                                                const filtro = filtroAlumnoAsignacion.toLowerCase();
                                                const cumpleTexto = alumno.nombre.toLowerCase().includes(filtro) ||
                                                    alumno.matricula.toLowerCase().includes(filtro) ||
                                                    (alumno.grupo && alumno.grupo.toLowerCase().includes(filtro));
                                                if (!cumpleTexto) return false;
                                            }

                                            // Aplicar filtro de semestre
                                            if (filtroSemestreAsignacion && filtroSemestreAsignacion !== 'todos') {
                                                const semestreFiltro = parseInt(filtroSemestreAsignacion);
                                                if (alumno.semestre !== semestreFiltro) return false;
                                            }

                                            return true;
                                        });

                                        if (alumnosList.length === 0) {
                                            return (
                                                <p className="text-sm text-gray-500 text-center py-4">
                                                    No hay alumnos disponibles. Crea alumnos primero.
                                                </p>
                                            );
                                        }

                                        if (alumnosDisponibles.length === 0) {
                                            return (
                                                <p className="text-sm text-gray-500 text-center py-4">
                                                    No se encontraron alumnos con ese criterio
                                                </p>
                                            );
                                        }

                                        return (
                                            <div className="space-y-2">
                                                {alumnosDisponibles.map(alumno => (
                                                    <label
                                                        key={alumno.id}
                                                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAlumnosAsignacion.includes(alumno.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedAlumnosAsignacion([...selectedAlumnosAsignacion, alumno.id]);
                                                                } else {
                                                                    setSelectedAlumnosAsignacion(selectedAlumnosAsignacion.filter(id => id !== alumno.id));
                                                                }
                                                            }}
                                                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                        />
                                                        <span className="text-sm text-gray-700 flex-1">
                                                            {alumno.nombre} - {alumno.matricula}
                                                            {alumno.grupo && <span className="text-blue-600 font-semibold"> (Grupo: {alumno.grupo})</span>}
                                                            {alumno.semestre && <span className="text-purple-600 font-semibold"> - {alumno.semestre}° Semestre</span>}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                                {selectedAlumnosAsignacion.length > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                        <p className="text-sm text-green-800 font-medium">
                                            {selectedAlumnosAsignacion.length} alumno(s) seleccionado(s)
                                        </p>
                                        <button
                                            onClick={() => setSelectedAlumnosAsignacion([])}
                                            className="text-xs text-green-700 hover:text-green-800 font-medium underline"
                                        >
                                            Limpiar selección
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsAsignarAlumnosOpen(false);
                                        setSelectedAlumnosAsignacion([]);
                                        setFiltroAlumnoAsignacion('');
                                        setFiltroSemestreAsignacion('todos');
                                    }}
                                    className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAsignarAlumnos}
                                    disabled={savingAsignacion || selectedAlumnosAsignacion.length === 0}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {savingAsignacion ? 'Asignando...' : `Asignar ${selectedAlumnosAsignacion.length > 0 ? `(${selectedAlumnosAsignacion.length})` : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;