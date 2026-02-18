import { useEffect, useState } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import projectService from '../../services/projectService';
import teamService from '../../services/teamService';
import {
    FolderKanban,
    Users,
    Clock,
    CheckCircle,
    Search,
    X,
    Eye,
} from 'lucide-react';
import '../../styles/Dashboard.css';

const ManagerProjects = () => {
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [projectsRes, teamsRes] = await Promise.all([
                projectService.getAllProjects(),
                teamService.getAllTeams(),
            ]);
            if (projectsRes.success) setProjects(projectsRes.data || []);
            if (teamsRes.success) setTeams(teamsRes.data || []);
        } catch (e) {
            console.error('ManagerProjects loadData error:', e);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTeam = async (projectId, teamId) => {
        if (!teamId || teamId === '0') return;
        try {
            setSaving(true);
            const res = await projectService.assignTeamToProject(projectId, parseInt(teamId));
            if (!res.success) {
                alert(res.message || "Erreur lors de l'assignation");
                return;
            }
            const teamName = teams.find(t => t.teamId === parseInt(teamId))?.teamName || 'Équipe assignée';
            setProjects(prev =>
                prev.map(p =>
                    p.projectId === projectId ? { ...p, teamId: parseInt(teamId), teamName } : p
                )
            );
        } catch (e) {
            console.error('assignTeam error:', e);
            alert('Erreur de connexion au serveur');
        } finally {
            setSaving(false);
        }
    };

    const filteredProjects = projects.filter(p => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            p.projectName?.toLowerCase().includes(s) ||
            p.teamName?.toLowerCase().includes(s) ||
            p.projectManagerName?.toLowerCase().includes(s)
        );
    });

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString('fr-FR') : 'N/A';

    const isLate = (p) =>
        p.endDate && new Date(p.endDate) < new Date() && (p.progress ?? 0) < 100;

    const getProgressColor = (progress) => {
        if (progress >= 75) return '#10b981';
        if (progress >= 40) return '#f59e0b';
        return '#ef4444';
    };

    // KPIs
    const total = projects.length;
    const withTeam = projects.filter(p => p.teamName && p.teamName !== 'N/A').length;
    const lateCount = projects.filter(isLate).length;
    const avgProgress = total
        ? Math.round(projects.reduce((acc, p) => acc + (p.progress ?? 0), 0) / total)
        : 0;

    return (
        <ManagerLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">

                    {/* HEADER */}
                    <div className="page-header" style={{ marginBottom: '2rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>
                            Gestion des Projets
                        </h2>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                            Vue globale · Assignation des équipes
                        </p>
                    </div>

                    {/* KPI CARDS */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}>
                        {[
                            { label: 'Total Projets', value: total, color: '#111827', icon: <FolderKanban size={24} /> },
                            { label: 'Avec Équipe', value: withTeam, color: '#3b82f6', icon: <Users size={24} /> },
                            { label: 'En Retard', value: lateCount, color: '#ef4444', icon: <Clock size={24} /> },
                            { label: 'Progression Moy.', value: `${avgProgress}%`, color: '#10b981', icon: <CheckCircle size={24} /> },
                        ].map((kpi, i) => (
                            <div key={i} className="stat-card" style={{ padding: '1.5rem' }}>
                                <div style={{
                                    width: 45, height: 45,
                                    background: `${kpi.color}20`,
                                    color: kpi.color,
                                    borderRadius: 10,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '0.75rem'
                                }}>
                                    {kpi.icon}
                                </div>
                                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: kpi.color }}>
                                    {kpi.value}
                                </p>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
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
                            placeholder="Rechercher par nom, équipe ou chef de projet..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm('')}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* ERROR */}
                    {error && (
                        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ {error}</p>
                    )}

                    {/* TABLE */}
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            Chargement des projets...
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Projet</th>
                                        <th>Chef de projet</th>
                                        <th>Équipe actuelle</th>
                                        <th>Assigner une équipe</th>
                                        <th>Progression</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProjects.length > 0 ? (
                                        filteredProjects.map(p => (
                                            <tr key={p.projectId}>
                                                {/* Projet */}
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{p.projectName}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                        Fin : {formatDate(p.endDate)}
                                                    </div>
                                                </td>

                                                {/* Chef de projet */}
                                                <td>{p.projectManagerName || 'Non assigné'}</td>

                                                {/* Équipe actuelle */}
                                                <td>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: 20,
                                                        fontSize: '0.8rem',
                                                        background: p.teamName ? '#dbeafe' : '#f3f4f6',
                                                        color: p.teamName ? '#1d4ed8' : '#6b7280'
                                                    }}>
                                                        {p.teamName || 'Aucune'}
                                                    </span>
                                                </td>

                                                {/* Assign dropdown */}
                                                <td>
                                                    <select
                                                        defaultValue={p.teamId || ''}
                                                        onChange={e => handleAssignTeam(p.projectId, e.target.value)}
                                                        disabled={saving}
                                                        style={{
                                                            padding: '6px 10px',
                                                            borderRadius: 8,
                                                            border: '1px solid #e5e7eb',
                                                            fontSize: '0.85rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <option value="">-- Choisir --</option>
                                                        {teams.map(t => (
                                                            <option key={t.teamId} value={t.teamId}>
                                                                {t.teamName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Progress bar */}
                                                <td style={{ minWidth: 120 }}>
                                                    <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>
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
                                                            borderRadius: 3,
                                                            transition: 'width 0.3s'
                                                        }} />
                                                    </div>
                                                </td>

                                                {/* Statut */}
                                                <td>
                                                    <span className={`status-badge ${isLate(p) ? 'inactive' : 'active'}`}>
                                                        {isLate(p) ? '⚠️ En retard' : '✅ OK'}
                                                    </span>
                                                </td>

                                                {/* Voir détails */}
                                                <td>
                                                    <button
                                                        className="btn-icon"
                                                        title="Voir détails"
                                                        onClick={() => { setSelectedProject(p); setShowDetails(true); }}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
                                                            color: '#1976D2'
                                                        }}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="no-data">
                                                {searchTerm ? 'Aucun projet trouvé' : 'Aucun projet'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* DETAILS MODAL */}
                    {showDetails && selectedProject && (
                        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}
                                style={{ maxWidth: 550 }}>
                                <div className="modal-header">
                                    <h3>Détails du projet</h3>
                                    <button className="modal-close" onClick={() => setShowDetails(false)}>
                                        <X size={22} />
                                    </button>
                                </div>
                                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {[
                                        { label: 'Nom', value: selectedProject.projectName },
                                        { label: 'Description', value: selectedProject.description || 'N/A' },
                                        { label: 'Chef de projet', value: selectedProject.projectManagerName || 'Non assigné' },
                                        { label: 'Équipe', value: selectedProject.teamName || 'Aucune' },
                                        { label: 'Date début', value: formatDate(selectedProject.startDate) },
                                        { label: 'Date fin', value: formatDate(selectedProject.endDate) },
                                        { label: 'Progression', value: `${selectedProject.progress ?? 0}%` },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                                            <span style={{ fontWeight: 600, minWidth: 130, color: '#111827' }}>
                                                {item.label} :
                                            </span>
                                            <span style={{ color: '#6b7280' }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </ManagerLayout>
    );
};

export default ManagerProjects;
