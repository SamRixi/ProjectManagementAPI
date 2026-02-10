// 📁 src/services/taskService.js
import api from './api';

export const getAllTasks = async () => {
    const response = await api.get('/task');
    return response.data;
};

export const getTaskById = async (taskId) => {
    const response = await api.get(`/task/${taskId}`);
    return response.data;
};

export const createTask = async (taskData) => {
    const response = await api.post('/task', taskData);
    return response.data;
};

export const updateTaskStatus = async (taskId, statusId) => {
    const response = await api.put(`/task/${taskId}/status`, { statusId });
    return response.data;
};

export const validateTask = async (taskId) => {
    const response = await api.post(`/task/${taskId}/validate`);
    return response.data;
};
