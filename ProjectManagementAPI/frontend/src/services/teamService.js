// src/services/teamService.js
import api from './api';

const teamService = {
    // ============= CREATE TEAM (Reporting/Manager) =============
    createTeam: async (teamData) => {
        try {
            console.log('📤 Creating team:', teamData);

            // CreateTeamDTO format: { teamName, description?, isActive? }
            const response = await api.post('/team', teamData);

            console.log('✅ Create team response:', response.data);

            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Équipe créée avec succès'
            };
        } catch (error) {
            console.error('❌ Create team error:', error);
            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la création de l\'équipe'
            };
        }
    },

    // ============= UPDATE TEAM (Reporting/Manager) =============
    updateTeam: async (teamId, teamData) => {
        try {
            console.log(`📤 Updating team ${teamId}:`, teamData);

            // UpdateTeamDTO format: { teamId, teamName, description?, isActive? }
            const response = await api.put(`/team/${teamId}`, teamData);

            console.log('✅ Update team response:', response.data);

            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Équipe mise à jour avec succès'
            };
        } catch (error) {
            console.error('❌ Update team error:', error);
            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la mise à jour de l\'équipe'
            };
        }
    },

    // ============= GET ALL TEAMS =============
    getAllTeams: async () => {
        try {
            console.log('📥 Fetching all teams...');

            const response = await api.get('/team');

            console.log('✅ Get all teams response:', response.data);

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
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la récupération des équipes'
            };
        }
    },

    // ============= GET TEAM BY ID =============
    getTeamById: async (teamId) => {
        try {
            console.log(`📥 Fetching team with ID: ${teamId}`);

            const response = await api.get(`/team/${teamId}`);

            console.log('✅ Get team by ID response:', response.data);

            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get team by ID error:', error);
            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la récupération de l\'équipe'
            };
        }
    },

    // ============= TOGGLE TEAM ACTIVE (Reporting/Manager) =============
    toggleTeamActive: async (teamId, isActive) => {
        try {
            console.log(`🔄 Toggling team ${teamId} active status to: ${isActive}`);

            const response = await api.put(`/team/${teamId}/toggle-active`, isActive, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Toggle team active response:', response.data);

            // 🔍 Verify the isActive field was actually changed
            if (response.data.data) {
                console.log('📊 Team isActive after toggle:', response.data.data.isActive);
            }

            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || `Équipe ${isActive ? 'activée' : 'désactivée'} avec succès`
            };
        } catch (error) {
            console.error('❌ Toggle team active error:', error);
            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors du changement de statut de l\'équipe'
            };
        }
    },

    // ============= DELETE TEAM (Reporting/Manager) =============
    deleteTeam: async (teamId) => {
        try {
            console.log(`🗑️ Deleting team ${teamId} (permanent delete)`);

            const response = await api.delete(`/team/${teamId}`);

            console.log('✅ Delete team response:', response.data);

            return {
                success: response.data.success || response.status === 200 || response.status === 204,
                data: response.data.data,
                message: response.data.message || 'Équipe supprimée avec succès'
            };
        } catch (error) {
            console.error('❌ Delete team error:', error);

            // If 405 Method Not Allowed, backend doesn't support DELETE
            if (error.response?.status === 405) {
                return {
                    success: false,
                    notSupported: true,
                    message: 'La suppression permanente n\'est pas supportée par le serveur'
                };
            }

            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la suppression de l\'équipe'
            };
        }
    },

    // ============= DEACTIVATE TEAM (Soft Delete) =============
    deactivateTeam: async (teamId) => {
        try {
            console.log(`🔄 Deactivating team ${teamId} (soft delete)`);

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
                message: 'Erreur lors de la désactivation de l\'équipe'
            };
        }
    },

    // ============= GET ALL USERS ============= ✅ AJOUTÉ
    getAllUsers: async () => {
        try {
            console.log('📥 Fetching all users...');

            const response = await api.get('/users');

            console.log('✅ Get all users response:', response.data);

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
            console.error('❌ Get all users error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la récupération des utilisateurs'
            };
        }
    },

    // ============= ADD TEAM MEMBER (Reporting/Manager) =============
    addMember: async (memberData) => {
        try {
            console.log('📤 Adding member to team:', memberData);

            // AddTeamMemberDTO format: { teamId, userId, isProjectManager? }
            const response = await api.post('/team/member', memberData);

            console.log('✅ Add member response:', response.data);

            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Membre ajouté avec succès'
            };
        } catch (error) {
            console.error('❌ Add member error:', error);
            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de l\'ajout du membre'
            };
        }
    },

    // ============= TOGGLE MEMBER ACTIVE (Reporting/Manager) =============
    toggleMemberActive: async (memberId, isActive) => {
        try {
            console.log(`🔄 Toggling member ${memberId} active status to: ${isActive}`);

            const response = await api.put(`/team/member/${memberId}/toggle-active`, isActive, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Toggle member active response:', response.data);

            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || `Membre ${isActive ? 'activé' : 'désactivé'} avec succès`
            };
        } catch (error) {
            console.error('❌ Toggle member active error:', error);
            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors du changement de statut du membre'
            };
        }
    },

    // ============= GET TEAM MEMBERS =============
    getTeamMembers: async (teamId) => {
        try {
            console.log(`📥 Fetching members for team ID: ${teamId}`);

            const response = await api.get(`/team/${teamId}/members`);

            console.log('✅ Get team members response:', response.data);

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
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la récupération des membres de l\'équipe'
            };
        }
    },

    // ============= REMOVE TEAM MEMBER (Reporting/Manager) =============
    removeMember: async (teamId, userId) => {
        try {
            console.log(`🗑️ Removing user ${userId} from team ${teamId}`);

            const response = await api.delete(`/team/member/${teamId}/${userId}`);

            console.log('✅ Remove member response:', response.data);

            return {
                success: response.data.success,
                message: response.data.message || 'Membre retiré avec succès'
            };
        } catch (error) {
            console.error('❌ Remove member error:', error);
            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors du retrait du membre'
            };
        }
    },

    // ============= HELPER: Add multiple members at once =============
    addMultipleMembers: async (teamId, userIds) => {
        try {
            console.log(`📤 Adding ${userIds.length} members to team ${teamId}`);

            const results = await Promise.allSettled(
                userIds.map(userId =>
                    teamService.addMember({ teamId, userId, isProjectManager: false })
                )
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const failed = results.length - successful;

            return {
                success: successful > 0,
                message: `${successful} membre(s) ajouté(s) avec succès${failed > 0 ? `, ${failed} échec(s)` : ''}`,
                data: { successful, failed, total: results.length }
            };
        } catch (error) {
            console.error('❌ Add multiple members error:', error);
            return {
                success: false,
                message: 'Erreur lors de l\'ajout des membres'
            };
        }
    }
};

export default teamService;
