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
            // Llamada al endpoint de Login del Backend
            const response = await api.post<AuthResponse>('/auth/login', { email, password });

            const { token, user } = response.data;

            // 1. Almacenar el token y la info del usuario en el almacenamiento local
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // 2. Redirigir al Dashboard
            navigate('/dashboard', { replace: true });


        } catch (err: any) {
            console.error("Axios error completo:", err);

            if (err.response) {
                // El servidor respondió (400, 401, 500, etc)
                console.error("Response data:", err.response.data);
                console.error("Status:", err.response.status);

                const msg =
                    err.response.data?.message ||
                    err.response.data?.error ||
                    `Error del servidor (${err.response.status})`;

                setError(msg);
            } else if (err.request) {
                // La petición salió, pero no hubo respuesta
                console.error("No response from server:", err.request);
                setError("No hay respuesta del servidor. Revisa la conexión o CORS.");
            } else {
                // Algo evitó hacer la petición
                console.error("Error desconocido:", err.message);
                setError("Error inesperado: " + err.message);
            }
        }

    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white text-center">
                            <h2>Sistema de Control Escolar</h2>
                            <p>Iniciar Sesión</p>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleLogin}>
                                {error && <div className="alert alert-danger">{error}</div>}

                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">Contraseña</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="d-grid gap-2">
                                    <button type="submit" className="btn btn-success" disabled={loading}>
                                        {loading ? 'Cargando...' : 'Acceder'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;