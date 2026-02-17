import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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

    // États
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Charger les tâches au montage
    useEffect(() => {
        if (user?.userId) {
            fetchTasksAwaitingValidation();
        }
    }, [user]);

    // Récupérer les tâches en attente de validation
    const fetchTasksAwaitingValidation = async () => {
        try {
            setLoading(true);

            console.log('📥 Fetching tasks awaiting validation...');
            const response = await api.get('/projectmanager/validation'); // ✅ CORRIGÉ: Enlevé /api/
            console.log('✅ Validation tasks response:', response.data);

            if (response.data.success) {
                setTasks(response.data.data || []);
            }
        } catch (err) {
            console.error('❌ Error loading validation tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ VALIDER UNE TÂCHE
    const handleValidateTask = async (taskId) => {
        const confirmed = window.confirm('Voulez-vous valider cette tâche ?');
        if (!confirmed) return;

        try {
            console.log(`✅ Validating task ${taskId}...`);

            const response = await api.put(`/projectmanager/tasks/${taskId}/validate`); // ✅ CORRIGÉ

            if (response.data.success) {
                alert('✅ Tâche validée avec succès!');
                fetchTasksAwaitingValidation();
            }
        } catch (err) {
            console.error('❌ Error validating task:', err);
            alert('❌ Erreur: ' + (err.response?.data?.message || err.message));
        }
    };

    // ✅ REFUSER UNE TÂCHE
    const handleRejectTask = async (taskId) => {
        const reason = window.prompt('Raison du refus (optionnel):');
        if (reason === null) return; // Annulé

        try {
            console.log(`❌ Rejecting task ${taskId} with reason: ${reason}`);

            const response = await api.put(`/projectmanager/tasks/${taskId}/reject`, { // ✅ CORRIGÉ
                reason: reason || 'Aucune raison fournie'
            });

            if (response.data.success) {
                alert('❌ Tâche refusée avec succès');
                fetchTasksAwaitingValidation();
            }
        } catch (err) {
            console.error('❌ Error rejecting task:', err);
            alert('❌ Erreur: ' + (err.response?.data?.message || err.message));
        }
    };

    // Obtenir la classe CSS selon la priorité
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
                                    {tasks.length} tâche{tasks.length !== 1 ? 's' : ''} en attente de validation
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            Chargement des tâches en attente...
                        </div>
                    ) : tasks.length > 0 ? (
                        /* Tasks List */
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem'
                        }}>
                            {tasks.map((task) => (
                                <div
                                    key={task.taskId}
                                    style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        padding: '1.8rem',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                        border: '2px solid #fbbf24',
                                        transition: 'all 0.3s',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Badge "En attente" */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                        color: 'white',
                                        padding: '0.4rem 0.9rem',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                                        animation: 'pulse 2s infinite'
                                    }}>
                                        <AlertCircle size={14} />
                                        En Attente
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
                                        {/* Projet */}
                                        <div style={{
                                            background: '#f9fafb',
                                            padding: '0.8rem',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.6rem'
                                        }}>
                                            <FolderKanban size={20} style={{ color: 'var(--mobilis-green)' }} />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600' }}>
                                                    PROJET
                                                </p>
                                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151', fontWeight: '600' }}>
                                                    {task.projectName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Assigné à */}
                                        <div style={{
                                            background: '#f9fafb',
                                            padding: '0.8rem',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.6rem'
                                        }}>
                                            <User size={20} style={{ color: '#3b82f6' }} />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600' }}>
                                                    ASSIGNÉ À
                                                </p>
                                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151', fontWeight: '600' }}>
                                                    {task.assignedToName || 'Non assigné'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Deadline */}
                                        <div style={{
                                            background: '#f9fafb',
                                            padding: '0.8rem',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.6rem'
                                        }}>
                                            <Calendar size={20} style={{ color: '#f59e0b' }} />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600' }}>
                                                    DEADLINE
                                                </p>
                                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151', fontWeight: '600' }}>
                                                    {task.deadline ? new Date(task.deadline).toLocaleDateString('fr-FR') : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Priorité */}
                                        <div style={{
                                            background: '#f9fafb',
                                            padding: '0.8rem',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.6rem'
                                        }}>
                                            <AlertCircle size={20} style={{ color: '#dc2626' }} />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600' }}>
                                                    PRIORITÉ
                                                </p>
                                                <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                                                    {task.priority || 'Moyenne'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>
                                                Progression
                                            </span>
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

                                    {/* Action Buttons */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '1rem'
                                    }}>
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
                                                transition: 'all 0.3s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                fontSize: '0.95rem'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = '#dc2626';
                                                e.target.style.color = 'white';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = 'white';
                                                e.target.style.color = '#dc2626';
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
                                                transition: 'all 0.3s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                fontSize: '0.95rem',
                                                boxShadow: '0 4px 12px rgba(0, 166, 81, 0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = 'var(--mobilis-dark)';
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 6px 16px rgba(0, 166, 81, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = 'var(--mobilis-green)';
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(0, 166, 81, 0.3)';
                                            }}
                                        >
                                            <CheckCircle size={20} />
                                            Valider la Tâche
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* No Tasks */
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
