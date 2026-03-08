// src/pages/dashboards/ManagerTeam.jsx
import { useEffect, useState } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import teamService from '../../services/teamService';
import projectService from '../../services/projectService';
import { UsersRound, FolderKanban, Search, X, ChevronDown, ChevronUp, Link } from 'lucide-react';
import '../../styles/Dashboard.css';

const getStatusBadge = (statusId, statusName) => {
    const id = parseInt(statusId);
    if (id === 1) return { label: statusName || 'Planifié', bg: '#E5E7EB', color: '#374151' };
    if (id === 2) return { label: statusName || 'En cours', bg: '#DBEAFE', color: '#1D4ED8' };
    if (id === 3) return { label: statusName || 'Terminé', bg: '#DCFCE7', color: '#15803D' };
    if (id === 4) return { label: statusName || 'Annulé', bg: '#FEE2E2', color: '#B91C1C' };
    return { label: statusName || 'N/A', bg: '#E5E7EB', color: '#374151' };
};

const ManagerTeams = () => {
    const [teams, setTeams] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedTeam, setExpandedTeam] = useState(null);

    // Assignation
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignTeam, setAssignTeam] = useState(null);
    const [assignProjectId, setAssignProjectId] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => { loadData(); }, []);

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
        } catch { setError('Erreur de connexion au serveur'); }
        finally { setLoading(false); }
    };

    const getTeamProjects = teamName =>
        projects.filter(p => p.teamName === teamName);

    // Projets sans équipe assignée (disponibles pour assignation)
    const unassignedProjects = projects.filter(
        p => (!p.teamName || p.teamName === 'N/A' || p.teamName === 'Aucune')
            && parseInt(p.projectStatusId) !== 3
            && parseInt(p.projectStatusId) !== 4
    );

    const handleAssign = async () => {
        if (!assignProjectId || !assignTeam) { alert('Sélectionnez un projet'); return; }
        try {
            setAssigning(true);
            const res = await projectService.assignTeamToProject(
                parseInt(assignProjectId),
                assignTeam.teamId
            );
            if (res.success) {
                alert(`✅ Équipe "${assignTeam.teamName}" assignée au projet !`);
                setShowAssignModal(false);
                setAssignProjectId('');
                setAssignTeam(null);
                await loadData();
            } else {
                alert('❌ ' + (res.message || 'Erreur lors de l\'assignation'));
            }
        } catch { alert('Erreur de connexion'); }
        finally { setAssigning(false); }
    };

    const isLate = p =>
        p.endDate && new Date(p.endDate) < new Date()
        && parseInt(p.projectStatusId) !== 3
        && parseInt(p.projectStatusId) !== 4;

    const getProgressColor = v => v >= 75 ? '#10b981' : v >= 40 ? '#f59e0b' : '#ef4444';
    const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : 'N/A';

    const filteredTeams = teams.filter(t =>
        !searchTerm || t.teamName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>Équipes</h2>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                            Vue globale des équipes · Assignation aux projets
                        </p>
                    </div>

                    {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ {error}</p>}

                    {/* KPI CARDS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            { label: 'Total Équipes', value: totalTeams, color: '#111827', icon: <UsersRound size={22} /> },
                            { label: 'Membres total', value: totalMembers, color: '#3b82f6', icon: <UsersRound size={22} /> },
                            { label: 'Équipes assignées', value: assignedTeams, color: '#10b981', icon: <FolderKanban size={22} /> },
                            { label: 'Équipes libres', value: freeTeams, color: '#f59e0b', icon: <UsersRound size={22} /> },
                        ].map((kpi, i) => (
                            <div key={i} className="stat-card" style={{ padding: '1.5rem' }}>
                                <div style={{ width: 44, height: 44, background: `${kpi.color}20`, color: kpi.color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                                    {kpi.icon}
                                </div>
                                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: kpi.color }}>{kpi.value}</p>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>{kpi.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* SEARCH */}
                    <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
                        <Search size={18} />
                        <input type="text" placeholder="Rechercher une équipe..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        {searchTerm && <button className="clear-search" onClick={() => setSearchTerm('')}><X size={16} /></button>}
                    </div>

                    {/* TEAMS LIST */}
                    {loading ? (
                        <div className="loading"><div className="spinner" />Chargement des équipes...</div>
                    ) : filteredTeams.length === 0 ? (
                        <p className="no-data">Aucune équipe trouvée</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {filteredTeams.map(team => {
                                const teamProjects = getTeamProjects(team.teamName);
                                const isExpanded = expandedTeam === team.teamId;
                                const avgProgress = teamProjects.length
                                    ? Math.round(teamProjects.reduce((a, p) => a + (p.progress ?? 0), 0) / teamProjects.length)
                                    : 0;

                                return (
                                    <div key={team.teamId} className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>

                                        {/* TEAM ROW */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '1.25rem 1.5rem',
                                            borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none'
                                        }}>
                                            {/* Left */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: 48, height: 48,
                                                    background: 'linear-gradient(135deg,#111827,#374151)',
                                                    borderRadius: 12, display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', color: 'white',
                                                    fontSize: '1.2rem', fontWeight: 700, flexShrink: 0
                                                }}>
                                                    {team.teamName?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{team.teamName}</div>
                                                    <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>
                                                        {team.memberCount ?? team.members?.length ?? 0} membre(s) · {teamProjects.length} projet(s)
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                {/* Barre progression */}
                                                {teamProjects.length > 0 && (
                                                    <div style={{ textAlign: 'right', minWidth: 130 }}>
                                                        <div style={{ fontSize: '0.8rem', marginBottom: 4, color: getProgressColor(avgProgress), fontWeight: 600 }}>
                                                            Moy. {avgProgress}%
                                                        </div>
                                                        <div style={{ height: 6, width: 130, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${avgProgress}%`, background: getProgressColor(avgProgress), borderRadius: 3, transition: 'width 0.5s' }} />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ✅ Bouton Assigner un projet */}
                                                <button
                                                    title="Assigner cette équipe à un projet"
                                                    onClick={() => { setAssignTeam(team); setAssignProjectId(''); setShowAssignModal(true); }}
                                                    style={{
                                                        background: 'linear-gradient(135deg,#00A651,#004D29)',
                                                        color: 'white', border: 'none',
                                                        padding: '8px 16px', borderRadius: 8,
                                                        cursor: 'pointer', fontWeight: 600,
                                                        fontSize: '0.82rem', display: 'flex',
                                                        alignItems: 'center', gap: 6,
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                    <Link size={14} /> Assigner
                                                </button>

                                                {/* Badge libre */}
                                                {teamProjects.length === 0 && (
                                                    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', background: '#fef9c3', color: '#a16207' }}>
                                                        Libre
                                                    </span>
                                                )}

                                                {/* Expand */}
                                                {teamProjects.length > 0 && (
                                                    <button
                                                        onClick={() => setExpandedTeam(isExpanded ? null : team.teamId)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
                                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* EXPANDED : projets de l'équipe */}
                                        {isExpanded && (
                                            <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
                                                <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                                    Projets assignés à cette équipe :
                                                </p>
                                                <div className="table-container">
                                                    <table className="data-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Projet</th><th>Chef de projet</th>
                                                                <th>Date fin</th><th>Progression</th><th>Statut</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {teamProjects.map(p => {
                                                                const status = getStatusBadge(p.projectStatusId, p.statusName);
                                                                return (
                                                                    <tr key={p.projectId}>
                                                                        <td style={{ fontWeight: 600 }}>{p.projectName}</td>
                                                                        <td>{p.projectManagerName || 'N/A'}</td>
                                                                        <td style={{ color: isLate(p) ? '#ef4444' : '#374151', fontSize: '0.85rem' }}>
                                                                            {formatDate(p.endDate)}
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
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── MODAL ASSIGNATION ── */}
                    {showAssignModal && assignTeam && (
                        <div className="modal-overlay" onClick={() => !assigning && setShowAssignModal(false)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                                <div className="modal-header">
                                    <h3>🔗 Assigner l'équipe à un projet</h3>
                                    <button className="modal-close" onClick={() => setShowAssignModal(false)} disabled={assigning}><X size={22} /></button>
                                </div>
                                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '0.75rem 1rem' }}>
                                        <p style={{ margin: 0, fontWeight: 600, color: '#15803d' }}>
                                            Équipe : {assignTeam.teamName}
                                        </p>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                                            {assignTeam.memberCount ?? 0} membre(s)
                                        </p>
                                    </div>

                                    <div>
                                        <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
                                            Sélectionner le projet *
                                        </label>
                                        {unassignedProjects.length === 0 ? (
                                            <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#92400e' }}>
                                                ℹ️ Tous les projets actifs ont déjà une équipe assignée.
                                                Vous pouvez réassigner depuis la page Projets.
                                            </div>
                                        ) : (
                                            <select value={assignProjectId}
                                                onChange={e => setAssignProjectId(e.target.value)}
                                                disabled={assigning}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem' }}>
                                                <option value="">-- Choisir un projet --</option>
                                                {unassignedProjects.map(p => (
                                                    <option key={p.projectId} value={p.projectId}>
                                                        #{p.projectId} — {p.projectName}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setShowAssignModal(false)} disabled={assigning}
                                            style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', background: 'white' }}>
                                            Annuler
                                        </button>
                                        <button onClick={handleAssign}
                                            disabled={assigning || !assignProjectId || unassignedProjects.length === 0}
                                            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#00A651,#004D29)', color: 'white', cursor: 'pointer', fontWeight: 700, opacity: (!assignProjectId || unassignedProjects.length === 0) ? 0.6 : 1 }}>
                                            {assigning ? '⏳ Assignation...' : '✅ Confirmer'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ManagerLayout>
    );
};

export default ManagerTeams;