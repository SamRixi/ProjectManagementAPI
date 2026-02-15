// src/pages/reporting/ProjectManagement.jsx
import { useState, useEffect } from 'react';
import {
    FolderKanban,
    Plus,
    Search,
    X,
    Edit2,
    Trash2,
    Users,
    Calendar,
    FileText,
    UserCheck,
    Eye
} from 'lucide-react';
import projectService from '../../services/projectService';
import teamService from '../../services/teamService';
import edbService from '../../services/edbService';
import ReportingLayout from '../../components/layout/ReportingLayout';
import '../../styles/Dashboard.css';

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

    const [formData, setFormData] = useState({
        projectName: '',
        description: '',
        startDate: '',
        endDate: '',
        teamId: 0,
        edbId: 0,
        projectManagerId: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projectsResponse, teamsResponse, edbsResponse] = await Promise.all([
                projectService.getAllProjects(),
                teamService.getAllTeams(),
                edbService.getAllEDBs()
            ]);

            if (projectsResponse.success) {
                setProjects(projectsResponse.data || []);
            }
            if (teamsResponse.success) {
                setTeams(teamsResponse.data || []);
            }
            if (edbsResponse.success) {
                setEdbs(edbsResponse.data || []);
            }
            const managersResponse = await teamService.getProjectManagers();
            if (managersResponse.success) {
                // Filter duplicates by userId
                const uniqueManagers = managersResponse.data.filter(
                    (manager, index, self) =>
                        index === self.findIndex(m => m.userId === manager.userId)
                );
                setProjectManagers(uniqueManagers);
                console.log('📊 Unique managers:', uniqueManagers);
            }
        } catch (error) {
            console.error('❌ Fetch data error:', error);
            alert('Erreur lors de la récupération des données');
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(project => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            (project.projectName || '').toLowerCase().includes(search) ||
            (project.description || '').toLowerCase().includes(search) ||
            (project.teamName || '').toLowerCase().includes(search)
        );
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            projectName: '',
            description: '',
            startDate: '',
            endDate: '',
            teamId: 0,
            edbId: 0
        });
    };

    // ✅ FIX 1: handleCreate - extrait correctement le projectId et assigne l'équipe
    const handleCreate = async (e) => {
        e.preventDefault();

        if (!formData.projectName.trim()) {
            alert('Le nom du projet est requis');
            return;
        }

        if (!formData.startDate || !formData.endDate) {
            alert('Les dates de début et de fin sont requises');
            return;
        }

        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

        if (endDate < startDate) {
            alert('La date de fin doit être après la date de début');
            return;
        }

        try {
            setSubmitting(true);

            const projectData = {
                projectName: formData.projectName.trim(),
                description: formData.description?.trim() || '',
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                projectManagerId: parseInt(formData.projectManagerId) || 0
            };

            console.log('📤 Données envoyées:', projectData);

            let response;
            if (formData.edbId && parseInt(formData.edbId) > 0) {
                response = await projectService.createProjectWithEdb({
                    ...projectData,
                    edbId: parseInt(formData.edbId)
                });
            } else {
                response = await projectService.createProject(projectData);
            }

            console.log('📥 Réponse backend complète:', response);

            if (response.success) {
                // ✅ FIX: Chercher le projectId dans toutes les structures possibles
                const newProjectId =
                    response.data?.projectId ||
                    response.data?.ProjectId ||
                    response.data?.id ||
                    response.data?.Id;

                console.log('🆔 Project ID trouvé:', newProjectId);
                console.log('👥 Team ID sélectionné:', formData.teamId);

                // ✅ FIX: Assigner l'équipe si sélectionnée
                const selectedTeamId = parseInt(formData.teamId);
                if (selectedTeamId > 0) {
                    if (newProjectId) {
                        console.log(`📤 Assignation équipe ${selectedTeamId} → projet ${newProjectId}`);
                        const assignResult = await projectService.assignTeamToProject(
                            newProjectId,
                            selectedTeamId
                        );
                        console.log('✅ Résultat assignation:', assignResult);

                        if (!assignResult.success) {
                            console.warn('⚠️ Équipe non assignée:', assignResult.message);
                            alert(`✅ Projet créé mais équipe non assignée: ${assignResult.message}`);
                            setShowCreateModal(false);
                            resetForm();
                            fetchData();
                            return;
                        }
                    } else {
                        // ✅ FIX: Log détaillé si projectId introuvable
                        console.error('❌ projectId introuvable dans la réponse!');
                        console.error('Structure complète de response:', JSON.stringify(response, null, 2));
                        alert('✅ Projet créé mais impossible d\'assigner l\'équipe (ID projet introuvable). Assignez l\'équipe via "Modifier".');
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
                alert('❌ Erreur: ' + (response.message || 'Échec de création'));
            }
        } catch (error) {
            console.error('❌ Create error:', error);
            const errorMessage = error.response?.data?.message
                || error.response?.data?.title
                || error.message
                || 'Erreur lors de la création du projet';
            alert('❌ ' + errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ FIX 2: handleEdit - assigne aussi l'équipe correctement
    const handleEdit = async (e) => {
        e.preventDefault();

        if (!selectedProject) return;

        if (!formData.projectName.trim()) {
            alert('Le nom du projet est requis');
            return;
        }

        if (!formData.startDate || !formData.endDate) {
            alert('Les dates de début et de fin sont requises');
            return;
        }

        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

        if (endDate < startDate) {
            alert('La date de fin doit être après la date de début');
            return;
        }

        try {
            setSubmitting(true);

            const projectData = {
                projectName: formData.projectName.trim(),
                description: formData.description?.trim() || '',
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString()
            };

            const response = await projectService.updateProject(
                selectedProject.projectId,
                projectData
            );

            if (response.success) {
                // ✅ FIX: Assigner l'équipe si sélectionnée (même si teamId = 0 on ignore)
                const selectedTeamId = parseInt(formData.teamId);
                if (selectedTeamId > 0) {
                    console.log(`📤 Assignation équipe ${selectedTeamId} → projet ${selectedProject.projectId}`);
                    const assignResult = await projectService.assignTeamToProject(
                        selectedProject.projectId,
                        selectedTeamId
                    );
                    console.log('✅ Résultat assignation:', assignResult);
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
            const errorMessage = error.response?.data?.message
                || error.response?.data?.title
                || error.message
                || 'Erreur lors de la mise à jour du projet';
            alert('❌ ' + errorMessage);
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
            edbId: 0
        });
        setShowEditModal(true);
    };

    const handleDelete = async (projectId, projectName) => {
        if (!window.confirm(`Voulez-vous vraiment supprimer le projet "${projectName}" ?`)) return;

        try {
            const response = await projectService.deleteProject(projectId);
            if (response.success) {
                alert('✅ Projet supprimé avec succès !');
                fetchData();
            } else {
                alert('❌ ' + response.message);
            }
        } catch (error) {
            console.error('❌ Delete error:', error);
            alert('Erreur lors de la suppression du projet');
        }
    };

    const openDetailsModal = (project) => {
        setSelectedProject(project);
        setShowDetailsModal(true);
    };

    // ✅ FIX 3: Comparer teamId en number ET en string (l'API peut retourner les deux)
    const getTeamName = (teamId) => {
        if (!teamId || teamId === 0 || teamId === '0') return 'Aucune équipe';
        const id = parseInt(teamId);
        const team = teams.find(t => t.teamId === id || t.teamId === teamId);
        return team?.teamName || `Équipe #${teamId}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Non défini';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const getAvailableEdbs = () => {
        return edbs.filter(edb => edb.projectId === 0 || edb.projectId === null);
    };

    return (
        <ReportingLayout>
            <div className="page-container">
                {/* Page Header */}
                <div className="page-header">
                    <h2>Gestion des Projets</h2>
                    <button className="btn-create" onClick={() => setShowCreateModal(true)}>
                        <Plus size={20} />
                        Créer un projet
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #00A651 0%, #004D29 100%)' }}>
                            <FolderKanban size={28} />
                        </div>
                        <div className="stat-content">
                            <h3>Total Projets</h3>
                            <p className="stat-number" style={{ color: '#00A651' }}>{projects.length}</p>
                            <p className="stat-label">Projets actifs</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}>
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
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
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

                {/* Search Bar */}
                <div className="search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom de projet, description ou équipe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm('')}>
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Projects Table */}
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
                                    <th>Dates</th>
                                    <th>EDB</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.length > 0 ? (
                                    filteredProjects.map((project) => (
                                        <tr key={project.projectId}>
                                            <td>
                                                <span style={{
                                                    fontWeight: '700',
                                                    color: '#00A651',
                                                    fontSize: '0.95rem'
                                                }}>
                                                    #{project.projectId}
                                                </span>
                                            </td>
                                            <td>
                                                <div>
                                                    <div style={{
                                                        fontWeight: '600',
                                                        marginBottom: '0.25rem',
                                                        color: '#333'
                                                    }}>
                                                        {project.projectName}
                                                    </div>
                                                    {project.description && (
                                                        <div style={{
                                                            fontSize: '0.875rem',
                                                            color: '#666',
                                                            maxWidth: '300px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {project.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Users size={16} style={{ color: '#00A651' }} />
                                                    <span>{project.teamName || 'Aucune équipe'}</span> 

                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.875rem' }}>
                                                    <div style={{ color: '#666' }}>
                                                        Début: {formatDate(project.startDate)}
                                                    </div>
                                                    <div style={{ color: '#666' }}>
                                                        Fin: {formatDate(project.endDate)}
                                                    </div>
                                                </div>
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
                                                        style={{ background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)', color: '#1976D2' }}
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
                                                        onClick={() => handleDelete(project.projectId, project.projectName)}
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-data">
                                            {searchTerm ? 'Aucun projet trouvé' : 'Aucun projet créé'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="modal-overlay" onClick={() => !submitting && setShowCreateModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                            <div className="modal-header">
                                <h3>Créer un nouveau projet</h3>
                                <button
                                    className="modal-close"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={submitting}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="modal-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nom du projet *</label>
                                        <input
                                            type="text"
                                            name="projectName"
                                            value={formData.projectName}
                                            onChange={handleInputChange}
                                            required
                                            disabled={submitting}
                                            placeholder="Ex: Application Mobile"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Équipe</label>
                                        <select
                                            name="teamId"
                                            value={formData.teamId}
                                            onChange={handleInputChange}
                                            disabled={submitting}
                                        >
                                            <option key="no-team" value="0">Aucune équipe</option>
                                            {teams.map(team => (
                                                <option key={team.teamId} value={team.teamId}>
                                                    {team.teamName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Chef de projet</label>
                                    <select
                                        name="projectManagerId"
                                        value={formData.projectManagerId}
                                        onChange={handleInputChange}
                                        disabled={submitting}
                                    >
                                        <option key="no-manager" value="0">Aucun chef de projet</option>
                                        {projectManagers.map(manager => (
                                            <option key={manager.userId} value={manager.userId}>
                                                {manager.firstName} {manager.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        disabled={submitting}
                                        rows={3}
                                        placeholder="Description du projet..."
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '12px',
                                            fontSize: '1rem',
                                            fontFamily: 'Outfit, sans-serif',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Date de début *</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            disabled={submitting}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Date de fin *</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            disabled={submitting}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>EDB (optionnel)</label>
                                    <select
                                        name="edbId"
                                        value={formData.edbId}
                                        onChange={handleInputChange}
                                        disabled={submitting}
                                    >
                                        <option key="no-edb" value="0">Aucun EDB</option>
                                        {getAvailableEdbs().map(edb => (
                                            <option key={edb.edbId} value={edb.edbId}>
                                                {edb.fileName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => setShowCreateModal(false)}
                                        disabled={submitting}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-submit"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Création...' : 'Créer le projet'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && selectedProject && (
                    <div className="modal-overlay" onClick={() => !submitting && setShowEditModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                            <div className="modal-header">
                                <h3>Modifier le projet</h3>
                                <button
                                    className="modal-close"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={submitting}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleEdit} className="modal-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nom du projet *</label>
                                        <input
                                            type="text"
                                            name="projectName"
                                            value={formData.projectName}
                                            onChange={handleInputChange}
                                            required
                                            disabled={submitting}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Équipe</label>
                                        <select
                                            name="teamId"
                                            value={formData.teamId}
                                            onChange={handleInputChange}
                                            disabled={submitting}
                                        >
                                            <option value="0">Aucune équipe</option>
                                            {teams.map(team => (
                                                <option key={team.teamId} value={team.teamId}>
                                                    {team.teamName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Chef de projet</label>
                                    <select
                                        name="projectManagerId"
                                        value={formData.projectManagerId}
                                        onChange={handleInputChange}
                                        disabled={submitting}
                                    >
                                        <option value="0">Aucun chef de projet</option>
                                        {projectManagers.map(manager => (
                                            <option key={manager.userId} value={manager.userId}>
                                                 {manager.firstName} {manager.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        disabled={submitting}
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '12px',
                                            fontSize: '1rem',
                                            fontFamily: 'Outfit, sans-serif',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Date de début *</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            disabled={submitting}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Date de fin *</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            disabled={submitting}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => setShowEditModal(false)}
                                        disabled={submitting}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-submit"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Mise à jour...' : 'Mettre à jour'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Details Modal */}
                {showDetailsModal && selectedProject && (
                    <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                            <div className="modal-header">
                                <h3>Détails du projet</h3>
                                <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="modal-form" style={{ padding: '2rem' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{ color: '#00A651', marginBottom: '0.5rem' }}>Nom du projet</h4>
                                    <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{selectedProject.projectName}</p>
                                </div>

                                {selectedProject.description && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ color: '#00A651', marginBottom: '0.5rem' }}>Description</h4>
                                        <p style={{ color: '#666' }}>{selectedProject.description}</p>
                                    </div>
                                )}

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{ color: '#00A651', marginBottom: '0.5rem' }}>Équipe assignée</h4>
                                    <p>{getTeamName(selectedProject.teamId)}</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h4 style={{ color: '#00A651', marginBottom: '0.5rem' }}>Date de début</h4>
                                        <p>{formatDate(selectedProject.startDate)}</p>
                                    </div>
                                    <div>
                                        <h4 style={{ color: '#00A651', marginBottom: '0.5rem' }}>Date de fin</h4>
                                        <p>{formatDate(selectedProject.endDate)}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ color: '#00A651', marginBottom: '0.5rem' }}>EDB lié</h4>
                                    <span className={`status-badge ${selectedProject.hasEdb ? 'active' : 'inactive'}`}>
                                        {selectedProject.hasEdb ? 'Oui' : 'Non'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ReportingLayout>
    );
};

export default ProjectManagement;