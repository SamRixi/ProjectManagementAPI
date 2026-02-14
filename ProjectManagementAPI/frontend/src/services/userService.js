// src/services/userService.js
import axios from 'axios';

const API_URL = 'https://localhost:7013/api';

const userService = {
    // ============= GET ALL USERS =============
    getAllUsers: async () => {
        try {
            console.log('📥 Fetching all users...');
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users`, {  // ✅ /users
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Get all users response:', response.data);

            return {
                success: response.data.success !== false,
                data: Array.isArray(response.data.data) ? response.data.data : [],
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get all users error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || 'Erreur lors de la récupération'
            };
        }
    },

    // ============= GET USER BY ID =============
    getUserById: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users/${userId}`, {  // ✅ /users
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Utilisateur non trouvé' };
        }
    },

    // ============= CREATE USER =============
    createUser: async (userData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/users`, userData, {  // ✅ /users
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la création' };
        }
    },

    // ============= UPDATE USER =============
    updateUser: async (userId, userData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_URL}/users/${userId}`, userData, {  // ✅ /users
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la mise à jour' };
        }
    },

    // ============= TOGGLE USER STATUS (ACTIVATE/DEACTIVATE) =============
    toggleUserStatus: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(
                `${API_URL}/users/${userId}/toggle-status`,  // ✅ /users
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors du changement de statut' };
        }
    },

    // ============= DELETE USER (SOFT DELETE) =============
    deleteUser: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${API_URL}/users/${userId}`, {  // ✅ /users
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la suppression' };
        }
    },

    // ============= GENERATE TEMP PASSWORD =============
    generateTempPassword: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/users/${userId}/generate-temp-password`,  // ✅ /users
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la génération' };
        }
    },

    // ============= CHANGE PASSWORD =============
    changePassword: async (currentPassword, newPassword) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/users/change-password`,  // ✅ /users
                {
                    currentPassword,
                    newPassword,
                    confirmPassword: newPassword
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Retirer le flag après changement réussi
            localStorage.removeItem('mustChangePassword');

            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors du changement' };
        }
    }
};

export default userService;
