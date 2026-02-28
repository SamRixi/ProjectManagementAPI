// src/services/teamService.js
import api from './api';

const teamService = {
    // ============= CREATE TEAM (Reporting/Manager) =============
    createTeam: async (teamData) => {
        try {
            const response = await api.post('/team', teamData);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Équipe créée avec succès'
            };
        } catch (error) {
            console.error('❌ Create team error:', error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    "Erreur lors de la création de l'équipe"
            };
        }
    },

    // ============= UPDATE TEAM (Reporting/Manager) =============
    updateTeam: async (teamId, teamData) => {
        try {
            const response = await api.put(`/team/${teamId}`, teamData);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Équipe mise à jour avec succès'
            };
        } catch (error) {
            console.error('❌ Update team error:', error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    "Erreur lors de la mise à jour de l'équipe"
            };
        }
    },

    // ============= GET ALL TEAMS =============
    getAllTeams: async () => {
        try {
            const response = await api.get('/team');

            let teamsArray = [];
            if (response.data.success && response.data.data) {
                teamsArray = Array.isArray(response.data.data)
                    ? response.data.data
                    : [response.data.data];
            } else if (Array.isArray(response.data)) {
                teamsArray = response.data;
            }

            return {
                success: true,
                data: teamsArray,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get all teams error:', error);
            return {
                success: false,
                data: [],
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la récupération des équipes'
            };
        }
    },

    // ============= GET TEAM BY ID =============
    getTeamById: async (teamId) => {
        try {
            const response = await api.get(`/team/${teamId}`);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get team by ID error:', error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    "Erreur lors de la récupération de l'équipe"
            };
        }
    },

    // ============= TOGGLE TEAM ACTIVE (Reporting/Manager) =============
    toggleTeamActive: async (teamId, isActive) => {
        try {
            const response = await api.put(`/team/${teamId}/toggle-active`, isActive, {
                headers: { 'Content-Type': 'application/json' }
            });

            return {
                success: response.data.success,
                data: response.data.data,
                message:
                    response.data.message ||
                    `Équipe ${isActive ? 'activée' : 'désactivée'} avec succès`
            };
        } catch (error) {
            console.error('❌ Toggle team active error:', error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    "Erreur lors du changement de statut de l'équipe"
            };
        }
    },

    // ============= DELETE TEAM (Reporting/Manager) =============
    deleteTeam: async (teamId) => {
        try {
            const response = await api.delete(`/team/${teamId}`);

            return {
                success:
                    response.data.success ||
                    response.status === 200 ||
                    response.status === 204,
                data: response.data.data,
                message: response.data.message || 'Équipe supprimée avec succès'
            };
        } catch (error) {
            console.error('❌ Delete team error:', error);

            if (error.response?.status === 405) {
                return {
                    success: false,
                    notSupported: true,
                    message:
                        "La suppression permanente n'est pas supportée par le serveur"
                };
            }

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    "Erreur lors de la suppression de l'équipe"
            };
        }
    },

    // ============= DEACTIVATE TEAM (Soft Delete) =============
    deactivateTeam: async (teamId) => {
        try {
            const response = await teamService.toggleTeamActive(teamId, false);
            return {
                success: response.success,
                data: response.data,
                message: response.message || 'Équipe désactivée avec succès'
            };
        } catch (error) {
            console.error('❌ Deactivate team error:', error);
            return {
                success: false,
                message: "Erreur lors de la désactivation de l'équipe"
            };
        }
    },

    // ============= ADD TEAM MEMBER (Reporting/Manager) =============
    addMember: async (memberData) => {
        try {
            const response = await api.post('/team/member', memberData);

            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Membre ajouté avec succès'
            };
        } catch (error) {
            console.error('❌ Add member error:', error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    "Erreur lors de l'ajout du membre"
            };
        }
    },

    // ============= TOGGLE MEMBER ACTIVE (Reporting/Manager) =============
    // ⚠️ aligné avec le controller: PUT /team/member/{teamId}/{userId}/toggle-active
    toggleMemberActive: async (teamId, userId, isActive) => {
        try {
            const response = await api.put(
                `/team/member/${teamId}/${userId}/toggle-active`,
                isActive,
                { headers: { 'Content-Type': 'application/json' } }
            );

            return {
                success: response.data.success,
                data: response.data.data,
                message:
                    response.data.message ||
                    `Membre ${isActive ? 'activé' : 'désactivé'} avec succès`
            };
        } catch (error) {
            console.error('❌ Toggle member active error:', error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors du changement de statut du membre'
            };
        }
    },

    // ============= GET TEAM MEMBERS =============
    getTeamMembers: async (teamId) => {
        try {
            const response = await api.get(`/team/${teamId}/members`);

            let membersArray = [];
            if (response.data.success && response.data.data) {
                membersArray = Array.isArray(response.data.data)
                    ? response.data.data
                    : [response.data.data];
            } else if (Array.isArray(response.data)) {
                membersArray = response.data;
            }

            return {
                success: true,
                data: membersArray,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get team members error:', error);
            return {
                success: false,
                data: [],
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    "Erreur lors de la récupération des membres de l'équipe"
            };
        }
    },

    // ============= REMOVE TEAM MEMBER (Reporting/Manager) =============
    removeMember: async (teamId, userId) => {
        try {
            const response = await api.delete(`/team/member/${teamId}/${userId}`);

            return {
                success: response.data.success,
                message: response.data.message || 'Membre retiré avec succès'
            };
        } catch (error) {
            console.error('❌ Remove member error:', error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors du retrait du membre'
            };
        }
    },

    // ============= HELPER: Add multiple members at once =============
    addMultipleMembers: async (teamId, userIds) => {
        try {
            const results = await Promise.allSettled(
                userIds.map((userId) =>
                    teamService.addMember({ teamId, userId, isProjectManager: false })
                )
            );

            const successful = results.filter(
                (r) => r.status === 'fulfilled' && r.value.success
            ).length;
            const failed = results.length - successful;

            return {
                success: successful > 0,
                message: `${successful} membre(s) ajouté(s) avec succès${failed > 0 ? `, ${failed} échec(s)` : ''
                    }`,
                data: { successful, failed, total: results.length }
            };
        } catch (error) {
            console.error('❌ Add multiple members error:', error);
            return {
                success: false,
                message: "Erreur lors de l'ajout des membres"
            };
        }
    },

    // ============= GET PROJECT MANAGERS (for dropdown) =============
    getProjectManagers: async () => {
        try {
            const response = await api.get('/team/project-managers');

            let managersArray = [];
            if (response.data.success && response.data.data) {
                managersArray = Array.isArray(response.data.data)
                    ? response.data.data
                    : [response.data.data];
            } else if (Array.isArray(response.data)) {
                managersArray = response.data;
            }

            return {
                success: true,
                data: managersArray,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get project managers error:', error);
            return {
                success: false,
                data: [],
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la récupération des chefs de projet'
            };
        }
    },

    // ============= GET AVAILABLE USERS FOR TEAM (dropdown) =============
    // Developer + Project Manager uniquement, pas déjà dans l'équipe
    getAvailableUsers: async (teamId) => {
        try {
            const response = await api.get(`/team/${teamId}/available-users`);

            let usersArray = [];
            if (response.data.success && response.data.data) {
                usersArray = Array.isArray(response.data.data)
                    ? response.data.data
                    : [response.data.data];
            } else if (Array.isArray(response.data)) {
                usersArray = response.data;
            }

            return {
                success: true,
                data: usersArray,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get available users error:', error);
            return {
                success: false,
                data: [],
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la récupération des utilisateurs disponibles'
            };
        }
    }
};

export default teamService;
