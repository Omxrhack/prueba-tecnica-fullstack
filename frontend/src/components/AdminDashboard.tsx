// /frontend/src/components/AdminDashboard.tsx
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
    asignarMateriasAAlumno,
    deleteAlumnoAdmin,
    deleteMateriaAdmin,
    updateMateriaAdmin,
    updateMaestroAdmin,
    updateAlumnoAdmin,
    getDetalleAlumnoAdmin,
    type CrearMateriaPayload,
    type UpdateMateriaPayload,
    type UpdateMaestroPayload,
    type UpdateAlumnoPayload,
    type CrearUsuarioPayload,
    type DetalleAlumnoResponse,
} from '../services/admin.service';
import { getMaterias, getMaestros, getAlumnos, getUsuariosAlumnosDisponibles, type AlumnoListItem } from '../services/general.service';
import type { User } from '../types';
import api from '../services/api';
import type { Materia } from '../types';
import type { ReporteItem, CalificacionMateriaItem } from '../services/admin.service'; // Tipos del admin service
import type { MaestroListItem } from '../services/general.service'; // Tipo del general service

// --- Spinner Component ---
// --- Spinner Component ---
const Spinner: React.FC = () => (
    <div className="flex items-center justify-center p-6">
        <svg className="animate-spin h-8 w-8 text-neutral-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <svg className="animate-spin h-8 w-8 text-neutral-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
    </div>
);

const AdminDashboard: React.FC = () => {
    // --- Estados de Datos ---
    // --- Estados de Datos ---
    const [reporteGlobal, setReporteGlobal] = useState<ReporteItem[]>([]);
    const [materiasList, setMateriasList] = useState<Materia[]>([]);
    const [maestrosList, setMaestrosList] = useState<MaestroListItem[]>([]);
    const [alumnosList, setAlumnosList] = useState<AlumnoListItem[]>([]);
    const [alumnosList, setAlumnosList] = useState<AlumnoListItem[]>([]);

    // --- Estado de la Vista Principal (Filtrado por Materia) ---
    // --- Estado de la Vista Principal (Filtrado por Materia) ---
    const [selectedMateriaId, setSelectedMateriaId] = useState<number | null>(null);
    const [calificacionesMateria, setCalificacionesMateria] = useState<CalificacionMateriaItem[] | null>(null);
    const [maestroAsignado, setMaestroAsignado] = useState<{ id: number; nombre: string } | null>(null);
    const [calificacionesMateria, setCalificacionesMateria] = useState<CalificacionMateriaItem[] | null>(null);
    const [maestroAsignado, setMaestroAsignado] = useState<{ id: number; nombre: string } | null>(null);

    // --- Estados de UI ---
    // --- Estados de UI ---
    const [loading, setLoading] = useState(true);
    const [loadingMateria, setLoadingMateria] = useState(false); // Spinner específico para la tabla
    const [loadingMateria, setLoadingMateria] = useState(false); // Spinner específico para la tabla
    const [gestionError, setGestionError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // --- Formulario de Asignación ---
    // --- Formulario de Asignación ---
    const [asignacionForm, setAsignacionForm] = useState({
        maestro_id: '',
        materia_id: '',
        cupo_maximo: 40,
    });
    const [asignacionSaving, setAsignacionSaving] = useState(false);

    // --- Modales ---
    // --- Modales ---
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editMeta, setEditMeta] = useState<{ alumnoID: number; currentNota: number; currentObs: string } | null>(null);
    const [editNota, setEditNota] = useState('');
    const [editObs, setEditObs] = useState('');
    const [saving, setSaving] = useState(false);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteMeta, setDeleteMeta] = useState<{ alumnoID: number } | null>(null);
    const [isConfirmDeleteAlumnoOpen, setIsConfirmDeleteAlumnoOpen] = useState(false);
    const [deleteAlumnoMeta, setDeleteAlumnoMeta] = useState<{ alumnoID: number; nombre: string } | null>(null);
    const [isConfirmDeleteMateriaOpen, setIsConfirmDeleteMateriaOpen] = useState(false);
    const [deleteMateriaMeta, setDeleteMateriaMeta] = useState<{ materiaID: number; nombre: string } | null>(null);
    const [deletingAlumno, setDeletingAlumno] = useState(false);
    const [deletingMateria, setDeletingMateria] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // --- Formularios de Creación ---
    const [isCreateMateriaOpen, setIsCreateMateriaOpen] = useState(false);
    const [materiaForm, setMateriaForm] = useState<CrearMateriaPayload>({
        nombre: '',
        codigo: '',
        descripcion: '',
        maestro_id: undefined,
        cupo_maximo: 40,
        semestre: 1
    });
    const [isEditMateriaOpen, setIsEditMateriaOpen] = useState(false);
    const [editMateriaForm, setEditMateriaForm] = useState<UpdateMateriaPayload>({
        nombre: '',
        codigo: '',
        descripcion: '',
        semestre: 1
    });
    const [savingEditMateria, setSavingEditMateria] = useState(false);
    const [selectedAlumnos, setSelectedAlumnos] = useState<number[]>([]);
    const [savingMateria, setSavingMateria] = useState(false);

    // Estados para editar Maestro
    const [isEditMaestroOpen, setIsEditMaestroOpen] = useState(false);
    const [editMaestroForm, setEditMaestroForm] = useState<UpdateMaestroPayload>({
        nombre: '',
        email: '',
        password: ''
    });
    const [selectedMaestroId, setSelectedMaestroId] = useState<number | null>(null);
    const [savingEditMaestro, setSavingEditMaestro] = useState(false);

    // Estados para editar Alumno
    const [isEditAlumnoOpen, setIsEditAlumnoOpen] = useState(false);
    const [editAlumnoForm, setEditAlumnoForm] = useState<UpdateAlumnoPayload>({
        nombre: '',
        matricula: '',
        grupo: '',
        fecha_nacimiento: '',
        semestre: 1,
        usuario_id: undefined
    });
    const [selectedAlumnoId, setSelectedAlumnoId] = useState<number | null>(null);
    const [savingEditAlumno, setSavingEditAlumno] = useState(false);
    const [usuariosAlumnosDisponibles, setUsuariosAlumnosDisponibles] = useState<User[]>([]);
    const [loadingUsuariosAlumnos, setLoadingUsuariosAlumnos] = useState(false);

    // Estado para mostrar detalle de alumno
    const [alumnoDetalle, setAlumnoDetalle] = useState<Record<number, DetalleAlumnoResponse>>({});
    const [loadingDetalle, setLoadingDetalle] = useState<Record<number, boolean>>({});

    // Filtros de búsqueda
    const [filtroMaestro, setFiltroMaestro] = useState('');
    const [filtroAlumno, setFiltroAlumno] = useState('');
    const [filtroSemestreCrearMateria, setFiltroSemestreCrearMateria] = useState('todos');
    const [filtroMaestroAsignacion, setFiltroMaestroAsignacion] = useState('');
    const [filtroMateriaAsignacion, setFiltroMateriaAsignacion] = useState('');
    const [filtroMateriaSelector, setFiltroMateriaSelector] = useState('');
    const [filtroSemestreGeneral, setFiltroSemestreGeneral] = useState<number | 'todos'>('todos');
    const [isMateriaSelectorOpen, setIsMateriaSelectorOpen] = useState(false);
    const [isAsignacionMateriaSelectorOpen, setIsAsignacionMateriaSelectorOpen] = useState(false);

    // Modal para asignar alumnos a materia existente
    const [isAsignarAlumnosOpen, setIsAsignarAlumnosOpen] = useState(false);
    const [selectedAlumnosAsignacion, setSelectedAlumnosAsignacion] = useState<number[]>([]);
    const [filtroAlumnoAsignacion, setFiltroAlumnoAsignacion] = useState('');
    const [filtroSemestreAsignacion, setFiltroSemestreAsignacion] = useState('todos');
    const [savingAsignacion, setSavingAsignacion] = useState(false);

    // Modal para asignar materias a un alumno
    const [isAsignarMateriasOpen, setIsAsignarMateriasOpen] = useState(false);
    const [selectedAlumnoParaAsignar, setSelectedAlumnoParaAsignar] = useState<{ id: number; nombre: string } | null>(null);
    const [selectedMateriasAsignacion, setSelectedMateriasAsignacion] = useState<number[]>([]);
    const [filtroMateriaAsignacionAlumno, setFiltroMateriaAsignacionAlumno] = useState('');
    const [filtroSemestreAsignacionMateria, setFiltroSemestreAsignacionMateria] = useState('todos');
    const [savingAsignacionMaterias, setSavingAsignacionMaterias] = useState(false);

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

    // Handler para asignar materias a un alumno
    const handleAsignarMateriasAAlumno = async () => {
        if (!selectedAlumnoParaAsignar || selectedMateriasAsignacion.length === 0) {
            setGestionError('Debes seleccionar al menos una materia para asignar.');
            return;
        }

        setSavingAsignacionMaterias(true);
        setGestionError(null);
        try {
            const response = await asignarMateriasAAlumno(selectedAlumnoParaAsignar.id, {
                materia_ids: selectedMateriasAsignacion
            });
            console.log(`[AdminDashboard] ✅ Materias asignadas exitosamente. Respuesta:`, response);
            setSuccessMsg(response.message || `${selectedMateriasAsignacion.length} materia(s) asignada(s) exitosamente al alumno.`);
            setIsAsignarMateriasOpen(false);
            setSelectedMateriasAsignacion([]);
            setFiltroMateriaAsignacionAlumno('');
            setFiltroSemestreAsignacionMateria('todos');

            // Recargar todo lo necesario
            const alumnoId = selectedAlumnoParaAsignar.id;
            console.log(`[AdminDashboard] Iniciando recarga de datos para alumno ${alumnoId} después de asignar materias...`);

            // Recargar listas
            console.log(`[AdminDashboard] Recargando listas de alumnos y reporte global...`);
            const [alumnosData, reporteData] = await Promise.all([
                getAlumnos(),
                getReporteGlobal()
            ]);
            console.log(`[AdminDashboard] Listas recargadas: ${alumnosData.length} alumnos`);
            setAlumnosList(alumnosData);
            setReporteGlobal(reporteData);

            // Limpiar el detalle del alumno del estado antes de recargar (fuerza recarga sin caché)
            console.log(`[AdminDashboard] Limpiando detalle en caché para alumno ${alumnoId}...`);
            setAlumnoDetalle(prev => {
                const nuevo = { ...prev };
                if (nuevo[alumnoId]) {
                    console.log(`[AdminDashboard] Detalle encontrado en caché, eliminándolo...`);
                    delete nuevo[alumnoId];
                } else {
                    console.log(`[AdminDashboard] No había detalle en caché para alumno ${alumnoId}`);
                }
                return nuevo;
            });

            // Esperar un momento para que el estado se actualice
            await new Promise(resolve => setTimeout(resolve, 100));

            // Recargar el detalle del alumno SIEMPRE (fuerza recarga)
            console.log(`[AdminDashboard] Recargando detalle del alumno ${alumnoId} (force=true)...`);
            await loadDetalleAlumno(alumnoId, true);

            // Si estaba seleccionada una materia, recargar sus detalles también
            if (selectedMateriaId) {
                await loadMateriaDetails(selectedMateriaId);
            }
        } catch (e: any) {
            setGestionError('Error al asignar materias: ' + (e.response?.data?.message || e.message));
        } finally {
            setSavingAsignacionMaterias(false);
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
                getMaterias(),
                getMaestros(),
                getAlumnos()
            ]);
            setReporteGlobal(reporteData);
            setMateriasList(materiasData);
            setMaestrosList(maestrosData);
            setAlumnosList(alumnosData);

            // Log para verificar que se cargaron todos los datos
            console.log(`[AdminDashboard] Datos cargados:`, {
                materias: materiasData.length,
                maestros: maestrosData.length,
                alumnos: alumnosData.length,
                reporte: reporteData.length
            });
        } catch (e: any) {
            setGestionError('Error al cargar catálogos iniciales.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // Cerrar dropdowns al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Si el clic fue fuera de los dropdowns, cerrarlos
            if (!target.closest('.materia-selector-dropdown') && !target.closest('.asignacion-materia-dropdown')) {
                setIsMateriaSelectorOpen(false);
                setIsAsignacionMateriaSelectorOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
            setGestionError(e.message || 'Error al cargar calificaciones de la materia.');
            setCalificacionesMateria([]);
            setMaestroAsignado(null);
        } finally {
            setLoadingMateria(false);
            setLoadingMateria(false);
        }
    }, []);
}, []);

// 2. Carga Dinámica al Seleccionar Materia
// 2. Carga Dinámica al Seleccionar Materia
useEffect(() => {
    if (!selectedMateriaId) {
        setCalificacionesMateria(null);
        setMaestroAsignado(null);
        return;
    }

    loadMateriaDetails(selectedMateriaId);
}, [selectedMateriaId, loadMateriaDetails]);

if (!selectedMateriaId) {
    setCalificacionesMateria(null);
    setMaestroAsignado(null);
    return;
}

loadMateriaDetails(selectedMateriaId);
    }, [selectedMateriaId, loadMateriaDetails]);


// --- Handlers ---
// --- Handlers ---
const handleMateriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedMateriaId(id === 0 ? null : id);
    setSuccessMsg(null); // Limpiar mensajes previos
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

        setSuccessMsg('Asignación realizada con éxito.');
        setAsignacionForm({ maestro_id: '', materia_id: '', cupo_maximo: 40 });

        // Si la materia asignada está seleccionada, recargar los detalles
        if (Number(materia_id) === selectedMateriaId) {
            // Recargar los detalles completos de la materia (esto actualizará el maestro)
            await loadMateriaDetails(Number(materia_id));
        }

        // Si la materia asignada está seleccionada, recargar los detalles
        if (Number(materia_id) === selectedMateriaId) {
            // Recargar los detalles completos de la materia (esto actualizará el maestro)
            await loadMateriaDetails(Number(materia_id));
        }
    } catch (e: any) {
        setGestionError('Error en la asignación: ' + (e.message || 'Desconocido'));
        setGestionError('Error en la asignación: ' + (e.message || 'Desconocido'));
    } finally {
        setAsignacionSaving(false);
    }
};

// --- Modales Handlers ---
const [selectedUnidadEdit, setSelectedUnidadEdit] = useState<number>(1);

const openEdit = (item: CalificacionMateriaItem, unidad?: number) => {
    if (!selectedMateriaId) return;
    const unidadNum = unidad || 1;
    const califUnidad = item.unidades?.find(u => u.unidad === unidadNum);

    setSelectedUnidadEdit(unidadNum);
    setEditMeta({
        alumnoID: item.alumno.id,
        currentNota: califUnidad ? parseFloat(califUnidad.nota.toString()) : 0,
        currentObs: califUnidad?.observaciones || ''
    });
    setEditNota(califUnidad?.nota?.toString() || '');
    setEditObs(califUnidad?.observaciones || '');
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
        await updateCalificacionAdmin(selectedMateriaId, editMeta.alumnoID, parsed, editObs, selectedUnidadEdit);
        setSuccessMsg(`Calificación de unidad ${selectedUnidadEdit} actualizada.`);
        setIsEditOpen(false);
        await loadMateriaDetails(selectedMateriaId);
    } catch (e: any) {
        setGestionError('Error al actualizar: ' + (e.response?.data?.message || e.message));
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
        setSuccessMsg('Calificación eliminada.');
        setIsConfirmOpen(false);
        // Recargar los detalles de la materia
        await loadMateriaDetails(selectedMateriaId);
    } catch (e: any) {
        setGestionError('Error al eliminar: ' + e.message);
        setGestionError('Error al eliminar: ' + e.message);
    } finally {
        setDeleting(false);
    }
};

// --- Handlers para Eliminar Alumno ---
const openConfirmDeleteAlumno = (alumnoID: number, nombre: string) => {
    setDeleteAlumnoMeta({ alumnoID, nombre });
    setIsConfirmDeleteAlumnoOpen(true);
};

const handleDeleteAlumno = async () => {
    if (!deleteAlumnoMeta) return;
    const alumnoIdToDelete = deleteAlumnoMeta.alumnoID;
    setDeletingAlumno(true);
    setGestionError(null);
    try {
        await deleteAlumnoAdmin(alumnoIdToDelete);
        setSuccessMsg(`Alumno "${deleteAlumnoMeta.nombre}" eliminado con éxito.`);
        setIsConfirmDeleteAlumnoOpen(false);

        // Limpiar el detalle del alumno eliminado del estado
        setAlumnoDetalle(prev => {
            const nuevo = { ...prev };
            delete nuevo[alumnoIdToDelete];
            return nuevo;
        });
        setLoadingDetalle(prev => {
            const nuevo = { ...prev };
            delete nuevo[alumnoIdToDelete];
            return nuevo;
        });

        // Recargar listas
        try {
            const [alumnosData, reporteData] = await Promise.all([
                getAlumnos(),
                getReporteGlobal()
            ]);
            setAlumnosList(alumnosData);
            setReporteGlobal(reporteData);

            // Si estaba seleccionada una materia, recargar sus detalles
            if (selectedMateriaId) {
                await loadMateriaDetails(selectedMateriaId);
            }
        } catch (reloadError: any) {
            console.error('Error al recargar datos después de eliminar:', reloadError);
            // No mostrar error al usuario si falla la recarga, ya que la eliminación fue exitosa
        }
    } catch (e: any) {
        setGestionError('Error al eliminar alumno: ' + (e.response?.data?.message || e.message));
    } finally {
        setDeletingAlumno(false);
        // Limpiar el meta después de todo
        setDeleteAlumnoMeta(null);
    }
};

// --- Handlers para Eliminar Materia ---
const openConfirmDeleteMateria = (materiaID: number, nombre: string) => {
    setDeleteMateriaMeta({ materiaID, nombre });
    setIsConfirmDeleteMateriaOpen(true);
};

const handleDeleteMateria = async () => {
    if (!deleteMateriaMeta) return;
    setDeletingMateria(true);
    setGestionError(null);
    try {
        await deleteMateriaAdmin(deleteMateriaMeta.materiaID);
        setSuccessMsg(`Materia "${deleteMateriaMeta.nombre}" eliminada con éxito.`);
        setIsConfirmDeleteMateriaOpen(false);
        // Recargar listas
        const materiasData = await getMaterias();
        setMateriasList(materiasData);
        // Si la materia eliminada estaba seleccionada, limpiar selección
        if (selectedMateriaId === deleteMateriaMeta.materiaID) {
            setSelectedMateriaId(null);
            setCalificacionesMateria(null);
            setMaestroAsignado(null);
        }
    } catch (e: any) {
        setGestionError('Error al eliminar materia: ' + (e.response?.data?.message || e.message));
    } finally {
        setDeletingMateria(false);
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
        setMateriaForm({ nombre: '', codigo: '', descripcion: '', maestro_id: undefined, cupo_maximo: 40, semestre: 1 });
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

// --- Handlers para Editar Materia ---
const openEditMateria = (materia: Materia) => {
    setEditMateriaForm({
        nombre: materia.nombre,
        codigo: materia.codigo,
        descripcion: materia.descripcion || '',
        semestre: materia.semestre || 1
    });
    setIsEditMateriaOpen(true);
};

const handleEditMateria = async () => {
    if (!selectedMateriaId) return;
    if (!editMateriaForm.nombre || !editMateriaForm.codigo) {
        setGestionError('Nombre y código son obligatorios');
        return;
    }

    setSavingEditMateria(true);
    setGestionError(null);
    try {
        await updateMateriaAdmin(selectedMateriaId, editMateriaForm);
        setSuccessMsg('Materia actualizada con éxito.');
        setIsEditMateriaOpen(false);
        // Recargar listas
        const materiasData = await getMaterias();
        setMateriasList(materiasData);
        // Actualizar selección si corresponde
        const materiaActualizada = materiasData.find(m => m.id === selectedMateriaId);
        if (materiaActualizada) {
            await loadMateriaDetails(selectedMateriaId);
        }
    } catch (e: any) {
        setGestionError('Error al actualizar materia: ' + (e.response?.data?.message || e.message));
    } finally {
        setSavingEditMateria(false);
    }
};

// --- Handlers para Editar Maestro ---
const openEditMaestro = (maestro: MaestroListItem) => {
    setEditMaestroForm({
        nombre: maestro.nombre,
        email: maestro.email,
        password: '' // No mostrar contraseña
    });
    setSelectedMaestroId(maestro.id);
    setIsEditMaestroOpen(true);
};

const handleEditMaestro = async () => {
    if (!selectedMaestroId) return;
    if (!editMaestroForm.nombre || !editMaestroForm.email) {
        setGestionError('Nombre y email son obligatorios');
        return;
    }

    setSavingEditMaestro(true);
    setGestionError(null);
    try {
        // Solo enviar password si se proporcionó
        const payload: UpdateMaestroPayload = {
            nombre: editMaestroForm.nombre,
            email: editMaestroForm.email
        };
        if (editMaestroForm.password && editMaestroForm.password.length > 0) {
            payload.password = editMaestroForm.password;
        }

        await updateMaestroAdmin(selectedMaestroId, payload);
        setSuccessMsg('Maestro actualizado con éxito.');
        setIsEditMaestroOpen(false);
        // Recargar listas
        const [maestrosData, reporteData] = await Promise.all([
            getMaestros(),
            getReporteGlobal()
        ]);
        setMaestrosList(maestrosData);
        setReporteGlobal(reporteData);
    } catch (e: any) {
        setGestionError('Error al actualizar maestro: ' + (e.response?.data?.message || e.message));
    } finally {
        setSavingEditMaestro(false);
    }
};

// --- Handler para cargar detalle de alumno ---
const loadDetalleAlumno = useCallback(async (alumnoID: number, force = false) => {
    console.log(`[AdminDashboard] loadDetalleAlumno llamado para alumno ${alumnoID}, force=${force}`);
    if (alumnoDetalle[alumnoID] && !force) {
        console.log(`[AdminDashboard] Detalle ya existe en caché para alumno ${alumnoID}, omitiendo carga`);
        return; // Ya cargado, a menos que se fuerce
    }

    setLoadingDetalle(prev => ({ ...prev, [alumnoID]: true }));
    try {
        console.log(`[AdminDashboard] Iniciando petición al backend para detalle del alumno ${alumnoID}...`);
        const detalle = await getDetalleAlumnoAdmin(alumnoID);

        console.log(`[AdminDashboard] Detalle recibido del backend para alumno ${alumnoID}:`, {
            alumno: detalle.alumno?.nombre,
            matricula: detalle.alumno?.matricula,
            total_calificaciones: detalle.calificaciones?.length || 0,
            materias_cursando_count: detalle.materias_cursando?.length || 0,
            materias_activas: detalle.materias_cursando?.filter(m => m.activa === 1).length || 0,
            materias_cursando_detalle: detalle.materias_cursando?.map(m => ({
                id: m.materia?.id,
                nombre: m.materia?.nombre,
                activa: m.activa,
                promedio: m.promedio_materia,
                unidades: m.unidades?.length || 0
            })) || []
        });

        console.log(`[AdminDashboard] Materias por semestre:`, Object.keys(detalle.materias_por_semestre || {}).map((sem: string) => {
            const datos = detalle.materias_por_semestre[parseInt(sem)];
            return {
                semestre: sem,
                cursando: datos?.cursando?.length || 0,
                cursadas: datos?.cursadas?.length || 0,
                faltantes: datos?.faltantes?.length || 0
            };
        }));

        setAlumnoDetalle(prev => {
            const nuevo = { ...prev, [alumnoID]: detalle };
            console.log(`[AdminDashboard] Estado actualizado, detalle para alumno ${alumnoID} guardado`);
            return nuevo;
        });
    } catch (e: any) {
        console.error(`[AdminDashboard] ❌ Error al cargar detalle del alumno ${alumnoID}:`, e);
        console.error(`[AdminDashboard] Error details:`, {
            message: e.message,
            response: e.response?.data,
            status: e.response?.status
        });
    } finally {
        setLoadingDetalle(prev => ({ ...prev, [alumnoID]: false }));
        console.log(`[AdminDashboard] Finalizada carga de detalle para alumno ${alumnoID}`);
    }
}, [alumnoDetalle]);

// --- Handlers para Editar Alumno ---
const openEditAlumno = async (alumno: AlumnoListItem) => {
    setEditAlumnoForm({
        nombre: alumno.nombre,
        matricula: alumno.matricula,
        grupo: alumno.grupo,
        fecha_nacimiento: '',
        semestre: alumno.semestre || 1,
        usuario_id: alumno.usuario_id || undefined
    });
    setSelectedAlumnoId(alumno.id);
    setIsEditAlumnoOpen(true);

    // Cargar usuarios disponibles
    setLoadingUsuariosAlumnos(true);
    try {
        const usuarios = await getUsuariosAlumnosDisponibles();
        setUsuariosAlumnosDisponibles(usuarios);
    } catch (e: any) {
        console.error('Error al cargar usuarios:', e);
    } finally {
        setLoadingUsuariosAlumnos(false);
    }
};

const handleEditAlumno = async () => {
    if (!selectedAlumnoId) return;
    if (!editAlumnoForm.nombre || !editAlumnoForm.matricula || !editAlumnoForm.grupo) {
        setGestionError('Nombre, matrícula y grupo son obligatorios');
        return;
    }

    setSavingEditAlumno(true);
    setGestionError(null);
    try {
        await updateAlumnoAdmin(selectedAlumnoId, editAlumnoForm);
        setSuccessMsg('Alumno actualizado con éxito.');
        setIsEditAlumnoOpen(false);
        // Recargar listas
        const [alumnosData, reporteData] = await Promise.all([
            getAlumnos(),
            getReporteGlobal()
        ]);
        setAlumnosList(alumnosData);
        setReporteGlobal(reporteData);
        // Recargar detalle si estaba cargado
        if (selectedAlumnoId && alumnoDetalle[selectedAlumnoId]) {
            await loadDetalleAlumno(selectedAlumnoId, true);
        }
        // Si estaba seleccionada una materia, recargar sus detalles
        if (selectedMateriaId) {
            await loadMateriaDetails(selectedMateriaId);
        }
    } catch (e: any) {
        setGestionError('Error al actualizar alumno: ' + (e.response?.data?.message || e.message));
    } finally {
        setSavingEditAlumno(false);
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
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Unidades</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Promedio</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {calificacionesMateria && calificacionesMateria.length > 0 ? (
                                            calificacionesMateria
                                                .filter(item => item && item.alumno && item.alumno.id) // Filtrar elementos nulos o inválidos
                                                .map((item) => (
                                                    <tr key={item.alumno.id} className="hover:bg-neutral-50 transition-colors">
                                                        <td className="px-6 py-4" colSpan={4}>
                                                            <div className="space-y-4">
                                                                {/* Header del Alumno */}
                                                                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex-shrink-0 h-10 w-10 bg-neutral-200 rounded-full flex items-center justify-center">
                                                                            <span className="text-neutral-800 font-bold">{item.alumno.nombre.charAt(0)}</span>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-sm font-bold text-neutral-900">{item.alumno.nombre}</div>
                                                                            <div className="text-xs text-neutral-500">{item.alumno.matricula} • Grupo: {item.alumno.grupo}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-xs text-neutral-500 mb-1">Promedio</div>
                                                                        <div className={`text-lg font-bold ${item.promedio_materia >= 7 ? 'text-green-600' : item.promedio_materia >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                            {item.promedio_materia.toFixed(2)}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Unidades */}
                                                                <div className="grid grid-cols-5 gap-2">
                                                                    {Array.from({ length: 5 }, (_, i) => i + 1).map(unidad => {
                                                                        const califUnidad = item.unidades?.find(u => u.unidad === unidad);
                                                                        const nota = califUnidad ? parseFloat(califUnidad.nota.toString()) : null;

                                                                        return (
                                                                            <div key={unidad} className="relative group">
                                                                                <button
                                                                                    onClick={() => openEdit(item, unidad)}
                                                                                    className={`w-full p-2 rounded-lg text-xs font-semibold transition-all ${nota !== null
                                                                                        ? nota >= 7
                                                                                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                                                                            : nota >= 6
                                                                                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                                                                                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                                                                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200'
                                                                                        }`}
                                                                                >
                                                                                    <div className="font-bold">U{unidad}</div>
                                                                                    <div className="text-[10px] mt-0.5">{nota !== null ? nota.toFixed(1) : '-'}</div>
                                                                                </button>
                                                                                {califUnidad && (
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            if (window.confirm(`¿Eliminar calificación de unidad ${unidad}?`)) {
                                                                                                deleteCalificacionAdmin(selectedMateriaId!, item.alumno.id, unidad)
                                                                                                    .then(() => {
                                                                                                        setSuccessMsg(`Calificación de unidad ${unidad} eliminada.`);
                                                                                                        loadMateriaDetails(selectedMateriaId!);
                                                                                                    })
                                                                                                    .catch(err => setGestionError('Error al eliminar: ' + err.message));
                                                                                            }
                                                                                        }}
                                                                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px]"
                                                                                        title="Eliminar"
                                                                                    >
                                                                                        ×
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center">
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
                                            {/* Dropdown de materias agrupadas por semestre */}
                                            <div className="relative materia-selector-dropdown">
                                                {/* Botón para abrir/cerrar el dropdown */}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsMateriaSelectorOpen(!isMateriaSelectorOpen)}
                                                    className="w-full input-field text-sm font-medium flex items-center justify-between"
                                                >
                                                    <span>
                                                        {selectedMateriaId
                                                            ? materiasList.find(m => m.id === selectedMateriaId)?.nombre || '— Elegir Materia —'
                                                            : '— Elegir Materia —'}
                                                    </span>
                                                    <svg
                                                        className={`w-5 h-5 text-gray-400 transition-transform ${isMateriaSelectorOpen ? 'rotate-180' : ''}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>

                                                {/* Lista desplegable */}
                                                {isMateriaSelectorOpen && (
                                                    <div className="absolute z-50 w-full mt-1 border-2 border-neutral-300 rounded-lg max-h-64 overflow-y-auto bg-white shadow-lg">
                                                        {/* Opción "Elegir Materia" */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedMateriaId(null);
                                                                handleMateriaChange({ target: { value: '0' } } as any);
                                                                setIsMateriaSelectorOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2 text-sm font-medium border-b border-neutral-200 hover:bg-neutral-50 transition-colors ${!selectedMateriaId ? 'bg-purple-50 border-purple-300' : 'bg-white'}`}
                                                        >
                                                            — Elegir Materia —
                                                        </button>

                                                        {/* Materias agrupadas por semestre */}
                                                        {(() => {
                                                            // Filtrar materias
                                                            const materiasFiltradas = materiasList.filter(m => {
                                                                if (!filtroMateriaSelector) return true;
                                                                const filtro = filtroMateriaSelector.toLowerCase();
                                                                return m.nombre.toLowerCase().includes(filtro) ||
                                                                    (m.codigo && m.codigo.toLowerCase().includes(filtro));
                                                            });

                                                            // Agrupar por semestre
                                                            const materiasPorSemestre: Record<number, typeof materiasFiltradas> = {};
                                                            materiasFiltradas.forEach(materia => {
                                                                const semestre = (materia.semestre && materia.semestre > 0) ? materia.semestre : 0;
                                                                if (!materiasPorSemestre[semestre]) {
                                                                    materiasPorSemestre[semestre] = [];
                                                                }
                                                                materiasPorSemestre[semestre].push(materia);
                                                            });

                                                            // Ordenar semestres
                                                            const semestresOrdenados = Object.keys(materiasPorSemestre)
                                                                .map(Number)
                                                                .filter(sem => sem > 0 && materiasPorSemestre[sem].length > 0)
                                                                .sort((a, b) => a - b);

                                                            if (semestresOrdenados.length === 0 && materiasFiltradas.length === 0) {
                                                                return (
                                                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                                        No hay materias disponibles
                                                                    </div>
                                                                );
                                                            }

                                                            return semestresOrdenados.map(semestre => (
                                                                <div key={semestre}>
                                                                    {/* Título del Semestre */}
                                                                    <div className="sticky top-0 z-10 px-4 py-2 bg-purple-700 text-white border-b border-purple-800">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-6 h-6 bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold">
                                                                                {semestre}
                                                                            </span>
                                                                            <span className="text-xs font-bold uppercase tracking-wide">
                                                                                Semestre {semestre}
                                                                            </span>
                                                                            <span className="ml-auto text-xs opacity-90">
                                                                                ({materiasPorSemestre[semestre].length})
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {/* Materias del Semestre */}
                                                                    {materiasPorSemestre[semestre].map(materia => (
                                                                        <button
                                                                            key={materia.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedMateriaId(materia.id);
                                                                                handleMateriaChange({ target: { value: materia.id.toString() } } as any);
                                                                            }}
                                                                            className={`w-full text-left px-4 py-2 text-sm font-medium border-b border-neutral-100 hover:bg-neutral-50 transition-colors flex items-center gap-2 ${selectedMateriaId === materia.id ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
                                                                        >
                                                                            <span className="font-semibold text-neutral-900">{materia.nombre}</span>
                                                                            {materia.codigo && (
                                                                                <span className="text-xs text-neutral-600">({materia.codigo})</span>
                                                                            )}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                            {selectedMateriaId && (
                                                <button
                                                    onClick={() => {
                                                        const materia = materiasList.find(m => m.id === selectedMateriaId);
                                                        if (materia) {
                                                            openConfirmDeleteMateria(materia.id, materia.nombre);
                                                        }
                                                    }}
                                                    className="w-full mt-2 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Eliminar Materia Seleccionada
                                                </button>
                                            )}
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
                                                    {/* Dropdown de materias agrupadas por semestre */}
                                                    <div className="relative asignacion-materia-dropdown">
                                                        {/* Botón para abrir/cerrar el dropdown */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsAsignacionMateriaSelectorOpen(!isAsignacionMateriaSelectorOpen)}
                                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all flex items-center justify-between bg-white"
                                                        >
                                                            <span>
                                                                {asignacionForm.materia_id
                                                                    ? materiasList.find(m => m.id.toString() === asignacionForm.materia_id)?.nombre || 'Seleccionar materia...'
                                                                    : 'Seleccionar materia...'}
                                                            </span>
                                                            <svg
                                                                className={`w-5 h-5 text-gray-400 transition-transform ${isAsignacionMateriaSelectorOpen ? 'rotate-180' : ''}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>

                                                        {/* Lista desplegable */}
                                                        {isAsignacionMateriaSelectorOpen && (
                                                            <div className="absolute z-50 w-full mt-1 border-2 border-gray-200 rounded-xl max-h-64 overflow-y-auto bg-white shadow-lg">
                                                                {/* Opción "Seleccionar materia" */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setAsignacionForm({ ...asignacionForm, materia_id: '' });
                                                                        setIsAsignacionMateriaSelectorOpen(false);
                                                                    }}
                                                                    className={`w-full text-left px-4 py-3 text-sm font-medium border-b border-gray-200 hover:bg-gray-50 transition-colors ${!asignacionForm.materia_id ? 'bg-green-50 border-green-300' : 'bg-white'}`}
                                                                >
                                                                    Seleccionar materia...
                                                                </button>

                                                                {/* Materias agrupadas por semestre */}
                                                                {(() => {
                                                                    // Filtrar materias
                                                                    const materiasFiltradas = materiasList.filter(m => {
                                                                        if (!filtroMateriaAsignacion) return true;
                                                                        const filtro = filtroMateriaAsignacion.toLowerCase();
                                                                        return m.nombre.toLowerCase().includes(filtro) ||
                                                                            (m.codigo && m.codigo.toLowerCase().includes(filtro));
                                                                    });

                                                                    // Agrupar por semestre
                                                                    const materiasPorSemestre: Record<number, typeof materiasFiltradas> = {};
                                                                    materiasFiltradas.forEach(materia => {
                                                                        const semestre = (materia.semestre && materia.semestre > 0) ? materia.semestre : 0;
                                                                        if (!materiasPorSemestre[semestre]) {
                                                                            materiasPorSemestre[semestre] = [];
                                                                        }
                                                                        materiasPorSemestre[semestre].push(materia);
                                                                    });

                                                                    // Ordenar semestres
                                                                    const semestresOrdenados = Object.keys(materiasPorSemestre)
                                                                        .map(Number)
                                                                        .filter(sem => sem > 0 && materiasPorSemestre[sem].length > 0)
                                                                        .sort((a, b) => a - b);

                                                                    if (semestresOrdenados.length === 0 && materiasFiltradas.length === 0) {
                                                                        return (
                                                                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                                                No hay materias disponibles
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return semestresOrdenados.map(semestre => (
                                                                        <div key={semestre}>
                                                                            {/* Título del Semestre */}
                                                                            <div className="sticky top-0 z-10 px-4 py-2 bg-purple-700 text-white border-b border-purple-800">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="w-6 h-6 bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold">
                                                                                        {semestre}
                                                                                    </span>
                                                                                    <span className="text-xs font-bold uppercase tracking-wide">
                                                                                        Semestre {semestre}
                                                                                    </span>
                                                                                    <span className="ml-auto text-xs opacity-90">
                                                                                        ({materiasPorSemestre[semestre].length})
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            {/* Materias del Semestre */}
                                                                            {materiasPorSemestre[semestre].map(materia => (
                                                                                <button
                                                                                    key={materia.id}
                                                                                    type="button"
                                                                                    onClick={() => setAsignacionForm({ ...asignacionForm, materia_id: materia.id.toString() })}
                                                                                    className={`w-full text-left px-4 py-2 text-sm font-medium border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center gap-2 ${asignacionForm.materia_id === materia.id.toString() ? 'bg-green-50 border-green-300' : 'bg-white'}`}
                                                                                >
                                                                                    <span className="font-semibold text-gray-900">{materia.nombre}</span>
                                                                                    {materia.codigo && (
                                                                                        <span className="text-xs text-gray-600">({materia.codigo})</span>
                                                                                    )}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    ));
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>
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
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-neutral-100 p-2 rounded-lg">
                                                        <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-neutral-900 font-bold text-xl">Reporte General de Promedios</h3>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <label className="text-sm font-semibold text-neutral-700">Filtrar por Semestre:</label>
                                                    <select
                                                        value={filtroSemestreGeneral}
                                                        onChange={(e) => setFiltroSemestreGeneral(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                                                        className="px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all"
                                                    >
                                                        <option value="todos">Todos los Semestres</option>
                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                                            <option key={sem} value={sem}>Semestre {sem}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto max-h-96 rounded-lg border border-neutral-200">
                                                <table className="min-w-full divide-y divide-neutral-200">
                                                    <thead className="bg-neutral-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">ID</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Alumno</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Grupo</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Semestre</th>
                                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Promedio</th>
                                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {reporteGlobal
                                                            .filter(r => {
                                                                if (!r || !r.alumno || !r.alumno.id) return false;
                                                                // Filtrar por semestre si está seleccionado
                                                                if (filtroSemestreGeneral !== 'todos') {
                                                                    const alumno = alumnosList.find(a => a.id === r.alumno.id);
                                                                    return alumno && alumno.semestre === filtroSemestreGeneral;
                                                                }
                                                                return true;
                                                            })
                                                            .slice(0, 10) // Limitar a 10 registros
                                                            .map(r => {
                                                                const alumno = alumnosList.find(a => a.id === r.alumno.id);
                                                                return (
                                                                    <tr key={r.alumno.id} className="hover:bg-neutral-50 transition-colors">
                                                                        <td className="px-4 py-3 text-sm text-gray-600">{r.alumno.id}</td>
                                                                        <td className="px-4 py-3 text-sm font-bold text-gray-900">{r.alumno.nombre}</td>
                                                                        <td className="px-4 py-3">
                                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-neutral-100 text-neutral-800">{r.alumno.grupo}</span>
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                                                                                {alumno?.semestre || 'N/A'}° Semestre
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right">
                                                                            <span className="text-lg font-bold text-purple-600">{r.promedio_general}</span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            <div className="flex items-center justify-center gap-2">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        if (alumno) {
                                                                                            openEditAlumno(alumno);
                                                                                        }
                                                                                    }}
                                                                                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                                                                    title="Editar alumno"
                                                                                >
                                                                                    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                    </svg>
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => openConfirmDeleteAlumno(r.alumno.id, r.alumno.nombre)}
                                                                                    className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                                                                    title="Eliminar alumno"
                                                                                >
                                                                                    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                    </tbody>
                                                </table>
                                                {reporteGlobal.filter(r => {
                                                    if (!r || !r.alumno || !r.alumno.id) return false;
                                                    if (filtroSemestreGeneral !== 'todos') {
                                                        const alumno = alumnosList.find(a => a.id === r.alumno.id);
                                                        return alumno && alumno.semestre === filtroSemestreGeneral;
                                                    }
                                                    return true;
                                                }).length > 10 && (
                                                        <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 text-center text-sm text-neutral-600">
                                                            Mostrando 10 de {reporteGlobal.filter(r => {
                                                                if (!r || !r.alumno || !r.alumno.id) return false;
                                                                if (filtroSemestreGeneral !== 'todos') {
                                                                    const alumno = alumnosList.find(a => a.id === r.alumno.id);
                                                                    return alumno && alumno.semestre === filtroSemestreGeneral;
                                                                }
                                                                return true;
                                                            }).length} alumnos
                                                        </div>
                                                    )}
                                            </div>
                                        </div>

                                        {/* Lista de Todos los Maestros */}
                                        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-neutral-100 p-2 rounded-lg">
                                                        <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-neutral-900 font-bold text-xl">Todos los Maestros ({maestrosList.length})</h3>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto max-h-96 rounded-lg border border-neutral-200">
                                                <table className="min-w-full divide-y divide-neutral-200">
                                                    <thead className="bg-neutral-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">ID</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Nombre</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Email</th>
                                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {maestrosList.map(m => (
                                                            <tr key={m.id} className="hover:bg-neutral-50 transition-colors">
                                                                <td className="px-4 py-3 text-sm text-gray-600">{m.id}</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-gray-900">{m.nombre}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-600">{m.email}</td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => openEditMaestro(m)}
                                                                            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                                                            title="Editar maestro"
                                                                        >
                                                                            <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Lista de Todas las Materias */}
                                        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-neutral-100 p-2 rounded-lg">
                                                        <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-neutral-900 font-bold text-xl">
                                                        Todas las Materias ({filtroSemestreGeneral !== 'todos'
                                                            ? materiasList.filter(m => m.semestre === filtroSemestreGeneral).length
                                                            : materiasList.length})
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <label className="text-sm font-semibold text-neutral-700">Filtrar por Semestre:</label>
                                                    <select
                                                        value={filtroSemestreGeneral}
                                                        onChange={(e) => setFiltroSemestreGeneral(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                                                        className="px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all"
                                                    >
                                                        <option value="todos">Todos los Semestres</option>
                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                                            <option key={sem} value={sem}>Semestre {sem}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto max-h-96 rounded-lg border border-neutral-200">
                                                <table className="min-w-full divide-y divide-neutral-200">
                                                    <thead className="bg-neutral-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">ID</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Código</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Nombre</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Semestre</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Descripción</th>
                                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {materiasList
                                                            .filter(m => {
                                                                if (filtroSemestreGeneral !== 'todos') {
                                                                    return m.semestre === filtroSemestreGeneral;
                                                                }
                                                                return true;
                                                            })
                                                            .map(m => (
                                                                <tr key={m.id} className="hover:bg-neutral-50 transition-colors">
                                                                    <td className="px-4 py-3 text-sm text-gray-600">{m.id}</td>
                                                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{m.codigo}</td>
                                                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{m.nombre}</td>
                                                                    <td className="px-4 py-3">
                                                                        <span className="px-2 py-1 text-xs font-semibold rounded-full 
                                                        
                                                        bg-purple-100 text-purple-700">
                                                                            {m.semestre || 'N/A'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={m.descripcion || ''}>
                                                                        {m.descripcion || '-'}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <button
                                                                                onClick={() => {
                                                                                    const materia = materiasList.find(mat => mat.id === m.id);
                                                                                    if (materia) {
                                                                                        openEditMateria(materia);
                                                                                    }
                                                                                }}
                                                                                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                                                                title="Editar materia"
                                                                            >
                                                                                <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                </svg>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => openConfirmDeleteMateria(m.id, m.nombre)}
                                                                                className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                                                                title="Eliminar materia"
                                                                            >
                                                                                <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Lista de Todos los Alumnos */}
                                        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-neutral-100 p-2 rounded-lg">
                                                        <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-neutral-900 font-bold text-xl">
                                                        Todos los Alumnos ({filtroSemestreGeneral !== 'todos'
                                                            ? alumnosList.filter(a => a.semestre === filtroSemestreGeneral).length
                                                            : alumnosList.length})
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <label className="text-sm font-semibold text-neutral-700">Filtrar por Semestre:</label>
                                                    <select
                                                        value={filtroSemestreGeneral}
                                                        onChange={(e) => setFiltroSemestreGeneral(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                                                        className="px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all"
                                                    >
                                                        <option value="todos">Todos los Semestres</option>
                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                                            <option key={sem} value={sem}>Semestre {sem}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                {alumnosList
                                                    .filter(a => {
                                                        if (filtroSemestreGeneral !== 'todos') {
                                                            return a.semestre === filtroSemestreGeneral;
                                                        }
                                                        return true;
                                                    })
                                                    .map(a => {
                                                        // Protección: si el alumno no existe en la lista actual, no renderizar
                                                        if (!a || !a.id) return null;

                                                        const detalle = alumnoDetalle[a.id];
                                                        const isLoading = loadingDetalle[a.id];
                                                        const materiasCursadas = detalle?.calificaciones?.length || 0;
                                                        const materiasCursando = detalle?.materias_cursando?.length || detalle?.total_materias_cursando || 0;
                                                        const promedioGeneral = detalle?.promedio_general || 0;
                                                        const materiasFaltantes = detalle ? Object.values(detalle.materias_por_semestre || {}).reduce((sum, s) => sum + (s?.faltantes?.length || 0), 0) : 0;

                                                        // Log de depuración para ver qué datos tiene cada alumno
                                                        if (detalle) {
                                                            console.log(`[AdminDashboard] Alumno ${a.id} (${a.nombre}):`, {
                                                                materiasCursando,
                                                                materiasCursadas,
                                                                total_materias_cursando: detalle.total_materias_cursando,
                                                                materias_cursando_array: detalle.materias_cursando?.length || 0,
                                                                calificaciones_count: detalle.calificaciones?.length || 0
                                                            });
                                                        }

                                                        return (
                                                            <div key={a.id} className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                                                {/* Header del Alumno */}
                                                                <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-4 flex-1">
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-3 mb-1">
                                                                                    <h4 className="text-base font-bold text-neutral-900">{a.nombre}</h4>
                                                                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-neutral-200 text-neutral-700">{a.grupo}</span>
                                                                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">{a.semestre || 'N/A'}° Semestre</span>
                                                                                </div>
                                                                                <p className="text-xs text-neutral-600">Matrícula: {a.matricula}</p>
                                                                            </div>
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="text-center">
                                                                                    <p className="text-xs text-neutral-500 mb-1">Promedio General</p>
                                                                                    <p className={`text-lg font-bold ${promedioGeneral >= 7 ? 'text-green-600' : promedioGeneral >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                                        {detalle ? promedioGeneral.toFixed(2) : '---'}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="text-center">
                                                                                    <p className="text-xs text-neutral-500 mb-1">Materias</p>

                                                                                    <p className="text-sm font-semibold text-blue-600">{materiasCursando} cursando</p>
                                                                                    <p className="text-xs text-neutral-600">{materiasFaltantes} faltantes</p>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            if (!detalle && !isLoading) {
                                                                                                console.log(`[AdminDashboard] Cargando detalle para alumno ${a.id} (${a.nombre})...`);
                                                                                                loadDetalleAlumno(a.id);
                                                                                            } else if (detalle) {
                                                                                                // Toggle: si ya está cargado, ocultar
                                                                                                console.log(`[AdminDashboard] Ocultando detalle para alumno ${a.id}`);
                                                                                                setAlumnoDetalle(prev => {
                                                                                                    const nuevo = { ...prev };
                                                                                                    delete nuevo[a.id];
                                                                                                    return nuevo;
                                                                                                });
                                                                                            }
                                                                                        }}
                                                                                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1"
                                                                                        title={detalle ? "Ocultar detalle" : "Ver detalle"}
                                                                                    >
                                                                                        {isLoading ? (
                                                                                            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                                                                            </svg>
                                                                                        ) : (
                                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={detalle ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                                                                                            </svg>
                                                                                        )}
                                                                                        {detalle ? 'Ocultar' : 'Detalle'}
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setSelectedAlumnoParaAsignar({ id: a.id, nombre: a.nombre });
                                                                                            setSelectedMateriasAsignacion([]);
                                                                                            setFiltroMateriaAsignacionAlumno('');
                                                                                            setFiltroSemestreAsignacionMateria('todos');
                                                                                            setIsAsignarMateriasOpen(true);
                                                                                        }}
                                                                                        className="px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                                                                        title="Asignar materias al alumno"
                                                                                    >
                                                                                        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                                        </svg>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => openEditAlumno(a)}
                                                                                        className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                                                                        title="Editar alumno"
                                                                                    >
                                                                                        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                        </svg>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => openConfirmDeleteAlumno(a.id, a.nombre)}
                                                                                        className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                                                                        title="Eliminar alumno"
                                                                                    >
                                                                                        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                        </svg>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Detalle Expandible */}
                                                                {detalle && (
                                                                    <div className="p-4 bg-white space-y-4 animate-fade-in container mx-auto justify-center items-center content-center w-full h-full">
                                                                        {/* Resumen General */}
                                                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                                            <div className="bg-neutral-50 p-3 rounded-lg text-center">
                                                                                <p className="text-xs text-neutral-500 mb-1">Promedio General</p>
                                                                                <p className={`text-xl font-bold ${promedioGeneral >= 7 ? 'text-green-600' : promedioGeneral >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                                    {promedioGeneral.toFixed(2)}
                                                                                </p>
                                                                            </div>
                                                                            <div className="bg-neutral-50 p-3 rounded-lg text-center border-2 border-blue-200 bg-blue-50/30">
                                                                                <p className="text-xs text-neutral-500 mb-1 font-semibold"> Materias Cursando</p>
                                                                                <p className="text-xl font-bold text-blue-600">{materiasCursando}</p>
                                                                                <p className="text-xs text-blue-600 mt-0.5 font-medium">
                                                                                    {detalle?.materias_cursando?.filter(m => m.activa === 1).length || 0} activas
                                                                                </p>
                                                                            </div>

                                                                            <div className="bg-neutral-50 p-3 rounded-lg text-center">
                                                                                <p className="text-xs text-neutral-500 mb-1">Materias Faltantes</p>
                                                                                <p className="text-xl font-bold text-orange-600">{materiasFaltantes}</p>
                                                                            </div>
                                                                            <div className="bg-neutral-50 p-3 rounded-lg text-center">
                                                                                <p className="text-xs text-neutral-500 mb-1">Semestre Actual</p>
                                                                                <p className="text-xl font-bold text-purple-600">{detalle.alumno.semestre_actual}</p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Materias por Semestre */}
                                                                        {Object.keys(detalle.materias_por_semestre)
                                                                            .sort((a, b) => parseInt(a) - parseInt(b))
                                                                            .map(semStr => {
                                                                                const sem = parseInt(semStr);
                                                                                const datosSemestre = detalle.materias_por_semestre[sem];
                                                                                const { cursadas, cursando, faltantes, promedio_semestre } = datosSemestre;

                                                                                if (cursadas.length === 0 && (cursando?.length || 0) === 0 && faltantes.length === 0) return null;

                                                                                return (
                                                                                    <div key={sem} className="border border-neutral-200 rounded-lg overflow-hidden">
                                                                                        <div className="bg-neutral-100 px-4 py-2 border-b border-neutral-200 flex items-center justify-between">
                                                                                            <h5 className="text-sm font-bold text-neutral-900">Semestre {sem}</h5>
                                                                                            {promedio_semestre > 0 && (
                                                                                                <span className={`px-2 py-1 text-xs font-bold rounded ${promedio_semestre >= 7 ? 'bg-green-100 text-green-700' :
                                                                                                    promedio_semestre >= 6 ? 'bg-yellow-100 text-yellow-700' :
                                                                                                        'bg-red-100 text-red-700'
                                                                                                    }`}>
                                                                                                    Promedio: {promedio_semestre.toFixed(2)}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="p-3 space-y-3">
                                                                                            {/* Materias Cursando (Activas) */}
                                                                                            {cursando && cursando.length > 0 && (
                                                                                                <div>
                                                                                                    <p className="text-xs font-semibold text-blue-700 uppercase mb-2 flex items-center gap-2">
                                                                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">ACTIVAS</span>
                                                                                                        Materias Cursando ({cursando.length})
                                                                                                    </p>
                                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                                                                                        {cursando.map((calif: {
                                                                                                            materia: { id: number; nombre: string; codigo: string; semestre: number };
                                                                                                            maestro: { id: number; nombre: string } | null;
                                                                                                            unidades: Array<{ unidad: number; nota: number; observaciones?: string }>;
                                                                                                            promedio_materia: number;
                                                                                                            activa?: number;
                                                                                                            cursando?: boolean;
                                                                                                        }) => {
                                                                                                            const activa = calif.activa === 1;
                                                                                                            return (
                                                                                                                <div key={calif.materia.id} className={`border-2 rounded p-2 ${activa ? 'border-blue-300 bg-blue-50/30' : 'border-neutral-200 bg-neutral-50'}`}>
                                                                                                                    <div className="flex items-start justify-between mb-1">
                                                                                                                        <div className="flex-1">
                                                                                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                                                                                <p className="text-xs font-bold text-neutral-900">{calif.materia.nombre}</p>
                                                                                                                                <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${activa ? 'bg-blue-200 text-blue-800' : 'bg-neutral-200 text-neutral-600'}`}>
                                                                                                                                    {activa ? 'ACTIVA (1)' : 'INACTIVA (0)'}
                                                                                                                                </span>
                                                                                                                                <p className="text-xs text-neutral-600">{calif.materia.codigo}</p>
                                                                                                                            </div>
                                                                                                                            {calif.maestro && (
                                                                                                                                <p className="text-xs text-neutral-500">Maestro: {calif.maestro.nombre}</p>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                        {calif.promedio_materia > 0 && (
                                                                                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${calif.promedio_materia >= 7 ? 'bg-green-200 text-green-800' :
                                                                                                                                calif.promedio_materia >= 6 ? 'bg-yellow-200 text-yellow-800' :
                                                                                                                                    'bg-red-200 text-red-800'
                                                                                                                                }`}>
                                                                                                                                {calif.promedio_materia.toFixed(2)}
                                                                                                                            </span>
                                                                                                                        )}
                                                                                                                        {calif.promedio_materia === 0 && activa && (
                                                                                                                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                                                                                                                Sin calificaciones
                                                                                                                            </span>
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                    {calif.unidades && calif.unidades.length > 0 && (
                                                                                                                        <div className="mt-1 flex gap-1 flex-wrap">
                                                                                                                            {calif.unidades.map((u: { unidad: number; nota: number; observaciones?: string }) => (
                                                                                                                                <span key={u.unidad} className={`text-xs px-1.5 py-0.5 rounded ${u.nota > 0 ? (
                                                                                                                                    u.nota >= 7 ? 'bg-green-200 text-green-800' :
                                                                                                                                        u.nota >= 6 ? 'bg-yellow-200 text-yellow-800' :
                                                                                                                                            'bg-red-200 text-red-800'
                                                                                                                                ) : 'bg-neutral-200 text-neutral-500'}`} title={`Unidad ${u.unidad}: ${u.nota.toFixed(1)}${u.observaciones ? ` - ${u.observaciones}` : ''}`}>
                                                                                                                                    U{u.unidad}: {u.nota > 0 ? u.nota.toFixed(1) : '0.0'}
                                                                                                                                </span>
                                                                                                                            ))}
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            );
                                                                                                        })}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}


                                                                                            {/* Materias Faltantes */}
                                                                                            {faltantes.length > 0 && (
                                                                                                <div>
                                                                                                    <p className="text-xs font-semibold text-orange-700 uppercase mb-2">⚠ Materias Faltantes ({faltantes.length})</p>
                                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                                                        {faltantes.map(item => (
                                                                                                            <div key={item.materia.id} className="bg-orange-50 border border-orange-200 border-dashed rounded p-2">
                                                                                                                <p className="text-xs font-semibold text-neutral-900">{item.materia.nombre}</p>
                                                                                                                <p className="text-xs text-neutral-600">{item.materia.codigo}</p>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>

                                        {/* Lista de Todas las Materias */}
                                        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-neutral-100 p-2 rounded-lg">
                                                        <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-neutral-900 font-bold text-xl">Todas las Materias ({materiasList.length})</h3>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto max-h-96 rounded-lg border border-neutral-200">
                                                <table className="min-w-full divide-y divide-neutral-200">
                                                    <thead className="bg-neutral-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">ID</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Código</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Nombre</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Semestre</th>
                                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {materiasList.map(m => (
                                                            <tr key={m.id} className="hover:bg-neutral-50 transition-colors">
                                                                <td className="px-4 py-3 text-sm text-gray-600">{m.id}</td>
                                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.codigo}</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-gray-900">{m.nombre}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-neutral-100 text-neutral-800">Semestre {m.semestre || 'N/A'}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedMateriaId(m.id);
                                                                                openEditMateria(m);
                                                                            }}
                                                                            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                                                            title="Editar materia"
                                                                        >
                                                                            <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                            </svg>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openConfirmDeleteMateria(m.id, m.nombre)}
                                                                            className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                                                            title="Eliminar materia"
                                                                        >
                                                                            <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
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
                                                        <label className="block text-sm font-bold text-neutral-700 mb-2">Unidad</label>
                                                        <select
                                                            value={selectedUnidadEdit}
                                                            onChange={(e) => setSelectedUnidadEdit(parseInt(e.target.value))}
                                                            className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all"
                                                        >
                                                            {Array.from({ length: 5 }, (_, i) => i + 1).map(u => (
                                                                <option key={u} value={u}>Unidad {u}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-neutral-700 mb-2">Nota (0 - 10)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max="10"
                                                            value={editNota}
                                                            onChange={e => setEditNota(e.target.value)}
                                                            className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-neutral-700 mb-2">Observaciones</label>
                                                        <textarea
                                                            rows={4}
                                                            value={editObs}
                                                            onChange={e => setEditObs(e.target.value)}
                                                            className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all"
                                                        />
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

                                {/* Modal Confirmar Eliminar Alumno */}
                                {isConfirmDeleteAlumnoOpen && deleteAlumnoMeta && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
                                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
                                            <div className="p-6 text-center">
                                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                                    <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar Alumno?</h3>
                                                <p className="text-sm text-gray-600 mb-2">Estás a punto de eliminar al alumno:</p>
                                                <p className="text-sm font-semibold text-gray-900 mb-6">{deleteAlumnoMeta.nombre}</p>
                                                <p className="text-xs text-red-600 mb-6">Esta acción eliminará también todas sus calificaciones asociadas. Esta acción no se puede deshacer.</p>
                                            </div>
                                            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                                                <button onClick={() => setIsConfirmDeleteAlumnoOpen(false)} className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all">Cancelar</button>
                                                <button onClick={handleDeleteAlumno} disabled={deletingAlumno} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50">
                                                    {deletingAlumno ? 'Eliminando...' : 'Eliminar Alumno'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Modal Confirmar Eliminar Materia */}
                                {isConfirmDeleteMateriaOpen && deleteMateriaMeta && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
                                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
                                            <div className="p-6 text-center">
                                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                                    <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar Materia?</h3>
                                                <p className="text-sm text-gray-600 mb-2">Estás a punto de eliminar la materia:</p>
                                                <p className="text-sm font-semibold text-gray-900 mb-6">{deleteMateriaMeta.nombre}</p>
                                                <p className="text-xs text-red-600 mb-6">Esta acción eliminará también todas las calificaciones y asignaciones asociadas. Esta acción no se puede deshacer.</p>
                                            </div>
                                            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                                                <button onClick={() => setIsConfirmDeleteMateriaOpen(false)} className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all">Cancelar</button>
                                                <button onClick={handleDeleteMateria} disabled={deletingMateria} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50">
                                                    {deletingMateria ? 'Eliminando...' : 'Eliminar Materia'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Modal Editar Materia */}
                                {isEditMateriaOpen && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                                            <div className="bg-neutral-900 text-white p-6 rounded-t-xl">
                                                <h3 className="text-xl font-bold flex items-center gap-2">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Editar Materia
                                                </h3>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                                                        <input
                                                            type="text"
                                                            value={editMateriaForm.nombre || ''}
                                                            onChange={(e) => setEditMateriaForm({ ...editMateriaForm, nombre: e.target.value })}
                                                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="Ej: Matemáticas Avanzadas"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Código *</label>
                                                        <input
                                                            type="text"
                                                            value={editMateriaForm.codigo || ''}
                                                            onChange={(e) => setEditMateriaForm({ ...editMateriaForm, codigo: e.target.value })}
                                                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="Ej: MAT101"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                                                    <textarea
                                                        value={editMateriaForm.descripcion || ''}
                                                        onChange={(e) => setEditMateriaForm({ ...editMateriaForm, descripcion: e.target.value })}
                                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        rows={2}
                                                        placeholder="Descripción opcional de la materia"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Semestre *</label>
                                                    <select
                                                        value={editMateriaForm.semestre || 1}
                                                        onChange={(e) => setEditMateriaForm({ ...editMateriaForm, semestre: parseInt(e.target.value) })}
                                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    >
                                                        {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                                                            <option key={sem} value={sem}>{sem}° Semestre</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                                                <button
                                                    onClick={() => setIsEditMateriaOpen(false)}
                                                    className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleEditMateria}
                                                    disabled={savingEditMateria || !editMateriaForm.nombre || !editMateriaForm.codigo}
                                                    className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                                                >
                                                    {savingEditMateria ? 'Guardando...' : 'Guardar Cambios'}
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
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Semestre *</label>
                                                    <select
                                                        value={materiaForm.semestre || 1}
                                                        onChange={(e) => setMateriaForm({ ...materiaForm, semestre: parseInt(e.target.value) })}
                                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    >
                                                        {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                                                            <option key={sem} value={sem}>{sem}° Semestre</option>
                                                        ))}
                                                    </select>
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
                                                        setMateriaForm({ nombre: '', codigo: '', descripcion: '', maestro_id: undefined, cupo_maximo: 40, semestre: 1 });
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

                                {/* Modal Editar Maestro */}
                                {isEditMaestroOpen && selectedMaestroId && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                                            <div className="bg-neutral-900 text-white p-6 rounded-t-xl">
                                                <h3 className="text-xl font-bold flex items-center gap-2">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Editar Maestro
                                                </h3>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                                                    <input
                                                        type="text"
                                                        value={editMaestroForm.nombre || ''}
                                                        onChange={(e) => setEditMaestroForm({ ...editMaestroForm, nombre: e.target.value })}
                                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="Nombre del maestro"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                                    <input
                                                        type="email"
                                                        value={editMaestroForm.email || ''}
                                                        onChange={(e) => setEditMaestroForm({ ...editMaestroForm, email: e.target.value })}
                                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="email@ejemplo.com"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña (Opcional)</label>
                                                    <input
                                                        type="password"
                                                        value={editMaestroForm.password || ''}
                                                        onChange={(e) => setEditMaestroForm({ ...editMaestroForm, password: e.target.value })}
                                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="Dejar vacío para no cambiar"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Solo completa si deseas cambiar la contraseña</p>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                                                <button
                                                    onClick={() => setIsEditMaestroOpen(false)}
                                                    className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleEditMaestro}
                                                    disabled={savingEditMaestro || !editMaestroForm.nombre || !editMaestroForm.email}
                                                    className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                                                >
                                                    {savingEditMaestro ? 'Guardando...' : 'Guardar Cambios'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Modal Editar Alumno */}
                                {isEditAlumnoOpen && selectedAlumnoId && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                                            <div className="bg-neutral-900 text-white p-6 rounded-t-xl">
                                                <h3 className="text-xl font-bold flex items-center gap-2">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Editar Alumno
                                                </h3>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                                                        <input
                                                            type="text"
                                                            value={editAlumnoForm.nombre || ''}
                                                            onChange={(e) => setEditAlumnoForm({ ...editAlumnoForm, nombre: e.target.value })}
                                                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="Nombre del alumno"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Matrícula *</label>
                                                        <input
                                                            type="text"
                                                            value={editAlumnoForm.matricula || ''}
                                                            onChange={(e) => setEditAlumnoForm({ ...editAlumnoForm, matricula: e.target.value })}
                                                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="Matrícula"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Grupo *</label>
                                                        <input
                                                            type="text"
                                                            value={editAlumnoForm.grupo || ''}
                                                            onChange={(e) => setEditAlumnoForm({ ...editAlumnoForm, grupo: e.target.value })}
                                                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="Grupo"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Semestre *</label>
                                                        <select
                                                            value={editAlumnoForm.semestre || 1}
                                                            onChange={(e) => setEditAlumnoForm({ ...editAlumnoForm, semestre: parseInt(e.target.value) })}
                                                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        >
                                                            {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                                                                <option key={sem} value={sem}>{sem}° Semestre</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
                                                    <input
                                                        type="date"
                                                        value={editAlumnoForm.fecha_nacimiento || ''}
                                                        onChange={(e) => setEditAlumnoForm({ ...editAlumnoForm, fecha_nacimiento: e.target.value })}
                                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vincular Usuario (Opcional)</label>
                                                    <select
                                                        value={editAlumnoForm.usuario_id || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setEditAlumnoForm({
                                                                ...editAlumnoForm,
                                                                usuario_id: value === '' ? undefined : (value === 'null' ? null : parseInt(value))
                                                            });
                                                        }}
                                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        disabled={loadingUsuariosAlumnos}
                                                    >
                                                        <option value="">-- Sin vincular --</option>
                                                        {loadingUsuariosAlumnos ? (
                                                            <option>Cargando usuarios...</option>
                                                        ) : (
                                                            usuariosAlumnosDisponibles.map(usuario => (
                                                                <option key={usuario.id} value={usuario.id}>
                                                                    {usuario.nombre} ({usuario.email})
                                                                </option>
                                                            ))
                                                        )}
                                                    </select>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Selecciona un usuario con rol ALUMNO para vincularlo a este registro de alumno.
                                                        Esto permitirá que el usuario inicie sesión y vea sus calificaciones.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                                                <button
                                                    onClick={() => setIsEditAlumnoOpen(false)}
                                                    className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleEditAlumno}
                                                    disabled={savingEditAlumno || !editAlumnoForm.nombre || !editAlumnoForm.matricula || !editAlumnoForm.grupo}
                                                    className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                                                >
                                                    {savingEditAlumno ? 'Guardando...' : 'Guardar Cambios'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Modal Asignar Materias a Alumno */}
                                {isAsignarMateriasOpen && selectedAlumnoParaAsignar && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                                            <div className="bg-neutral-900 text-white p-6">
                                                <h3 className="text-xl font-bold flex items-center gap-2">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    Asignar Materias a {selectedAlumnoParaAsignar.nombre}
                                                </h3>
                                            </div>
                                            <div className="p-6 overflow-y-auto flex-1">
                                                {/* Filtros */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Buscar Materia</label>
                                                        <input
                                                            type="text"
                                                            value={filtroMateriaAsignacionAlumno}
                                                            onChange={(e) => setFiltroMateriaAsignacionAlumno(e.target.value)}
                                                            placeholder="Buscar por nombre, código..."
                                                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Filtrar por Semestre</label>
                                                        <select
                                                            value={filtroSemestreAsignacionMateria}
                                                            onChange={(e) => setFiltroSemestreAsignacionMateria(e.target.value)}
                                                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        >
                                                            <option value="todos">Todos los semestres</option>
                                                            {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                                                                <option key={sem} value={sem.toString()}>{sem}° Semestre</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Lista de Materias */}
                                                <div className="border-2 border-gray-200 rounded-lg p-3 max-h-96 overflow-y-auto">
                                                    {(() => {
                                                        // Obtener materias ya cursadas por el alumno
                                                        const detalle = alumnoDetalle[selectedAlumnoParaAsignar.id];
                                                        const materiasCursadasIds = detalle?.calificaciones?.map(c => c.materia.id) || [];

                                                        // Filtrar materias
                                                        const materiasFiltradas = materiasList.filter(materia => {
                                                            // Filtro de texto
                                                            if (filtroMateriaAsignacionAlumno) {
                                                                const filtro = filtroMateriaAsignacionAlumno.toLowerCase();
                                                                const cumpleTexto = materia.nombre.toLowerCase().includes(filtro) ||
                                                                    (materia.codigo && materia.codigo.toLowerCase().includes(filtro));
                                                                if (!cumpleTexto) return false;
                                                            }

                                                            // Filtro de semestre
                                                            if (filtroSemestreAsignacionMateria && filtroSemestreAsignacionMateria !== 'todos') {
                                                                const semestreFiltro = parseInt(filtroSemestreAsignacionMateria);
                                                                if (materia.semestre !== semestreFiltro) return false;
                                                            }

                                                            return true;
                                                        });

                                                        if (materiasList.length === 0) {
                                                            return (
                                                                <p className="text-sm text-gray-500 text-center py-4">
                                                                    No hay materias disponibles. Crea materias primero.
                                                                </p>
                                                            );
                                                        }

                                                        if (materiasFiltradas.length === 0) {
                                                            return (
                                                                <p className="text-sm text-gray-500 text-center py-4">
                                                                    No se encontraron materias con ese criterio
                                                                </p>
                                                            );
                                                        }

                                                        // Agrupar materias por semestre
                                                        const materiasPorSemestre: Record<number, typeof materiasFiltradas> = {};
                                                        materiasFiltradas.forEach(materia => {
                                                            // Asegurar que el semestre existe, si no usar 0 como fallback
                                                            const semestre = (materia.semestre && materia.semestre > 0) ? materia.semestre : 0;
                                                            if (!materiasPorSemestre[semestre]) {
                                                                materiasPorSemestre[semestre] = [];
                                                            }
                                                            materiasPorSemestre[semestre].push(materia);
                                                        });

                                                        // Ordenar semestres (solo los que tienen materias y son mayores a 0)
                                                        const semestresOrdenados = Object.keys(materiasPorSemestre)
                                                            .map(Number)
                                                            .filter(sem => sem > 0 && materiasPorSemestre[sem].length > 0)
                                                            .sort((a, b) => a - b);

                                                        // Si hay materias sin semestre (semestre 0), agregarlas al final
                                                        if (materiasPorSemestre[0] && materiasPorSemestre[0].length > 0) {
                                                            semestresOrdenados.push(0);
                                                        }

                                                        if (semestresOrdenados.length === 0) {
                                                            return (
                                                                <p className="text-sm text-gray-500 text-center py-4">
                                                                    No hay materias disponibles para mostrar.
                                                                </p>
                                                            );
                                                        }

                                                        console.log('[Modal Asignar Materias] Semestres ordenados:', semestresOrdenados);
                                                        console.log('[Modal Asignar Materias] Materias por semestre:', materiasPorSemestre);

                                                        return (
                                                            <div className="space-y-5">
                                                                {semestresOrdenados.map(semestre => (
                                                                    <div key={semestre} className="mb-5">
                                                                        {/* Título del Semestre */}
                                                                        <div className="mb-3 px-4 py-3 bg-purple-700 text-white rounded-lg shadow-lg border-l-4 border-purple-900">
                                                                            <h4 className="text-base font-extrabold uppercase tracking-wide flex items-center gap-2">
                                                                                <span className="w-8 h-8 bg-purple-900 rounded-full flex items-center justify-center text-sm font-bold">
                                                                                    {semestre}
                                                                                </span>
                                                                                Semestre {semestre}
                                                                                <span className="ml-auto text-xs font-normal opacity-90">
                                                                                    ({materiasPorSemestre[semestre].length} materias)
                                                                                </span>
                                                                            </h4>
                                                                        </div>
                                                                        {/* Materias del Semestre */}
                                                                        <div className="space-y-2 ml-2">
                                                                            {materiasPorSemestre[semestre].map(materia => {
                                                                                const yaCursada = materiasCursadasIds.includes(materia.id);
                                                                                const isSelected = selectedMateriasAsignacion.includes(materia.id);

                                                                                return (
                                                                                    <label
                                                                                        key={materia.id}
                                                                                        className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors ${yaCursada
                                                                                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                                                                                            : isSelected
                                                                                                ? 'bg-indigo-50 border-indigo-300 cursor-pointer'
                                                                                                : 'bg-white border-gray-200 hover:bg-gray-50 cursor-pointer'
                                                                                            }`}
                                                                                    >
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={isSelected}
                                                                                            disabled={yaCursada}
                                                                                            onChange={(e) => {
                                                                                                if (yaCursada) return;
                                                                                                if (e.target.checked) {
                                                                                                    setSelectedMateriasAsignacion([...selectedMateriasAsignacion, materia.id]);
                                                                                                } else {
                                                                                                    setSelectedMateriasAsignacion(selectedMateriasAsignacion.filter(id => id !== materia.id));
                                                                                                }
                                                                                            }}
                                                                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                                                        />
                                                                                        <div className="flex-1">
                                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                                <span className="font-semibold text-gray-900">{materia.nombre}</span>
                                                                                                {materia.codigo && (
                                                                                                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                                                                                                        {materia.codigo}
                                                                                                    </span>
                                                                                                )}
                                                                                                {yaCursada && (
                                                                                                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                                                                                        Ya cursada
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            {materia.descripcion && (
                                                                                                <p className="text-xs text-gray-500 mt-1">{materia.descripcion}</p>
                                                                                            )}
                                                                                        </div>
                                                                                    </label>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Resumen de selección */}
                                                {selectedMateriasAsignacion.length > 0 && (
                                                    <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                                                        <p className="text-sm font-semibold text-indigo-900">
                                                            {selectedMateriasAsignacion.length} materia(s) seleccionada(s)
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                                                <button
                                                    onClick={() => {
                                                        setIsAsignarMateriasOpen(false);
                                                        setSelectedMateriasAsignacion([]);
                                                        setFiltroMateriaAsignacionAlumno('');
                                                        setFiltroSemestreAsignacionMateria('todos');
                                                    }}
                                                    className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleAsignarMateriasAAlumno}
                                                    disabled={savingAsignacionMaterias || selectedMateriasAsignacion.length === 0}
                                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {savingAsignacionMaterias ? 'Asignando...' : `Asignar ${selectedMateriasAsignacion.length > 0 ? `(${selectedMateriasAsignacion.length})` : ''}`}
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