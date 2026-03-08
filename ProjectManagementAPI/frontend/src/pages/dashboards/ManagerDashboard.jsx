// src/pages/dashboards/ManagerDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Users, UsersRound, FolderKanban, BarChart3,
    AlertTriangle, Clock, CheckCircle, TrendingUp, Activity
} from 'lucide-react';
import userService from '../../services/userService';
import teamService from '../../services/teamService';
import projectService from '../../services/projectService';
import ManagerLayout from '../../components/layout/ManagerLayout';
import '../../styles/Dashboard.css';

// ✅ Même logique que ReportingProjects
const getStatusBadge = (statusId, statusName) => {
    const id = parseInt(statusId);
    if (id === 1) return { label: statusName || 'Planifié', bg: '#E5E7EB', color: '#374151' };
    if (id === 2) return { label: statusName || 'En cours', bg: '#DBEAFE', color: '#1D4ED8' };
    if (id === 3) return { label: statusName || 'Terminé', bg: '#DCFCE7', color: '#15803D' };
    if (id === 4) return { label: statusName || 'Annulé', bg: '#FEE2E2', color: '#B91C1C' };
    return { label: statusName || 'N/A', bg: '#E5E7EB', color: '#374151' };
};

const ManagerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0, totalTeams: 0, totalProjects: 0,
        avgProgress: 0, lateProjects: 0,
        planned: 0, inProgress: 0, done: 0, cancelled: 0
    });
    const [recentProjects, setRecentProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { fetchDashboardData(); }, []);

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
                const projects = projectsRes.data || [];
                const now = new Date();

                const avgProgress = projects.length
                    ? Math.round(projects.reduce((a, p) => a + (p.progress ?? 0), 0) / projects.length)
                    : 0;

                const lateProjects = projects.filter(
                    p => p.endDate && new Date(p.endDate) < now
                        && (p.projectStatusId ?? 0) !== 3
                        && (p.projectStatusId ?? 0) !== 4
                ).length;

                setStats({
                    totalUsers: (usersRes.data || []).length,
                    totalTeams: (teamsRes.data || []).length,
                    totalProjects: projects.length,
                    avgProgress,
                    lateProjects,
                    planned: projects.filter(p => parseInt(p.projectStatusId) === 1).length,
                    inProgress: projects.filter(p => parseInt(p.projectStatusId) === 2).length,
                    done: projects.filter(p => parseInt(p.projectStatusId) === 3).length,
                    cancelled: projects.filter(p => parseInt(p.projectStatusId) === 4).length,
                });

                // 5 projets les plus récents
                setRecentProjects(
                    [...projects]
                        .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0))
                        .slice(0, 5)
                );
            } else {
                setError('Erreur lors du chargement des données');
            }
        } catch {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const kpis = [
        { icon: <Users size={28} />, label: 'Utilisateurs', value: stats.totalUsers, color: '#3B82F6', gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', sub: 'Tous rôles confondus' },
        { icon: <UsersRound size={28} />, label: 'Équipes', value: stats.totalTeams, color: '#8B5CF6', gradient: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', sub: 'Équipes actives' },
        { icon: <FolderKanban size={28} />, label: 'Projets', value: stats.totalProjects, color: '#00A651', gradient: 'linear-gradient(135deg,#00A651,#004D29)', sub: 'Total projets' },
        { icon: <TrendingUp size={28} />, label: 'Progression moy.', value: `${stats.avgProgress}%`, color: '#EC4899', gradient: 'linear-gradient(135deg,#EC4899,#BE185D)', sub: 'Sur tous les projets' },
        { icon: <AlertTriangle size={28} />, label: 'En retard', value: stats.lateProjects, color: '#EF4444', gradient: 'linear-gradient(135deg,#EF4444,#B91C1C)', sub: 'Projets en retard' },
        { icon: <Activity size={28} />, label: 'En cours', value: stats.inProgress, color: '#F59E0B', gradient: 'linear-gradient(135deg,#F59E0B,#D97706)', sub: 'Projets actifs' },
        { icon: <CheckCircle size={28} />, label: 'Terminés', value: stats.done, color: '#10B981', gradient: 'linear-gradient(135deg,#10B981,#059669)', sub: 'Projets clôturés' },
        { icon: <Clock size={28} />, label: 'Planifiés', value: stats.planned, color: '#6B7280', gradient: 'linear-gradient(135deg,#6B7280,#374151)', sub: 'Non démarrés' },
    ];

    const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : 'N/A';

    return (
        <ManagerLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">

                    {/* WELCOME */}
                    <div className="welcome-card">
                        <h2>Bienvenue, {user?.firstName || user?.username || 'Manager'} !</h2>
                        <div className="user-info">
                            <p><strong>Username:</strong> {user?.userName || user?.username}</p>
                            <p><strong>Email:</strong> {user?.email}</p>
                            <p><strong>Rôle:</strong> Manager</p>
                        </div>
                        <p className="welcome-text">
                            Tableau de bord global — Consultez les KPIs, gérez les projets
                            et supervisez l'avancement de toutes les équipes de la DDD.
                        </p>
                    </div>

                    {error && (
                        <div className="error-message">
                            <p>⚠️ {error}</p>
                            <button onClick={fetchDashboardData}>Réessayer</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="loading"><div className="spinner" />Chargement...</div>
                    ) : (
                        <>
                            {/* KPI GRID */}
                            <div className="stats-grid">
                                {kpis.map((kpi, i) => (
                                    <div className="stat-card" key={i}>
                                        <div className="stat-icon" style={{ background: kpi.gradient }}>
                                            {kpi.icon}
                                        </div>
                                        <div className="stat-content">
                                            <h3>{kpi.label}</h3>
                                            <p className="stat-number" style={{ color: kpi.color }}>{kpi.value}</p>
                                            <p className="stat-label">{kpi.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* RÉPARTITION PAR STATUT */}
                            <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                                <h3 style={{ color: '#00A651', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 700, borderBottom: '3px solid #00A651', paddingBottom: '0.5rem' }}>
                                    Répartition des projets par statut
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {[
                                        { label: 'Planifiés', value: stats.planned, color: '#6B7280', bg: '#E5E7EB' },
                                        { label: 'En cours', value: stats.inProgress, color: '#1D4ED8', bg: '#DBEAFE' },
                                        { label: 'Terminés', value: stats.done, color: '#15803D', bg: '#DCFCE7' },
                                        { label: 'Annulés', value: stats.cancelled, color: '#B91C1C', bg: '#FEE2E2' },
                                    ].map((item, i) => (
                                        <div key={i} style={{ background: item.bg, borderRadius: 12, padding: '1.25rem', border: `2px solid ${item.color}30` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span style={{ fontWeight: 600, color: item.color }}>{item.label}</span>
                                                <span style={{ fontWeight: 700, fontSize: '1.4rem', color: item.color }}>{item.value}</span>
                                            </div>
                                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: stats.totalProjects ? `${(item.value / stats.totalProjects) * 100}%` : '0%',
                                                    background: item.color, borderRadius: 3, transition: 'width 0.5s'
                                                }} />
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: item.color, marginTop: 4 }}>
                                                {stats.totalProjects ? Math.round((item.value / stats.totalProjects) * 100) : 0}% du total
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PROJETS RÉCENTS */}
                            {recentProjects.length > 0 && (
                                <div>
                                    <h3 style={{ color: '#00A651', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 700, borderBottom: '3px solid #00A651', paddingBottom: '0.5rem' }}>
                                        Projets récents
                                    </h3>
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Projet</th>
                                                    <th>Chef de projet</th>
                                                    <th>Équipe</th>
                                                    <th>Progression</th>
                                                    <th>Statut</th>
                                                    <th>Date fin</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentProjects.map(p => {
                                                    const status = getStatusBadge(p.projectStatusId, p.statusName);
                                                    return (
                                                        <tr key={p.projectId}>
                                                            <td style={{ fontWeight: 600 }}>{p.projectName}</td>
                                                            <td>{p.projectManagerName || 'Non assigné'}</td>
                                                            <td>{p.teamName || 'Aucune'}</td>
                                                            <td style={{ minWidth: 120 }}>
                                                                <div style={{ fontSize: '0.8rem', marginBottom: 3 }}>{p.progress ?? 0}%</div>
                                                                <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                                                                    <div style={{
                                                                        height: '100%', width: `${p.progress ?? 0}%`,
                                                                        background: (p.progress ?? 0) >= 75 ? '#10b981' : (p.progress ?? 0) >= 40 ? '#f59e0b' : '#ef4444',
                                                                        borderRadius: 3, transition: 'width 0.5s'
                                                                    }} />
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span style={{
                                                                    padding: '4px 10px', borderRadius: 20,
                                                                    fontSize: '0.8rem', fontWeight: 600,
                                                                    background: status.bg, color: status.color
                                                                }}>
                                                                    {status.label}
                                                                </span>
                                                            </td>
                                                            <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>{formatDate(p.endDate)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ACTIONS RAPIDES */}
                            <div style={{ marginTop: '2.5rem' }}>
                                <h3 style={{ color: '#00A651', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 700, borderBottom: '3px solid #00A651', paddingBottom: '0.5rem' }}>
                                    Actions rapides
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                    {[
                                        { href: '/manager/projects', icon: <FolderKanban size={28} />, title: 'Gérer les projets', sub: 'Créer, modifier, annuler des projets', color: '#00A651', bg: 'rgba(0,166,81,0.08)', border: 'rgba(0,166,81,0.25)' },
                                        { href: '/manager/team', icon: <UsersRound size={28} />, title: 'Assigner les équipes', sub: 'Affecter les équipes aux projets', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)' },
                                        { href: '/manager/statistics', icon: <BarChart3 size={28} />, title: 'Statistiques globales', sub: 'Graphiques et rapports de la DDD', color: '#EC4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.25)' },
                                    ].map((action, i) => (
                                        <a key={i} href={action.href} style={{
                                            background: action.bg, padding: '1.5rem', borderRadius: 16,
                                            textDecoration: 'none', color: '#333',
                                            border: `2px solid ${action.border}`,
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            transition: 'all 0.3s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = action.color; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = action.border; }}
                                        >
                                            <div style={{ color: action.color }}>{action.icon}</div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{action.title}</div>
                                                <div style={{ fontSize: '0.88rem', color: '#666', marginTop: 4 }}>{action.sub}</div>
                                            </div>
                                        </a>
                                    ))}
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