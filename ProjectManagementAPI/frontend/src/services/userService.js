import axios from 'axios';

const API_URL = 'https://localhost:7013/api';

const userService = {
    // Générer mot de passe temporaire (Reporting)
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

    // Changer mot de passe (User connecté)
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

            // ⬅️ IMPORTANT : Retirer le flag après changement réussi
            localStorage.removeItem('mustChangePassword');

            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors du changement' };
        }
    }
};

export default userService;