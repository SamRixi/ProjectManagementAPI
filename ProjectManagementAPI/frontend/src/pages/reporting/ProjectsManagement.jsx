// src/pages/reporting/ProjectsManagement.jsx
import { useState, useEffect } from 'react';
import {
    FolderKanban,
    Plus,
    Search,
    X,
    Edit2,
    Ban,
    Users,
    FileText,
    Eye
} from 'lucide-react';
import projectService from '../../services/projectService';
import teamService from '../../services/teamService';
import edbService from '../../services/edbService';
import ReportingLayout from '../../components/layout/ReportingLayout';
import userService from '../../services/userService';
import '../../styles/Dashboard.css';

// ── Constantes priorité ──────────────────────────────────────
const PRIORITIES = [
    { id: 1, label: 'Basse', emoji: '🟢' },
    { id: 2, label: 'Moyenne', emoji: '🟡' },
    { id: 3, label: 'Haute', emoji: '🔴' },
];

const getPriorityLabel = (id) => {
    const p = PRIORITIES.find(p => p.id === parseInt(id));
    return p ? `${p.emoji} ${p.label}` : 'N/A';
};

// ── Badge statut projet ──────────────────────────────────────
const getStatusBadge = (statusId, statusName) => {
    const id = parseInt(statusId);

    // Adapte ces IDs à ta table ProjectStatus :
    // 1 = Planifié, 2 = En cours, 3 = Terminé, 4 = Annulé (par ex.)

    if (id === 1) {
        return {
            label: statusName || 'Planifié',
            bg: '#E5E7EB',
            color: '#374151',
        };
    }
    if (id === 2) {
        return {
            label: statusName || 'En cours',
            bg: '#DBEAFE',
            color: '#1D4ED8',
        };
    }
    if (id === 3) {
        return {
            label: statusName || 'Terminé',
            bg: '#DCFCE7',
            color: '#15803D',
        };
    }
    if (id === 4) {
        return {
            label: statusName || 'Annulé',
            bg: '#FEE2E2',
            color: '#B91C1C',
        };
    }

    return {
        label: statusName || 'N/A',
        bg: '#E5E7EB',
        color: '#374151',
    };
};

const ProjectManagement = () => {
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [edbs, setEdbs] = useState([]);
    const [projectManagers, setProjectManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const initialForm = {
        projectName: '',
        description: '',
        startDate: '',
        endDate: '',
        teamId: 0,
        edbId: 0,
        projectManagerId: 0,
        priorityId: 0,
    };

    const [formData, setFormData] = useState(initialForm);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projectsRes, teamsRes, edbsRes] = await Promise.all([
                projectService.getAllProjects(),
                teamService.getAllTeams(),
                edbService.getAllEDBs(),
            ]);

            if (projectsRes.success) setProjects(projectsRes.data || []);
            if (teamsRes.success) setTeams(teamsRes.data || []);
            if (edbsRes.success) setEdbs(edbsRes.data || []);

            const managersRes = await userService.getUsersByRole(2);
            if (managersRes.success) {
                const unique = managersRes.data.filter(
                    (m, i, self) => i === self.findIndex(x => x.userId === m.userId)
                );
                setProjectManagers(unique);
            }
        } catch (error) {
            console.error('❌ fetchData error:', error);
            alert('Erreur lors de la récupération des données');
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(p => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            (p.projectName || '').toLowerCase().includes(s) ||
            (p.description || '').toLowerCase().includes(s) ||
            (p.teamName || '').toLowerCase().includes(s)
        );
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => setFormData(initialForm);

    // ── CREATE ────────────────────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();

        if (!formData.projectName.trim()) {
            alert('Le nom du projet est requis'); return;
        }
        if (!formData.startDate || !formData.endDate) {
            alert('Les dates de début et de fin sont requises'); return;
        }
        if (new Date(formData.endDate) < new Date(formData.startDate)) {
            alert('La date de fin doit être après la date de début'); return;
        }

        try {
            setSubmitting(true);
            const currentUser = JSON.parse(localStorage.getItem('user'));

            const projectData = {
                projectName: formData.projectName.trim(),
                description: formData.description?.trim() || '',
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                projectManagerId: parseInt(formData.projectManagerId) || null,
                priorityId: parseInt(formData.priorityId) || null,
                createdByUserId: currentUser?.userId || 0,
            };

            let response;
            if (formData.edbId && parseInt(formData.edbId) > 0) {
                response = await projectService.createProjectWithEdb({
                    ...projectData,
                    edbId: parseInt(formData.edbId),
                });
            } else {
                response = await projectService.createProject(projectData);
            }

            if (response.success) {
                const newProjectId =
                    response.data?.projectId ||
                    response.data?.ProjectId ||
                    response.data?.id;

                const selectedTeamId = parseInt(formData.teamId);
                if (selectedTeamId > 0 && newProjectId) {
                    const assignRes = await projectService.assignTeamToProject(
                        newProjectId, selectedTeamId
                    );
                    if (!assignRes.success) {
                        alert(`✅ Projet créé mais équipe non assignée: ${assignRes.message}`);
                        setShowCreateModal(false);
                        resetForm();
                        fetchData();
                        return;
                    }
                }

                alert('✅ Projet créé avec succès !');
                setShowCreateModal(false);
                resetForm();
                fetchData();
            } else {
                alert('❌ ' + (response.message || 'Échec de création'));
            }
        } catch (error) {
            console.error('❌ Create error:', error);
            alert('❌ ' + (error.message || 'Erreur lors de la création'));
        } finally {
            setSubmitting(false);
        }
    };

    // ── EDIT ──────────────────────────────────────────────────
    const handleEdit = async (e) => {
        e.preventDefault();
        if (!selectedProject) return;

        if (!formData.projectName.trim()) {
            alert('Le nom du projet est requis'); return;
        }
        if (!formData.startDate || !formData.endDate) {
            alert('Les dates de début et de fin sont requises'); return;
        }
        if (new Date(formData.endDate) < new Date(formData.startDate)) {
            alert('La date de fin doit être après la date de début'); return;
        }

        try {
            setSubmitting(true);

            const projectData = {
                projectId: selectedProject.projectId,
                projectName: formData.projectName.trim(),
                description: formData.description?.trim() || '',
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                projectStatusId: parseInt(formData.projectStatusId) || 1,
                priorityId: parseInt(formData.priorityId) || 2,
                projectManagerId: parseInt(formData.projectManagerId) || null,
            };

            const response = await projectService.updateProject(
                selectedProject.projectId, projectData
            );

            if (response.success) {
                const selectedTeamId = parseInt(formData.teamId);
                if (selectedTeamId > 0) {
                    await projectService.assignTeamToProject(
                        selectedProject.projectId, selectedTeamId
                    );
                }
                alert('✅ Projet mis à jour avec succès !');
                setShowEditModal(false);
                setSelectedProject(null);
                resetForm();
                fetchData();
            } else {
                alert('❌ ' + (response.message || 'Échec de mise à jour'));
            }
        } catch (error) {
            console.error('❌ Update error:', error);
            alert('❌ ' + (error.message || 'Erreur lors de la mise à jour'));
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (project) => {
        setSelectedProject(project);
        setFormData({
            projectName: project.projectName || '',
            description: project.description || '',
            startDate: project.startDate ? project.startDate.split('T')[0] : '',
            endDate: project.endDate ? project.endDate.split('T')[0] : '',
            teamId: project.teamId || 0,
            edbId: 0,
            projectManagerId: project.projectManagerId || 0,
            priorityId: project.priorityId || 0,
        });
        setShowEditModal(true);
    };

    // ── CANCEL PROJECT (au lieu de delete) ────────────────────
    const handleCancel = async (projectId, projectName) => {
        if (!window.confirm(`Voulez-vous vraiment annuler le projet "${projectName}" ?`)) return;
        try {
            const res = await projectService.cancelProject(projectId);
            if (res.success) {
                alert('✅ Projet annulé !');
                fetchData();
            } else {
                alert('❌ ' + res.message);
            }
        } catch {
            alert('Erreur lors de l\'annulation');
        }
    };

    const openDetailsModal = (project) => {
        setSelectedProject(project);
        setShowDetailsModal(true);
    };

    const getTeamName = (teamId) => {
        if (!teamId || teamId === 0) return 'Aucune équipe';
        const team = teams.find(t => t.teamId === parseInt(teamId));
        return team?.teamName || `Équipe #${teamId}`;
    };

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString('fr-FR') : 'Non défini';

    const getAvailableEdbs = () =>
        edbs.filter(e => !e.projectId || e.projectId === 0);

    // ── Dropdown priorité réutilisable ────────────────────────
    const PrioritySelect = () => (
        <div className="form-group">
            <label>Priorité</label>
            <select
                name="priorityId"
                value={formData.priorityId}
                onChange={handleInputChange}
                disabled={submitting}
            >
                <option value="0">-- Choisir une priorité --</option>
                <option value="1">🟢 Basse</option>
                <option value="2">🟡 Moyenne</option>
                <option value="3">🔴 Haute</option>
            </select>
        </div>
    );

    return (
        <ReportingLayout>
            <div className="page-container">

                {/* HEADER */}
                <div className="page-header">
                    <h2>Gestion des Projets</h2>
                    <button className="btn-create" onClick={() => setShowCreateModal(true)}>
                        <Plus size={20} />
                        Créer un projet
                    </button>
                </div>

                {/* STATS */}
                <div className="stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #00A651, #004D29)' }}>
                            <FolderKanban size={28} />
                        </div>
                        <div className="stat-content">
                            <h3>Total Projets</h3>
                            <p className="stat-number" style={{ color: '#00A651' }}>{projects.length}</p>
                            <p className="stat-label">Projets actifs</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
                            <Users size={28} />
                        </div>
                        <div className="stat-content">
                            <h3>Avec équipe</h3>
                            <p className="stat-number" style={{ color: '#3B82F6' }}>
                                {projects.filter(p => p.teamName && p.teamName !== 'N/A').length}
                            </p>
                            <p className="stat-label">Équipes assignées</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                            <FileText size={28} />
                        </div>
                        <div className="stat-content">
                            <h3>Avec EDB</h3>
                            <p className="stat-number" style={{ color: '#F59E0B' }}>
                                {projects.filter(p => p.hasEdb).length}
                            </p>
                            <p className="stat-label">EDB liés</p>
                        </div>
                    </div>
                </div>

                {/* SEARCH */}
                <div className="search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, description ou équipe..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm('')}>
                            <X size={18} />
                        </button>
                    )}
                </div>

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
                                    <th>ID</th>
                                    <th>Nom du projet</th>
                                    <th>Équipe</th>
                                    <th>Priorité</th>
                                    <th>Statut</th>
                                    <th>Dates</th>
                                    <th>EDB</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.length > 0 ? (
                                    filteredProjects.map(project => {
                                        const status = getStatusBadge(project.projectStatusId, project.statusName);
                                        return (
                                            <tr key={project.projectId}>
                                                <td>
                                                    <span style={{ fontWeight: 700, color: '#00A651' }}>
                                                        #{project.projectId}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: '#333' }}>
                                                        {project.projectName}
                                                    </div>
                                                    {project.description && (
                                                        <div style={{
                                                            fontSize: '0.875rem', color: '#666',
                                                            maxWidth: 300, overflow: 'hidden',
                                                            textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                        }}>
                                                            {project.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Users size={16} style={{ color: '#00A651' }} />
                                                        {project.teamName || 'Aucune équipe'}
                                                    </div>
                                                </td>
                                                {/* Priorité */}
                                                <td>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: 20,
                                                        fontSize: '0.82rem',
                                                        fontWeight: 600,
                                                        background: project.priorityId === 3 ? '#fee2e2'
                                                            : project.priorityId === 2 ? '#fef9c3'
                                                                : '#dcfce7',
                                                        color: project.priorityId === 3 ? '#dc2626'
                                                            : project.priorityId === 2 ? '#a16207'
                                                                : '#15803d'
                                                    }}>
                                                        {getPriorityLabel(project.priorityId)}
                                                    </span>
                                                </td>
                                                {/* Statut */}
                                                <td>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: 20,
                                                        fontSize: '0.82rem',
                                                        fontWeight: 600,
                                                        background: status.bg,
                                                        color: status.color,
                                                    }}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.875rem', color: '#666' }}>
                                                    <div>Début: {formatDate(project.startDate)}</div>
                                                    <div>Fin: {formatDate(project.endDate)}</div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${project.hasEdb ? 'active' : 'inactive'}`}>
                                                        {project.hasEdb ? 'Oui' : 'Non'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => openDetailsModal(project)}
                                                            title="Voir détails"
                                                            style={{ background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)', color: '#1976D2' }}
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-edit"
                                                            onClick={() => openEditModal(project)}
                                                            title="Modifier"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-deactivate"
                                                            onClick={() => handleCancel(project.projectId, project.projectName)}
                                                            title="Annuler le projet"
                                                            style={{ background: 'linear-gradient(135deg, #FEE2E2, #FECACA)', color: '#DC2626' }}
                                                        >
                                                            <Ban size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="no-data">
                                            {searchTerm ? 'Aucun projet trouvé' : 'Aucun projet créé'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── CREATE MODAL ── */}
                {showCreateModal && (
                    <div className="modal-overlay" onClick={() => !submitting && setShowCreateModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                            <div className="modal-header">
                                <h3>Créer un nouveau projet</h3>
                                <button className="modal-close" onClick={() => setShowCreateModal(false)} disabled={submitting}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="modal-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nom du projet *</label>
                                        <input
                                            type="text" name="projectName"
                                            value={formData.projectName}
                                            onChange={handleInputChange}
                                            required disabled={submitting}
                                            placeholder="Ex: Application Mobile"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Équipe</label>
                                        <select name="teamId" value={formData.teamId} onChange={handleInputChange} disabled={submitting}>
                                            <option value="0">Aucune équipe</option>
                                            {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Chef de projet</label>
                                        <select name="projectManagerId" value={formData.projectManagerId} onChange={handleInputChange} disabled={submitting}>
                                            <option value="0">Aucun chef de projet</option>
                                            {projectManagers.map(m => (
                                                <option key={m.userId} value={m.userId}>{m.firstName} {m.lastName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Priorité */}
                                    <PrioritySelect />
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description" value={formData.description}
                                        onChange={handleInputChange} disabled={submitting}
                                        rows={3} placeholder="Description du projet..."
                                        style={{ width: '100%', padding: '1rem', border: '2px solid #e5e7eb', borderRadius: 12, fontSize: '1rem', fontFamily: 'Outfit, sans-serif', resize: 'vertical' }}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Date de début *</label>
                                        <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} disabled={submitting} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Date de fin *</label>
                                        <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} disabled={submitting} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>EDB (optionnel)</label>
                                    <select name="edbId" value={formData.edbId} onChange={handleInputChange} disabled={submitting}>
                                        <option value="0">Aucun EDB</option>
                                        {getAvailableEdbs().map(e => <option key={e.edbId} value={e.edbId}>{e.fileName}</option>)}
                                    </select>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)} disabled={submitting}>
                                        Annuler
                                    </button>
                                    <button type="submit" className="btn-submit" disabled={submitting}>
                                        {submitting ? 'Création...' : 'Créer le projet'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── EDIT MODAL ── */}
                {showEditModal && selectedProject && (
                    <div className="modal-overlay" onClick={() => !submitting && setShowEditModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                            <div className="modal-header">
                                <h3>Modifier le projet</h3>
                                <button className="modal-close" onClick={() => setShowEditModal(false)} disabled={submitting}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleEdit} className="modal-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nom du projet *</label>
                                        <input
                                            type="text" name="projectName"
                                            value={formData.projectName}
                                            onChange={handleInputChange}
                                            required disabled={submitting}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Équipe</label>
                                        <select name="teamId" value={formData.teamId} onChange={handleInputChange} disabled={submitting}>
                                            <option value="0">Aucune équipe</option>
                                            {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Chef de projet</label>
                                        <select name="projectManagerId" value={formData.projectManagerId} onChange={handleInputChange} disabled={submitting}>
                                            <option value="0">Aucun chef de projet</option>
                                            {projectManagers.map(m => (
                                                <option key={m.userId} value={m.userId}>{m.firstName} {m.lastName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Priorité */}
                                    <PrioritySelect />
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description" value={formData.description}
                                        onChange={handleInputChange} disabled={submitting}
                                        rows={3}
                                        style={{ width: '100%', padding: '1rem', border: '2px solid #e5e7eb', borderRadius: 12, fontSize: '1rem', fontFamily: 'Outfit, sans-serif', resize: 'vertical' }}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Date de début *</label>
                                        <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} disabled={submitting} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Date de fin *</label>
                                        <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} disabled={submitting} required />
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)} disabled={submitting}>
                                        Annuler
                                    </button>
                                    <button type="submit" className="btn-submit" disabled={submitting}>
                                        {submitting ? 'Mise à jour...' : 'Mettre à jour'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── DETAILS MODAL ── */}
                {showDetailsModal && selectedProject && (
                    <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
                            <div className="modal-header">
                                <h3>Détails du projet</h3>
                                <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { label: 'Nom', value: selectedProject.projectName },
                                    { label: 'Description', value: selectedProject.description || 'N/A' },
                                    { label: 'Équipe', value: getTeamName(selectedProject.teamId) },
                                    { label: 'Chef de projet', value: selectedProject.projectManagerName || 'Non assigné' },
                                    { label: 'Priorité', value: getPriorityLabel(selectedProject.priorityId) },
                                    { label: 'Date début', value: formatDate(selectedProject.startDate) },
                                    { label: 'Date fin', value: formatDate(selectedProject.endDate) },
                                    { label: 'EDB', value: selectedProject.hasEdb ? 'Oui' : 'Non' },
                                    { label: 'Progression', value: `${selectedProject.progress ?? 0}%` },
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                                        <span style={{ fontWeight: 600, minWidth: 130, color: '#111827' }}>{item.label} :</span>
                                        <span style={{ color: '#6b7280' }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </ReportingLayout>
    );
};

export default ProjectManagement;
