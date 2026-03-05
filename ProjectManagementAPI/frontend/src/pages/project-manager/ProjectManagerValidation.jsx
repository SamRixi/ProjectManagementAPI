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
    Calendar,
    X
} from 'lucide-react';
import api from '../../services/api';
import ProjectManagerLayout from '../../components/layout/ProjectManagerLayout';
import '../../styles/Dashboard.css';
import '../../styles/DeveloperDashboard.css';

// ✅ Modal de confirmation Valider
const ConfirmValidateModal = ({ onConfirm, onCancel }) => (
    <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
        <div style={{
            background: 'white', borderRadius: '16px', padding: '2rem',
            width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#1f2937' }}>✅ Valider la tâche</h3>
                <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </div>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Voulez-vous valider cette tâche ? Le membre sera notifié.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={onCancel} style={{
                    flex: 1, padding: '0.8rem', background: 'white', border: '2px solid #e5e7eb',
                    borderRadius: '10px', cursor: 'pointer', fontWeight: '600', color: '#6b7280'
                }}>
                    Annuler
                </button>
                <button onClick={onConfirm} style={{
                    flex: 1, padding: '0.8rem', background: 'var(--mobilis-green)', color: 'white',
                    border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(0,166,81,0.3)'
                }}>
                    ✅ Confirmer
                </button>
            </div>
        </div>
    </div>
);

// ✅ Modal de refus avec raison
const RejectModal = ({ onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', borderRadius: '16px', padding: '2rem',
                width: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: '#dc2626' }}>❌ Refuser la tâche</h3>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                    Indiquez la raison du refus (optionnel). Le membre sera notifié et la tâche sera renvoyée en cours.
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: La gestion des rôles est incomplète, merci de revoir..."
                    rows={4}
                    style={{
                        width: '100%', padding: '0.8rem', borderRadius: '10px',
                        border: '2px solid #e5e7eb', fontSize: '0.95rem',
                        resize: 'vertical', outline: 'none', marginBottom: '1.5rem',
                        fontFamily: 'inherit', boxSizing: 'border-box',
                        transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={onCancel} style={{
                        flex: 1, padding: '0.8rem', background: 'white', border: '2px solid #e5e7eb',
                        borderRadius: '10px', cursor: 'pointer', fontWeight: '600', color: '#6b7280'
                    }}>
                        Annuler
                    </button>
                    <button onClick={() => onConfirm(reason)} style={{
                        flex: 1, padding: '0.8rem', background: 'white', color: '#dc2626',
                        border: '2px solid #dc2626', borderRadius: '10px',
                        cursor: 'pointer', fontWeight: '600'
                    }}>
                        ❌ Confirmer le refus
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProjectManagerValidation = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ États pour les modals
    const [validateModal, setValidateModal] = useState(null); // taskId
    const [rejectModal, setRejectModal] = useState(null);     // taskId

    useEffect(() => {
        if (user?.userId) fetchTasksAwaitingValidation();
    }, [user]);

    const fetchTasksAwaitingValidation = async () => {
        try {
            setLoading(true);
            const response = await api.get('/projectmanager/validation');
            if (response.data.success) setTasks(response.data.data || []);
        } catch (err) {
            console.error('❌ Error loading validation tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ VALIDER — appelé après confirmation dans le modal
    const handleValidateTask = async (taskId) => {
        setValidateModal(null);
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
        }
    };

    // ✅ REFUSER — appelé après confirmation dans le modal
    const handleRejectTask = async (taskId, reason) => {
        setRejectModal(null);
        try {
            const response = await api.put(`/projectmanager/tasks/${taskId}/reject`, {
                reason: reason || 'Aucune raison fournie'
            });
            if (response.data.success) {
                try {
                    await commentService.addComment(taskId, reason || 'Aucune raison fournie');
                } catch (commentErr) {
                    console.error('❌ Error adding comment:', commentErr);
                }
                setTasks(prev => prev.filter(t => t.taskId !== taskId));
            }
        } catch (err) {
            console.error('❌ Error rejecting task:', err);
        }
    };

    const getPriorityClass = (priority) => {
        if (priority?.toLowerCase() === 'haute') return 'high';
        if (priority?.toLowerCase() === 'moyenne') return 'medium';
        return 'low';
    };

    return (
        <ProjectManagerLayout>
            {/* ✅ Modals custom */}
            {validateModal && (
                <ConfirmValidateModal
                    onConfirm={() => handleValidateTask(validateModal)}
                    onCancel={() => setValidateModal(null)}
                />
            )}
            {rejectModal && (
                <RejectModal
                    onConfirm={(reason) => handleRejectTask(rejectModal, reason)}
                    onCancel={() => setRejectModal(null)}
                />
            )}

            <div className="dashboard-container">
                <div className="dashboard-content">
                    {/* Header */}
                    <div className="welcome-card" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, var(--mobilis-green), var(--mobilis-dark))',
                                color: 'white', width: '60px', height: '60px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
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

                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            Chargement des tâches en attente...
                        </div>
                    ) : tasks.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {tasks.map((task) => (
                                <div key={task.taskId} style={{
                                    background: 'white', borderRadius: '16px', padding: '1.8rem',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    border: task.isValidated ? '2px solid #10b981' : '2px solid #fbbf24',
                                    transition: 'all 0.3s', position: 'relative',
                                    overflow: 'hidden', opacity: task.isValidated ? 0.85 : 1
                                }}>
                                    {/* Badge statut */}
                                    <div style={{
                                        position: 'absolute', top: '1rem', right: '1rem',
                                        background: task.isValidated
                                            ? 'linear-gradient(135deg, #10b981, #059669)'
                                            : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                        color: 'white', padding: '0.4rem 0.9rem',
                                        borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                                        textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        boxShadow: task.isValidated
                                            ? '0 2px 8px rgba(16,185,129,0.4)'
                                            : '0 2px 8px rgba(245,158,11,0.4)'
                                    }}>
                                        {task.isValidated
                                            ? <><CheckCircle size={14} /> Validée</>
                                            : <><AlertCircle size={14} /> En Attente</>
                                        }
                                    </div>

                                    {/* Task Header */}
                                    <div style={{ marginBottom: '1.2rem', paddingRight: '130px' }}>
                                        <h3 style={{ fontSize: '1.4rem', color: '#1f2937', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
                                            {task.taskName}
                                        </h3>
                                        <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                                            {task.description || 'Aucune description'}
                                        </p>
                                    </div>

                                    {/* Task Info Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
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
                                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--mobilis-green)' }}>{task.progress || 0}%</span>
                                        </div>
                                        <div className="task-progress-bar-bg" style={{ height: '12px' }}>
                                            <div className="task-progress-bar-fill progress-completed" style={{ width: `${task.progress || 0}%` }}>
                                                <div className="progress-shimmer"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Boutons actions */}
                                    {!task.isValidated ? (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            {/* ✅ Ouvre le modal de refus */}
                                            <button
                                                onClick={() => setRejectModal(task.taskId)}
                                                style={{
                                                    flex: 1, padding: '0.85rem', background: 'white',
                                                    color: '#dc2626', border: '2px solid #dc2626',
                                                    borderRadius: '12px', fontWeight: '600', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    gap: '0.5rem', fontSize: '0.95rem'
                                                }}
                                            >
                                                <XCircle size={20} /> Refuser
                                            </button>
                                            {/* ✅ Ouvre le modal de validation */}
                                            <button
                                                onClick={() => setValidateModal(task.taskId)}
                                                style={{
                                                    flex: 1, padding: '0.85rem', background: 'var(--mobilis-green)',
                                                    color: 'white', border: 'none', borderRadius: '12px',
                                                    fontWeight: '600', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    gap: '0.5rem', fontSize: '0.95rem',
                                                    boxShadow: '0 4px 12px rgba(0,166,81,0.3)'
                                                }}
                                            >
                                                <CheckCircle size={20} /> Valider la Tâche
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{
                                            padding: '0.85rem', background: '#f0fdf4',
                                            border: '1px solid #10b981', borderRadius: '12px',
                                            color: '#059669', fontWeight: '600', textAlign: 'center', fontSize: '0.95rem'
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
                            <h3 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Aucune tâche en attente de validation</h3>
                            <p style={{ color: '#9ca3af' }}>Toutes les tâches ont été validées ou sont en cours de réalisation.</p>
                        </div>
                    )}
                </div>
            </div>
        </ProjectManagerLayout>
    );
};

export default ProjectManagerValidation;