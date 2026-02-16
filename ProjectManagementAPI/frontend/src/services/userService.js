// src/services/userService.js
import axios from 'axios';

const API_URL = 'https://localhost:7013/api';

const userService = {
    // ============= GET ALL USERS =============
    getAllUsers: async () => {
        try {
            console.log('📥 Fetching all users...');
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users`, {
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
            const response = await axios.get(`${API_URL}/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Utilisateur non trouvé' };
        }
    },

    // ============= GET USERS BY ROLE ID ============= ✅ NOUVEAU
    getUsersByRole: async (roleId) => {
        try {
            console.log(`📥 Fetching users with roleId ${roleId}...`);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users/by-role/${roleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Get users by role response:', response.data);

            return {
                success: response.data.success !== false,
                data: Array.isArray(response.data.data) ? response.data.data : [],
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get users by role error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || 'Erreur lors de la récupération'
            };
        }
    },

    // ============= GET USERS BY ROLE NAME ============= ✅ NOUVEAU
    getUsersByRoleName: async (roleName) => {
        try {
            console.log(`📥 Fetching users with role ${roleName}...`);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users/by-role-name/${roleName}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Get users by role name response:', response.data);

            return {
                success: response.data.success !== false,
                data: Array.isArray(response.data.data) ? response.data.data : [],
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get users by role name error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || 'Erreur lors de la récupération'
            };
        }
    },

    // ============= CREATE USER =============
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

    // ============= UPDATE USER =============
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

    // ============= TOGGLE USER ACTIVE (ACTIVATE/DEACTIVATE) =============
    toggleUserActive: async (userId) => {
        try {
            console.log(`🔄 Toggling user ${userId}...`);
            const token = localStorage.getItem('token');
            const response = await axios.patch(
                `${API_URL}/users/${userId}/toggle-active`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log('✅ Toggle active response:', response.data);

            return {
                success: response.data.success,
                message: response.data.message || 'Statut modifié avec succès',
                data: response.data.data
            };
        } catch (error) {
            console.error('❌ Toggle active error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Erreur lors du changement de statut'
            };
        }
    },

    // ============= APPROVE USER (for pending registrations) =============
    approveUser: async (userId) => {
        try {
            console.log(`✅ Approving user ${userId}...`);
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/users/${userId}/approve`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log('✅ Approve response:', response.data);

            return {
                success: response.data.success,
                message: response.data.message || 'Utilisateur approuvé avec succès'
            };
        } catch (error) {
            console.error('❌ Approve user error:', error);
            return {
                success: false,
                message: error.response?.data?.message || "Erreur lors de l'approbation"
            };
        }
    },

    // ============= REJECT USER (for pending registrations) =============
    rejectUser: async (userId) => {
        try {
            console.log(`❌ Rejecting user ${userId}...`);
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${API_URL}/users/${userId}/reject`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log('✅ Reject response:', response.data);

            return {
                success: response.data.success,
                message: response.data.message || 'Demande rejetée avec succès'
            };
        } catch (error) {
            console.error('❌ Reject user error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Erreur lors du rejet'
            };
        }
    },

    // ============= DELETE USER (for inactive users - permanent delete) =============
    deleteUser: async (userId) => {
        try {
            console.log(`🗑️ Deleting user ${userId}...`);
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${API_URL}/users/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log('✅ Delete response:', response.data);

            return {
                success: response.data.success,
                message: response.data.message || 'Utilisateur supprimé avec succès'
            };
        } catch (error) {
            console.error('❌ Delete user error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Erreur lors de la suppression'
            };
        }
    },

    // ============= GENERATE TEMP PASSWORD =============
    generateTempPassword: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/users/${userId}/generate-temp-password`,
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
                `${API_URL}/users/change-password`,
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
