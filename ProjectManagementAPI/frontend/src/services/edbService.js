// src/services/edbService.js
import api from './api';

const edbService = {
    // ============= UPLOAD EDB (Reporting Only) =============
    uploadEDB: async (file, description = '') => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (description) {
                formData.append('description', description);
            }

            console.log('📤 Uploading EDB file:', file.name);

            const response = await api.post('/edb/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('✅ Upload EDB response:', response.data);

            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Fichier EDB uploadé avec succès'
            };
        } catch (error) {
            console.error('❌ Upload EDB error:', error);
            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de l\'upload de l\'EDB'
            };
        }
    },

    // ============= GET ALL EDBS (Reporting Only) =============
    getAllEDBs: async () => {
        try {
            console.log('📥 Fetching all EDBs...');

            const response = await api.get('/edb');

            console.log('✅ Get all EDBs response:', response.data);

            // Backend returns: { success: true, message: "X EDB(s) récupéré(s)", data: [...] }
            let edbsArray = [];

            if (response.data.success && response.data.data) {
                edbsArray = Array.isArray(response.data.data)
                    ? response.data.data
                    : [response.data.data];
            } else if (Array.isArray(response.data)) {
                edbsArray = response.data;
            }

            return {
                success: true,
                data: edbsArray,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get all EDBs error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la récupération des EDB'
            };
        }
    },

    // ============= GET EDB BY ID =============
    getEDBById: async (edbId) => {
        try {
            console.log(`📥 Fetching EDB with ID: ${edbId}`);

            const response = await api.get(`/edb/${edbId}`);

            console.log('✅ Get EDB by ID response:', response.data);

            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error('❌ Get EDB by ID error:', error);
            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la récupération de l\'EDB'
            };
        }
    },

    // ============= GET PROJECT EDBS =============
    getProjectEDBs: async (projectId) => {
        try {
            console.log(`📥 Fetching EDBs for project ID: ${projectId}`);

            const response = await api.get(`/edb/project/${projectId}`);

            console.log('✅ Get project EDBs response:', response.data);

            // Backend returns: { success: true, message: "X EDB(s) trouvé(s) pour le projet", data: [...] }
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
            console.error('❌ Get project EDBs error:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la récupération des EDB du projet'
            };
        }
    },

    // ============= DOWNLOAD EDB =============
    downloadEDB: async (edbId, fileName) => {
        try {
            console.log(`⬇️ Downloading EDB with ID: ${edbId}`);

            const response = await api.get(`/edb/${edbId}/download`, {
                responseType: 'blob' // Important for file download
            });

            // Create blob URL and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || `EDB_${edbId}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            console.log('✅ EDB downloaded successfully');

            return {
                success: true,
                message: 'Fichier téléchargé avec succès'
            };
        } catch (error) {
            console.error('❌ Download EDB error:', error);
            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors du téléchargement de l\'EDB'
            };
        }
    },

    // ============= DELETE EDB (Reporting Only) =============
    deleteEDB: async (edbId) => {
        try {
            console.log(`🗑️ Deleting EDB with ID: ${edbId}`);

            const response = await api.delete(`/edb/${edbId}`);

            console.log('✅ Delete EDB response:', response.data);

            return {
                success: response.data.success,
                message: response.data.message || 'EDB supprimé avec succès'
            };
        } catch (error) {
            console.error('❌ Delete EDB error:', error);
            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.Message ||
                    'Erreur lors de la suppression de l\'EDB'
            };
        }
    },

    // ============= HELPER: Get file info from URL =============
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
