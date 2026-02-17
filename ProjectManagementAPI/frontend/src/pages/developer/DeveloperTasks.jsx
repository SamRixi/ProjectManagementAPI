import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, CheckCircle, Clock } from 'lucide-react';
import developerService from '../../services/developerService';
import UpdateTaskModal from '../../components/modals/UpdateTaskModal';
import DeveloperLayout from '../../components/layout/DeveloperLayout';
import '../../styles/Dashboard.css';
import '../../styles/DeveloperDashboard.css';

const DeveloperTasks = () => {
    const { user } = useAuth();

    // États
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);

    // Charger les données au montage du composant
    useEffect(() => {
        if (user?.userId) {
            fetchTasks();
        }
    }, [user]);

    // Fonction pour récupérer les tâches
    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await developerService.getDashboardData();

            if (response.success) {
                console.log('📋 Tasks received:', response.data.tasks);
                response.data.tasks.forEach(t => {
                    console.log(`Task "${t.taskName}" - Status: "${t.status}" - Progress: ${t.progress}%`);
                });

                setTasks(response.data.tasks || []);
            } else {
                setError(response.message || 'Erreur lors du chargement des tâches');
            }
        } catch (err) {
            console.error('❌ Error loading tasks:', err);
            setError('Erreur lors de la connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour mettre à jour une tâche
    const handleUpdateTask = async (taskId, updateData) => {
        try {
            console.log('📤 Updating task:', taskId, updateData);

            const result = await developerService.updateTask(taskId, updateData);

            if (result.success) {
                alert('✅ ' + result.message);
                setSelectedTask(null);
                fetchTasks();
            } else {
                alert('❌ Erreur: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating task:', error);
            alert('❌ Erreur lors de la mise à jour');
        }
    };

    // ✅ FONCTION POUR VÉRIFIER SI LA TÂCHE EST VALIDÉE (statut 5)
    const isTaskValidated = (status) => {
        const validatedStatuses = [
            'Validée',
            'Validé',
            'Terminé et validé',
            'Complété'
        ];
        return validatedStatuses.some(s => status?.toLowerCase().includes(s.toLowerCase()));
    };

    // ✅ FONCTION POUR VÉRIFIER SI LA TÂCHE EST EN ATTENTE (statut 4)
    const isTaskPending = (status) => {
        return status?.toLowerCase().includes('attente');
    };

    // Fonction pour obtenir la classe CSS du statut
    const getStatusClass = (status) => {
        const statusLower = status?.toLowerCase() || '';

        if (statusLower.includes('validé') || statusLower.includes('complété')) {
            return 'completed';
        }
        if (statusLower.includes('attente')) {
            return 'pending-validation';
        }
        if (statusLower.includes('cours')) {
            return 'in-progress';
        }
        if (statusLower.includes('terminé')) {
            return 'completed';
        }
        return 'pending';
    };

    // Fonction pour obtenir la classe CSS de la priorité
    const getPriorityClass = (priority) => {
        const priorityMap = {
            'Haute': 'high',
            'Moyenne': 'medium',
            'Basse': 'low'
        };
        return priorityMap[priority] || 'medium';
    };

    // Classe de progression
    const getProgressClass = (progress) => {
        if (progress === 100) return 'completed';
        if (progress >= 60) return 'high';
        if (progress >= 30) return 'medium';
        return 'low';
    };

    // Fonction pour formater la date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Fonction pour vérifier si une tâche est en retard
    const isTaskOverdue = (deadline, status) => {
        if (!deadline || isTaskValidated(status) || isTaskPending(status)) return false;
        return new Date(deadline) < new Date();
    };

    return (
        <DeveloperLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">
                    {/* Page Header */}
                    <div className="welcome-card" style={{
                        background: 'linear-gradient(135deg, #00A651 0%, #004D29 100%)',
                        color: 'white',
                        marginBottom: '30px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <CheckSquare size={40} />
                            <div>
                                <h2 style={{ margin: 0, color: 'white' }}>Mes Tâches</h2>
                                <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
                                    Gérez et mettez à jour toutes vos tâches assignées
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-message">
                            <p>⚠️ {error}</p>
                            <button onClick={fetchTasks}>
                                Réessayer
                            </button>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            Chargement des tâches...
                        </div>
                    ) : (
                        <div className="recent-section">
                            <h3>Toutes mes tâches</h3>

                            {tasks.length > 0 ? (
                                <div className="task-list">
                                    {tasks.map((task) => {
                                        const isValidated = isTaskValidated(task.status);
                                        const isPending = isTaskPending(task.status);
                                        const isLocked = isValidated || isPending;

                                        return (
                                            <div
                                                className={`task-item ${isTaskOverdue(task.deadline, task.status) ? 'overdue' : ''} ${isLocked ? 'locked' : ''}`}
                                                key={task.taskId}
                                            >
                                                <div className={`task-status ${getStatusClass(task.status)}`}></div>

                                                <div className="task-details">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <h4 style={{ margin: 0 }}>{task.taskName || 'Sans titre'}</h4>

                                                        {/* ✅ BADGE VALIDÉE (vert) */}
                                                        {isValidated && (
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                padding: '4px 12px',
                                                                background: '#10b981',
                                                                color: 'white',
                                                                borderRadius: '12px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '700',
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                <CheckCircle size={14} />
                                                                Validée
                                                            </span>
                                                        )}

                                                        {/* ⏳ BADGE EN ATTENTE (orange) */}
                                                        {isPending && (
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                padding: '4px 12px',
                                                                background: '#f59e0b',
                                                                color: 'white',
                                                                borderRadius: '12px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '700',
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                <Clock size={14} />
                                                                En attente
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p>Projet: {task.projectName || 'N/A'}</p>
                                                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                                                        Chef de projet: {task.projectManagerName || 'N/A'}
                                                    </p>
                                                    <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                                                        {task.priority || 'Moyenne'} Priorité
                                                    </span>
                                                </div>

                                                <div className="task-meta">
                                                    <span className="task-deadline">
                                                        {isValidated
                                                            ? `Complété: ${formatDate(task.completedDate)}`
                                                            : `Deadline: ${formatDate(task.deadline)}`}
                                                    </span>

                                                    {isTaskOverdue(task.deadline, task.status) && (
                                                        <span className="overdue-badge">
                                                            ⚠️ EN RETARD
                                                        </span>
                                                    )}

                                                    {task.progress !== undefined && (
                                                        <div className="progress-wrapper">
                                                            <div className="progress-container">
                                                                <div
                                                                    className={`progress-fill ${getProgressClass(task.progress)}`}
                                                                    style={{ width: `${task.progress}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="progress-text">
                                                                {task.progress}% complété
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* ✅ BOUTON AVEC MESSAGES DIFFÉRENTS */}
                                                    <button
                                                        className="btn-update-task"
                                                        onClick={() => !isLocked && setSelectedTask(task)}
                                                        disabled={isLocked}
                                                        style={{
                                                            marginTop: '1rem',
                                                            padding: '8px 16px',
                                                            background: isLocked ? '#d1d5db' : '#00A651',
                                                            color: isLocked ? '#6b7280' : 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: isLocked ? 'not-allowed' : 'pointer',
                                                            fontSize: '0.9rem',
                                                            fontWeight: '600',
                                                            transition: 'all 0.3s',
                                                            opacity: isLocked ? 0.6 : 1
                                                        }}
                                                        title={
                                                            isValidated
                                                                ? '✅ Tâche validée par le chef de projet - Modification impossible'
                                                                : isPending
                                                                    ? '⏳ Tâche en attente de validation par le chef de projet'
                                                                    : 'Mettre à jour la tâche'
                                                        }
                                                    >
                                                        {isValidated
                                                            ? '🔒 Validée'
                                                            : isPending
                                                                ? '⏳ En attente'
                                                                : '✏️ Mettre à jour'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="no-data">
                                    <p>📋 Aucune tâche assignée pour le moment.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal de mise à jour */}
                {selectedTask && (
                    <UpdateTaskModal
                        task={selectedTask}
                        onUpdate={handleUpdateTask}
                        onClose={() => setSelectedTask(null)}
                    />
                )}
            </div>
        </DeveloperLayout>
    );
};

export default DeveloperTasks;
