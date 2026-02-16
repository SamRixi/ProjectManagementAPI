// src/services/projectService.js
import api from './api';

const projectService = {
    createProject: async (projectData) => {
        try {
            console.log('📤 Creating project:', projectData);
            const response = await api.post('/project', projectData);
            console.log('✅ Create project response:', response.data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Projet créé avec succès'
            };
        } catch (error) {
            console.error('❌ Create project error:', error);
            console.error('❌ Error response:', error.response?.data);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la création du projet',
                errors: error.response?.data?.errors
            };
        }
    },

    createProjectWithEdb: async (projectData) => {
        try {
            console.log('📤 Creating project with EDB:', projectData);
            const response = await api.post('/project/with-edb', projectData);
            console.log('✅ Create project with EDB response:', response.data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Projet créé avec EDB avec succès'
            };
        } catch (error) {
            console.error('❌ Create project with EDB error:', error);
            console.error('❌ Error response data:', error.response?.data);
            console.error('❌ Error response status:', error.response?.status);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la création du projet avec EDB',
                errors: error.response?.data?.errors
            };
        }
    },

    updateProject: async (projectId, projectData) => {
        try {
            console.log(`📤 Updating project ${projectId}:`, projectData);
            const response = await api.put(`/project/${projectId}`, projectData);
            console.log('✅ Update project response:', response.data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Projet mis à jour avec succès'
            };
        } catch (error) {
            console.error('❌ Update project error:', error);
            console.error('❌ Error response:', error.response?.data);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la mise à jour du projet',
                errors: error.response?.data?.errors
            };
        }
    },

    assignTeamToProject: async (projectId, teamId) => {
        try {
            console.log(`📤 Assigning team ${teamId} to project ${projectId}`);
            const response = await api.put(`/project/${projectId}/assign-team`, teamId, {
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('✅ Assign team response:', response.data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Équipe assignée avec succès'
            };
        } catch (error) {
            console.error('❌ Assign team error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de l\'assignation de l\'équipe'
            };
        }
    },

    assignProjectManager: async (projectId, userId) => {
        try {
            console.log(`📤 Assigning user ${userId} as manager to project ${projectId}`);
            const response = await api.put(`/project/${projectId}/assign-manager`, { userId });
            console.log('✅ Assign project manager response:', response.data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Chef de projet assigné avec succès'
            };
        } catch (error) {
            console.error('❌ Assign project manager error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de l\'assignation du chef de projet'
            };
        }
    },

    setProjectManager: async (teamMemberId, isProjectManager) => {
        try {
            console.log(`📤 Setting project manager status for member ${teamMemberId}: ${isProjectManager}`);
            const response = await api.put('/project/set-project-manager', { teamMemberId, isProjectManager });
            console.log('✅ Set project manager response:', response.data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Statut de chef de projet mis à jour avec succès'
            };
        } catch (error) {
            console.error('❌ Set project manager error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la mise à jour du chef de projet'
            };
        }
    },

    getAllProjects: async () => {
        try {
            console.log('📥 Fetching all projects...');
            const response = await api.get('/project');
            console.log('✅ Get all projects response:', response.data);
            let projectsArray = [];
            if (response.data.success && response.data.data) {
                projectsArray = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            } else if (Array.isArray(response.data)) {
                projectsArray = response.data;
            }
            return { success: true, data: projectsArray, message: response.data.message };
        } catch (error) {
            console.error('❌ Get all projects error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la récupération des projets'
            };
        }
    },

    getProjectById: async (projectId) => {
        try {
            console.log(`📥 Fetching project with ID: ${projectId}`);
            const response = await api.get(`/project/${projectId}`);
            console.log('✅ Get project by ID response:', response.data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get project by ID error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la récupération du projet'
            };
        }
    },

    getTeamProjects: async (teamId) => {
        try {
            console.log(`📥 Fetching projects for team ID: ${teamId}`);
            const response = await api.get(`/project/team/${teamId}`);
            console.log('✅ Get team projects response:', response.data);
            let projectsArray = [];
            if (response.data.success && response.data.data) {
                projectsArray = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            }
            return { success: response.data.success, data: projectsArray, message: response.data.message };
        } catch (error) {
            console.error('❌ Get team projects error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la récupération des projets de l\'équipe'
            };
        }
    },

    getUserProjects: async (userId) => {
        try {
            console.log(`📥 Fetching projects for user ID: ${userId}`);
            const response = await api.get(`/project/user/${userId}`);
            console.log('✅ Get user projects response:', response.data);
            let projectsArray = [];
            if (response.data.success && response.data.data) {
                projectsArray = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            }
            return { success: response.data.success, data: projectsArray, message: response.data.message };
        } catch (error) {
            console.error('❌ Get user projects error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la récupération des projets de l\'utilisateur'
            };
        }
    },

    getManagedProjects: async (userId) => {
        try {
            console.log(`📥 Fetching managed projects for user ID: ${userId}`);
            const response = await api.get(`/project/managed-by/${userId}`);
            console.log('✅ Get managed projects response:', response.data);
            let projectsArray = [];
            if (response.data.success && response.data.data) {
                projectsArray = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            }
            return { success: response.data.success, data: projectsArray, message: response.data.message };
        } catch (error) {
            console.error('❌ Get managed projects error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la récupération des projets managés'
            };
        }
    },

    getProjectTeamMembers: async (projectId, search = '') => {
        try {
            console.log(`📥 Fetching team members for project ID: ${projectId}`);
            const params = search ? { search } : {};
            const response = await api.get(`/project/${projectId}/team-members`, { params });
            console.log('✅ Get project team members response:', response.data);
            let membersArray = [];
            if (response.data.success && response.data.data) {
                membersArray = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            }
            return { success: response.data.success, data: membersArray, message: response.data.message };
        } catch (error) {
            console.error('❌ Get project team members error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la récupération des membres de l\'équipe'
            };
        }
    },

    getProjectStats: async (projectId) => {
        try {
            console.log(`📥 Fetching stats for project ID: ${projectId}`);
            const response = await api.get(`/project/${projectId}/stats`);
            console.log('✅ Get project stats response:', response.data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get project stats error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la récupération des statistiques du projet'
            };
        }
    },

    deleteProject: async (projectId) => {
        try {
            console.log(`🗑️ Deleting project with ID: ${projectId}`);
            const response = await api.delete(`/project/${projectId}`);
            console.log('✅ Delete project response:', response.data);
            return {
                success: response.data.success,
                message: response.data.message || 'Projet supprimé avec succès'
            };
        } catch (error) {
            console.error('❌ Delete project error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.Message || 'Erreur lors de la suppression du projet'
            };
        }
    }
};

export default projectService;
