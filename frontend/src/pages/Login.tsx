import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { AuthResponse } from '../types';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Por favor, ingresa tu correo y contraseña.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post<AuthResponse>('/auth/login', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            console.error("Login error:", err);

            if (err.response) {
                const msg =
                    err.response.data?.message ||
                    err.response.data?.error ||
                    `Error del servidor (${err.response.status})`;
                setError(msg);
            } else if (err.request) {
                setError("No hay respuesta del servidor. Revisa la conexión.");
            } else {
                setError("Error inesperado: " + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-scale-in">
                {/* Card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-neutral-200">
                    {/* Header Minimalista */}
                    <div className="bg-neutral-900 p-8 text-white text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-1">Sistema de Control Escolar</h1>
                        <p className="text-neutral-300 text-sm">Gestión de calificaciones</p>
                    </div>

                    {/* Form */}
                    <div className="p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-800 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        required
                                        placeholder="tu@correo.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        id="password"
                                        className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        required
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                        </svg>
                                        Iniciando sesión...
                                    </span>
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </button>
                        </form>

                        {/* Credenciales de prueba */}
                        <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                            <p className="text-xs font-bold text-neutral-700 mb-2">
                                Credenciales de Prueba:
                            </p>
                            <div className="text-xs text-neutral-600 space-y-1">
                                <p><strong>Admin:</strong> admin@escuela.com / password123</p>
                                <p><strong>Maestro:</strong> juan.perez@escuela.com / password123</p>
                                <p><strong>Alumno:</strong> raul.castro@escuela.com / password123</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-neutral-500 text-xs mt-6">
                    © 2025 Sistema de Control Escolar
                </p>
            </div>
        </div>
    );
};

export default Login;
