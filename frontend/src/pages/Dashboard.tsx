import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Nota: Usamos 'type' para importar solo la interfaz, evitando el error de verbatimModuleSyntax
import type { User, Rol } from '../types';

import MaestroDashboard from '../components/MaestroDashboard';
import AdminDashboard from '../components/AdminDashboard';

const Dashboard: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Cargar la información del usuario desde localStorage
        const userString = localStorage.getItem('user');

        if (userString) {
            try {
                const userData: User = JSON.parse(userString);
                setUser(userData);
            } catch (e) {
                console.error("Error al parsear datos de usuario:", e);
                handleLogout();
            }
        } else {
            // Si no hay datos de usuario (aunque ProtectedRoute debería atrapar esto), forzar logout.
            handleLogout();
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
    };

    const renderDashboardByRole = (rol: Rol) => {
        switch (rol) {
            case 'MAESTRO':
                return <MaestroDashboard />;
            case 'CONTROL_ESCOLAR':
                return <AdminDashboard />;
            default:
                return <div className="alert alert-warning">Rol de usuario no reconocido.</div>;
        }
    };

    if (!user) {
        return <div className="text-center mt-5">Cargando perfil...</div>;
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded shadow-sm">
                <div>
                    <h1 className="h3">Bienvenido, {user.nombre}</h1>
                    <p className="text-muted">Rol: {user.rol}</p>
                </div>
                <button className="btn btn-outline-secondary" onClick={handleLogout}>
                    Cerrar Sesión
                </button>
            </div>

            <div className="row">
                <div className="col-12">
                    {renderDashboardByRole(user.rol)}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;