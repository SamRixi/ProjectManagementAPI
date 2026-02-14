import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare } from 'lucide-react';
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

    // Fonction pour obtenir la classe CSS du statut
    const getStatusClass = (status) => {
        const statusMap = {
            'À faire': 'pending',
            'En cours': 'in-progress',
            'Terminé': 'completed'
        };
        return statusMap[status] || 'pending';
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
        if (!deadline || status === 'Terminé') return false;
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
                                    {tasks.map((task) => (
                                        <div
                                            className={`task-item ${isTaskOverdue(task.deadline, task.status) ? 'overdue' : ''}`}
                                            key={task.taskId}
                                        >
                                            <div className={`task-status ${getStatusClass(task.status)}`}></div>

                                            <div className="task-details">
                                                <h4>{task.taskName || 'Sans titre'}</h4>
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
                                                    {task.status === 'Terminé'
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

                                                <button
                                                    className="btn-update-task"
                                                    onClick={() => setSelectedTask(task)}
                                                    style={{
                                                        marginTop: '1rem',
                                                        padding: '8px 16px',
                                                        background: '#00A651',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '600',
                                                        transition: 'all 0.3s'
                                                    }}
                                                >
                                                    ✏️ Mettre à jour
                                                </button>
                                            </div>
                                        </div>
                                    ))}
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
