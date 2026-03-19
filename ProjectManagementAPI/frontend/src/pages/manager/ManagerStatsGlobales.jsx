// src/pages/dashboards/ManagerStatistics.jsx
import { useEffect, useState } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import projectService from '../../services/projectService';
import teamService from '../../services/teamService';
import userService from '../../services/userService';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
    FolderKanban, Clock, CheckCircle,
    TrendingUp, AlertTriangle, Activity, BarChart3
} from 'lucide-react';
import '../../styles/Dashboard.css';

const getStatusBadge = (statusId, statusName) => {
    const id = parseInt(statusId);
    if (id === 1) return { label: statusName || 'Planifié', bg: '#E5E7EB', color: '#374151' };
    if (id === 2) return { label: statusName || 'En cours', bg: '#DBEAFE', color: '#1D4ED8' };
    if (id === 3) return { label: statusName || 'Terminé', bg: '#DCFCE7', color: '#15803D' };
    if (id === 4) return { label: statusName || 'Annulé', bg: '#FEE2E2', color: '#B91C1C' };
    return { label: 'N/A', bg: '#E5E7EB', color: '#374151' };
};

const PIE_COLORS = ['#6B7280', '#3B82F6', '#10B981', '#EF4444'];

const CustomTooltipPie = ({ active, payload, total }) => {
    if (active && payload?.length) {
        return (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{payload[0].name}</p>
                <p style={{ margin: 0, color: payload[0].fill }}>{payload[0].value} projet{payload[0].value > 1 ? 's' : ''}</p>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.82rem' }}>
                    {total ? Math.round((payload[0].value / total) * 100) : 0}%
                </p>
            </div>
        );
    }
    return null;
};

const CustomTooltipBar = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: 0, fontWeight: 700, marginBottom: 4 }}>{payload[0]?.payload?.fullName || label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ margin: 0, color: p.fill, fontSize: '0.9rem' }}>
                        {p.name} : <strong>{p.value}{p.name === 'Progression (%)' ? '%' : ''}</strong>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const SectionTitle = ({ children, color = '#00A651' }) => (
    <h3 style={{
        color,
        borderBottom: `3px solid ${color}`,
        paddingBottom: '0.5rem',
        marginBottom: '1.5rem',
        fontSize: '1.1rem',
        fontWeight: 700
    }}>
        {children}
    </h3>
);

const KpiCard = ({ kpi }) => (
    <div style={{
        padding: '1.2rem 1.5rem',
        borderRadius: 14,
        background: kpi.bg,
        borderLeft: `5px solid ${kpi.color}`,
        boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        transition: 'transform 0.2s, box-shadow 0.2s',
    }}
        onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07)';
        }}
    >
        <div style={{
            width: 42, height: 42,
            background: `${kpi.color}25`,
            color: kpi.color,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.3rem'
        }}>
            {kpi.icon}
        </div>
        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: kpi.color, lineHeight: 1 }}>
            {kpi.value}
        </p>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151', fontWeight: 600 }}>
            {kpi.label}
        </p>
    </div>
);

const ManagerStatistics = () => {
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [pRes, tRes, uRes] = await Promise.all([
                projectService.getAllProjects(),
                teamService.getAllTeams(),
                userService.getAllUsers(),
            ]);
            if (pRes.success) setProjects(pRes.data || []);
            if (tRes.success) setTeams(tRes.data || []);
            if (uRes.success) setUsers(uRes.data || []);
        } catch { setError('Erreur de connexion au serveur'); }
        finally { setLoading(false); }
    };

    const total = projects.length;
    const now = new Date();
    const planned = projects.filter(p => parseInt(p.projectStatusId) === 1);
    const inProgress = projects.filter(p => parseInt(p.projectStatusId) === 2);
    const done = projects.filter(p => parseInt(p.projectStatusId) === 3);
    const cancelled = projects.filter(p => parseInt(p.projectStatusId) === 4);
    const late = projects.filter(p =>
        p.endDate && new Date(p.endDate) < now
        && parseInt(p.projectStatusId) !== 3
        && parseInt(p.projectStatusId) !== 4
    );
    const avgProgress = total
        ? Math.round(projects.reduce((a, p) => a + (p.progress ?? 0), 0) / total)
        : 0;

    const pieData = [
        { name: 'Planifiés', value: planned.length },
        { name: 'En cours', value: inProgress.length },
        { name: 'Terminés', value: done.length },
        { name: 'Annulés', value: cancelled.length },
    ].filter(d => d.value > 0);

    const teamBarData = teams.map(team => {
        const tp = projects.filter(p => p.teamName === team.teamName);
        if (tp.length === 0) return null;
        return {
            name: team.teamName?.length > 14 ? team.teamName.slice(0, 14) + '…' : team.teamName,
            fullName: team.teamName,
            'Nb projets': tp.length,
            'Progression (%)': Math.round(tp.reduce((a, p) => a + (p.progress ?? 0), 0) / tp.length),
        };
    }).filter(Boolean);

    const devsByProjectData = projects
        .filter(p => p.teamName && p.teamName !== 'N/A' && p.teamName !== 'Aucune')
        .map(p => {
            const team = teams.find(t => t.teamName === p.teamName);
            const devCount = team?.memberCount ?? team?.members?.length ?? 0;
            return {
                name: p.projectName?.length > 14 ? p.projectName.slice(0, 14) + '…' : p.projectName,
                fullName: p.projectName,
                'Développeurs': devCount,
            };
        })
        .filter(d => d['Développeurs'] > 0);

    const projectsByManagerData = users
        .filter(u => u.role === 'ChefDeProjet' || u.role === 'ProjectManager')
        .map(u => {
            const displayName = u.firstName
                ? `${u.firstName} ${u.lastName || ''}`.trim()
                : u.username;
            const managed = projects.filter(
                p => p.projectManagerName === displayName || p.projectManagerId === u.userId
            );
            if (managed.length === 0) return null;
            return {
                name: displayName.length > 12 ? displayName.slice(0, 12) + '…' : displayName,
                fullName: displayName,
                'Terminés': managed.filter(p => parseInt(p.projectStatusId) === 3).length,
                'En cours': managed.filter(p => parseInt(p.projectStatusId) === 2).length,
            };
        })
        .filter(Boolean);

    const top5Late = [...late].sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0)).slice(0, 5);
    const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : 'N/A';
    const getProgressColor = v => v >= 75 ? '#10b981' : v >= 40 ? '#f59e0b' : '#ef4444';

    const kpis = [
        { label: 'Total Projets', value: total, color: '#1E40AF', bg: '#BFDBFE', icon: <FolderKanban size={22} /> },
        { label: 'En cours', value: inProgress.length, color: '#0369A1', bg: '#BAE6FD', icon: <Activity size={22} /> },
        { label: 'Terminés', value: done.length, color: '#15803D', bg: '#BBF7D0', icon: <CheckCircle size={22} /> },
        { label: 'Planifiés', value: planned.length, color: '#4B5563', bg: '#D1D5DB', icon: <FolderKanban size={22} /> },
        { label: 'En retard', value: late.length, color: '#DC2626', bg: '#FECACA', icon: <AlertTriangle size={22} /> },
        { label: 'Annulés', value: cancelled.length, color: '#B91C1C', bg: '#FECACA', icon: <Clock size={22} /> },
        { label: 'Progression moy.', value: `${avgProgress}%`, color: '#D97706', bg: '#FDE68A', icon: <TrendingUp size={22} /> },
        { label: 'Équipes actives', value: teamBarData.length, color: '#0891B2', bg: '#A5F3FC', icon: <BarChart3 size={22} /> },
    ];

    return (
        <ManagerLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">

                    {/* ✅ TITRE VISIBLE */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: '1.8rem',
                            fontWeight: 700,
                            color: '#111827',
                        }}>
                            Statistiques Globales
                        </h2>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                            Vue consolidée — KPIs, graphiques et rapports de tous les projets de la DDD
                        </p>
                    </div>

                    {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ {error}</p>}

                    {loading ? (
                        <div className="loading"><div className="spinner" />Chargement...</div>
                    ) : (
                        <>
                            {/* 1. KPI Cards */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                                gap: '1rem',
                                marginBottom: '2.5rem'
                            }}>
                                {kpis.map((kpi, i) => <KpiCard key={i} kpi={kpi} />)}
                            </div>

                            {/* 2. État d'avancement */}
                            <SectionTitle>📊 État d'avancement des projets</SectionTitle>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                <div className="stat-card" style={{ padding: '1.5rem' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', fontWeight: 700, color: '#111827' }}>Répartition par statut</h4>
                                    {pieData.length === 0 ? (
                                        <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem 0' }}>Aucune donnée</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip content={<CustomTooltipPie total={total} />} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>

                                <div className="stat-card" style={{ padding: '1.5rem' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', fontWeight: 700, color: '#111827' }}>Progression par équipe (%)</h4>
                                    {teamBarData.length === 0 ? (
                                        <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem 0' }}>Aucune équipe assignée</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={teamBarData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                                <Tooltip content={<CustomTooltipBar />} />
                                                <Bar dataKey="Progression (%)" fill="#00A651" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* 3. Développeurs affectés par projet */}
                            {devsByProjectData.length > 0 && (
                                <>
                                    <SectionTitle>👥 Développeurs affectés par projet</SectionTitle>
                                    <div className="stat-card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <BarChart data={devsByProjectData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                                <Tooltip content={<CustomTooltipBar />} />
                                                <Bar dataKey="Développeurs" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            )}

                            {/* 4. Projets par chef de projet */}
                            {projectsByManagerData.length > 0 && (
                                <>
                                    <SectionTitle>🏆 Projets réalisés par chef de projet</SectionTitle>
                                    <div className="stat-card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <BarChart data={projectsByManagerData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                                <Tooltip content={<CustomTooltipBar />} />
                                                <Bar dataKey="Terminés" fill="#10B981" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="En cours" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                                <Legend />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            )}

                            {/* 5. En retard */}
                            {top5Late.length > 0 && (
                                <>
                                    <SectionTitle color="#ef4444">⚠️ Projets en retard</SectionTitle>
                                    <div className="stat-card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
                                        <div className="table-container">
                                            <table className="data-table">
                                                <thead>
                                                    <tr><th>Projet</th><th>Équipe</th><th>Chef de projet</th><th>Date fin prévue</th><th>Progression</th></tr>
                                                </thead>
                                                <tbody>
                                                    {top5Late.map(p => (
                                                        <tr key={p.projectId}>
                                                            <td style={{ fontWeight: 600 }}>{p.projectName}</td>
                                                            <td>{p.teamName || 'Aucune'}</td>
                                                            <td>{p.projectManagerName || 'N/A'}</td>
                                                            <td style={{ color: '#ef4444' }}>{formatDate(p.endDate)}</td>
                                                            <td style={{ minWidth: 120 }}>
                                                                <div style={{ fontSize: '0.8rem', marginBottom: 3 }}>{p.progress ?? 0}%</div>
                                                                <div style={{ height: 6, borderRadius: 3, background: '#fee2e2', overflow: 'hidden' }}>
                                                                    <div style={{ height: '100%', width: `${p.progress ?? 0}%`, background: '#ef4444', borderRadius: 3 }} />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* 6. Tous les projets */}
                            <SectionTitle>📋 Tous les projets</SectionTitle>
                            <div className="stat-card" style={{ padding: '1.5rem' }}>
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr><th>Projet</th><th>Équipe</th><th>Chef de projet</th><th>Dates</th><th>Progression</th><th>Statut</th></tr>
                                        </thead>
                                        <tbody>
                                            {projects.length === 0 ? (
                                                <tr><td colSpan={6} className="no-data">Aucun projet</td></tr>
                                            ) : projects.map(p => {
                                                const status = getStatusBadge(p.projectStatusId, p.statusName);
                                                return (
                                                    <tr key={p.projectId}>
                                                        <td style={{ fontWeight: 600 }}>{p.projectName}</td>
                                                        <td>{p.teamName || 'Aucune'}</td>
                                                        <td>{p.projectManagerName || 'N/A'}</td>
                                                        <td style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                                                            <div>Début : {formatDate(p.startDate)}</div>
                                                            <div>Fin : {formatDate(p.endDate)}</div>
                                                        </td>
                                                        <td style={{ minWidth: 120 }}>
                                                            <div style={{ fontSize: '0.8rem', marginBottom: 3 }}>{p.progress ?? 0}%</div>
                                                            <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', width: `${p.progress ?? 0}%`, background: getProgressColor(p.progress ?? 0), borderRadius: 3 }} />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, background: status.bg, color: status.color }}>
                                                                {status.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
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