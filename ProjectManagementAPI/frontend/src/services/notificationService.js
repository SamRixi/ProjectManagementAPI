// src/services/notificationService.js
import axios from 'axios';

const API_URL = 'https://localhost:7013/api';

const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const notificationService = {

    // ============= GET MY NOTIFICATIONS =============
    getMyNotifications: async () => {
        try {
            const response = await axios.get(
                `${API_URL}/Notification`,  // ✅ GET api/Notification
                getHeaders()
            );
            return {
                success: true,
                data: Array.isArray(response.data.data) ? response.data.data : []
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || 'Erreur récupération'
            };
        }
    },

    // ============= GET UNREAD COUNT =============
    getUnreadCount: async () => {
        try {
            const response = await axios.get(
                `${API_URL}/Notification/unread-count`,  // ✅ GET api/Notification/unread-count
                getHeaders()
            );
            return {
                success: true,
                data: response.data.data || 0
            };
        } catch {
            return { success: false, data: 0 };
        }
    },

    // ============= MARK AS READ =============
    markAsRead: async (notificationId) => {
        try {
            await axios.put(
                `${API_URL}/Notification/${notificationId}/read`,  // ✅ PUT
                {},
                getHeaders()
            );
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Erreur'
            };
        }
    },

    // ============= MARK ALL AS READ =============
    markAllAsRead: async () => {
        try {
            await axios.put(
                `${API_URL}/Notification/read-all`,  // ✅ PUT
                {},
                getHeaders()
            );
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Erreur'
            };
        }
    },

    // ============= DELETE NOTIFICATION =============
    deleteNotification: async (notificationId) => {
        try {
            await axios.delete(
                `${API_URL}/Notification/${notificationId}`,  // ✅ DELETE
                getHeaders()
            );
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Erreur suppression'
            };
        }
    }
};

export default notificationService;
