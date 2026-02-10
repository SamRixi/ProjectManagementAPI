// 📁 src/services/teamService.js
import api from './api';

export const getAllTeams = async () => {
    const response = await api.get('/team');
    return response.data;
};

export const createTeam = async (teamData) => {
    const response = await api.post('/team', teamData);
    return response.data;
};

export const addMemberToTeam = async (teamId, userId) => {
    const response = await api.post(`/team/${teamId}/members`, { userId });
    return response.data;
};
