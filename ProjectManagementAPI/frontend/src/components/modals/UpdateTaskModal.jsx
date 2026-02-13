import { useState } from 'react';
import { X, Save } from 'lucide-react';
import '../../styles/Modal.css';

// ✅ Composant interne qui utilise les hooks
const UpdateTaskModalContent = ({ task, onUpdate, onClose }) => {
    function getStatusId(statusText) {
        const statusMap = {
            'À faire': 1,
            'En cours': 2,
            'Terminé': 3
        };
        return statusMap[statusText] || 1;
    }

    const [formData, setFormData] = useState({
        taskId: task.taskId,
        progress: task.progress || 0,
        taskStatusId: getStatusId(task.status)
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const updateData = {
            taskId: formData.taskId,
            taskStatusId: formData.taskStatusId,
            progress: parseInt(formData.progress)
        };

        await onUpdate(task.taskId, updateData);
        setLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>✏️ Mettre à jour la tâche</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>📋 Tâche</label>
                        <input
                            type="text"
                            value={task.taskName || 'Sans titre'}
                            disabled
                            className="input-disabled"
                        />
                    </div>

                    <div className="form-group">
                        <label>📁 Projet</label>
                        <input
                            type="text"
                            value={task.projectName || 'N/A'}
                            disabled
                            className="input-disabled"
                        />
                    </div>

                    <div className="form-group">
                        <label>🔄 Statut *</label>
                        <select
                            value={formData.taskStatusId}
                            onChange={(e) => {
                                const newStatus = parseInt(e.target.value);
                                setFormData({
                                    ...formData,
                                    taskStatusId: newStatus,
                                    progress: newStatus === 3 ? 100 : formData.progress
                                });
                            }}
                            required
                            className="form-select"
                        >
                            <option value={1}>À faire</option>
                            <option value={2}>En cours</option>
                            <option value={3}>Terminé</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>📊 Progression: {formData.progress}%</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={formData.progress}
                            onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                            className="progress-slider"
                            disabled={formData.taskStatusId === 3}
                        />
                        <div className="progress-bar-preview">
                            <div
                                className={`progress-fill-preview ${formData.progress === 100 ? 'completed' :
                                        formData.progress >= 60 ? 'high' :
                                            formData.progress >= 30 ? 'medium' : 'low'
                                    }`}
                                style={{ width: `${formData.progress}%` }}
                            ></div>
                        </div>
                        {formData.taskStatusId === 3 && (
                            <p className="help-text">
                                ✅ Progression automatiquement définie à 100% pour les tâches terminées
                            </p>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-cancel"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="btn-save"
                            disabled={loading}
                        >
                            <Save size={18} />
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ✅ Composant wrapper qui gère la vérification
const UpdateTaskModal = ({ task, onUpdate, onClose }) => {
    if (!task || !task.taskId) {
        console.error('❌ Task object is invalid:', task);
        return null;
    }

    return <UpdateTaskModalContent task={task} onUpdate={onUpdate} onClose={onClose} />;
};

export default UpdateTaskModal;
