import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password2: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Estilo de manejo de cambios similar al chatbot
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: value.trimStart() // Limpieza básica como en el chatbot
        }));
    };

    // Obtener CSRF como en el chatbot (pero simplificado)
    useEffect(() => {
        const fetchCSRF = async () => {
            try {
                await axios.get(`${import.meta.env.VITE_API_BASE_URL}/csrf/`, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('Error CSRF:', error);
            }
        };
        fetchCSRF();
    }, []);

    // Envío de formulario al estilo chatbot
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const csrfToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('csrftoken='))
                ?.split('=')[1];

            // Configuración similar al chatbot pero para registro
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/users/register/`,
                {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    password2: formData.password2
                },
                {
                    withCredentials: true,
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest' // Header importante del chatbot
                    }
                }
            );

            // Manejo de respuesta como en el chatbot
            if (response.data.access) {
                localStorage.setItem('authData', JSON.stringify({
                    access: response.data.access,
                    refresh: response.data.refresh,
                    user: response.data.user
                }));
                navigate('/');
            }

        } catch (err) {
            // Manejo de errores estilo chatbot
            const errorData = err.response?.data || {};
            const serverError = errorData.detail || 
                             errorData.message || 
                             Object.values(errorData)?.[0]?.[0] || 
                             'Error de registro';
            setError(serverError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">Registro de Usuario</h2>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

<form onSubmit={handleSubmit} className="space-y-4">
    {/* Nombre de usuario */}
    <div>
        <label className="block mb-1">Nombre de usuario:</label>
        <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
    </div>

    {/* Correo electrónico */}
    <div>
        <label className="block mb-1">Correo electrónico:</label>
        <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
    </div>

    {/* Contraseña */}
    <div>
        <label className="block mb-1">Contraseña:</label>
        <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
    </div>

    {/* Confirmar contraseña */}
    <div>
        <label className="block mb-1">Confirmar contraseña:</label>
        <input
            type="password"
            name="password2"
            value={formData.password2}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
    </div>

    {/* Botón de envío */}
    <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 px-4 rounded-full text-white transition-colors ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
    >
        {loading ? 'Registrando...' : 'Crear cuenta'}
    </button>
</form>

        </div>
    );
};

export default Register;