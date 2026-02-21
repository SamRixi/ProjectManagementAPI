import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Code, CheckSquare, FolderKanban, Clock } from 'lucide-react';
import developerService from '../../services/developerService';
import DeveloperLayout from '../../components/layout/DeveloperLayout';
import '../../styles/Dashboard.css';
import '../../styles/DeveloperDashboard.css';

const DeveloperDashboard = () => {
    const { user } = useAuth();

    const [stats, setStats] = useState({
        activeProjects: 0,
        tasksInProgress: 0,
        completedTasks: 0,
        overdueTasks: 0,
        totalTasks: 0,
        pendingTasks: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?.userId) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await developerService.getDashboardData();

            if (response.success) {
                const loadedTasks = response.data.tasks || [];

                // 🔹 Ne garder que les tâches non annulées (même règle que DeveloperTasks)
                const activeTasks = loadedTasks.filter(
                    (t) => t.status !== 'Annulé'
                );

                const totalTasks = activeTasks.length;

                const tasksInProgress = activeTasks.filter((t) => {
                    const s = t.status?.toLowerCase() || '';
                    return s.includes('cours');
                }).length;

                const completedTasks = activeTasks.filter((t) => {
                    const s = t.status?.toLowerCase() || '';
                    return s.includes('terminé') || s.includes('valid');
                }).length;

                const pendingTasks = activeTasks.filter((t) => {
                    const s = t.status?.toLowerCase() || '';
                    return s.includes('attente');
                }).length;

                const overdueTasks = activeTasks.filter((t) => {
                    const s = t.status?.toLowerCase() || '';
                    if (
                        s.includes('valid') ||
                        s.includes('terminé') ||
                        s.includes('attente')
                    ) {
                        return false;
                    }
                    if (!t.deadline) return false;
                    return new Date(t.deadline) < new Date();
                }).length;

                // 🔹 Projets actifs vus par le dev = projets des tâches non annulées
                const projectIds = new Set(
                    activeTasks
                        .map((t) => t.projectId)
                        .filter((id) => id !== null && id !== undefined)
                );

                setStats({
                    activeProjects: projectIds.size,
                    tasksInProgress,
                    completedTasks,
                    overdueTasks,
                    totalTasks,
                    pendingTasks
                });
            } else {
                setError(
                    response.message ||
                    'Erreur lors du chargement des données'
                );
            }
        } catch (err) {
            console.error('❌ Error loading dashboard:', err);
            setError('Erreur lors de la connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DeveloperLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">
                    <div className="welcome-card">
                        <h2>
                            Bienvenue,{' '}
                            {user?.firstName || user?.username || 'Developer'}!
                        </h2>
                        <div className="user-info">
                            <p>
                                <strong>Username:</strong> {user?.userName}
                            </p>
                            <p>
                                <strong>Email:</strong> {user?.email}
                            </p>
                            <p>
                                <strong>Role:</strong> Developer
                            </p>
                        </div>
                        <p className="welcome-text">
                            Vous avez accès au tableau de bord développeur.
                            Gérez vos tâches et projets ici.
                        </p>
                    </div>

                    {error && (
                        <div className="error-message">
                            <p>⚠️ {error}</p>
                            <button onClick={fetchDashboardData}>Réessayer</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            Chargement des données...
                        </div>
                    ) : (
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <FolderKanban size={32} />
                                </div>
                                <div className="stat-content">
                                    <h3>Mes Projets</h3>
                                    <p className="stat-number">
                                        {stats.activeProjects}
                                    </p>
                                    <p className="stat-label">Projets actifs</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <CheckSquare size={32} />
                                </div>
                                <div className="stat-content">
                                    <h3>Mes Tâches</h3>
                                    <p className="stat-number">
                                        {stats.tasksInProgress}
                                    </p>
                                    <p className="stat-label">Tâches en cours</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <Code size={32} />
                                </div>
                                <div className="stat-content">
                                    <h3>Tâches terminées</h3>
                                    <p className="stat-number">
                                        {stats.completedTasks}
                                    </p>
                                    <p className="stat-label">Ce mois-ci</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <Clock size={32} />
                                </div>
                                <div className="stat-content">
                                    <h3>En retard</h3>
                                    <p className="stat-number">
                                        {stats.overdueTasks}
                                    </p>
                                    <p className="stat-label">Tâches en retard</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DeveloperLayout>
    );
};

export default DeveloperDashboard;
