import axios from 'axios';

const managerService = {

    // ✅ StatisticsController
    getGlobalStats: () =>
        axios.get('/api/statistics/global').then(r => r.data),

    getProjectsStats: () =>
        axios.get('/api/statistics/projects').then(r => r.data),

    getTasksByStatus: () =>
        axios.get('/api/statistics/tasks-by-status').then(r => r.data),

    // ✅ ProjectController
    getAllProjects: () =>
        axios.get('/api/project').then(r => r.data),

    getProjectById: (id) =>
        axios.get(`/api/project/${id}`).then(r => r.data),

    createProject: (data) =>
        axios.post('/api/project', data).then(r => r.data),

    updateProject: (id, data) =>
        axios.put(`/api/project/${id}`, data).then(r => r.data),

    assignTeam: (projectId, teamId) =>
        axios.put(`/api/project/${projectId}/assign-team`, teamId).then(r => r.data),

    cancelProject: (projectId) =>
        axios.put(`/api/project/${projectId}/cancel`).then(r => r.data),
};

export default managerService;