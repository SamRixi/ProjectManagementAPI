import axios from 'axios';
const API_URL = 'https://localhost:7013/api/auth';
const authService = {
    register: async (userData) => {
        try {
            const response = await axios.post(`${API_URL}/register`, {
                username: userData.username,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de l\'inscription' };
        }
    },
    login: async (credentials) => {
        try {
            const response = await axios.post(`${API_URL}/login`, {
                username: credentials.username,
                password: credentials.password
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la connexion' };
        }
    },
    logout: () => {
        return true;
    }
};
export default authService;