import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, CheckSquare, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import developerService from '../../services/developerService';
import DeveloperLayout from '../../components/layout/DeveloperLayout';
import '../../styles/Dashboard.css';
import '../../styles/DeveloperDashboard.css';

const ProjectDetails = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProjectDetails();
    }, [projectId]);

    const loadProjectDetails = async () => {
        setLoading(true);
        try {
            const [projectResponse, tasksResponse] = await Promise.all([
                developerService.getProjectDetails(projectId),
                developerService.getAllTasks()
            ]);

            if (projectResponse.success) {
                setProject(projectResponse.data);
            } else {
                setError(projectResponse.message);
            }

            if (tasksResponse.success) {
                const projectTasks = (tasksResponse.data || []).filter(
                    task => task.projectId === parseInt(projectId)
                );
                setTasks(projectTasks);
            }
        } catch (err) {
            console.error('❌ Error loading project details:', err);
            setError('Erreur lors du chargement des détails');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusClass = (status) => {
        const statusMap = {
            'À faire': 'pending',
            'En cours': 'in-progress',
            'Terminé': 'completed'
        };
        return statusMap[status] || 'pending';
    };

    const getPriorityClass = (priority) => {
        const priorityMap = {
            'Haute': 'high',
            'Moyenne': 'medium',
            'Basse': 'low'
        };
        return priorityMap[priority] || 'medium';
    };

    const getProgressClass = (progress) => {
        if (progress === 100) return 'completed';
        if (progress >= 60) return 'high';
        if (progress >= 30) return 'medium';
        return 'low';
    };

    const isOverdue = (deadline, status) => {
        if (!deadline || status === 'Terminé') return false;
        return new Date(deadline) < new Date();
    };

    if (loading) {
        return (
            <DeveloperLayout>
                <div className="dashboard-container">
                    <div className="loading">
                        <div className="spinner"></div>
                        Chargement des détails...
                    </div>
                </div>
            </DeveloperLayout>
        );
    }

    if (error || !project) {
        return (
            <DeveloperLayout>
                <div className="dashboard-container">
                    <div className="dashboard-content">
                        <div className="error-message">
                            <p>⚠️ {error || 'Projet introuvable'}</p>
                            <button onClick={() => navigate('/developer/projects')}>
                                Retour aux projets
                            </button>
                        </div>
                    </div>
                </div>
            </DeveloperLayout>
        );
    }

    const completedTasks = tasks.filter(t => t.status === 'Terminé').length;
    const inProgressTasks = tasks.filter(t => t.status === 'En cours').length;
    const _pendingTasks = tasks.filter(t => t.status === 'À faire').length;
    const overdueTasks = tasks.filter(t => isOverdue(t.deadline, t.status)).length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return (
        <DeveloperLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/developer/projects')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            background: 'white',
                            border: '2px solid #00A651',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '15px',
                            fontWeight: '600',
                            color: '#00A651',
                            marginBottom: '24px',
                            transition: 'all 0.3s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#00A651';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.color = '#00A651';
                        }}
                    >
                        <ArrowLeft size={20} />
                        Retour aux projets
                    </button>

                    {/* Project Header */}
                    <div className="welcome-card" style={{
                        background: 'linear-gradient(135deg, #00A651 0%, #004D29 100%)',
                        color: 'white',
                        marginBottom: '30px'
                    }}>
                        <h2 style={{ margin: '0 0 12px 0', color: 'white', fontSize: '2rem' }}>
                            {project.projectName}
                        </h2>
                        <p style={{ margin: '0 0 24px 0', opacity: 0.95, fontSize: '1.05rem' }}>
                            {project.description || 'Pas de description disponible'}
                        </p>

                        {/* Progress Bar */}
                        <div className="task-progress-section">
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                                fontSize: '0.95rem',
                                fontWeight: '600'
                            }}>
                                <span>Progression globale</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="task-progress-bar-bg" style={{ background: 'rgba(255,255,255,0.3)' }}>
                                <div
                                    className={`task-progress-bar-fill ${getProgressClass(progress)}`}
                                    style={{
                                        width: `${progress}%`,
                                        background: 'white'
                                    }}
                                >
                                    <div className="progress-shimmer"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' }}>
                                <CheckSquare size={28} />
                            </div>
                            <div className="stat-content">
                                <h3>Total Tâches</h3>
                                <p className="stat-number" style={{ color: '#2196F3' }}>{tasks.length}</p>
                                <p className="stat-label">Assignées à vous</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' }}>
                                <TrendingUp size={28} />
                            </div>
                            <div className="stat-content">
                                <h3>En cours</h3>
                                <p className="stat-number" style={{ color: '#FF9800' }}>{inProgressTasks}</p>
                                <p className="stat-label">Tâches actives</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}>
                                <CheckSquare size={28} />
                            </div>
                            <div className="stat-content">
                                <h3>Terminées</h3>
                                <p className="stat-number" style={{ color: '#4CAF50' }}>{completedTasks}</p>
                                <p className="stat-label">Complétées</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)' }}>
                                <AlertCircle size={28} />
                            </div>
                            <div className="stat-content">
                                <h3>En retard</h3>
                                <p className="stat-number" style={{ color: '#F44336' }}>{overdueTasks}</p>
                                <p className="stat-label">Tâches overdue</p>
                            </div>
                        </div>
                    </div>

                    {/* Project Info */}
                    <div className="recent-section" style={{ marginBottom: '30px' }}>
                        <h3>📋 Informations du projet</h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '20px',
                            marginTop: '20px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px',
                                background: '#f8f9fa',
                                borderRadius: '12px'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #00A651, #004D29)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Chef de projet</p>
                                    <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#333' }}>
                                        {project.projectManagerName || 'Non assigné'}
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px',
                                background: '#f8f9fa',
                                borderRadius: '12px'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Équipe</p>
                                    <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#333' }}>
                                        {project.teamName || 'Non assignée'}
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px',
                                background: '#f8f9fa',
                                borderRadius: '12px'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #4CAF50, #388E3C)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Date de début</p>
                                    <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#333' }}>
                                        {formatDate(project.startDate)}
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px',
                                background: '#f8f9fa',
                                borderRadius: '12px'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #FF9800, #F57C00)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Date de fin</p>
                                    <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#333' }}>
                                        {formatDate(project.endDate)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks List */}
                    <div className="recent-section">
                        <h3>✅ Mes tâches sur ce projet</h3>

                        {tasks.length === 0 ? (
                            <div className="no-data">
                                <CheckSquare size={64} color="#ccc" />
                                <p>Aucune tâche assignée sur ce projet</p>
                            </div>
                        ) : (
                            <div className="task-list">
                                {tasks.map(task => (
                                    <div
                                        key={task.taskId}
                                        className={`task-item ${isOverdue(task.deadline, task.status) ? 'overdue' : ''}`}
                                    >
                                        <div className={`task-status ${getStatusClass(task.status)}`}></div>

                                        <div className="task-details">
                                            <h4>{task.taskName}</h4>
                                            {task.description && <p>{task.description}</p>}
                                            <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                                                {task.priority} Priorité
                                            </span>
                                        </div>

                                        <div className="task-meta">
                                            <span className="task-deadline">
                                                📅 Deadline: {formatDate(task.deadline)}
                                            </span>

                                            {isOverdue(task.deadline, task.status) && (
                                                <span className="overdue-badge">
                                                    ⚠️ EN RETARD
                                                </span>
                                            )}

                                            {task.progress !== undefined && (
                                                <div className="progress-wrapper">
                                                    <div className="progress-container">
                                                        <div
                                                            className={`progress-fill ${getProgressClass(task.progress)}`}
                                                            style={{ width: `${task.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="progress-text">
                                                        {task.progress}% complété
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DeveloperLayout>
    );
};

export default ProjectDetails;
