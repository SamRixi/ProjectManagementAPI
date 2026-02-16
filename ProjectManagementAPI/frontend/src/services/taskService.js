// src/services/taskService.js
import api from './api';

const taskService = {
    // ============= GET ALL TASKS =============
    getAllTasks: async () => {
        try {
            console.log('📥 Fetching all tasks...');
            const response = await api.get('/task');
            console.log('✅ Get all tasks response:', response.data);
            let tasksArray = [];
            if (response.data.success && response.data.data) {
                tasksArray = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            } else if (Array.isArray(response.data)) {
                tasksArray = response.data;
            }
            return {
                success: true,
                data: tasksArray,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get all tasks error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la récupération des tâches'
            };
        }
    },

    // ============= GET TASK BY ID =============
    getTaskById: async (taskId) => {
        try {
            console.log(`📥 Fetching task with ID: ${taskId}`);
            const response = await api.get(`/task/${taskId}`);
            console.log('✅ Get task by ID response:', response.data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get task by ID error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la récupération de la tâche'
            };
        }
    },

    // ============= CREATE TASK =============
    createTask: async (taskData) => {
        try {
            console.log('📤 Creating task:', taskData);
            const response = await api.post('/task', taskData);
            console.log('✅ Create task response:', response.data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Tâche créée avec succès'
            };
        } catch (error) {
            console.error('❌ Create task error:', error);
            console.error('❌ Error response:', error.response?.data);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la création de la tâche',
                errors: error.response?.data?.errors
            };
        }
    },

    // ============= UPDATE TASK STATUS =============
    updateTaskStatus: async (taskId, statusId) => {
        try {
            console.log(`📤 Updating task ${taskId} status to ${statusId}`);
            const response = await api.put(`/task/${taskId}/status/${statusId}`);
            console.log('✅ Update task status response:', response.data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Statut de la tâche mis à jour avec succès'
            };
        } catch (error) {
            console.error('❌ Update task status error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la mise à jour du statut'
            };
        }
    },

    // ============= VALIDATE TASK =============
    validateTask: async (taskId) => {
        try {
            console.log(`📤 Validating task ${taskId}`);
            const response = await api.put(`/task/${taskId}/validate`);
            console.log('✅ Validate task response:', response.data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Tâche validée avec succès'
            };
        } catch (error) {
            console.error('❌ Validate task error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la validation de la tâche'
            };
        }
    },

    // ============= GET TASKS BY PROJECT =============
    getTasksByProject: async (projectId) => {
        try {
            console.log(`📥 Fetching tasks for project ID: ${projectId}`);
            const response = await api.get(`/task/project/${projectId}`);
            console.log('✅ Get tasks by project response:', response.data);
            let tasksArray = [];
            if (response.data.success && response.data.data) {
                tasksArray = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            }
            return {
                success: response.data.success,
                data: tasksArray,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get tasks by project error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la récupération des tâches du projet'
            };
        }
    },

    // ============= GET TASKS BY USER =============
    getTasksByUser: async (userId) => {
        try {
            console.log(`📥 Fetching tasks for user ID: ${userId}`);
            const response = await api.get(`/task/user/${userId}`);
            console.log('✅ Get tasks by user response:', response.data);
            let tasksArray = [];
            if (response.data.success && response.data.data) {
                tasksArray = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            }
            return {
                success: response.data.success,
                data: tasksArray,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get tasks by user error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la récupération des tâches de l\'utilisateur'
            };
        }
    },

    // ============= GET MY TASKS =============
    getMyTasks: async () => {
        try {
            console.log('📥 Fetching my tasks...');
            const response = await api.get('/task/my-tasks');
            console.log('✅ Get my tasks response:', response.data);
            let tasksArray = [];
            if (response.data.success && response.data.data) {
                tasksArray = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            }
            return {
                success: response.data.success,
                data: tasksArray,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get my tasks error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la récupération de vos tâches'
            };
        }
    },

    // ============= DELETE TASK =============
    deleteTask: async (taskId) => {
        try {
            console.log(`🗑️ Deleting task with ID: ${taskId}`);
            const response = await api.delete(`/task/${taskId}`);
            console.log('✅ Delete task response:', response.data);
            return {
                success: response.data.success,
                message: response.data.message || 'Tâche supprimée avec succès'
            };
        } catch (error) {
            console.error('❌ Delete task error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la suppression de la tâche'
            };
        }
    }
};

export default taskService;
