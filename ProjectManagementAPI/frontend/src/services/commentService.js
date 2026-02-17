import api from './api';

const commentService = {
    // Ajouter un commentaire (raison du refus)
    addComment: async (taskId, content) => {
        const response = await api.post('/comment', {
            taskId,
            content,
        });
        return response.data;
    },

    // Récupérer les commentaires d'une tâche
    getComments: async (taskId) => {
        const response = await api.get(`/comment/task/${taskId}`);
        return response.data;
    },
};

export default commentService;
