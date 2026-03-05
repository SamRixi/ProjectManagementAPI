// src/services/edbService.js
import api from './api';

const edbService = {
    // ============= UPLOAD EDB (Reporting Only) =============
    uploadEDB: async (file, projectId = null, description = '') => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            // ✅ N'envoyer projectId QUE s'il est valide (pas null, pas 0)
            if (projectId && parseInt(projectId) > 0) {
                formData.append('projectId', parseInt(projectId));
            }

            if (description) {
                formData.append('description', description);
            }

            console.log('📤 Uploading EDB:', file?.name, '| project:', projectId ?? 'aucun');

            const response = await api.post('/edb/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Fichier EDB uploadé avec succès'
            };
        } catch (error) {
            console.error('❌ Upload EDB error raw:', error.response?.data || error);
            if (error.response?.data) {
                console.log('🔍 Details:', JSON.stringify(error.response.data, null, 2));
            }
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    "Erreur lors de l'upload de l'EDB"
            };
        }
    },

    // ============= GET ALL EDBS =============
    getAllEDBs: async () => {
        try {
            const response = await api.get('/edb');
            let edbsArray = [];
            if (response.data.success && response.data.data) {
                edbsArray = Array.isArray(response.data.data)
                    ? response.data.data
                    : [response.data.data];
            } else if (Array.isArray(response.data)) {
                edbsArray = response.data;
            }
            return { success: true, data: edbsArray, message: response.data.message };
        } catch (error) {
            console.error('❌ Get all EDBs error:', error);
            return {
                success: false,
                data: [],
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la récupération des EDB'
            };
        }
    },

    // ============= GET EDB BY ID =============
    getEDBById: async (edbId) => {
        try {
            const response = await api.get(`/edb/${edbId}`);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get EDB by ID error:', error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    "Erreur lors de la récupération de l'EDB"
            };
        }
    },

    // ============= GET MY PROJECT EDBS =============
    getMyProjectEdbs: async () => {
        try {
            const response = await api.get('/edb/my-project-edbs');
            let edbsArray = [];
            if (response.data.success && response.data.data) {
                edbsArray = Array.isArray(response.data.data)
                    ? response.data.data
                    : [response.data.data];
            }
            return {
                success: response.data.success,
                data: edbsArray,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get my project EDBs error:', error);
            if (error.response) {
                console.log('🔴 Status:', error.response.status);
                console.log('🔴 Data:', JSON.stringify(error.response.data, null, 2));
            }
            return {
                success: false,
                data: [],
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la récupération des EDB de vos projets'
            };
        }
    },

    // ============= DOWNLOAD EDB =============
    downloadEDB: async (edbId, fileName) => {
        try {
            const response = await api.get(`/edb/${edbId}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || `EDB_${edbId}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return { success: true, message: 'Fichier téléchargé avec succès' };
        } catch (error) {
            console.error('❌ Download EDB error:', error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    "Erreur lors du téléchargement de l'EDB"
            };
        }
    },

    // ============= DELETE EDB =============
    deleteEDB: async (edbId) => {
        try {
            const response = await api.delete(`/edb/${edbId}`);
            return {
                success: response.data.success,
                message: response.data.message || 'EDB supprimé avec succès'
            };
        } catch (error) {
            console.error('❌ Delete EDB error:', error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    "Erreur lors de la suppression de l'EDB"
            };
        }
    },

    // ============= HELPER =============
    getFileNameFromUrl: (fileUrl) => {
        try {
            const url = new URL(fileUrl);
            return decodeURIComponent(url.pathname.split('/').pop() || '');
        } catch {
            return fileUrl.split('/').pop() || 'file';
        }
    }
};

export default edbService;
