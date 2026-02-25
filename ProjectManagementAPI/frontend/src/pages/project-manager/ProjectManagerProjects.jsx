// src/pages/projectmanager/ProjectManagerProjects.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    FolderKanban,
    BarChart3,
    Clock,
    AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import ProjectManagerLayout from '../../components/layout/ProjectManagerLayout';
import '../../styles/Dashboard.css';
import '../../styles/DeveloperDashboard.css';

const ProjectManagerProjects = () => {
    const { user } = useAuth();

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectStats, setProjectStats] = useState(null);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?.userId) fetchProjects();
    }, [user]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/projectmanager/my-projects');
            if (response.data.success) {
                setProjects(response.data.data || []);
            } else {
                setError(response.data.message || 'Erreur lors du chargement des projets');
            }
        } catch (err) {
            setError(
                err.response?.data?.message || 'Erreur lors de la connexion au serveur'
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchProjectStats = async (projectId) => {
        try {
            setStatsLoading(true);
            const response = await api.get(
                `/projectmanager/projects/${projectId}/stats`
            );
            if (response.data.success) {
                setProjectStats(response.data.data);
            }
        } catch (err) {
            console.error('❌ Error loading stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const viewProjectStats = async (project) => {
        setSelectedProject(project);
        setShowStatsModal(true);
        await fetchProjectStats(project.projectId);
    };

    const closeStatsModal = () => {
        setShowStatsModal(false);
        setSelectedProject(null);
        setProjectStats(null);
    };

    const getProgressClass = (progress) => {
        if (progress >= 100) return 'completed';
        if (progress >= 66) return 'high';
        if (progress >= 33) return 'medium';
        return 'low';
    };

    const getProjectStatusStyle = (statusName) => {
        switch (statusName) {
            case 'Planifié':
                return { backgroundColor: '#E5E7EB', color: '#374151' };
            case 'En cours':
                return { backgroundColor: '#DBEAFE', color: '#1D4ED8' };
            case 'Terminé':
                return { backgroundColor: '#DCFCE7', color: '#15803D' };
            case 'Annulé':
                return { backgroundColor: '#FEE2E2', color: '#B91C1C' };
            case '✅ Prêt à finaliser':          // ✅ FIXED
                return { backgroundColor: '#D1FAE5', color: '#065F46' };
            case '⏳ En attente de validation':
                return { backgroundColor: '#FEF3C7', color: '#B45309' };
            case '🔴 En retard':
                return { backgroundColor: '#FEE2E2', color: '#B91C1C' };
            default:
                return { backgroundColor: '#E5E7EB', color: '#374151' };
        }
    };

    const getProjectBorder = (statusName) => {
        switch (statusName) {
            case 'Terminé':
                return '2px solid #10B981';
            case 'Annulé':
                return '2px solid #EF4444';
            case '✅ Prêt à finaliser':          // ✅ FIXED
                return '2px solid #F59E0B';
            case '⏳ En attente de validation':
                return '2px solid #FFA500';
            case '🔴 En retard':
                return '2px solid #EF4444';
            default:
                return '1px solid #e5e7eb';
        }
    };

    const handleCloseProject = async (projectId) => {
        const confirmClose = window.confirm(
            '✅ Toutes les tâches sont validées.\nVoulez-vous finaliser ce projet ?'
        );
        if (!confirmClose) return;

        try {
            const response = await api.put(
                `/projectmanager/projects/${projectId}/close`
            );
            if (response.data.success) {
                alert('✅ Projet finalisé avec succès');
                fetchProjects();
            } else {
                alert('❌ ' + response.data.message);
            }
        } catch (err) {
            console.error('❌ Erreur finalisation projet:', err);
            alert(
                '❌ ' +
                (err.response?.data?.message ||
                    'Erreur lors de la finalisation du projet')
            );
        }
    };

    return (
        <ProjectManagerLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">

                    {/* Header */}
                    <div className="welcome-card" style={{ marginBottom: '2rem' }}>
                        <h2>📁 Mes Projets</h2>
                        <p className="welcome-text">
                            Gérez et suivez la progression de tous vos projets
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: '#fee2e2',
                            border: '2px solid #dc2626',
                            borderRadius: '12px',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <p style={{ margin: 0, color: '#dc2626', fontWeight: '600' }}>
                                ⚠️ {error}
                            </p>
                            <button
                                onClick={fetchProjects}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Réessayer
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            Chargement des projets...
                        </div>
                    ) : (
                        <>
                            {projects.length > 0 ? (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                    gap: '1.5rem'
                                }}>
                                    {projects.map((project) => (
                                        <div
                                            key={project.projectId}
                                            style={{
                                                background: 'white',
                                                borderRadius: '16px',
                                                padding: '1.5rem',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                                border: getProjectBorder(project.statusName)
                                            }}
                                        >
                                            {/* Header */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                marginBottom: '1rem'
                                            }}>
                                                <h3 style={{
                                                    fontSize: '1.2rem',
                                                    color: '#1f2937',
                                                    fontWeight: '700',
                                                    margin: 0,
                                                    flex: 1
                                                }}>
                                                    {project.projectName}
                                                </h3>
                                                {project.isDelayed && (
                                                    <span className="overdue-badge">
                                                        <Clock size={14} />
                                                        RETARD
                                                    </span>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.35rem 0.85rem',
                                                borderRadius: '999px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                marginBottom: '1rem',
                                                ...getProjectStatusStyle(project.statusName)
                                            }}>
                                                {project.statusName}
                                            </div>

                                            {/* Description */}
                                            <p style={{
                                                fontSize: '0.9rem',
                                                color: '#6b7280',
                                                marginBottom: '1rem',
                                                lineHeight: '1.5'
                                            }}>
                                                {project.description || 'Aucune description'}
                                            </p>

                                            {/* Progress Bar */}
                                            <div className="task-progress-section">
                                                <div className="task-progress-bar-bg">
                                                    <div
                                                        className={`task-progress-bar-fill progress-${getProgressClass(project.progress)}`}
                                                        style={{ width: `${project.progress ?? 0}%` }}
                                                    >
                                                        <div className="progress-shimmer"></div>
                                                    </div>
                                                </div>
                                                <span className="task-progress-text">
                                                    {project.progress ?? 0}% —{' '}
                                                    {project.completedTasks ?? 0}/
                                                    {project.totalTasks ?? 0} tâches
                                                </span>
                                            </div>

                                            {/* Task Stats */}
                                            <div style={{
                                                display: 'flex',
                                                gap: '0.8rem',
                                                marginTop: '1rem',
                                                fontSize: '0.85rem',
                                                color: '#6b7280',
                                                fontWeight: '600',
                                                flexWrap: 'wrap'
                                            }}>
                                                <span>✅ {project.completedTasks ?? 0}</span>
                                                <span>🔄 {project.inProgressTasks ?? 0}</span>
                                                <span>📝 {project.todoTasks ?? 0}</span>
                                                {(project.pendingValidationTasks ?? 0) > 0 &&
                                                    project.statusName !== 'Terminé' &&
                                                    project.statusName !== 'Annulé' && (
                                                        <span style={{ color: '#F59E0B' }}>
                                                            ⏳ {project.pendingValidationTasks} en validation
                                                        </span>
                                                    )}
                                            </div>

                                            {/* Dates */}
                                            {(project.startDate || project.endDate) && (
                                                <div style={{
                                                    marginTop: '1rem',
                                                    fontSize: '0.85rem',
                                                    color: '#6b7280'
                                                }}>
                                                    {project.startDate && (
                                                        <p style={{ margin: '0.3rem 0' }}>
                                                            📅 Début:{' '}
                                                            {new Date(project.startDate).toLocaleDateString('fr-FR')}
                                                        </p>
                                                    )}
                                                    {project.endDate && (
                                                        <p style={{ margin: '0.3rem 0' }}>
                                                            🏁 Fin:{' '}
                                                            {new Date(project.endDate).toLocaleDateString('fr-FR')}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Boutons */}
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.6rem',
                                                marginTop: '1rem'
                                            }}>
                                                <button
                                                    onClick={() => viewProjectStats(project)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.85rem 1rem',
                                                        background: 'linear-gradient(135deg, var(--mobilis-green) 0%, #008f3f 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem',
                                                        fontSize: '0.95rem',
                                                        boxShadow: '0 4px 12px rgba(0, 166, 81, 0.25)'
                                                    }}
                                                >
                                                    <BarChart3 size={20} />
                                                    Statistiques Détaillées
                                                </button>

                                                {/* ✅ FIXED : était '✅ Prêt à clôturer' */}
                                                {project.statusName === '✅ Prêt à finaliser' && (
                                                    <button
                                                        onClick={() => handleCloseProject(project.projectId)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.75rem 1rem',
                                                            background: 'linear-gradient(135deg, #15803D, #166534)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '10px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            boxShadow: '0 4px 12px rgba(21, 128, 61, 0.3)'
                                                        }}
                                                    >
                                                        ✅ Finaliser le projet
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="welcome-card" style={{ textAlign: 'center' }}>
                                    <FolderKanban
                                        size={64}
                                        style={{ color: 'var(--mobilis-green)', margin: '0 auto 1rem' }}
                                    />
                                    <h3 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                                        Aucun projet trouvé
                                    </h3>
                                    <p style={{ color: '#9ca3af' }}>
                                        Vous n'avez pas encore de projets assignés.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Stats Modal */}
            {showStatsModal && (
                <div
                    onClick={closeStatsModal}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '2rem',
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            position: 'relative',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={closeStatsModal}
                            style={{
                                position: 'absolute',
                                top: '1rem', right: '1rem',
                                width: '40px', height: '40px',
                                background: 'var(--mobilis-green)',
                                border: 'none',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '28px',
                                fontWeight: 'bold',
                                lineHeight: '1',
                                padding: 0,
                                zIndex: 10
                            }}
                        >
                            ×
                        </button>

                        <h2 style={{
                            color: 'var(--mobilis-green)',
                            marginBottom: '1.5rem',
                            fontSize: '1.8rem',
                            fontWeight: '700',
                            paddingRight: '50px'
                        }}>
                            📊 {selectedProject?.projectName}
                        </h2>

                        {statsLoading ? (
                            <div className="loading">
                                <div className="spinner"></div>
                                Chargement des statistiques...
                            </div>
                        ) : projectStats ? (
                            <>
                                {/* Stats Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '1rem',
                                    marginBottom: '2rem'
                                }}>
                                    <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                        <p style={{ color: '#0369a1', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                                            {projectStats.totalTasks ?? 0}
                                        </p>
                                        <p style={{ color: '#0284c7', fontSize: '0.9rem', margin: '0.3rem 0 0 0' }}>
                                            Tâches totales
                                        </p>
                                    </div>
                                    <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                        <p style={{ color: '#15803d', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                                            {projectStats.completedTasks ?? 0}
                                        </p>
                                        <p style={{ color: '#16a34a', fontSize: '0.9rem', margin: '0.3rem 0 0 0' }}>
                                            Terminées
                                        </p>
                                    </div>
                                    <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                        <p style={{ color: '#b45309', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                                            {projectStats.inProgressTasks ?? 0}
                                        </p>
                                        <p style={{ color: '#d97706', fontSize: '0.9rem', margin: '0.3rem 0 0 0' }}>
                                            En cours
                                        </p>
                                    </div>
                                    <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                        <p style={{ color: '#4b5563', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                                            {projectStats.todoTasks ?? 0}
                                        </p>
                                        <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0.3rem 0 0 0' }}>
                                            À faire
                                        </p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: '600', color: '#374151' }}>Progression globale</span>
                                        <span style={{ fontWeight: '700', color: 'var(--mobilis-green)', fontSize: '1.2rem' }}>
                                            {projectStats.progress ?? 0}%
                                        </span>
                                    </div>
                                    <div className="task-progress-bar-bg" style={{ height: '14px' }}>
                                        <div
                                            className={`task-progress-bar-fill progress-${getProgressClass(projectStats.progress ?? 0)}`}
                                            style={{ width: `${projectStats.progress ?? 0}%` }}
                                        >
                                            <div className="progress-shimmer"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.4rem 1rem',
                                    borderRadius: '999px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    marginBottom: '1.5rem',
                                    ...getProjectStatusStyle(projectStats.statusName)
                                }}>
                                    {projectStats.statusName}
                                </div>

                                {/* Delayed Warning */}
                                {projectStats.isDelayed && (
                                    <div style={{
                                        background: '#fee2e2',
                                        border: '2px solid #dc2626',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.8rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <AlertCircle size={24} style={{ color: '#dc2626', flexShrink: 0 }} />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '700', color: '#dc2626' }}>
                                                Projet en retard
                                            </p>
                                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.9rem', color: '#991b1b' }}>
                                                Ce projet a dépassé sa date de fin prévue
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Dates */}
                                {(projectStats.startDate || projectStats.endDate) && (
                                    <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1rem' }}>
                                        <h4 style={{ margin: '0 0 0.8rem 0', color: '#374151' }}>📅 Dates du projet</h4>
                                        {projectStats.startDate && (
                                            <p style={{ margin: '0.3rem 0', color: '#6b7280' }}>
                                                Début : <strong>{new Date(projectStats.startDate).toLocaleDateString('fr-FR')}</strong>
                                            </p>
                                        )}
                                        {projectStats.endDate && (
                                            <p style={{ margin: '0.3rem 0', color: '#6b7280' }}>
                                                Fin prévue : <strong>{new Date(projectStats.endDate).toLocaleDateString('fr-FR')}</strong>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <p style={{ color: '#6b7280', textAlign: 'center' }}>
                                Aucune statistique disponible
                            </p>
                        )}
                    </div>
                </div>
            )}
        </ProjectManagerLayout>
    );
};

export default ProjectManagerProjects;
