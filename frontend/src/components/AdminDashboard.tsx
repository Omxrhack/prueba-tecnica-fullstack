import React, { useState, useEffect, useCallback } from 'react';
import {
    getReporteGlobal,
    updateCalificacionAdmin,
    deleteCalificacionAdmin,
    asignarMateriaMaestro,
} from '../services/admin.service';
import { getMaterias, getMaestros } from '../services/general.service';
import type { Materia, User } from '../types';
import type { ReporteItem, } from '../services/admin.service';
import type { MaestroListItem } from '../services/general.service';

// --- Componentes Auxiliares ---
const Spinner: React.FC = () => (
    <div className="flex items-center justify-center p-6">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
    </div>
);

// Definición de tipo para la lista de calificaciones por materia (para simulación)
interface MateriaCalificacion {
    alumno: { id: number; nombre: string; matricula: string; grupo: string };
    nota: number;
    observaciones: string;
    maestro: { id: number; nombre: string };
}

// SIMULACIÓN: Función temporal para obtener calificaciones individuales por materia
// Nota: Este endpoint no fue implementado en el Backend (GET /maestro/alumnos/{materiaID}),
// por lo que usamos datos fijos para que la UI funcione.
const getCalificacionesByMateria = async (materiaID: number): Promise<MateriaCalificacion[]> => {
    // Usamos las notas en escala 0-10 para la UI
    if (materiaID === 1) {
        return [
            { alumno: { id: 1, nombre: 'Raúl Castro', matricula: 'A1001', grupo: 'A' }, nota: 9.55, observaciones: 'Excelente', maestro: { id: 2, nombre: 'Juan Pérez' } },
            { alumno: { id: 2, nombre: 'Sofía García', matricula: 'A1002', grupo: 'A' }, nota: 8.80, observaciones: 'Buen trabajo', maestro: { id: 2, nombre: 'Juan Pérez' } },
            { alumno: { id: 3, nombre: 'Luis Hernández', matricula: 'B2001', grupo: 'B' }, nota: 7.00, observaciones: 'Aprobado', maestro: { id: 2, nombre: 'Juan Pérez' } },
        ];
    }
    return [];
};
// ---------------------------------------------------------------------------------


const AdminDashboard: React.FC = () => {
    const [reporteGlobal, setReporteGlobal] = useState<ReporteItem[]>([]);
    const [materiasList, setMateriasList] = useState<Materia[]>([]);
    const [maestrosList, setMaestrosList] = useState<MaestroListItem[]>([]);

    const [selectedMateriaId, setSelectedMateriaId] = useState<number | null>(null);
    const [calificacionesMateria, setCalificacionesMateria] = useState<MateriaCalificacion[] | null>(null);
    const [maestroAsignado, setMaestroAsignado] = useState<User | null>(null);

    const [loading, setLoading] = useState(true);
    const [gestionError, setGestionError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Formulario de Asignación
    const [asignacionForm, setAsignacionForm] = useState({
        maestro_id: '',
        materia_id: '',
        cupo_maximo: 40,
    });
    const [asignacionSaving, setAsignacionSaving] = useState(false);

    // Modales y Edición
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editMeta, setEditMeta] = useState<{ alumnoID: number; currentNota: number; currentObs: string } | null>(null);
    const [editNota, setEditNota] = useState('');
    const [editObs, setEditObs] = useState('');
    const [saving, setSaving] = useState(false);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteMeta, setDeleteMeta] = useState<{ alumnoID: number } | null>(null);
    const [deleting, setDeleting] = useState(false);


    const loadData = useCallback(async () => {
        setLoading(true);
        setGestionError(null);
        setSuccessMsg(null);

        try {
            const [reporteData, materiasData, maestrosData] = await Promise.all([
                getReporteGlobal(),
                getMaterias(), // GET /api/materias
                getMaestros() // GET /api/usuarios/list
            ]);
            setReporteGlobal(reporteData);
            setMateriasList(materiasData);
            setMaestrosList(maestrosData);

            if (selectedMateriaId) {
                // Llama a la simulación para obtener calificaciones por la materia seleccionada
                const calificacionesData = await getCalificacionesByMateria(selectedMateriaId);
                setCalificacionesMateria(calificacionesData);

                // Determina el maestro asignado basado en las calificaciones de prueba
                if (calificacionesData.length > 0) {
                    const maestro = maestrosData.find(m => m.id === calificacionesData[0].maestro.id);
                    if (maestro) setMaestroAsignado(maestro);
                } else {
                    setMaestroAsignado(null);
                }
            } else {
                setCalificacionesMateria(null);
                setMaestroAsignado(null);
            }

        } catch (e: any) {
            // Captura errores de red o del servidor en las llamadas iniciales
            setGestionError('Error al cargar datos iniciales. Verifique la API (/materias, /usuarios/list).');
        } finally {
            setLoading(false);
        }
    }, [selectedMateriaId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- Lógica de Asignación ---
    const handleMateriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = Number(e.target.value);
        setSelectedMateriaId(id === 0 ? null : id);
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
            setSuccessMsg('Asignación de materia realizada con éxito.');
            setAsignacionForm({ maestro_id: '', materia_id: '', cupo_maximo: 40 });
            loadData(); // Recargar datos si la asignación afecta el display
        } catch (e: any) {
            const msg = e?.response?.data?.message || 'Error desconocido al asignar';
            setGestionError('Error en la asignación: ' + msg);
        } finally {
            setAsignacionSaving(false);
        }
    };

    // --- Modal Edit Logic ---
    const openEdit = (item: MateriaCalificacion) => {
        if (!selectedMateriaId) return;
        setEditMeta({ alumnoID: item.alumno.id, currentNota: item.nota, currentObs: item.observaciones });
        setEditNota(item.nota.toString());
        setEditObs(item.observaciones);
        setGestionError(null);
        setSuccessMsg(null);
        setIsEditOpen(true);
    };

    const closeEdit = () => setIsEditOpen(false);

    const handleSaveEdit = async () => {
        if (!editMeta || !selectedMateriaId) return;
        const parsed = parseFloat(editNota);

        // **VALIDACIÓN 0-10**
        if (isNaN(parsed) || parsed < 0 || parsed > 10) {
            setGestionError('La nota debe ser un número entre 0 y 10.');
            return;
        }

        setSaving(true);
        setGestionError(null);
        try {
            await updateCalificacionAdmin(selectedMateriaId, editMeta.alumnoID, parsed, editObs);
            setSuccessMsg('Calificación actualizada con éxito.');
            closeEdit();
            await loadData();
        } catch (e: any) {
            const msg = e?.response?.data?.message || 'Error desconocido';
            setGestionError('Error al actualizar: ' + msg);
        } finally {
            setSaving(false);
        }
    };

    // --- Modal Delete Logic ---
    const openConfirmDelete = (alumnoID: number) => {
        if (!selectedMateriaId) return;
        setDeleteMeta({ alumnoID });
        setGestionError(null);
        setSuccessMsg(null);
        setIsConfirmOpen(true);
    };

    const closeConfirm = () => setIsConfirmOpen(false);

    const handleDelete = async () => {
        if (!deleteMeta || !selectedMateriaId) return;
        setDeleting(true);
        setGestionError(null);
        try {
            await deleteCalificacionAdmin(selectedMateriaId, deleteMeta.alumnoID);
            setSuccessMsg('Calificación eliminada correctamente.');
            closeConfirm();
            await loadData();
        } catch (e: any) {
            const msg = e?.response?.data?.message || 'Error desconocido';
            setGestionError('Error al eliminar: ' + msg);
        } finally {
            setDeleting(false);
        }
    };


    // Renderizado de la vista filtrada por materia
    const renderMateriaView = () => {
        if (loading) return <Spinner />;
        if (!selectedMateriaId) return <div className="text-center p-10 text-gray-500 bg-gray-50 rounded-lg shadow-sm">Selecciona una materia para gestionar las calificaciones.</div>;

        const materia = materiasList.find(m => m.id === selectedMateriaId);
        if (!materia) return <div className="p-4 text-red-700 bg-red-100 rounded-lg">Materia ID no válida.</div>;

        return (
            <div className="bg-white p-6 rounded-lg shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                    Gestión de Calificaciones: {materia.nombre} ({materia.codigo})
                </h2>

                {/* Info Maestro Asignado */}
                <div className="mb-6 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800">
                    <p className="font-semibold">Maestro Asignado:</p>
                    <p>{maestroAsignado?.nombre || 'N/A'}</p>
                    <p className="text-sm">ID: {maestroAsignado?.id || 'Sin Calificaciones'}</p>
                </div>

                {/* Tabla de Calificaciones por Materia */}
                <h3 className="text-lg font-semibold mb-3">Calificaciones Individuales</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border-collapse">
                        <thead>
                            <tr className="bg-gray-800 text-white text-left">
                                <th className="px-4 py-2">Alumno</th>
                                <th className="px-4 py-2">Matrícula</th>
                                <th className="px-4 py-2">Nota (0-10)</th>
                                <th className="px-4 py-2">Observaciones</th>
                                <th className="px-4 py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calificacionesMateria && calificacionesMateria.map((item) => (
                                <tr key={item.alumno.id} className="odd:bg-white even:bg-gray-50 border-b">
                                    <td className="px-4 py-3 font-medium">{item.alumno.nombre}</td>
                                    <td className="px-4 py-3 text-gray-600">{item.alumno.matricula}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-sm ${item.nota >= 7 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {item.nota.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{item.observaciones || '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                className="px-3 py-1 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm"
                                                onClick={() => openEdit(item)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                className="px-3 py-1 rounded-md border border-red-600 text-red-600 hover:bg-red-50 text-sm"
                                                onClick={() => openConfirmDelete(item.alumno.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {calificacionesMateria?.length === 0 && (
                        <p className="p-4 text-center text-gray-500 border-t">No hay calificaciones registradas para esta materia.</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Panel de Control Escolar</h1>
                <p className="text-gray-500">Gestión de calificaciones, asignaciones y reportes.</p>
            </div>

            {/* Mensajes */}
            {gestionError && <div className="my-4 p-3 bg-amber-50 text-amber-800 rounded">{gestionError}</div>}
            {successMsg && <div className="my-4 p-3 bg-green-50 text-green-800 rounded">{successMsg}</div>}

            {/* Control de Filtrado */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center gap-4">
                <label className="text-gray-700 font-medium whitespace-nowrap">Gestionar Materia:</label>
                <select
                    className="flex-1 border rounded px-3 py-2"
                    onChange={handleMateriaChange}
                    value={selectedMateriaId || 0}
                    disabled={loading}
                >
                    <option value={0}>— Selecciona una Materia —</option>
                    {materiasList.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>
                    ))}
                </select>
                <button
                    className="px-4 py-2 rounded-lg bg-red-600 text-white shadow hover:bg-red-700"
                    onClick={loadData}
                    disabled={loading}
                >
                    Recargar Datos
                </button>
            </div>

            {/* Vista Principal (Gestión por Materia) */}
            {renderMateriaView()}

            {/* Formulario de Asignación */}
            <div className="bg-white p-6 rounded-lg shadow-xl mt-8">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                    Asignación de Materias a Maestros
                </h2>
                <form onSubmit={handleAsignacionSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Maestro</label>
                            <select
                                name="maestro_id"
                                value={asignacionForm.maestro_id}
                                onChange={handleAsignacionChange}
                                className="w-full border rounded px-3 py-2 text-sm"
                                required
                                disabled={asignacionSaving || loading}
                            >
                                <option value="">Seleccione Maestro</option>
                                {maestrosList.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre} ({m.email})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                            <select
                                name="materia_id"
                                value={asignacionForm.materia_id}
                                onChange={handleAsignacionChange}
                                className="w-full border rounded px-3 py-2 text-sm"
                                required
                                disabled={asignacionSaving || loading}
                            >
                                <option value="">Seleccione Materia</option>
                                {materiasList.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cupo Máximo</label>
                            <input
                                type="number"
                                name="cupo_maximo"
                                min={1}
                                value={asignacionForm.cupo_maximo}
                                onChange={handleAsignacionChange}
                                className="w-full border rounded px-3 py-2 text-sm"
                                required
                                disabled={asignacionSaving || loading}
                            />
                        </div>

                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-lg bg-green-600 text-white shadow hover:bg-green-700 disabled:opacity-50"
                            disabled={asignacionSaving || loading}
                        >
                            {asignacionSaving ? 'Asignando...' : 'Asignar Materia'}
                        </button>
                    </div>
                </form>
            </div>


            {/* Reporte Global de Promedios (Resumen) */}
            <p className="mt-8 text-lg font-semibold text-gray-700">Reporte Global de Promedios (Resumen)</p>
            <p className="text-sm text-gray-500 mb-4">Muestra el promedio general de todos los alumnos, independientemente de la materia seleccionada.</p>

            <div className="overflow-x-auto bg-white p-4 rounded-lg shadow">
                <table className="min-w-full table-auto border-collapse">
                    <thead>
                        <tr className="bg-gray-200 text-left text-sm text-gray-700">
                            <th className="px-3 py-2">ID</th>
                            <th className="px-3 py-2">Alumno</th>
                            <th className="px-3 py-2">Promedio General</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reporteGlobal.map((item) => (
                            <tr key={item.alumno.id} className="odd:bg-white even:bg-gray-50 border-b">
                                <td className="px-3 py-2">{item.alumno.id}</td>
                                <td className="px-3 py-2">{item.alumno.nombre}</td>
                                <td className="px-3 py-2 font-medium">{item.promedio_general}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            {/* Modal Edit */}
            {isEditOpen && editMeta && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={closeEdit}></div>
                    <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md p-6 z-10">
                        <h4 className="text-xl font-bold mb-4">Editar Calificación</h4>
                        <p className="text-sm text-gray-600 mb-4">Alumno ID: {editMeta.alumnoID} | Materia ID: {selectedMateriaId}</p>

                        <label className="block text-sm text-gray-700 font-medium">Nueva Nota (0 - 10)</label>
                        <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.01}
                            className="w-full mt-1 mb-3 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            value={editNota}
                            onChange={(e) => setEditNota(e.target.value)}
                        />

                        <label className="block text-sm text-gray-700 font-medium">Observaciones</label>
                        <textarea
                            className="w-full mt-1 mb-4 p-2 border border-gray-300 rounded"
                            placeholder="Motivo del ajuste"
                            value={editObs}
                            onChange={(e) => setEditObs(e.target.value)}
                        />

                        <div className="flex justify-end gap-3">
                            <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={closeEdit} disabled={saving}>Cancelar</button>
                            <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handleSaveEdit} disabled={saving}>
                                {saving ? <Spinner /> : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {isConfirmOpen && deleteMeta && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={closeConfirm}></div>
                    <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-sm p-6 z-10">
                        <h4 className="text-xl font-bold mb-4 text-red-700">Confirmar Eliminación</h4>
                        <p className="text-sm text-gray-600 mb-6">Esta acción realizará un Soft Delete. ¿Seguro que deseas eliminar la calificación del alumno ID {deleteMeta.alumnoID} en la materia {selectedMateriaId}?</p>

                        <div className="flex justify-end gap-3">
                            <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={closeConfirm} disabled={deleting}>Cancelar</button>
                            <button className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Eliminando...' : 'Eliminar Permanentemente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;