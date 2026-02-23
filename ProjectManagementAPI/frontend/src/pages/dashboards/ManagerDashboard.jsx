// src/pages/dashboards/ManagerDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Users,
    UsersRound,
    FolderKanban,
    BarChart3,
    AlertTriangle,
    RefreshCw,
    Clock
} from 'lucide-react';
import userService from '../../services/userService';
import teamService from '../../services/teamService';
import projectService from '../../services/projectService';
import ManagerLayout from '../../components/layout/ManagerLayout';
import '../../styles/Dashboard.css';

const ManagerDashboard = () => {
    const { user } = useAuth();

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTeams: 0,
        totalProjects: 0,
        avgProgress: 0,
        overdueTasks: 0,
        pendingValidation: 0
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

            const [usersRes, teamsRes, projectsRes] = await Promise.all([
                userService.getAllUsers(),
                teamService.getAllTeams(),
                projectService.getAllProjects()
            ]);

            if (usersRes.success && teamsRes.success && projectsRes.success) {
                const users = usersRes.data || [];
                const teams = teamsRes.data || [];
                const projects = projectsRes.data || [];

                let totalProgress = 0;
                let projectCountWithProgress = 0;

                projects.forEach(p => {
                    if (typeof p.progress === 'number') {
                        totalProgress += p.progress;
                        projectCountWithProgress++;
                    }
                });

                const avgProgress =
                    projectCountWithProgress > 0
                        ? Math.round(totalProgress / projectCountWithProgress)
                        : 0;

                setStats({
                    totalUsers: users.length,
                    totalTeams: teams.length,
                    totalProjects: projects.length,
                    avgProgress,
                    overdueTasks: 0,
                    pendingValidation: 0
                });
            } else {
                setError('Erreur lors du chargement des données Manager');
            }
        } catch (err) {
            console.error('❌ Error loading manager dashboard:', err);
            setError('Erreur lors de la connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ManagerLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">

                    {/* ====== WELCOME CARD ====== */}
                    <div
                        className="welcome-card"
                        style={{
                            background: 'linear-gradient(135deg, #00A651 0%, #004D29 100%)',
                            color: 'white'
                        }}
                    >
                        <h2>Bienvenue, {user?.firstName || user?.username || 'Manager'}!</h2>
                        <div className="user-info">
                            <p><strong>Username:</strong> {user?.userName}</p>
                            <p><strong>Email:</strong> {user?.email}</p>
                            <p><strong>Role:</strong> Manager</p>
                        </div>
                        <p className="welcome-text" style={{ color: 'rgba(255,255,255,0.85)' }}>
                            Vous avez accès au tableau de bord global Manager.
                            Consultez les statistiques globales des projets, équipes et chefs de projet.
                        </p>
                    </div>

                    {/* ====== ERROR ====== */}
                    {error && (
                        <div className="error-message">
                            <p>⚠️ {error}</p>
                            <button onClick={fetchDashboardData}>
                                <RefreshCw size={16} />
                                Réessayer
                            </button>
                        </div>
                    )}

                    {/* ====== LOADING ====== */}
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            Chargement des statistiques globales...
                        </div>
                    ) : (
                        <>
                            {/* ====== STATS GRID ====== */}
                            <div className="stats-grid">

                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}>
                                        <Users size={32} />
                                    </div>
                                    <div className="stat-content">
                                        <h3>Utilisateurs</h3>
                                        <p className="stat-number" style={{ color: '#3B82F6' }}>
                                            {stats.totalUsers}
                                        </p>
                                        <p className="stat-label">Tous rôles confondus</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
                                        <UsersRound size={32} />
                                    </div>
                                    <div className="stat-content">
                                        <h3>Équipes</h3>
                                        <p className="stat-number" style={{ color: '#8B5CF6' }}>
                                            {stats.totalTeams}
                                        </p>
                                        <p className="stat-label">Équipes actives</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #00A651 0%, #004D29 100%)' }}>
                                        <FolderKanban size={32} />
                                    </div>
                                    <div className="stat-content">
                                        <h3>Projets</h3>
                                        <p className="stat-number" style={{ color: '#00A651' }}>
                                            {stats.totalProjects}
                                        </p>
                                        <p className="stat-label">Projets actifs</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)' }}>
                                        <BarChart3 size={32} />
                                    </div>
                                    <div className="stat-content">
                                        <h3>Progression moyenne</h3>
                                        <p className="stat-number" style={{ color: '#EC4899' }}>
                                            {stats.avgProgress}%
                                        </p>
                                        <p className="stat-label">Sur tous les projets</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)' }}>
                                        <AlertTriangle size={32} />
                                    </div>
                                    <div className="stat-content">
                                        <h3>Tâches en retard</h3>
                                        <p className="stat-number" style={{ color: '#EF4444' }}>
                                            {stats.overdueTasks}
                                        </p>
                                        <p className="stat-label">Toutes équipes confondues</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
                                        <Clock size={32} />
                                    </div>
                                    <div className="stat-content">
                                        <h3>En attente de validation</h3>
                                        <p className="stat-number" style={{ color: '#8B5CF6' }}>
                                            {stats.pendingValidation}
                                        </p>
                                        <p className="stat-label">Tâches terminées non validées</p>
                                    </div>
                                </div>
                            </div>

                            {/* ====== ACTIONS RAPIDES ====== */}
                            <div style={{ marginTop: '3rem' }}>
                                <h3 style={{
                                    color: '#00A651',
                                    marginBottom: '1.5rem',
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    paddingBottom: '0.8rem',
                                    borderBottom: '3px solid #00A651'
                                }}>
                                    Actions rapides
                                </h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '1.5rem'
                                }}>
                                    <a
                                        href="/manager/projects"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(0,166,81,0.1) 0%, rgba(0,77,41,0.05) 100%)',
                                            padding: '1.5rem',
                                            borderRadius: '16px',
                                            textDecoration: 'none',
                                            color: '#333',
                                            border: '2px solid rgba(0,166,81,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,166,81,0.2)';
                                            e.currentTarget.style.borderColor = '#00A651';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                                            e.currentTarget.style.borderColor = 'rgba(0,166,81,0.2)';
                                        }}
                                    >
                                        <FolderKanban size={28} style={{ color: '#00A651', flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                                                Gérer les projets
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                                                Voir tous les projets, PM et équipes
                                            </div>
                                        </div>
                                    </a>

                                    <a
                                        href="/manager/team"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(109,40,217,0.05) 100%)',
                                            padding: '1.5rem',
                                            borderRadius: '16px',
                                            textDecoration: 'none',
                                            color: '#333',
                                            border: '2px solid rgba(139,92,246,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(139,92,246,0.2)';
                                            e.currentTarget.style.borderColor = '#8B5CF6';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                                            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)';
                                        }}
                                    >
                                        <UsersRound size={28} style={{ color: '#8B5CF6', flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                                                Assigner les équipes
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                                                Affecter les équipes aux projets
                                            </div>
                                        </div>
                                    </a>

                                    <a
                                        href="/manager/statistics"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(190,24,93,0.05) 100%)',
                                            padding: '1.5rem',
                                            borderRadius: '16px',
                                            textDecoration: 'none',
                                            color: '#333',
                                            border: '2px solid rgba(236,72,153,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(236,72,153,0.2)';
                                            e.currentTarget.style.borderColor = '#EC4899';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                                            e.currentTarget.style.borderColor = 'rgba(236,72,153,0.2)';
                                        }}
                                    >
                                        <BarChart3 size={28} style={{ color: '#EC4899', flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                                                Statistiques globales
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                                                Graphiques et rapports détaillés
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ManagerLayout>
    );
};

export default ManagerDashboard;