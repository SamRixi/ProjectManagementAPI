import { useEffect, useState } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import projectService from '../../services/projectService';
import teamService from '../../services/teamService';
import userService from '../../services/userService';
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
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [newProject, setNewProject] = useState({
        projectName: '',
        description: '',
        priority: 'Moyenne',
        startDate: '',
        endDate: '',
        teamId: '',
        projectManagerId: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [projectsRes, teamsRes, usersRes] = await Promise.all([
                projectService.getAllProjects(),
                teamService.getAllTeams(),
                userService.getAllUsers(),
            ]);
            if (projectsRes.success) setProjects(projectsRes.data || []);
            if (teamsRes.success) setTeams(teamsRes.data || []);
            if (usersRes.success) {
                const pms = (usersRes.data || []).filter(
                    u =>
                        u.role === 'ChefDeProjet' ||
                        u.role === 'ProjectManager'
                );
                setManagers(pms);
            }
        } catch (e) {
            console.error('loadData error:', e);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (
            !newProject.projectName ||
            !newProject.startDate ||
            !newProject.endDate
        ) {
            alert(
                '⚠️ Veuillez remplir le nom, la date de début et la date de fin'
            );
            return;
        }
        try {
            setSaving(true);
            const payload = {
                ...newProject,
                teamId: newProject.teamId
                    ? parseInt(newProject.teamId, 10)
                    : null,
                projectManagerId: newProject.projectManagerId
                    ? parseInt(newProject.projectManagerId, 10)
                    : null,
            };
            const res = await projectService.createProject(payload);
            if (!res.success) {
                alert(res.message || 'Erreur lors de la création du projet');
                return;
            }
            setShowCreateModal(false);
            setNewProject({
                projectName: '',
                description: '',
                priority: 'Moyenne',
                startDate: '',
                endDate: '',
                teamId: '',
                projectManagerId: '',
            });
            await loadData();
        } catch {
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

    const formatDate = d =>
        d ? new Date(d).toLocaleDateString('fr-FR') : 'N/A';

    const isLate = p =>
        p.endDate &&
        new Date(p.endDate) < new Date() &&
        (p.progress ?? 0) < 100;

    const getProgressColor = progress => {
        if (progress >= 75) return '#10b981';
        if (progress >= 40) return '#f59e0b';
        return '#ef4444';
    };

    const total = projects.length;
    const withTeam = projects.filter(
        p => p.teamName && p.teamName !== 'N/A'
    ).length;
    const lateCount = projects.filter(isLate).length;
    const avgProgress = total
        ? Math.round(
            projects.reduce((acc, p) => acc + (p.progress ?? 0), 0) / total
        )
        : 0;

    return (
        <ManagerLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">

                    {/* HEADER */}
                    <div
                        className="page-header"
                        style={{
                            marginBottom: '2rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: '1.8rem',
                                    fontWeight: 700,
                                }}
                            >
                                Gestion des Projets
                            </h2>
                            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                                Vue globale · Assignation des équipes et chefs de projet
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                background:
                                    'linear-gradient(135deg, #00A651, #004D29)',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                            }}
                        >
                            + Nouveau Projet
                        </button>
                    </div>

                    {/* KPI CARDS */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '1rem',
                            marginBottom: '2rem',
                        }}
                    >
                        {[
                            {
                                label: 'Total Projets',
                                value: total,
                                color: '#111827',
                                icon: <FolderKanban size={24} />,
                            },
                            {
                                label: 'Avec Équipe',
                                value: withTeam,
                                color: '#3b82f6',
                                icon: <Users size={24} />,
                            },
                            {
                                label: 'En Retard',
                                value: lateCount,
                                color: '#ef4444',
                                icon: <Clock size={24} />,
                            },
                            {
                                label: 'Progression Moy.',
                                value: `${avgProgress}%`,
                                color: '#10b981',
                                icon: <CheckCircle size={24} />,
                            },
                        ].map((kpi, i) => (
                            <div
                                key={i}
                                className="stat-card"
                                style={{ padding: '1.5rem' }}
                            >
                                <div
                                    style={{
                                        width: 45,
                                        height: 45,
                                        background: `${kpi.color}20`,
                                        color: kpi.color,
                                        borderRadius: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '0.75rem',
                                    }}
                                >
                                    {kpi.icon}
                                </div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: '1.6rem',
                                        fontWeight: 700,
                                        color: kpi.color,
                                    }}
                                >
                                    {kpi.value}
                                </p>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: '0.85rem',
                                        color: '#6b7280',
                                    }}
                                >
                                    {kpi.label}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* SEARCH */}
                    <div
                        className="search-bar"
                        style={{ marginBottom: '1.5rem' }}
                    >
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, équipe ou chef de projet..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchTerm('')}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {error && (
                        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>
                            ⚠️ {error}
                        </p>
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
                                        <th>Équipe</th>
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
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {p.projectName}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: '0.8rem',
                                                            color: '#6b7280',
                                                        }}
                                                    >
                                                        Fin :{' '}
                                                        {formatDate(p.endDate)}
                                                    </div>
                                                </td>

                                                {/* Chef de projet */}
                                                <td>
                                                    <span
                                                        style={{
                                                            padding: '4px 10px',
                                                            borderRadius: 20,
                                                            fontSize: '0.8rem',
                                                            background:
                                                                p.projectManagerName
                                                                    ? '#d1fae5'
                                                                    : '#f3f4f6',
                                                            color: p.projectManagerName
                                                                ? '#065f46'
                                                                : '#6b7280',
                                                        }}
                                                    >
                                                        {p.projectManagerName ||
                                                            'Non assigné'}
                                                    </span>
                                                </td>

                                                {/* Équipe */}
                                                <td>
                                                    <span
                                                        style={{
                                                            padding: '4px 10px',
                                                            borderRadius: 20,
                                                            fontSize: '0.8rem',
                                                            background:
                                                                p.teamName
                                                                    ? '#dbeafe'
                                                                    : '#f3f4f6',
                                                            color: p.teamName
                                                                ? '#1d4ed8'
                                                                : '#6b7280',
                                                        }}
                                                    >
                                                        {p.teamName || 'Aucune'}
                                                    </span>
                                                </td>

                                                {/* Progress bar */}
                                                <td style={{ minWidth: 120 }}>
                                                    <div
                                                        style={{
                                                            fontSize: '0.8rem',
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        {p.progress ?? 0}%
                                                    </div>
                                                    <div
                                                        style={{
                                                            height: 6,
                                                            borderRadius: 3,
                                                            background:
                                                                '#e5e7eb',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                height: '100%',
                                                                width: `${p.progress ??
                                                                    0
                                                                    }%`,
                                                                background:
                                                                    getProgressColor(
                                                                        p.progress ??
                                                                        0
                                                                    ),
                                                                borderRadius: 3,
                                                                transition:
                                                                    'width 0.3s',
                                                            }}
                                                        />
                                                    </div>
                                                </td>

                                                {/* Statut */}
                                                <td>
                                                    <span
                                                        className={`status-badge ${isLate(p)
                                                                ? 'inactive'
                                                                : 'active'
                                                            }`}
                                                    >
                                                        {isLate(p)
                                                            ? '⚠️ En retard'
                                                            : '✅ OK'}
                                                    </span>
                                                </td>

                                                {/* Voir détails */}
                                                <td>
                                                    <button
                                                        className="btn-icon"
                                                        title="Voir détails"
                                                        onClick={() => {
                                                            setSelectedProject(p);
                                                            setShowDetails(true);
                                                        }}
                                                        style={{
                                                            background:
                                                                'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
                                                            color: '#1976D2',
                                                        }}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="no-data"
                                            >
                                                {searchTerm
                                                    ? 'Aucun projet trouvé'
                                                    : 'Aucun projet'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* DETAILS MODAL */}
                    {showDetails && selectedProject && (
                        <div
                            className="modal-overlay"
                            onClick={() => setShowDetails(false)}
                        >
                            <div
                                className="modal-content"
                                onClick={e => e.stopPropagation()}
                                style={{ maxWidth: 550 }}
                            >
                                <div className="modal-header">
                                    <h3>Détails du projet</h3>
                                    <button
                                        className="modal-close"
                                        onClick={() => setShowDetails(false)}
                                    >
                                        <X size={22} />
                                    </button>
                                </div>
                                <div
                                    style={{
                                        padding: '1.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                    }}
                                >
                                    {[
                                        {
                                            label: 'Nom',
                                            value: selectedProject.projectName,
                                        },
                                        {
                                            label: 'Description',
                                            value:
                                                selectedProject.description ||
                                                'N/A',
                                        },
                                        {
                                            label: 'Chef de projet',
                                            value:
                                                selectedProject.projectManagerName ||
                                                'Non assigné',
                                        },
                                        {
                                            label: 'Équipe',
                                            value:
                                                selectedProject.teamName ||
                                                'Aucune',
                                        },
                                        {
                                            label: 'Priorité',
                                            value:
                                                selectedProject.priority ||
                                                'N/A',
                                        },
                                        {
                                            label: 'Date début',
                                            value: formatDate(
                                                selectedProject.startDate
                                            ),
                                        },
                                        {
                                            label: 'Date fin',
                                            value: formatDate(
                                                selectedProject.endDate
                                            ),
                                        },
                                        {
                                            label: 'Progression',
                                            value: `${selectedProject.progress ?? 0
                                                }%`,
                                        },
                                    ].map((item, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                display: 'flex',
                                                gap: '1rem',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontWeight: 600,
                                                    minWidth: 130,
                                                    color: '#111827',
                                                }}
                                            >
                                                {item.label} :
                                            </span>
                                            <span style={{ color: '#6b7280' }}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CREATE MODAL */}
                    {showCreateModal && (
                        <div
                            className="modal-overlay"
                            onClick={() => setShowCreateModal(false)}
                        >
                            <div
                                className="modal-content"
                                onClick={e => e.stopPropagation()}
                                style={{ maxWidth: 550 }}
                            >
                                <div className="modal-header">
                                    <h3>➕ Nouveau Projet</h3>
                                    <button
                                        className="modal-close"
                                        onClick={() =>
                                            setShowCreateModal(false)
                                        }
                                    >
                                        <X size={22} />
                                    </button>
                                </div>
                                <div
                                    style={{
                                        padding: '1.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                    }}
                                >
                                    {/* Nom */}
                                    <div>
                                        <label style={{ fontWeight: 600 }}>
                                            Nom du projet *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Projet DigitalWork"
                                            value={newProject.projectName}
                                            onChange={e =>
                                                setNewProject({
                                                    ...newProject,
                                                    projectName: e.target.value,
                                                })
                                            }
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: 8,
                                                border: '1px solid #e5e7eb',
                                                marginTop: 6,
                                            }}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label style={{ fontWeight: 600 }}>
                                            Description
                                        </label>
                                        <textarea
                                            placeholder="Description du projet..."
                                            value={newProject.description}
                                            onChange={e =>
                                                setNewProject({
                                                    ...newProject,
                                                    description: e.target.value,
                                                })
                                            }
                                            rows={3}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: 8,
                                                border: '1px solid #e5e7eb',
                                                marginTop: 6,
                                            }}
                                        />
                                    </div>

                                    {/* Priorité */}
                                    <div>
                                        <label style={{ fontWeight: 600 }}>
                                            Priorité
                                        </label>
                                        <select
                                            value={newProject.priority}
                                            onChange={e =>
                                                setNewProject({
                                                    ...newProject,
                                                    priority: e.target.value,
                                                })
                                            }
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: 8,
                                                border: '1px solid #e5e7eb',
                                                marginTop: 6,
                                            }}
                                        >
                                            <option value="Basse">
                                                🟢 Basse
                                            </option>
                                            <option value="Moyenne">
                                                🟡 Moyenne
                                            </option>
                                            <option value="Élevée">
                                                🔴 Élevée
                                            </option>
                                        </select>
                                    </div>

                                    {/* Dates */}
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '1rem',
                                        }}
                                    >
                                        <div>
                                            <label style={{ fontWeight: 600 }}>
                                                Date de début *
                                            </label>
                                            <input
                                                type="date"
                                                value={newProject.startDate}
                                                onChange={e =>
                                                    setNewProject({
                                                        ...newProject,
                                                        startDate:
                                                            e.target.value,
                                                    })
                                                }
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: 8,
                                                    border: '1px solid #e5e7eb',
                                                    marginTop: 6,
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: 600 }}>
                                                Date de fin *
                                            </label>
                                            <input
                                                type="date"
                                                value={newProject.endDate}
                                                onChange={e =>
                                                    setNewProject({
                                                        ...newProject,
                                                        endDate: e.target.value,
                                                    })
                                                }
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: 8,
                                                    border: '1px solid #e5e7eb',
                                                    marginTop: 6,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Chef de Projet */}
                                    <div>
                                        <label style={{ fontWeight: 600 }}>
                                            Chef de Projet (optionnel)
                                        </label>
                                        <select
                                            value={
                                                newProject.projectManagerId
                                            }
                                            onChange={e =>
                                                setNewProject({
                                                    ...newProject,
                                                    projectManagerId:
                                                        e.target.value,
                                                })
                                            }
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: 8,
                                                border: '1px solid #e5e7eb',
                                                marginTop: 6,
                                            }}
                                        >
                                            <option value="">
                                                -- Aucun chef --
                                            </option>
                                            {managers.map(m => (
                                                <option
                                                    key={m.userId}
                                                    value={m.userId}
                                                >
                                                    {m.firstName
                                                        ? `${m.firstName} ${m.lastName || ''
                                                        }`
                                                        : m.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Équipe */}
                                    <div>
                                        <label style={{ fontWeight: 600 }}>
                                            Équipe assignée (optionnel)
                                        </label>
                                        <select
                                            value={newProject.teamId}
                                            onChange={e =>
                                                setNewProject({
                                                    ...newProject,
                                                    teamId: e.target.value,
                                                })
                                            }
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: 8,
                                                border: '1px solid #e5e7eb',
                                                marginTop: 6,
                                            }}
                                        >
                                            <option value="">
                                                -- Aucune équipe --
                                            </option>
                                            {teams.map(t => (
                                                <option
                                                    key={t.teamId}
                                                    value={t.teamId}
                                                >
                                                    {t.teamName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Boutons */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            justifyContent: 'flex-end',
                                            marginTop: '1rem',
                                        }}
                                    >
                                        <button
                                            onClick={() =>
                                                setShowCreateModal(false)
                                            }
                                            style={{
                                                padding: '10px 24px',
                                                borderRadius: 8,
                                                border: '1px solid #e5e7eb',
                                                cursor: 'pointer',
                                                background: 'white',
                                            }}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleCreateProject}
                                            disabled={saving}
                                            style={{
                                                padding: '10px 24px',
                                                borderRadius: 8,
                                                border: 'none',
                                                background:
                                                    'linear-gradient(135deg, #00A651, #004D29)',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {saving
                                                ? '⏳ Création...'
                                                : '✅ Créer le projet'}
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

export default ManagerProjects;
