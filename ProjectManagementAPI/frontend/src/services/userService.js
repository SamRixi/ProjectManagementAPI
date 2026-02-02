import axios from 'axios';

const API_URL = 'https://localhost:7013/api';

const userService = {
    // ============= GET ALL USERS =============
    getAllUsers: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/user`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération' };
        }
    },

    // ============= GET USER BY ID =============
    getUserById: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/user/${userId}`, {
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
            const response = await axios.post(`${API_URL}/user`, userData, {
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
            const response = await axios.put(`${API_URL}/user/${userId}`, userData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la mise à jour' };
        }
    },

    // ✅ NEW: TOGGLE USER STATUS (ACTIVATE/DEACTIVATE)
    toggleUserStatus: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(
                `${API_URL}/user/${userId}/toggle-status`,
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

    // ============= DELETE USER (KEEP FOR COMPATIBILITY) =============
    deleteUser: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${API_URL}/user/${userId}`, {
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
                `${API_URL}/user/${userId}/generate-temp-password`,
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
                `${API_URL}/user/change-password`,
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
