import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    FolderKanban,
    CheckSquare,
    Clock,
    AlertCircle,
    BarChart3,
    Users,
    TrendingUp
} from 'lucide-react';
import api from '../../services/api';
import ProjectManagerLayout from '../../components/layout/ProjectManagerLayout';
import '../../styles/Dashboard.css';
import '../../styles/DeveloperDashboard.css';

const ProjectManagerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // États
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        tasksAwaitingValidation: 0,
        activeMembers: 0
    });
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Charger les données au montage
    useEffect(() => {
        if (user?.userId) {
            fetchDashboardData();
        }
    }, [user]);

    // Récupérer les données du dashboard
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('📥 Fetching project manager dashboard...');
            const response = await api.get('/projectmanager/dashboard');
            console.log('✅ Dashboard response:', response.data);

            if (response.data.success) {
                setStats(response.data.data.stats || {
                    totalProjects: 0,
                    totalTasks: 0,
                    completedTasks: 0,
                    pendingTasks: 0,
                    tasksAwaitingValidation: 0,
                    activeMembers: 0
                });
                setProjects(response.data.data.projects || []);
            } else {
                setError(response.data.message || 'Erreur lors du chargement des données');
            }
        } catch (err) {
            console.error('❌ Error loading dashboard:', err);
            setError('Erreur lors de la connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

   

    // Obtenir la classe CSS selon le pourcentage
    const getProgressClass = (progress) => {
        if (progress >= 100) return 'completed';
        if (progress >= 66) return 'high';
        if (progress >= 33) return 'medium';
        return 'low';
    };

    return (
        <ProjectManagerLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">
                    {/* Welcome Card */}
                    <div className="welcome-card">
                        <h2>Bienvenue, {user?.firstName || user?.username || 'Project Manager'}!</h2>
                        <div className="user-info">
                            <p><strong>Username:</strong> {user?.username}</p>
                            <p><strong>Email:</strong> {user?.email}</p>
                            <p><strong>Role:</strong> Project Manager</p>
                        </div>
                        <p className="welcome-text">
                            Gérez vos projets, assignez des tâches et suivez la progression de votre équipe.
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
                                        <p className="stat-number">{stats.totalProjects}</p>
                                        <p className="stat-label">Projets actifs</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <CheckSquare size={32} />
                                    </div>
                                    <div className="stat-content">
                                        <h3>Tâches Totales</h3>
                                        <p className="stat-number">{stats.totalTasks}</p>
                                        <p className="stat-label">Toutes les tâches</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <TrendingUp size={32} />
                                    </div>
                                    <div className="stat-content">
                                        <h3>Terminées</h3>
                                        <p className="stat-number">{stats.completedTasks}</p>
                                        <p className="stat-label">Tâches complétées</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <AlertCircle size={32} />
                                    </div>
                                    <div className="stat-content">
                                        <h3>Validation</h3>
                                        <p className="stat-number">{stats.tasksAwaitingValidation}</p>
                                        <p className="stat-label">En attente</p>
                                    </div>
                                </div>
                            </div>

                            {/* Projects Section */}
                            {projects.length > 0 && (
                                <div className="projects-section" style={{ marginTop: '2rem' }}>
                                    <div className="section-header" style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <h2 style={{
                                            fontSize: '1.8rem',
                                            color: 'var(--mobilis-green)',
                                            fontWeight: '700'
                                        }}>
                                            📊 Mes Projets
                                        </h2>
                                        <button
                                            onClick={() => navigate('/project-manager/projects')}
                                            style={{
                                                padding: '0.6rem 1.2rem',
                                                background: 'var(--mobilis-green)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                        >
                                            Voir tous
                                        </button>
                                    </div>

                                    <div className="projects-grid" style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                        gap: '1.5rem'
                                    }}>
                                        {projects.slice(0, 6).map((project) => (
                                            <div
                                                key={project.projectId}
                                                className="project-card"
                                                style={{
                                                    background: 'white',
                                                    borderRadius: '16px',
                                                    padding: '1.5rem',
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                                    transition: 'all 0.3s',
                                                    cursor: 'pointer',
                                                    border: '1px solid #e5e7eb'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 166, 81, 0.15)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                                                }}
                                            >
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    marginBottom: '1rem'
                                                }}>
                                                    <h3 style={{
                                                        fontSize: '1.2rem',
                                                        color: '#1f2937',
                                                        fontWeight: '700',
                                                        margin: 0
                                                    }}>
                                                        {project.projectName}
                                                    </h3>
                                                    {project.isDelayed && (
                                                        <span className="overdue-badge">
                                                            <Clock size={14} />
                                                            RETARD
                                                        </span>
                                                    )}
                                                </div>

                                                <p style={{
                                                    fontSize: '0.9rem',
                                                    color: '#6b7280',
                                                    marginBottom: '1rem',
                                                    lineHeight: '1.5'
                                                }}>
                                                    {project.description || 'Aucune description'}
                                                </p>

                                                <div className="task-progress-section">
                                                    <div className="task-progress-bar-bg">
                                                        <div
                                                            className={`task-progress-bar-fill progress-${getProgressClass(project.progress)}`}
                                                            style={{ width: `${project.progress}%` }}
                                                        >
                                                            <div className="progress-shimmer"></div>
                                                        </div>
                                                    </div>
                                                    <span className="task-progress-text">
                                                        {project.progress}% - {project.completedTasks}/{project.totalTasks} tâches
                                                    </span>
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    gap: '0.5rem',
                                                    marginTop: '1rem',
                                                    fontSize: '0.85rem',
                                                    color: '#6b7280'
                                                }}>
                                                    <span>✅ {project.completedTasks}</span>
                                                    <span>🔄 {project.inProgressTasks}</span>
                                                    <span>📝 {project.todoTasks}</span>
                                                </div>

                                               
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No Projects Message */}
                            {!loading && projects.length === 0 && (
                                <div className="welcome-card" style={{ marginTop: '2rem', textAlign: 'center' }}>
                                    <FolderKanban size={48} style={{ color: 'var(--mobilis-green)', margin: '0 auto 1rem' }} />
                                    <h3 style={{ color: '#6b7280' }}>Aucun projet trouvé</h3>
                                    <p style={{ color: '#9ca3af' }}>
                                        Vous n'avez pas encore de projets assignés.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </ProjectManagerLayout>
    );
};

export default ProjectManagerDashboard;
