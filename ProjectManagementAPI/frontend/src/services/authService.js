import axios from 'axios';

const API_URL = 'https://localhost:7013/api/auth';

const authService = {
    register: async (userData) => {
        try {
            const payload = {
                username: userData.username,
                email: userData.email,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName
            };

            console.log('Sending registration data:', payload);

            const response = await axios.post(`${API_URL}/register`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Registration successful:', response.data);

            return {
                success: true,
                data: response.data,
                message: 'Inscription réussie'
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

            const response = await axios.post(`${API_URL}/login`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Login successful:', response.data);

            return response.data;
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