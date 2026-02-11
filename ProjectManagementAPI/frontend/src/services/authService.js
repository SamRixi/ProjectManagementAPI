import api from './api';

const authService = {
    register: async (userData) => {
        try {
            const payload = {
                username: userData.username,
                email: userData.email,
                password: userData.password,
                confirmPassword: userData.confirmPassword,
                firstName: userData.firstName,
                lastName: userData.lastName
            };

            console.log('Sending registration data:', payload);

            const response = await api.post('/api/auth/register', payload); // ✅ FIXED

            console.log('Registration successful:', response.data);

            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Inscription réussie'
            };
        } catch (error) {
            console.error('Register error:', error);
            console.error('Error response:', error.response?.data);

            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.title ||
                    'Erreur lors de l\'inscription',
                errors: error.response?.data?.errors
            };
        }
    },

    login: async (credentials) => {
        try {
            const payload = {
                username: credentials.username,
                password: credentials.password
            };

            console.log('Sending login data:', payload);

            const response = await api.post('/api/auth/login', payload); // ✅ FIXED

            console.log('Login successful:', response.data);

            if (response.data.success) {
                return {
                    success: true,
                    token: response.data.token,              // adapte si ton DTO a .data.token
                    user: response.data.user,                // pareil ici si c'est data.user
                    mustChangePassword: response.data.mustChangePassword,
                    message: response.data.message
                };
            } else {
                return {
                    success: false,
                    message: response.data.message || 'Erreur de connexion'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            console.error('Error response:', error.response?.data);

            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.title ||
                    'Erreur lors de la connexion'
            };
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return true;
    }
};

export default authService;
