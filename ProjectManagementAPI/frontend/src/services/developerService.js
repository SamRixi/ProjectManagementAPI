import api from './api';

const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.userId;
};

// Récupérer les données du dashboard
const getDashboardData = async () => {
    try {
        const userId = getUserId();
        const response = await api.get(`/api/developer/${userId}/dashboard`);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Erreur lors du chargement du dashboard'
        };
    }
};

// Mettre à jour une tâche (statut + progression)
const updateTask = async (taskId, updateData) => {
    try {
        console.log('📤 Sending update request:', { taskId, updateData });
        const response = await api.put(`/api/developer/tasks/${taskId}`, updateData);
        console.log('✅ Update successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error updating task:', error);
        console.error('Response:', error.response?.data);
        return {
            success: false,
            message: error.response?.data?.message || 'Erreur lors de la mise à jour de la tâche'
        };
    }
};

// Récupérer toutes les tâches
const getAllTasks = async () => {
    try {
        const userId = getUserId();
        const response = await api.get(`/api/developer/${userId}/tasks`);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching tasks:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Erreur lors du chargement des tâches'
        };
    }
};

// Récupérer les projets
const getProjects = async () => {
    try {
        const userId = getUserId();
        const response = await api.get(`/api/developer/${userId}/projects`);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching projects:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Erreur lors du chargement des projets'
        };
    }
};

export default {
    getDashboardData,
    updateTask,
    getAllTasks,
    getProjects
};
