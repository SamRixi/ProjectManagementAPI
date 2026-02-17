import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import commentService from '../../services/commentService';
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    User,
    FolderKanban,
    Calendar
} from 'lucide-react';
import api from '../../services/api';
import ProjectManagerLayout from '../../components/layout/ProjectManagerLayout';
import '../../styles/Dashboard.css';
import '../../styles/DeveloperDashboard.css';

const ProjectManagerValidation = () => {
    const { user } = useAuth();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.userId) {
            fetchTasksAwaitingValidation();
        }
    }, [user]);

    const fetchTasksAwaitingValidation = async () => {
        try {
            setLoading(true);
            const response = await api.get('/projectmanager/validation');
            if (response.data.success) {
                setTasks(response.data.data || []);
            }
        } catch (err) {
            console.error('❌ Error loading validation tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ VALIDER UNE TÂCHE → badge vert + boutons disparaissent
    const handleValidateTask = async (taskId) => {
        const confirmed = window.confirm('Voulez-vous valider cette tâche ?');
        if (!confirmed) return;

        try {
            const response = await api.put(`/projectmanager/tasks/${taskId}/validate`);
            if (response.data.success) {
                setTasks(prev =>
                    prev.map(t =>
                        t.taskId === taskId
                            ? { ...t, isValidated: true, status: 'Validée' }
                            : t
                    )
                );
            }
        } catch (err) {
            console.error('❌ Error validating task:', err);
            alert('❌ Erreur: ' + (err.response?.data?.message || err.message));
        }
    };

    // ❌ REFUSER UNE TÂCHE → renvoie en cours + ajoute un commentaire
    const handleRejectTask = async (taskId) => {
        const reason = window.prompt('Raison du refus (optionnel):');
        if (reason === null) return;

        try {
            // 1) Met à jour la tâche côté PM (statut, progression, etc.)
            const response = await api.put(`/projectmanager/tasks/${taskId}/reject`, {
                reason: reason || 'Aucune raison fournie'
            });

            if (response.data.success) {
                // 2) Ajoute un commentaire lié à la tâche pour le développeur
                try {
                    await commentService.addComment(
                        taskId,
                        reason || 'Aucune raison fournie'
                    );
                } catch (commentErr) {
                    console.error('❌ Error adding comment:', commentErr);
                    // On ne bloque pas le refus si le commentaire échoue
                }

                alert('❌ Tâche refusée - renvoyée en cours');

                // 3) Retire la tâche de la liste de validation
                setTasks(prev => prev.filter(t => t.taskId !== taskId));
            }
        } catch (err) {
            console.error('❌ Error rejecting task:', err);
            alert('❌ Erreur: ' + (err.response?.data?.message || err.message));
        }
    };

    const getPriorityClass = (priority) => {
        if (priority?.toLowerCase() === 'haute') return 'high';
        if (priority?.toLowerCase() === 'moyenne') return 'medium';
        return 'low';
    };

    return (
        <ProjectManagerLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">
                    {/* Header */}
                    <div className="welcome-card" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, var(--mobilis-green), var(--mobilis-dark))',
                                color: 'white',
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0, 166, 81, 0.3)'
                            }}>
                                <CheckCircle size={32} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, marginBottom: '0.3rem' }}>🔔 Validation des Tâches</h2>
                                <p className="welcome-text" style={{ margin: 0 }}>
                                    {tasks.filter(t => !t.isValidated).length} tâche(s) en attente · {tasks.filter(t => t.isValidated).length} validée(s)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Loading */}
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            Chargement des tâches en attente...
                        </div>
                    ) : tasks.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {tasks.map((task) => (
                                <div
                                    key={task.taskId}
                                    style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        padding: '1.8rem',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                        border: task.isValidated
                                            ? '2px solid #10b981'
                                            : '2px solid #fbbf24',
                                        transition: 'all 0.3s',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        opacity: task.isValidated ? 0.85 : 1
                                    }}
                                >
                                    {/* Badge statut */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        background: task.isValidated
                                            ? 'linear-gradient(135deg, #10b981, #059669)'
                                            : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                        color: 'white',
                                        padding: '0.4rem 0.9rem',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        boxShadow: task.isValidated
                                            ? '0 2px 8px rgba(16, 185, 129, 0.4)'
                                            : '0 2px 8px rgba(245, 158, 11, 0.4)'
                                    }}>
                                        {task.isValidated
                                            ? <><CheckCircle size={14} /> Validée</>
                                            : <><AlertCircle size={14} /> En Attente</>
                                        }
                                    </div>

                                    {/* Task Header */}
                                    <div style={{ marginBottom: '1.2rem', paddingRight: '130px' }}>
                                        <h3 style={{
                                            fontSize: '1.4rem',
                                            color: '#1f2937',
                                            fontWeight: '700',
                                            margin: '0 0 0.5rem 0'
                                        }}>
                                            {task.taskName}
                                        </h3>
                                        <p style={{
                                            fontSize: '1rem',
                                            color: '#6b7280',
                                            lineHeight: '1.6',
                                            margin: 0
                                        }}>
                                            {task.description || 'Aucune description'}
                                        </p>
                                    </div>

                                    {/* Task Info Grid */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '1rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div style={{ background: '#f9fafb', padding: '0.8rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <FolderKanban size={20} style={{ color: 'var(--mobilis-green)' }} />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600' }}>PROJET</p>
                                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151', fontWeight: '600' }}>{task.projectName}</p>
                                            </div>
                                        </div>

                                        <div style={{ background: '#f9fafb', padding: '0.8rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <User size={20} style={{ color: '#3b82f6' }} />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600' }}>ASSIGNÉ À</p>
                                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151', fontWeight: '600' }}>{task.assignedToName || 'Non assigné'}</p>
                                            </div>
                                        </div>

                                        <div style={{ background: '#f9fafb', padding: '0.8rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <Calendar size={20} style={{ color: '#f59e0b' }} />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600' }}>DEADLINE</p>
                                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151', fontWeight: '600' }}>
                                                    {task.deadline ? new Date(task.deadline).toLocaleDateString('fr-FR') : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ background: '#f9fafb', padding: '0.8rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <AlertCircle size={20} style={{ color: '#dc2626' }} />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600' }}>PRIORITÉ</p>
                                                <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                                                    {task.priority || 'Moyenne'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>Progression</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--mobilis-green)' }}>
                                                {task.progress || 0}%
                                            </span>
                                        </div>
                                        <div className="task-progress-bar-bg" style={{ height: '12px' }}>
                                            <div
                                                className="task-progress-bar-fill progress-completed"
                                                style={{ width: `${task.progress || 0}%` }}
                                            >
                                                <div className="progress-shimmer"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Boutons actions */}
                                    {!task.isValidated ? (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button
                                                onClick={() => handleRejectTask(task.taskId)}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.85rem',
                                                    background: 'white',
                                                    color: '#dc2626',
                                                    border: '2px solid #dc2626',
                                                    borderRadius: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                    fontSize: '0.95rem'
                                                }}
                                            >
                                                <XCircle size={20} />
                                                Refuser
                                            </button>

                                            <button
                                                onClick={() => handleValidateTask(task.taskId)}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.85rem',
                                                    background: 'var(--mobilis-green)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                    fontSize: '0.95rem',
                                                    boxShadow: '0 4px 12px rgba(0, 166, 81, 0.3)'
                                                }}
                                            >
                                                <CheckCircle size={20} />
                                                Valider la Tâche
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{
                                            padding: '0.85rem',
                                            background: '#f0fdf4',
                                            border: '1px solid #10b981',
                                            borderRadius: '12px',
                                            color: '#059669',
                                            fontWeight: '600',
                                            textAlign: 'center',
                                            fontSize: '0.95rem'
                                        }}>
                                            ✅ Tâche validée avec succès !
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="welcome-card" style={{ textAlign: 'center' }}>
                            <CheckCircle size={64} style={{ color: 'var(--mobilis-green)', margin: '0 auto 1rem' }} />
                            <h3 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                                Aucune tâche en attente de validation
                            </h3>
                            <p style={{ color: '#9ca3af' }}>
                                Toutes les tâches ont été validées ou sont en cours de réalisation.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </ProjectManagerLayout>
    );
};

export default ProjectManagerValidation;
