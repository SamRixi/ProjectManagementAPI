import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    CheckSquare,
    Plus,
    Filter,
    Search,
    Clock,
    User,
    AlertCircle,
    X,
    Trash2
} from 'lucide-react';
import api from '../../services/api';
import ProjectManagerLayout from '../../components/layout/ProjectManagerLayout';
import '../../styles/Dashboard.css';
import '../../styles/DeveloperDashboard.css';
import '../../styles/Modal.css';

const ProjectManagerTasks = () => {
    const { user } = useAuth();

    const [allTasks, setAllTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const [newTask, setNewTask] = useState({
        taskName: '',
        description: '',
        projectId: '',
        assignedToUserId: '',
        dueDate: '',
        taskStatusId: 1,
        priorityId: 2
    });

    useEffect(() => {
        if (user?.userId) fetchProjects();
    }, [user]);

    useEffect(() => {
        if (selectedProject) {
            fetchProjectTasks(selectedProject);
            fetchTeamMembers(selectedProject);
        }
    }, [selectedProject]);

    useEffect(() => {
        let filtered = [...allTasks];
        if (searchQuery) {
            filtered = filtered.filter(
                (task) =>
                    task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (filterStatus !== 'all') {
            filtered = filtered.filter((task) => {
                const s = task.status?.toLowerCase() || '';
                if (filterStatus === 'todo') return s.includes('faire');
                if (filterStatus === 'progress') return s.includes('cours');
                if (filterStatus === 'completed') return s.includes('terminé') || s.includes('attente');
                if (filterStatus === 'validated') return s.includes('valid');
                if (filterStatus === 'pending') return s.includes('attente');
                if (filterStatus === 'overdue') return task.isOverdue;
                return true;
            });
        }
        setFilteredTasks(filtered);
    }, [allTasks, searchQuery, filterStatus]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await api.get('/projectmanager/my-projects');
            if (response.data.success) {
                const projectsList = response.data.data || [];
                const activeProjects = projectsList.filter((p) => p.statusName !== 'Annulé');
                setProjects(activeProjects);
                if (activeProjects.length > 0) {
                    setSelectedProject(activeProjects[0].projectId);
                } else {
                    setSelectedProject('');
                    setAllTasks([]);
                    setFilteredTasks([]);
                }
            }
        } catch (err) {
            console.error('❌ Error loading projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjectTasks = async (projectId) => {
        try {
            setLoading(true);
            const response = await api.get(`/projectmanager/projects/${projectId}/tasks`);
            if (response.data.success) {
                setAllTasks(response.data.data || []);
            }
        } catch (err) {
            console.error('❌ Error loading tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamMembers = async (projectId) => {
        try {
            const response = await api.get(`/projectmanager/projects/${projectId}/team-members`);
            if (response.data.success) {
                setTeamMembers(response.data.data || []);
            }
        } catch (err) {
            console.error('❌ Error loading team members:', err);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/projectmanager/tasks', {
                ...newTask,
                projectId: parseInt(selectedProject),
                assignedToUserId: newTask.assignedToUserId
                    ? parseInt(newTask.assignedToUserId)
                    : null
            });
            if (response.data.success) {
                alert('✅ Tâche créée avec succès!');
                setShowCreateModal(false);
                resetForm();
                fetchProjectTasks(selectedProject);
            } else {
                alert('❌ ' + response.data.message);
            }
        } catch (err) {
            console.error('❌ Error creating task:', err);
            alert('❌ Erreur lors de la création de la tâche');
        }
    };

    const handleDeleteTask = async (task) => {
        if (task.isValidated) {
            alert('❌ Impossible : tâche déjà validée !');
            return;
        }
        if (task.progress > 0) {
            alert(`❌ Impossible : tâche à ${task.progress}% en cours !`);
            return;
        }
        if (task.status?.toLowerCase().includes('attente')) {
            alert('❌ Impossible : tâche en attente de validation !');
            return;
        }
        if (!window.confirm(`Supprimer la tâche "${task.taskName}" ?`)) return;

        try {
            const response = await api.delete(`/projectmanager/tasks/${task.taskId}`);
            if (response.data.success) {
                alert('✅ Tâche supprimée avec succès !');
                setAllTasks((prev) => prev.filter((t) => t.taskId !== task.taskId));
            } else {
                alert('❌ ' + response.data.message);
            }
        } catch (err) {
            console.error('❌ Error deleting task:', err);
            alert('❌ ' + (err.response?.data?.message || 'Erreur lors de la suppression'));
        }
    };

    const resetForm = () => {
        setNewTask({
            taskName: '',
            description: '',
            projectId: '',
            assignedToUserId: '',
            dueDate: '',
            taskStatusId: 1,
            priorityId: 2
        });
    };

    const getStatusClass = (status) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('valid')) return 'completed';
        if (s.includes('terminé')) return 'completed';
        if (s.includes('cours')) return 'in-progress';
        if (s.includes('attente')) return 'pending-validation';
        return 'pending';
    };

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('validé')) return { label: '✅ Validée', bg: '#10b981', color: 'white' };
        if (s.includes('attente')) return { label: '🏁 Terminé · En attente', bg: '#f59e0b', color: 'white' };
        if (s.includes('terminé')) return { label: '🏁 Terminé', bg: '#3b82f6', color: 'white' };
        if (s.includes('cours')) return { label: '🔄 En cours', bg: '#8b5cf6', color: 'white' };
        return { label: '📋 À faire', bg: '#6b7280', color: 'white' };
    };

    const getPriorityClass = (priority) => {
        if (priority?.toLowerCase() === 'haute') return 'high';
        if (priority?.toLowerCase() === 'moyenne') return 'medium';
        return 'low';
    };

    const isDeletable = (task) =>
        !task.isValidated &&
        task.progress === 0 &&
        !task.status?.toLowerCase().includes('attente');

    return (
        <ProjectManagerLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">

                    {/* Header */}
                    <div className="welcome-card" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2>✅ Gestion des Tâches</h2>
                                <p className="welcome-text">
                                    Créez, assignez et suivez les tâches de vos projets
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                disabled={!selectedProject}
                                style={{
                                    padding: '0.8rem 1.5rem',
                                    background: 'var(--mobilis-green)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: selectedProject ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: selectedProject ? 1 : 0.5
                                }}
                            >
                                <Plus size={20} />
                                Nouvelle Tâche
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                    <Filter size={16} style={{ display: 'inline', marginRight: '0.3rem' }} />
                                    Projet
                                </label>
                                <select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem' }}
                                >
                                    {projects.map((project) => (
                                        <option key={project.projectId} value={project.projectId}>
                                            {project.projectName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                    Statut
                                </label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem' }}
                                >
                                    <option value="all">📋 Tous</option>
                                    <option value="todo">📋 À faire</option>
                                    <option value="progress">🔄 En cours</option>
                                    <option value="completed">🏁 Terminé (+ En attente)</option>
                                    <option value="pending">⏳ En attente de validation</option>
                                    <option value="validated">✅ Validée</option>
                                    <option value="overdue">⚠️ En retard</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                    <Search size={16} style={{ display: 'inline', marginRight: '0.3rem' }} />
                                    Rechercher
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nom de la tâche..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tasks List */}
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            Chargement des tâches...
                        </div>
                    ) : filteredTasks.length > 0 ? (
                        <div className="task-list">
                            {filteredTasks.map((task) => {
                                const badge = getStatusBadge(task.status);
                                const canDelete = isDeletable(task);
                                return (
                                    <div
                                        key={task.taskId}
                                        className={`task-item ${task.isOverdue ? 'overdue' : ''}`}
                                    >
                                        <div className={`task-status ${getStatusClass(task.status)}`}></div>
                                        <div className="task-details" style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
                                                <h4 style={{ margin: 0 }}>{task.taskName}</h4>
                                                <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', background: badge.bg, color: badge.color }}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <p style={{ margin: '0.3rem 0 0 0', color: '#6b7280' }}>
                                                {task.description || 'Aucune description'}
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginTop: '0.5rem' }}>
                                                <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                                                    {task.priority || 'Moyenne'}
                                                </span>
                                                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                                    📊 {task.progress || 0}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="task-meta">
                                            {task.assignedToName && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                                                    <User size={16} />
                                                    {task.assignedToName}
                                                </div>
                                            )}
                                            {task.deadline && (
                                                <span className="task-deadline">
                                                    <Clock size={16} style={{ display: 'inline', marginRight: '0.3rem' }} />
                                                    {new Date(task.deadline).toLocaleDateString('fr-FR')}
                                                </span>
                                            )}
                                            {task.isOverdue && (
                                                <span className="overdue-badge" style={{ marginTop: '0.5rem' }}>
                                                    <AlertCircle size={14} />
                                                    EN RETARD
                                                </span>
                                            )}

                                            {/* ✅ BOUTON SUPPRIMER */}
                                            <button
                                                onClick={() => handleDeleteTask(task)}
                                                disabled={!canDelete}
                                                title={
                                                    task.isValidated ? '🔒 Tâche validée — non supprimable' :
                                                        task.progress > 0 ? `🔒 En cours (${task.progress}%) — non supprimable` :
                                                            task.status?.toLowerCase().includes('attente') ? '🔒 En attente de validation — non supprimable' :
                                                                '🗑️ Supprimer la tâche'
                                                }
                                                style={{
                                                    marginTop: '0.6rem',
                                                    padding: '0.4rem 0.8rem',
                                                    background: canDelete ? '#fee2e2' : '#f3f4f6',
                                                    color: canDelete ? '#dc2626' : '#9ca3af',
                                                    border: `1px solid ${canDelete ? '#fca5a5' : '#e5e7eb'}`,
                                                    borderRadius: '8px',
                                                    cursor: canDelete ? 'pointer' : 'not-allowed',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    fontSize: '0.82rem',
                                                    fontWeight: '600',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <Trash2 size={14} />
                                                {canDelete ? 'Supprimer' : '🔒 Bloquée'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="welcome-card" style={{ textAlign: 'center' }}>
                            <CheckSquare size={64} style={{ color: 'var(--mobilis-green)', margin: '0 auto 1rem' }} />
                            <h3 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                                {searchQuery || filterStatus !== 'all' ? 'Aucune tâche trouvée' : 'Aucune tâche dans ce projet'}
                            </h3>
                            <p style={{ color: '#9ca3af' }}>
                                {searchQuery || filterStatus !== 'all'
                                    ? 'Essayez de modifier vos filtres'
                                    : 'Créez votre première tâche pour commencer'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>➕ Nouvelle Tâche</h2>
                            <button className="close-btn" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="modal-body">
                            <div className="form-group">
                                <label>📋 Nom de la tâche *</label>
                                <input
                                    type="text"
                                    required
                                    value={newTask.taskName}
                                    onChange={(e) => setNewTask({ ...newTask, taskName: e.target.value })}
                                    placeholder="Ex: Développer la page d'accueil"
                                    className="form-select"
                                />
                            </div>

                            <div className="form-group">
                                <label>📝 Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    placeholder="Décrivez la tâche..."
                                    rows="3"
                                    className="form-select"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>📅 Date limite *</label>
                                <input
                                    type="date"
                                    required
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    className="form-select"
                                />
                            </div>

                            <div className="form-group">
                                <label>⚡ Priorité *</label>
                                <select
                                    value={newTask.priorityId}
                                    onChange={(e) => setNewTask({ ...newTask, priorityId: parseInt(e.target.value) })}
                                    className="form-select"
                                >
                                    <option value="1">Basse</option>
                                    <option value="2">Moyenne</option>
                                    <option value="3">Haute</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>👤 Assigner à</label>
                                <select
                                    value={newTask.assignedToUserId}
                                    onChange={(e) => setNewTask({ ...newTask, assignedToUserId: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="">Non assigné</option>
                                    {/* ✅ FIX — backend retourne uniquement les Developers */}
                                    {teamMembers.map((member) => (
                                        <option key={member.userId} value={member.userId}>
                                            {member.fullName} {/* ✅ Sans (roleName) — toujours Developer */}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="btn-cancel">
                                    Annuler
                                </button>
                                <button type="submit" className="btn-save">
                                    <Plus size={18} />
                                    Créer la tâche
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ProjectManagerLayout>
    );
};

export default ProjectManagerTasks;
