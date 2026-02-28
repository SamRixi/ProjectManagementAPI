// src/services/edbService.js
import api from './api';

const edbService = {
    // ============= UPLOAD EDB (Reporting Only) =============
    // file + projectId + description
    uploadEDB: async (file, projectId, description = '') => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('projectId', projectId); // pour [FromForm] int projectId
            if (description) {
                formData.append('description', description);
            }

            console.log('📤 Uploading EDB file:', file?.name, 'for project:', projectId);

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
            console.error('❌ Upload EDB error raw:', error.response?.data || error);
            // 🔎 log détaillé pour voir la vraie erreur du backend
            if (error.response?.data) {
                console.log('🔍 Upload EDB error details:', JSON.stringify(error.response.data, null, 2));
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

    // ============= GET ALL EDBS (Reporting Only) =============
    getAllEDBs: async () => {
        try {
            console.log('📥 Fetching all EDBs...');

            const response = await api.get('/edb');

            console.log('✅ Get all EDBs response:', response.data);

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
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    "Erreur lors de la récupération de l'EDB"
            };
        }
    },

    // ============= GET MY PROJECT EDBS (Dev + Chef de projet) =============
    getMyProjectEdbs: async () => {
        try {
            console.log('📥 Fetching my project EDBs...');

            const response = await api.get('/edb/my-project-edbs');

            console.log('✅ Get my project EDBs response:', response.data);

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
            // 🔥 LOG COMPLET DE L’ERREUR
            console.error('❌ Get my project EDBs error (full):', error);

            if (error.response) {
                console.log('🔴 error.response.status:', error.response.status);
                console.log('🔴 error.response.data:', JSON.stringify(error.response.data, null, 2));
                console.log('🔴 error.response.headers:', error.response.headers);
            } else if (error.request) {
                console.log('🟠 error.request (no response):', error.request);
            } else {
                console.log('🟡 error.message:', error.message);
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
            console.log(`⬇️ Downloading EDB with ID: ${edbId}`);

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

            console.log('✅ EDB downloaded successfully');

            return {
                success: true,
                message: 'Fichier téléchargé avec succès'
            };
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
                message:
                    error.response?.data?.message ||
                    error.response?.data?.Message ||
                    "Erreur lors de la suppression de l'EDB"
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
