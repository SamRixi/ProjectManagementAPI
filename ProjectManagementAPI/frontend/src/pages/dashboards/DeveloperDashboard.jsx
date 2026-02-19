import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Code, CheckSquare, FolderKanban, Clock } from 'lucide-react';
import developerService from '../../services/developerService';
import DeveloperLayout from '../../components/layout/DeveloperLayout';
import '../../styles/Dashboard.css';
import '../../styles/DeveloperDashboard.css';

const DeveloperDashboard = () => {
    const { user } = useAuth();

    // États
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

            const response = await developerService.getDashboardData();

            if (response.success) {
                setStats(response.data.stats || {
                    activeProjects: 0,
                    tasksInProgress: 0,
                    completedTasks: 0,
                    overdueTasks: 0,
                    totalTasks: 0,
                    pendingTasks: 0
                });
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

    return (
        <DeveloperLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">
                    {/* Welcome Card */}
                    <div className="welcome-card">
                        <h2>Bienvenue, {user?.firstName || user?.username || 'Developer'}!</h2>
                        <div className="user-info">
                            <p><strong>Username:</strong> {user?.userName}</p>
                            <p><strong>Email:</strong> {user?.email}</p>
                            <p><strong>Role:</strong> Developer</p>
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
                        /* Stats Grid */
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
                    )}
                </div>
            </div>
        </DeveloperLayout>
    );
};

export default DeveloperDashboard;
