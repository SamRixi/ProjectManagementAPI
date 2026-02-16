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
    X
} from 'lucide-react';
import api from '../../services/api';
import ProjectManagerLayout from '../../components/layout/ProjectManagerLayout';
import '../../styles/Dashboard.css';
import '../../styles/DeveloperDashboard.css';

const ProjectManagerTasks = () => {
    const { user } = useAuth();

    // États
    const [allTasks, setAllTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);
 

    // États pour création de tâche
    const [newTask, setNewTask] = useState({
        taskName: '',
        description: '',
        projectId: '',
        assignedToUserId: '',
        dueDate: '',
        taskStatusId: 1,
        priorityId: 2
    });

    // Charger les données au montage
    useEffect(() => {
        if (user?.userId) {
            fetchProjects();
        }
    }, [user]);

    // Charger les tâches quand un projet est sélectionné
    useEffect(() => {
        if (selectedProject) {
            fetchProjectTasks(selectedProject);
            fetchTeamMembers(selectedProject);
        }
    }, [selectedProject]);

    // Filtrer les tâches
    useEffect(() => {
        let filtered = [...allTasks];

        // Filtre par recherche
        if (searchQuery) {
            filtered = filtered.filter(task =>
                task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filtre par statut
        if (filterStatus !== 'all') {
            filtered = filtered.filter(task => {
                if (filterStatus === 'todo') return task.status?.toLowerCase().includes('faire');
                if (filterStatus === 'progress') return task.status?.toLowerCase().includes('cours');
                if (filterStatus === 'completed') return task.status?.toLowerCase().includes('terminé');
                if (filterStatus === 'overdue') return task.isOverdue;
                return true;
            });
        }

        setFilteredTasks(filtered);
    }, [allTasks, searchQuery, filterStatus]);

    // Récupérer la liste des projets
    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await api.get('/projectmanager/my-projects');

            if (response.data.success) {
                const projectsList = response.data.data || [];
                setProjects(projectsList);

                // Sélectionner le premier projet par défaut
                if (projectsList.length > 0) {
                    setSelectedProject(projectsList[0].projectId);
                }
            }
        } catch (err) {
            console.error('❌ Error loading projects:', err);
          
        } finally {
            setLoading(false);
        }
    };

    // Récupérer les tâches d'un projet
    const fetchProjectTasks = async (projectId) => {
        try {
            setLoading(true);
            console.log(`📥 Fetching tasks for project ${projectId}...`);

            const response = await api.get(`/projectmanager/projects/${projectId}/tasks`);
            console.log('✅ Tasks response:', response.data);

            if (response.data.success) {
                setAllTasks(response.data.data || []);
            }
        } catch (err) {
            console.error('❌ Error loading tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    // Récupérer les membres de l'équipe
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

    // Créer une nouvelle tâche
    const handleCreateTask = async (e) => {
        e.preventDefault();

        try {
            console.log('📤 Creating task:', newTask);
            const response = await api.post('/projectmanager/tasks', {
                ...newTask,
                projectId: parseInt(selectedProject),
                assignedToUserId: newTask.assignedToUserId ? parseInt(newTask.assignedToUserId) : null
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

    // Réinitialiser le formulaire
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

    // Obtenir la classe CSS selon le statut
    const getStatusClass = (status) => {
        if (status?.toLowerCase().includes('terminé')) return 'completed';
        if (status?.toLowerCase().includes('cours')) return 'in-progress';
        return 'pending';
    };

    // Obtenir la classe CSS selon la priorité
    const getPriorityClass = (priority) => {
        if (priority?.toLowerCase() === 'haute') return 'high';
        if (priority?.toLowerCase() === 'moyenne') return 'medium';
        return 'low';
    };

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
                                    transition: 'all 0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: selectedProject ? 1 : 0.5
                                }}
                                onMouseEnter={(e) => selectedProject && (e.target.style.background = 'var(--mobilis-dark)')}
                                onMouseLeave={(e) => selectedProject && (e.target.style.background = 'var(--mobilis-green)')}
                            >
                                <Plus size={20} />
                                Nouvelle Tâche
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem'
                        }}>
                            {/* Sélection projet */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                    <Filter size={16} style={{ display: 'inline', marginRight: '0.3rem' }} />
                                    Projet
                                </label>
                                <select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    {projects.map(project => (
                                        <option key={project.projectId} value={project.projectId}>
                                            {project.projectName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtre statut */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                    Statut
                                </label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    <option value="all">Tous</option>
                                    <option value="todo">À faire</option>
                                    <option value="progress">En cours</option>
                                    <option value="completed">Terminé</option>
                                    <option value="overdue">En retard</option>
                                </select>
                            </div>

                            {/* Recherche */}
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
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.95rem'
                                    }}
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
                            {filteredTasks.map((task) => (
                                <div key={task.taskId} className={`task-item ${task.isOverdue ? 'overdue' : ''}`}>
                                    <div className={`task-status ${getStatusClass(task.status)}`}></div>

                                    <div className="task-details" style={{ flex: 1 }}>
                                        <h4>{task.taskName}</h4>
                                        <p>{task.description || 'Aucune description'}</p>

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
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                marginBottom: '0.5rem',
                                                fontSize: '0.9rem',
                                                color: '#374151'
                                            }}>
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
                                    </div>
                                </div>
                            ))}
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
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        padding: '2rem',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        position: 'relative',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                    }}>
                        {/* Close Button */}
                        <button
                            onClick={() => {
                                setShowCreateModal(false);
                                resetForm();
                            }}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: '#f3f4f6',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                            onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
                        >
                            <X size={20} />
                        </button>

                        {/* Modal Header */}
                        <h2 style={{
                            color: 'var(--mobilis-green)',
                            marginBottom: '1.5rem',
                            fontSize: '1.8rem',
                            fontWeight: '700'
                        }}>
                            ➕ Nouvelle Tâche
                        </h2>

                        {/* Form */}
                        <form onSubmit={handleCreateTask}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Nom de la tâche */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                        Nom de la tâche *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newTask.taskName}
                                        onChange={(e) => setNewTask({ ...newTask, taskName: e.target.value })}
                                        placeholder="Ex: Développer la page d'accueil"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                        Description
                                    </label>
                                    <textarea
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        placeholder="Décrivez la tâche..."
                                        rows="3"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '0.95rem',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                {/* Date limite */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                        Date limite *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>

                                {/* Priorité */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                        Priorité *
                                    </label>
                                    <select
                                        value={newTask.priorityId}
                                        onChange={(e) => setNewTask({ ...newTask, priorityId: parseInt(e.target.value) })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '0.95rem'
                                        }}
                                    >
                                        <option value="1">Basse</option>
                                        <option value="2">Moyenne</option>
                                        <option value="3">Haute</option>
                                    </select>
                                </div>

                                {/* Assigner à */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                        Assigner à
                                    </label>
                                    <select
                                        value={newTask.assignedToUserId}
                                        onChange={(e) => setNewTask({ ...newTask, assignedToUserId: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '0.95rem'
                                        }}
                                    >
                                        <option value="">Non assigné</option>
                                        {teamMembers.map(member => (
                                            <option key={member.userId} value={member.userId}>
                                                {member.fullName} ({member.roleName})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '1rem',
                                marginTop: '2rem'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: '#f3f4f6',
                                        color: '#374151',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                                    onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: 'var(--mobilis-green)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = 'var(--mobilis-dark)'}
                                    onMouseLeave={(e) => e.target.style.background = 'var(--mobilis-green)'}
                                >
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
