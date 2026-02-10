// 📁 src/services/projectService.js
import api from './api';

export const getAllProjects = async () => {
    const response = await api.get('/project');
    return response.data;
};

export const getProjectById = async (projectId) => {
    const response = await api.get(`/project/${projectId}`);
    return response.data;
};

export const createProject = async (projectData) => {
    const response = await api.post('/project', projectData);
    return response.data;
};

export const updateProject = async (projectId, projectData) => {
    const response = await api.put(`/project/${projectId}`, projectData);
    return response.data;
};

export const getProjectStats = async (projectId) => {
    const response = await api.get(`/project/${projectId}/stats`);
    return response.data;
};

export const assignTeam = async (projectId, teamId) => {
    const response = await api.put(`/project/${projectId}/assign-team`, teamId);
    return response.data;
};

export const assignProjectManager = async (projectId, userId) => {
    const response = await api.put(`/project/${projectId}/assign-manager`, { userId });
    return response.data;
};

export const deleteProject = async (projectId) => {
    const response = await api.delete(`/project/${projectId}`);
    return response.data;
};
