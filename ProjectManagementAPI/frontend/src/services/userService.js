// src/services/userService.js
import axios from 'axios';

const API_URL = 'https://localhost:7013/api';

const userService = {

    getAllUsers: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return {
                success: response.data.success !== false,
                data: Array.isArray(response.data.data) ? response.data.data : [],
                message: response.data.message
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || 'Erreur lors de la récupération'
            };
        }
    },

    getUserById: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Utilisateur non trouvé' };
        }
    },

    getUsersByRole: async (roleId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users/by-role/${roleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return {
                success: response.data.success !== false,
                data: Array.isArray(response.data.data) ? response.data.data : [],
                message: response.data.message
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || 'Erreur lors de la récupération'
            };
        }
    },

    getUsersByRoleName: async (roleName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users/by-role-name/${roleName}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return {
                success: response.data.success !== false,
                data: Array.isArray(response.data.data) ? response.data.data : [],
                message: response.data.message
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || 'Erreur lors de la récupération'
            };
        }
    },

    createUser: async (userData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/users`, userData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la création' };
        }
    },

    updateUser: async (userId, userData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_URL}/users/${userId}`, userData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la mise à jour' };
        }
    },

    toggleUserActive: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(
                `${API_URL}/users/${userId}/toggle-active`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return {
                success: response.data.success,
                message: response.data.message || 'Statut modifié avec succès',
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Erreur lors du changement de statut'
            };
        }
    },

    // ✅ CORRIGÉ — envoie roleId dans le body
    approveUser: async (userId, roleId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/users/${userId}/approve`,
                { roleId }, // ✅ roleId envoyé ici !
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return {
                success: response.data.success,
                message: response.data.message || 'Utilisateur approuvé avec succès',
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "Erreur lors de l'approbation"
            };
        }
    },

    rejectUser: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${API_URL}/users/${userId}/reject`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return {
                success: response.data.success,
                message: response.data.message || 'Demande rejetée avec succès'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Erreur lors du rejet'
            };
        }
    },

    deleteUser: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${API_URL}/users/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return {
                success: response.data.success,
                message: response.data.message || 'Utilisateur supprimé avec succès'
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Erreur lors de la suppression'
            };
        }
    },

    generateTempPassword: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/users/${userId}/generate-temp-password`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la génération' };
        }
    },

    changePassword: async (currentPassword, newPassword) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/users/change-password`,
                { currentPassword, newPassword, confirmPassword: newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            localStorage.removeItem('mustChangePassword');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors du changement' };
        }
    }
};

export default userService;
