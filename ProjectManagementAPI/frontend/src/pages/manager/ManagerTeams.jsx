import { useEffect, useState } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import teamService from '../../services/teamService';
import projectService from '../../services/projectService';
import {
    UsersRound,
    FolderKanban,
    Search,
    X,
    Eye,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import '../../styles/Dashboard.css';

const ManagerTeams = () => {
    const [teams, setTeams] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedTeam, setExpandedTeam] = useState(null); // teamId expanded

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [tRes, pRes] = await Promise.all([
                teamService.getAllTeams(),
                projectService.getAllProjects(),
            ]);
            if (tRes.success) setTeams(tRes.data || []);
            if (pRes.success) setProjects(pRes.data || []);
        } catch (e) {
            console.error('ManagerTeams error:', e);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    // Projets liés à une équipe
    const getTeamProjects = (teamName) =>
        projects.filter(p => p.teamName === teamName);

    const isLate = (p) =>
        p.endDate && new Date(p.endDate) < new Date() && (p.progress ?? 0) < 100;

    const getProgressColor = (v) => {
        if (v >= 75) return '#10b981';
        if (v >= 40) return '#f59e0b';
        return '#ef4444';
    };

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString('fr-FR') : 'N/A';

    const filteredTeams = teams.filter(t => {
        if (!searchTerm) return true;
        return t.teamName?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // KPIs
    const totalTeams = teams.length;
    const totalMembers = teams.reduce((a, t) => a + (t.memberCount ?? t.members?.length ?? 0), 0);
    const assignedTeams = teams.filter(t => getTeamProjects(t.teamName).length > 0).length;
    const freeTeams = totalTeams - assignedTeams;

    return (
        <ManagerLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">

                    {/* HEADER */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>
                            Équipes
                        </h2>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                            Vue globale des équipes et leurs projets associés
                        </p>
                    </div>

                    {error && (
                        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ {error}</p>
                    )}

                    {/* KPI CARDS */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}>
                        {[
                            { label: 'Total Équipes', value: totalTeams, color: '#111827', icon: <UsersRound size={22} /> },
                            { label: 'Membres total', value: totalMembers, color: '#3b82f6', icon: <UsersRound size={22} /> },
                            { label: 'Équipes assignées', value: assignedTeams, color: '#10b981', icon: <FolderKanban size={22} /> },
                            { label: 'Équipes libres', value: freeTeams, color: '#f59e0b', icon: <UsersRound size={22} /> },
                        ].map((kpi, i) => (
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
                                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: kpi.color }}>
                                    {kpi.value}
                                </p>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>
                                    {kpi.label}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* SEARCH */}
                    <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher une équipe..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm('')}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* TEAMS LIST */}
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            Chargement des équipes...
                        </div>
                    ) : filteredTeams.length === 0 ? (
                        <p className="no-data">Aucune équipe trouvée</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {filteredTeams.map(team => {
                                const teamProjects = getTeamProjects(team.teamName);
                                const isExpanded = expandedTeam === team.teamId;
                                const avgProgress = teamProjects.length
                                    ? Math.round(
                                        teamProjects.reduce((a, p) => a + (p.progress ?? 0), 0) /
                                        teamProjects.length
                                    )
                                    : 0;

                                return (
                                    <div key={team.teamId} className="stat-card"
                                        style={{ padding: 0, overflow: 'hidden' }}>

                                        {/* ── TEAM ROW ── */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '1.25rem 1.5rem',
                                            cursor: teamProjects.length > 0 ? 'pointer' : 'default',
                                            borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none'
                                        }}
                                            onClick={() => {
                                                if (teamProjects.length > 0)
                                                    setExpandedTeam(isExpanded ? null : team.teamId);
                                            }}
                                        >
                                            {/* Left : avatar + infos */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: 48, height: 48,
                                                    background: 'linear-gradient(135deg, #111827, #374151)',
                                                    borderRadius: 12,
                                                    display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white', fontSize: '1.2rem',
                                                    fontWeight: 700, flexShrink: 0
                                                }}>
                                                    {team.teamName?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                                        {team.teamName}
                                                    </div>
                                                    <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>
                                                        {team.memberCount ?? team.members?.length ?? 0} membre(s) ·{' '}
                                                        {teamProjects.length} projet(s) assigné(s)
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right : progress + expand */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                {teamProjects.length > 0 && (
                                                    <div style={{ textAlign: 'right', minWidth: 130 }}>
                                                        <div style={{
                                                            fontSize: '0.8rem', marginBottom: 4,
                                                            color: getProgressColor(avgProgress),
                                                            fontWeight: 600
                                                        }}>
                                                            Moy. {avgProgress}%
                                                        </div>
                                                        <div style={{
                                                            height: 6, width: 130,
                                                            borderRadius: 3, background: '#e5e7eb',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                height: '100%',
                                                                width: `${avgProgress}%`,
                                                                background: getProgressColor(avgProgress),
                                                                borderRadius: 3,
                                                                transition: 'width 0.5s'
                                                            }} />
                                                        </div>
                                                    </div>
                                                )}

                                                {teamProjects.length > 0 && (
                                                    <div style={{ color: '#6b7280' }}>
                                                        {isExpanded
                                                            ? <ChevronUp size={20} />
                                                            : <ChevronDown size={20} />}
                                                    </div>
                                                )}

                                                {teamProjects.length === 0 && (
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: 20,
                                                        fontSize: '0.78rem',
                                                        background: '#fef9c3',
                                                        color: '#a16207'
                                                    }}>
                                                        Libre
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* ── EXPANDED : projets de l'équipe ── */}
                                        {isExpanded && (
                                            <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
                                                <p style={{
                                                    fontSize: '0.82rem', color: '#6b7280',
                                                    marginBottom: '0.75rem'
                                                }}>
                                                    Projets assignés à cette équipe :
                                                </p>
                                                <div className="table-container">
                                                    <table className="data-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Projet</th>
                                                                <th>Chef de projet</th>
                                                                <th>Date fin</th>
                                                                <th>Progression</th>
                                                                <th>Statut</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {teamProjects.map(p => (
                                                                <tr key={p.projectId}>
                                                                    <td style={{ fontWeight: 600 }}>
                                                                        {p.projectName}
                                                                    </td>
                                                                    <td>{p.projectManagerName || 'N/A'}</td>
                                                                    <td style={{
                                                                        color: isLate(p) ? '#ef4444' : '#374151',
                                                                        fontSize: '0.85rem'
                                                                    }}>
                                                                        {formatDate(p.endDate)}
                                                                    </td>
                                                                    <td style={{ minWidth: 120 }}>
                                                                        <div style={{
                                                                            fontSize: '0.8rem', marginBottom: 3
                                                                        }}>
                                                                            {p.progress ?? 0}%
                                                                        </div>
                                                                        <div style={{
                                                                            height: 6, borderRadius: 3,
                                                                            background: '#e5e7eb',
                                                                            overflow: 'hidden'
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
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </ManagerLayout>
    );
};

export default ManagerTeams;
