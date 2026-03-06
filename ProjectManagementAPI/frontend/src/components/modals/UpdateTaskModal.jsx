import { useState } from 'react';
import { X, Save } from 'lucide-react';
import '../../styles/Modal.css';

const UpdateTaskModalContent = ({ task, onUpdate, onClose }) => {

    function getStatusId(statusText) {
        const statusMap = {
            'À faire': 1,
            'En cours': 2,
            'Terminé': 3,
            'En attente de validation': 4,
            'Validé': 5,
            'Annulé': 6
        };
        return statusMap[statusText] || 1;
    }

    // ✅ Statut 100% automatique via le slider — le membre ne choisit JAMAIS le statut
    const computeStatusIdFromProgress = (progress) => {
        if (progress === 0) return 1;                  // À faire
        if (progress > 0 && progress < 100) return 2;  // En cours
        if (progress === 100) return 4;                // En attente de validation
        return 1;
    };

    const [formData, setFormData] = useState({
        taskId: task.taskId,
        progress: task.progress || 0,
        taskStatusId: getStatusId(task.status)
    });
    const [loading, setLoading] = useState(false);

    // ✅ Bloqué seulement si Validé(5) ou Annulé(6)
    const isLocked = formData.taskStatusId === 5 || formData.taskStatusId === 6;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const finalStatus = computeStatusIdFromProgress(formData.progress);

        const updateData = {
            TaskStatusId: finalStatus,
            progress: parseInt(formData.progress)
        };

        console.log('📤 Envoi:', updateData);
        await onUpdate(task.taskId, updateData);
        setLoading(false);
    };

    // ✅ Texte du statut actuel affiché en lecture seule
    const getStatusLabel = (statusId) => {
        const labels = {
            1: { text: 'À faire', color: '#95a5a6' },
            2: { text: 'En cours', color: '#3498db' },
            3: { text: 'Terminé', color: '#2ecc71' },
            4: { text: 'En attente de validation', color: '#f59e0b' },
            5: { text: 'Validé', color: '#10b981' },
            6: { text: 'Annulé', color: '#e74c3c' }
        };
        return labels[statusId] || labels[1];
    };

    const currentStatus = getStatusLabel(formData.taskStatusId);

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

                    {/* Tâche - lecture seule */}
                    <div className="form-group">
                        <label>📋 Tâche</label>
                        <input
                            type="text"
                            value={task.taskName || 'Sans titre'}
                            disabled
                            className="input-disabled"
                        />
                    </div>

                    {/* Projet - lecture seule */}
                    <div className="form-group">
                        <label>📁 Projet</label>
                        <input
                            type="text"
                            value={task.projectName || 'N/A'}
                            disabled
                            className="input-disabled"
                        />
                    </div>

                    {/* ✅ Statut affiché en lecture seule - pas de select */}
                    <div className="form-group">
                        <label>🔄 Statut actuel</label>
                        <div style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            border: `2px solid ${currentStatus.color}`,
                            background: `${currentStatus.color}15`,
                            color: currentStatus.color,
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span style={{
                                width: '10px', height: '10px',
                                borderRadius: '50%',
                                background: currentStatus.color,
                                display: 'inline-block'
                            }}></span>
                            {currentStatus.text}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.4rem' }}>
                            ℹ️ Le statut se met à jour automatiquement selon la progression
                        </p>
                    </div>

                    {/* Slider de progression */}
                    <div className="form-group">
                        <label>📊 Progression: {formData.progress}%</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={formData.progress}
                            onChange={(e) => {
                                const newProgress = parseInt(e.target.value);
                                setFormData({
                                    ...formData,
                                    progress: newProgress,
                                    taskStatusId: computeStatusIdFromProgress(newProgress)
                                });
                            }}
                            className="progress-slider"
                            disabled={isLocked}
                        />
                        <div className="progress-bar-preview">
                            <div
                                className={`progress-fill-preview ${formData.progress === 100 ? 'completed'
                                        : formData.progress >= 60 ? 'high'
                                            : formData.progress >= 30 ? 'medium'
                                                : 'low'
                                    }`}
                                style={{ width: `${formData.progress}%` }}
                            ></div>
                        </div>

                        {/* Messages selon progression */}
                        {formData.progress === 0 && (
                            <p className="help-text" style={{ color: '#95a5a6', fontWeight: '600' }}>
                                📋 Tâche non commencée
                            </p>
                        )}
                        {formData.progress > 0 && formData.progress < 100 && (
                            <p className="help-text" style={{ color: '#3498db', fontWeight: '600' }}>
                                🔵 Tâche en cours — {formData.progress}% complété
                            </p>
                        )}
                        {formData.progress === 100 && (
                            <p className="help-text" style={{ color: '#00A651', fontWeight: '600' }}>
                                ✅ Tâche à 100% ! Elle sera envoyée au chef de projet pour validation.
                            </p>
                        )}
                        {formData.taskStatusId === 5 && (
                            <p className="help-text" style={{ color: '#10b981', fontWeight: '600' }}>
                                ✅ Tâche validée par le chef de projet
                            </p>
                        )}
                        {formData.taskStatusId === 6 && (
                            <p className="help-text" style={{ color: '#e74c3c', fontWeight: '600' }}>
                                ❌ Tâche annulée
                            </p>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>
                            Annuler
                        </button>
                        <button type="submit" className="btn-save" disabled={loading || isLocked}>
                            <Save size={18} />
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UpdateTaskModal = ({ task, onUpdate, onClose }) => {
    if (!task || !task.taskId) {
        console.error('❌ Task object is invalid:', task);
        return null;
    }
    return <UpdateTaskModalContent task={task} onUpdate={onUpdate} onClose={onClose} />;
};

export default UpdateTaskModal;