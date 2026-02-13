import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Code, CheckSquare, FolderKanban, Clock, RefreshCw } from 'lucide-react';
import developerService from '../../services/developerService';
import UpdateTaskModal from '../../components/modals/UpdateTaskModal';  // ✅ Correct
 // ✅ UNE SEULE FOIS
import '../../styles/Dashboard.css';
import '../../styles/DeveloperDashboard.css';

const DeveloperDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // États
    const [stats, setStats] = useState({
        activeProjects: 0,
        tasksInProgress: 0,
        completedTasks: 0,
        overdueTasks: 0,
        totalTasks: 0,
        pendingTasks: 0
    });
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);

    // Charger les données au montage du composant
    useEffect(() => {
        if (user?.userId) {
            fetchDashboardData();
        }
    }, [user]);

    // Fonction pour récupérer les données du dashboard
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await developerService.getDashboardData(user.userId);

            if (response.success) {
                setStats(response.data.stats || {
                    activeProjects: 0,
                    tasksInProgress: 0,
                    completedTasks: 0,
                    overdueTasks: 0,
                    totalTasks: 0,
                    pendingTasks: 0
                });
                setTasks(response.data.tasks || []);
            } else {
                setError(response.message || 'Erreur lors du chargement des données');
            }
        } catch (err) {
            console.error('❌ Error loading dashboard:', err);
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
                fetchDashboardData();
            } else {
                alert('❌ Erreur: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating task:', error);
            alert('❌ Erreur lors de la mise à jour');
        }
    };

    // Fonction de déconnexion
    const handleLogout = () => {
        logout();
        navigate('/login');
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
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <h1>DEVELOPER DASHBOARD</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={fetchDashboardData}
                        className="refresh-btn"
                        title="Actualiser"
                        disabled={loading}
                    >
                        <RefreshCw size={20} className={loading ? 'spinning' : ''} />
                    </button>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={20} />
                        DECONNEXION
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="dashboard-content">
                {/* Welcome Card */}
                <div className="welcome-card">
                    <h2>Bienvenue, {user?.firstName || 'Developer'}!</h2>
                    <div className="user-info">
                        <p><strong>Username:</strong> {user?.userName}</p>
                        <p><strong>Email:</strong> {user?.email}</p>
                        <p><strong>Role:</strong> {user?.roleName}</p>
                    </div>
                    <p className="welcome-text">
                        Vous avez accès au tableau de bord développeur.
                        Gérez vos tâches et projets ici.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        <p>⚠️ {error}</p>
                        <button onClick={fetchDashboardData}>
                            Réessayer
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        Chargement des données...
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <FolderKanban size={32} />
                                </div>
                                <div className="stat-content">
                                    <h3>Mes Projets</h3>
                                    <p className="stat-number">{stats.activeProjects}</p>
                                    <p className="stat-label">Projets actifs</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <CheckSquare size={32} />
                                </div>
                                <div className="stat-content">
                                    <h3>Mes Tâches</h3>
                                    <p className="stat-number">{stats.tasksInProgress}</p>
                                    <p className="stat-label">Tâches en cours</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <Code size={32} />
                                </div>
                                <div className="stat-content">
                                    <h3>Tâches terminées</h3>
                                    <p className="stat-number">{stats.completedTasks}</p>
                                    <p className="stat-label">Ce mois-ci</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <Clock size={32} />
                                </div>
                                <div className="stat-content">
                                    <h3>En retard</h3>
                                    <p className="stat-number">{stats.overdueTasks}</p>
                                    <p className="stat-label">Tâches en retard</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Tasks */}
                        <div className="recent-section">
                            <h3>Tâches Récentes</h3>

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
                                                <span>
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
                    </>
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
    );
};

export default DeveloperDashboard;

