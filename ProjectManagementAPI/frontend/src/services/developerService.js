import api from './api';

const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.userId;
};

// ============= GET DASHBOARD DATA =============
const getDashboardData = async () => {
    try {
        const userId = getUserId();

        if (!userId) {
            return {
                success: false,
                message: 'Utilisateur non authentifié'
            };
        }

        // ✅ CORRECTION : Enlever /api (déjà dans baseURL)
        const response = await api.get(`/developer/${userId}/dashboard`);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Erreur lors du chargement du dashboard'
        };
    }
};

// ============= UPDATE TASK =============
const updateTask = async (taskId, updateData) => {
    try {
        console.log('📤 Sending update request:', { taskId, updateData });

        // ✅ CORRECTION : Enlever /api
        const response = await api.put(`/developer/tasks/${taskId}`, updateData);

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

// ============= GET ALL TASKS =============
const getAllTasks = async () => {
    try {
        const userId = getUserId();

        if (!userId) {
            return {
                success: false,
                message: 'Utilisateur non authentifié'
            };
        }

        // ✅ CORRECTION : Enlever /api
        const response = await api.get(`/developer/${userId}/tasks`);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching tasks:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Erreur lors du chargement des tâches'
        };
    }
};

// ============= GET PROJECTS =============
const getProjects = async () => {
    try {
        const userId = getUserId();

        if (!userId) {
            return {
                success: false,
                message: 'Utilisateur non authentifié'
            };
        }

        // ✅ CORRECTION : Enlever /api
        const response = await api.get(`/developer/${userId}/projects`);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching projects:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Erreur lors du chargement des projets'
        };
    }
};

// ============= GET PROJECT DETAILS =============
const getProjectDetails = async (projectId) => {
    try {
        // ✅ CORRECTION : Enlever /api
        const response = await api.get(`/developer/projects/${projectId}`);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching project details:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Erreur lors du chargement du projet'
        };
    }
};

export default {
    getDashboardData,
    updateTask,
    getAllTasks,
    getProjects,
    getProjectDetails
};
