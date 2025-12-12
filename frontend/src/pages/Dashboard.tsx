import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, Rol } from '../types';

import MaestroDashboard from '../components/MaestroDashboard';
import AdminDashboard from '../components/AdminDashboard';
import AlumnoDashboard from '../components/AlumnoDashboard';

const Dashboard: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
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
            case 'ALUMNO':
                return <AlumnoDashboard />;
            default:
                return (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm text-yellow-800">
                        Rol de usuario no reconocido.
                    </div>
                );
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-neutral-50">
                <div className="text-center animate-fade-in">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-neutral-200 border-t-neutral-900 mb-6"></div>
                    <p className="text-neutral-700 font-semibold text-lg">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header Bar Minimalista */}
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="bg-neutral-900 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-neutral-900">Bienvenido, {user.nombre}</h1>
                                <p className="text-xs text-neutral-500">
                                    <span className="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded">
                                        {user.rol.replace('_', ' ')}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </header>

            {/* Dashboard Content */}
            <main>
                {renderDashboardByRole(user.rol)}
            </main>
        </div>
    );
};

export default Dashboard;
