// src/pages/reporting/ReportingDashboard.jsx
// src/pages/dashboards/ReportingDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, UsersRound, FolderKanban, FileText, RefreshCw } from 'lucide-react';
import userService from '../../services/userService';
import teamService from '../../services/teamService';
import projectService from '../../services/projectService';
import edbService from '../../services/edbService';
import ReportingLayout from '../../components/layout/ReportingLayout';
import '../../styles/Dashboard.css';
import '../../styles/ReportingDashboard.css';

const ReportingDashboard = () => {
    const { user } = useAuth();

    // États
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalTeams: 0,
        activeTeams: 0,
        totalProjects: 0,
        projectsWithTeams: 0,
        totalEdbs: 0,
        unassignedEdbs: 0
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

            const [usersRes, teamsRes, projectsRes, edbsRes] = await Promise.all([
                userService.getAllUsers(),
                teamService.getAllTeams(),
                projectService.getAllProjects(),
                edbService.getAllEDBs()
            ]);

            if (usersRes.success && teamsRes.success && projectsRes.success && edbsRes.success) {
                const users = usersRes.data || [];
                const teams = teamsRes.data || [];
                const projects = projectsRes.data || [];
                const edbs = edbsRes.data || [];
               
                let usersInTeamsCount = 0;
                const userIdsInTeams = new Set();

                teams.forEach(team => {
                    // Si l'équipe a des membres
                    if (team.members && Array.isArray(team.members)) {
                        team.members.forEach(member => {
                            if (member.userId) {
                                userIdsInTeams.add(member.userId);
                            }
                        });
                    }
                    // Si l'équipe a memberCount
                    if (team.memberCount && team.memberCount > 0) {
                        usersInTeamsCount += team.memberCount;
                    }
                });

                // ✅ Utilise le Set si disponible, sinon memberCount
                const finalUsersInTeams = userIdsInTeams.size > 0
                    ? userIdsInTeams.size
                    : usersInTeamsCount;

                setStats({
                    totalUsers: users.length,
                    activeUsers: finalUsersInTeams,  // ✅ Utilisateurs dans des équipes
                 
                    totalTeams: teams.length,
                    activeTeams: teams.filter(t => t.isActive !== false).length,
                    totalProjects: projects.length,
                    projectsWithTeams: projects.filter(p =>
                        p.teamName && p.teamName !== 'N/A' && p.teamName !== 'Aucune équipe'
                    ).length, 
                    totalEdbs: edbs.length,
                    unassignedEdbs: edbs.filter(e => e.projectId === 0).length
                });
            } else {
                setError('Erreur lors du chargement des données');
            }
        } catch (err) {
            console.error('❌ Error loading dashboard:', err);
            setError('Erreur lors de la connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ReportingLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">
                    {/* Welcome Card */}
                    <div className="welcome-card">
                        <h2>Bienvenue, {user?.firstName || user?.username || 'Reporting'}!</h2>
                        <div className="user-info">
                            <p><strong>Username:</strong> {user?.userName}</p>
                            <p><strong>Email:</strong> {user?.email}</p>
                            <p><strong>Role:</strong> Reporting</p>
                        </div>
                        <p className="welcome-text">
                            Vous avez accès au tableau de bord reporting.
                            Gérez les utilisateurs, équipes, projets et EDB ici.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-message">
                            <p>⚠️ {error}</p>
                            <button onClick={fetchDashboardData}>
                                <RefreshCw size={16} />
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
                            {/* Users Stats */}
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}>
                                    <Users size={32} />
                                </div>
                                <div className="stat-content">
                                    <h3>Utilisateurs</h3>
                                    <p className="stat-number" style={{ color: '#3B82F6' }}>{stats.totalUsers}</p>
                                    <p className="stat-label">{stats.activeUsers} actifs</p>
                                </div>
                            </div>

                            {/* Teams Stats */}
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
                                    <UsersRound size={32} />
                                </div>
                                <div className="stat-content">
                                    <h3>Équipes</h3>
                                    <p className="stat-number" style={{ color: '#8B5CF6' }}>{stats.totalTeams}</p>
                                    <p className="stat-label">{stats.activeTeams} actives</p>
                                </div>
                            </div>

                            {/* Projects Stats */}
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #00A651 0%, #004D29 100%)' }}>
                                    <FolderKanban size={32} />
                                </div>
                                <div className="stat-content">
                                    <h3>Projets</h3>
                                    <p className="stat-number" style={{ color: '#00A651' }}>{stats.totalProjects}</p>
                                    <p className="stat-label">{stats.projectsWithTeams} avec équipe</p>
                                </div>
                            </div>

                            {/* EDB Stats */}
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
                                    <FileText size={32} />
                                </div>
                                <div className="stat-content">
                                    <h3>EDB</h3>
                                    <p className="stat-number" style={{ color: '#F59E0B' }}>{stats.totalEdbs}</p>
                                    <p className="stat-label">{stats.unassignedEdbs} non assignés</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div style={{ marginTop: '3rem' }}>
                        <h3 style={{
                            color: '#00A651',
                            marginBottom: '1.5rem',
                            fontSize: '1.5rem',
                            fontWeight: '700'
                        }}>
                            Actions rapides
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            <a href="/reporting/users" style={{
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.05) 100%)',
                                padding: '1.5rem',
                                borderRadius: '16px',
                                textDecoration: 'none',
                                color: '#333',
                                border: '2px solid rgba(59, 130, 246, 0.2)',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <Users size={24} style={{ color: '#3B82F6' }} />
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Gérer les utilisateurs</div>
                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Créer, modifier, désactiver</div>
                                </div>
                            </a>

                            <a href="/reporting/teams" style={{
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(109, 40, 217, 0.05) 100%)',
                                padding: '1.5rem',
                                borderRadius: '16px',
                                textDecoration: 'none',
                                color: '#333',
                                border: '2px solid rgba(139, 92, 246, 0.2)',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <UsersRound size={24} style={{ color: '#8B5CF6' }} />
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Gérer les équipes</div>
                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Créer, assigner des membres</div>
                                </div>
                            </a>

                            <a href="/reporting/projects" style={{
                                background: 'linear-gradient(135deg, rgba(0, 166, 81, 0.1) 0%, rgba(0, 77, 41, 0.05) 100%)',
                                padding: '1.5rem',
                                borderRadius: '16px',
                                textDecoration: 'none',
                                color: '#333',
                                border: '2px solid rgba(0, 166, 81, 0.2)',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <FolderKanban size={24} style={{ color: '#00A651' }} />
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Gérer les projets</div>
                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Créer, assigner des équipes</div>
                                </div>
                            </a>

                            <a href="/reporting/edb" style={{
                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
                                padding: '1.5rem',
                                borderRadius: '16px',
                                textDecoration: 'none',
                                color: '#333',
                                border: '2px solid rgba(245, 158, 11, 0.2)',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <FileText size={24} style={{ color: '#F59E0B' }} />
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Gérer les EDB</div>
                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Uploader, télécharger, assigner</div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </ReportingLayout>
    );
};

export default ReportingDashboard;
