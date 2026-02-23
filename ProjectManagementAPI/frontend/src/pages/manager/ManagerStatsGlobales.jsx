import { useEffect, useState } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import projectService from '../../services/projectService';
import teamService from '../../services/teamService';
import {
    BarChart3,
    FolderKanban,
    Users,
    Clock,
    CheckCircle,
    TrendingUp,
    AlertTriangle,
    Activity,
} from 'lucide-react';
import '../../styles/Dashboard.css';

const ManagerStatistics = () => {
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [pRes, tRes] = await Promise.all([
                projectService.getAllProjects(),
                teamService.getAllTeams(),
            ]);
            if (pRes.success) setProjects(pRes.data || []);
            if (tRes.success) setTeams(tRes.data || []);
        } catch (e) {
            console.error('ManagerStatistics error:', e);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    // ─── Calculs globaux ───────────────────────────────────────────
    const total = projects.length;
    const avgProgress = total
        ? Math.round(projects.reduce((a, p) => a + (p.progress ?? 0), 0) / total)
        : 0;

    const isLate = (p) =>
        p.endDate && new Date(p.endDate) < new Date() && (p.progress ?? 0) < 100;

    const lateProjects = projects.filter(isLate);
    const completedProjects = projects.filter(p => (p.progress ?? 0) === 100);
    const inProgressProjects = projects.filter(
        p => (p.progress ?? 0) > 0 && (p.progress ?? 0) < 100
    );
    const notStartedProjects = projects.filter(p => (p.progress ?? 0) === 0);
    const withTeam = projects.filter(p => p.teamName && p.teamName !== 'N/A');

    // ─── Stats par équipe ──────────────────────────────────────────
    const statsByTeam = teams.map(team => {
        const teamProjects = projects.filter(
            p => p.teamName === team.teamName
        );
        const teamAvg = teamProjects.length
            ? Math.round(
                teamProjects.reduce((a, p) => a + (p.progress ?? 0), 0) /
                teamProjects.length
            )
            : 0;
        return {
            teamName: team.teamName,
            count: teamProjects.length,
            avgProgress: teamAvg,
            lateCount: teamProjects.filter(isLate).length,
        };
    }).filter(t => t.count > 0);

    // ─── Top 5 projets en retard ───────────────────────────────────
    const top5Late = lateProjects
        .sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0))
        .slice(0, 5);

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString('fr-FR') : 'N/A';

    const getProgressColor = (v) => {
        if (v >= 75) return '#10b981';
        if (v >= 40) return '#f59e0b';
        return '#ef4444';
    };

    // ─── KPI cards config ─────────────────────────────────────────
    const kpis = [
        { label: 'Total Projets', value: total, color: '#111827', icon: <FolderKanban size={24} /> },
        { label: 'En cours', value: inProgressProjects.length, color: '#3b82f6', icon: <Activity size={24} /> },
        { label: 'Terminés', value: completedProjects.length, color: '#10b981', icon: <CheckCircle size={24} /> },
        { label: 'Non démarrés', value: notStartedProjects.length, color: '#6b7280', icon: <FolderKanban size={24} /> },
        { label: 'En retard', value: lateProjects.length, color: '#ef4444', icon: <AlertTriangle size={24} /> },
        { label: 'Avec équipe', value: withTeam.length, color: '#8b5cf6', icon: <Users size={24} /> },
        { label: 'Progression moy.', value: `${avgProgress}%`, color: '#f59e0b', icon: <TrendingUp size={24} /> },
        { label: 'Équipes actives', value: statsByTeam.length, color: '#06b6d4', icon: <BarChart3 size={24} /> },
    ];

    return (
        <ManagerLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">

                    {/* HEADER */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>
                            Statistiques Globales
                        </h2>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                            Vue consolidée de tous les projets de la DDD
                        </p>
                    </div>

                    {error && (
                        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ {error}</p>
                    )}

                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            Chargement des statistiques...
                        </div>
                    ) : (
                        <>
                            {/* ── KPI CARDS ── */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                                gap: '1rem',
                                marginBottom: '2.5rem'
                            }}>
                                {kpis.map((kpi, i) => (
                                    <div key={i} className="stat-card" style={{ padding: '1.5rem' }}>
                                        <div style={{
                                            width: 44, height: 44,
                                            background: `${kpi.color}20`,
                                            color: kpi.color,
                                            borderRadius: 10,
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '0.75rem'
                                        }}>
                                            {kpi.icon}
                                        </div>
                                        <p style={{
                                            margin: 0, fontSize: '1.6rem',
                                            fontWeight: 700, color: kpi.color
                                        }}>
                                            {kpi.value}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>
                                            {kpi.label}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* ── RÉPARTITION VISUELLE ── */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1.5rem',
                                marginBottom: '2.5rem'
                            }}>
                                {/* Répartition par statut */}
                                <div className="stat-card" style={{ padding: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 700 }}>
                                        📊 Répartition par statut
                                    </h3>
                                    {[
                                        { label: 'Terminés', count: completedProjects.length, color: '#10b981' },
                                        { label: 'En cours', count: inProgressProjects.length, color: '#3b82f6' },
                                        { label: 'Non démarrés', count: notStartedProjects.length, color: '#6b7280' },
                                        { label: 'En retard', count: lateProjects.length, color: '#ef4444' },
                                    ].map((item, i) => (
                                        <div key={i} style={{ marginBottom: '0.85rem' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '0.85rem', marginBottom: 4
                                            }}>
                                                <span style={{ color: '#374151' }}>{item.label}</span>
                                                <span style={{ fontWeight: 600, color: item.color }}>
                                                    {item.count} / {total}
                                                </span>
                                            </div>
                                            <div style={{
                                                height: 8, borderRadius: 4,
                                                background: '#e5e7eb', overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: total ? `${(item.count / total) * 100}%` : '0%',
                                                    background: item.color,
                                                    borderRadius: 4,
                                                    transition: 'width 0.5s'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Stats par équipe */}
                                <div className="stat-card" style={{ padding: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 700 }}>
                                        👥 Progression par équipe
                                    </h3>
                                    {statsByTeam.length === 0 ? (
                                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                            Aucune équipe assignée
                                        </p>
                                    ) : (
                                        statsByTeam.map((team, i) => (
                                            <div key={i} style={{ marginBottom: '0.85rem' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: '0.85rem', marginBottom: 4
                                                }}>
                                                    <span style={{ color: '#374151' }}>
                                                        {team.teamName}
                                                        <span style={{
                                                            marginLeft: 6, fontSize: '0.75rem',
                                                            color: '#6b7280'
                                                        }}>
                                                            ({team.count} projet{team.count > 1 ? 's' : ''})
                                                        </span>
                                                    </span>
                                                    <span style={{
                                                        fontWeight: 600,
                                                        color: getProgressColor(team.avgProgress)
                                                    }}>
                                                        {team.avgProgress}%
                                                    </span>
                                                </div>
                                                <div style={{
                                                    height: 8, borderRadius: 4,
                                                    background: '#e5e7eb', overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${team.avgProgress}%`,
                                                        background: getProgressColor(team.avgProgress),
                                                        borderRadius: 4,
                                                        transition: 'width 0.5s'
                                                    }} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* ── TOP 5 PROJETS EN RETARD ── */}
                            {top5Late.length > 0 && (
                                <div className="stat-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                                    <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>
                                        ⚠️ Projets en retard
                                    </h3>
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Projet</th>
                                                    <th>Équipe</th>
                                                    <th>Chef de projet</th>
                                                    <th>Date fin prévue</th>
                                                    <th>Progression</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {top5Late.map(p => (
                                                    <tr key={p.projectId}>
                                                        <td style={{ fontWeight: 600 }}>{p.projectName}</td>
                                                        <td>{p.teamName || 'Aucune'}</td>
                                                        <td>{p.projectManagerName || 'N/A'}</td>
                                                        <td style={{ color: '#ef4444' }}>
                                                            {formatDate(p.endDate)}
                                                        </td>
                                                        <td style={{ minWidth: 120 }}>
                                                            <div style={{ fontSize: '0.8rem', marginBottom: 3 }}>
                                                                {p.progress ?? 0}%
                                                            </div>
                                                            <div style={{
                                                                height: 6, borderRadius: 3,
                                                                background: '#fee2e2', overflow: 'hidden'
                                                            }}>
                                                                <div style={{
                                                                    height: '100%',
                                                                    width: `${p.progress ?? 0}%`,
                                                                    background: '#ef4444',
                                                                    borderRadius: 3
                                                                }} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ── TOUS LES PROJETS ── */}
                            <div className="stat-card" style={{ padding: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 700 }}>
                                    📋 Tous les projets
                                </h3>
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Projet</th>
                                                <th>Équipe</th>
                                                <th>Chef de projet</th>
                                                <th>Dates</th>
                                                <th>Progression</th>
                                                <th>Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projects.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="no-data">
                                                        Aucun projet trouvé
                                                    </td>
                                                </tr>
                                            ) : (
                                                projects.map(p => (
                                                    <tr key={p.projectId}>
                                                        <td style={{ fontWeight: 600 }}>
                                                            {p.projectName}
                                                        </td>
                                                        <td>{p.teamName || 'Aucune'}</td>
                                                        <td>{p.projectManagerName || 'N/A'}</td>
                                                        <td style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                                                            <div>Début : {formatDate(p.startDate)}</div>
                                                            <div>Fin : {formatDate(p.endDate)}</div>
                                                        </td>
                                                        <td style={{ minWidth: 120 }}>
                                                            <div style={{ fontSize: '0.8rem', marginBottom: 3 }}>
                                                                {p.progress ?? 0}%
                                                            </div>
                                                            <div style={{
                                                                height: 6, borderRadius: 3,
                                                                background: '#e5e7eb', overflow: 'hidden'
                                                            }}>
                                                                <div style={{
                                                                    height: '100%',
                                                                    width: `${p.progress ?? 0}%`,
                                                                    background: getProgressColor(p.progress ?? 0),
                                                                    borderRadius: 3
                                                                }} />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge ${(p.progress ?? 0) === 100
                                                                    ? 'active'
                                                                    : isLate(p)
                                                                        ? 'inactive'
                                                                        : 'pending'
                                                                }`}>
                                                                {(p.progress ?? 0) === 100
                                                                    ? '✅ Terminé'
                                                                    : isLate(p)
                                                                        ? '⚠️ En retard'
                                                                        : '🔵 En cours'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ManagerLayout>
    );
};

export default ManagerStatistics;
