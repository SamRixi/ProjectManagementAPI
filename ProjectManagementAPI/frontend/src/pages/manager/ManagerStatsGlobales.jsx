// src/pages/dashboards/ManagerStatistics.jsx
import { useEffect, useState } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import projectService from '../../services/projectService';
import teamService from '../../services/teamService';
import userService from '../../services/userService';
import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip, Legend,
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

const getProgressColor = v => v >= 75 ? '#10b981' : v >= 40 ? '#f59e0b' : '#ef4444';

const CustomTooltipBar = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: 0, fontWeight: 700, marginBottom: 4 }}>{payload[0]?.payload?.fullName || label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ margin: 0, color: p.fill || p.color, fontSize: '0.9rem' }}>
                        {p.name} : <strong>{p.value}{p.name === 'Progression (%)' ? '%' : ''}</strong>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const CustomTooltipProgression = ({ active, payload }) => {
    if (active && payload?.length) {
        const d = payload[0].payload;
        const status = getStatusBadge(d.statusId, d.statusName);
        return (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: 0, fontWeight: 700, marginBottom: 4, fontSize: '0.85rem' }}>{d.fullName}</p>
                <p style={{ margin: 0, color: '#00A651', fontSize: '0.88rem' }}>
                    Progression : <strong>{d['Progression']}%</strong>
                </p>
                <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, background: status.bg, color: status.color }}>
                    {status.label}
                </span>
            </div>
        );
    }
    return null;
};

const CustomTooltipDevs = ({ active, payload }) => {
    if (active && payload?.length) {
        const d = payload[0].payload;
        return (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: 0, fontWeight: 700, marginBottom: 4 }}>{d.fullName}</p>
                <p style={{ margin: 0, color: '#8B5CF6', fontSize: '0.9rem' }}>
                    Développeurs : <strong>{d['Développeurs']}</strong>
                </p>
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

    // Chart 1 : Progression par projet (barres VERTICALES)
    const progressionData = projects.map(p => ({
        name: p.projectName?.length > 14 ? p.projectName.slice(0, 14) + '…' : p.projectName,
        fullName: p.projectName,
        'Progression': p.progress ?? 0,
        statusId: p.projectStatusId,
        statusName: p.statusName,
    }));

    // Chart 2 : Développeurs par projet
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

    // Chart 3 : Projets par chef de projet
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

    const activeTeamsCount = teams.filter(t =>
        projects.some(p => p.teamName === t.teamName)
    ).length;

    const kpis = [
        { label: 'Total Projets', sub: 'Projets créés', value: total, color: '#1E40AF', gradient: 'linear-gradient(135deg,#1E40AF,#1D4ED8)', icon: <FolderKanban size={28} /> },
        { label: 'En cours', sub: 'Projets actifs', value: inProgress.length, color: '#0369A1', gradient: 'linear-gradient(135deg,#0369A1,#0284C7)', icon: <Activity size={28} /> },
        { label: 'Terminés', sub: 'Projets clôturés', value: done.length, color: '#15803D', gradient: 'linear-gradient(135deg,#15803D,#16A34A)', icon: <CheckCircle size={28} /> },
        { label: 'Planifiés', sub: 'Non démarrés', value: planned.length, color: '#4B5563', gradient: 'linear-gradient(135deg,#4B5563,#374151)', icon: <FolderKanban size={28} /> },
        { label: 'En retard', sub: 'Projets en retard', value: late.length, color: '#DC2626', gradient: 'linear-gradient(135deg,#DC2626,#B91C1C)', icon: <AlertTriangle size={28} /> },
        { label: 'Annulés', sub: 'Projets annulés', value: cancelled.length, color: '#B91C1C', gradient: 'linear-gradient(135deg,#EF4444,#DC2626)', icon: <Clock size={28} /> },
        { label: 'Progression moy.', sub: 'Moyenne globale', value: `${avgProgress}%`, color: '#D97706', gradient: 'linear-gradient(135deg,#D97706,#B45309)', icon: <TrendingUp size={28} /> },
        { label: 'Équipes actives', sub: 'Équipes assignées', value: activeTeamsCount, color: '#0891B2', gradient: 'linear-gradient(135deg,#0891B2,#0369A1)', icon: <BarChart3 size={28} /> },
    ];

    return (
        <ManagerLayout>
            <div className="page-container">
                <div className="dashboard-content">

                    {/* TITRE */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700, color: '#111827' }}>
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
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: '1rem',
                                marginBottom: '2.5rem'
                            }}>
                                {kpis.map((kpi, i) => (
                                    <div key={i} style={{
                                        background: '#ffffff',
                                        borderRadius: 14,
                                        padding: '1.2rem 1.4rem',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                                        border: '1px solid #f3f4f6',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        cursor: 'default',
                                    }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07)';
                                        }}
                                    >
                                        <div style={{
                                            width: 52, height: 52, minWidth: 52,
                                            borderRadius: '50%',
                                            background: kpi.gradient,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ffffff',
                                            flexShrink: 0,
                                        }}>
                                            {kpi.icon}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                                                {kpi.label}
                                            </span>
                                            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: kpi.color, lineHeight: 1.1 }}>
                                                {kpi.value}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                {kpi.sub}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 2. État d'avancement — 2 cartes côte à côte */}
                            <SectionTitle>📊 État d'avancement des projets</SectionTitle>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>

                                {/* Carte gauche : Progression par projet (VERTICAL) */}
                                <div className="stat-card" style={{ padding: '1.5rem' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', fontWeight: 700, color: '#111827' }}>
                                        Progression par projet (%)
                                    </h4>
                                    {progressionData.length === 0 ? (
                                        <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem 0' }}>Aucun projet</p>
                                    ) : (
                                        <>
                                            <ResponsiveContainer width="100%" height={260}>
                                                <BarChart
                                                    data={progressionData}
                                                    margin={{ top: 15, right: 10, left: -10, bottom: 60 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis
                                                        dataKey="name"
                                                        tick={{ fontSize: 10 }}
                                                        angle={-35}
                                                        textAnchor="end"
                                                        interval={0}
                                                    />
                                                    <YAxis
                                                        domain={[0, 100]}
                                                        tickFormatter={v => `${v}%`}
                                                        tick={{ fontSize: 11 }}
                                                    />
                                                    <Tooltip content={<CustomTooltipProgression />} />
                                                    <Bar
                                                        dataKey="Progression"
                                                        radius={[4, 4, 0, 0]}
                                                        maxBarSize={40}
                                                        label={{
                                                            position: 'top',
                                                            formatter: v => `${v}%`,
                                                            fontSize: 11,
                                                            fill: '#6b7280'
                                                        }}
                                                    >
                                                        {progressionData.map((entry, i) => {
                                                            const v = entry['Progression'];
                                                            const sid = parseInt(entry.statusId);
                                                            const color =
                                                                sid === 4 ? '#9ca3af' :
                                                                    sid === 3 ? '#10b981' :
                                                                        v >= 75 ? '#10b981' :
                                                                            v >= 40 ? '#f59e0b' :
                                                                                '#ef4444';
                                                            return <Cell key={i} fill={color} />;
                                                        })}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                            {/* Légende */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                                                {[
                                                    { color: '#10b981', label: 'Terminé / ≥75%' },
                                                    { color: '#f59e0b', label: '40–74%' },
                                                    { color: '#ef4444', label: '<40%' },
                                                    { color: '#9ca3af', label: 'Annulé' },
                                                ].map((item, i) => (
                                                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#6b7280' }}>
                                                        <span style={{ width: 10, height: 10, borderRadius: 2, background: item.color, display: 'inline-block' }} />
                                                        {item.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Carte droite : Développeurs par projet */}
                                <div className="stat-card" style={{ padding: '1.5rem' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', fontWeight: 700, color: '#111827' }}>
                                        Développeurs par projet
                                    </h4>
                                    {devsByProjectData.length === 0 ? (
                                        <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem 0' }}>Aucune donnée</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart
                                                data={devsByProjectData}
                                                margin={{ top: 15, right: 10, left: -10, bottom: 60 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fontSize: 10 }}
                                                    angle={-35}
                                                    textAnchor="end"
                                                    interval={0}
                                                />
                                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                                <Tooltip content={<CustomTooltipDevs />} />
                                                <Bar
                                                    dataKey="Développeurs"
                                                    fill="#8B5CF6"
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={40}
                                                    label={{
                                                        position: 'top',
                                                        fontSize: 11,
                                                        fill: '#6b7280'
                                                    }}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* 3. Projets par chef de projet */}
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

                            {/* 4. Projets en retard */}
                            {top5Late.length > 0 && (
                                <>
                                    <SectionTitle color="#ef4444">⚠️ Projets en retard</SectionTitle>
                                    <div className="stat-card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
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

                            {/* 5. Tous les projets */}
                            <SectionTitle>📋 Tous les projets</SectionTitle>
                            <div className="stat-card" style={{ padding: '1.5rem' }}>
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