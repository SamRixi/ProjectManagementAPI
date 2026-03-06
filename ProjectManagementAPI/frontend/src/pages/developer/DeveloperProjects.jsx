import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Users, Calendar, ArrowRight } from 'lucide-react';
import developerService from '../../services/developerService';
import edbService from '../../services/edbService';
import DeveloperLayout from '../../components/layout/DeveloperLayout';
import '../../styles/Dashboard.css';
import '../../styles/DeveloperDashboard.css';

// ✅ Statut simplifié pour le membre
const mapStatusForDeveloper = (statusName) => {
    if (!statusName) return 'En cours';
    if (statusName.includes('✅ Prêt à clôturer')) {
        return 'Terminé (en attente du chef de projet)';
    }
    if (statusName.includes('⏳ En attente de validation')) {
        return 'En cours (en attente de validation)';
    }
    return statusName;
};

const DeveloperProjects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [projectEdbs, setProjectEdbs] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadProjects = async () => {
        setLoading(true);
        try {
            const [projectsResponse, edbResponse] = await Promise.all([
                developerService.getProjects(),
                edbService.getMyProjectEdbs()
            ]);

            if (projectsResponse.success) {
                setProjects(projectsResponse.data || []);
                setError('');
            } else {
                setError(projectsResponse.message || 'Erreur lors du chargement des projets');
            }

            if (edbResponse.success) {
                const grouped = {};
                (edbResponse.data || []).forEach((edb) => {
                    const pid = edb.projectId;
                    if (!grouped[pid]) grouped[pid] = [];
                    grouped[pid].push(edb);
                });
                setProjectEdbs(grouped);
            }
        } catch (err) {
            console.error('❌ Error loading projects or EDBs:', err);
            setError('Erreur lors de la connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        const statusLower = (status || '').toLowerCase();
        if (statusLower.includes('actif') || statusLower === 'en cours') return '#00B050';
        if (statusLower.includes('terminé') || statusLower === 'completed') return '#4CAF50';
        return '#808080';
    };

    const getProgressColor = (progress) => {
        if (progress >= 80) return '#00B050';
        if (progress >= 50) return '#FFC107';
        if (progress >= 30) return '#FF9800';
        return '#F44336';
    };

    if (loading) {
        return (
            <DeveloperLayout>
                <div className="dashboard-container">
                    <div className="loading">
                        <div className="spinner"></div>
                        Chargement des projets...
                    </div>
                </div>
            </DeveloperLayout>
        );
    }

    if (error) {
        return (
            <DeveloperLayout>
                <div className="dashboard-container">
                    <div className="dashboard-content">
                        <div className="error-message">
                            <p>⚠️ {error}</p>
                            <button onClick={loadProjects}>Réessayer</button>
                        </div>
                    </div>
                </div>
            </DeveloperLayout>
        );
    }

    return (
        <DeveloperLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">
                    {/* Page Header */}
                    <div className="welcome-card" style={{
                        background: 'linear-gradient(135deg, #00A651 0%, #004D29 100%)',
                        color: 'white', marginBottom: '30px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <Folder size={40} />
                            <div>
                                <h2 style={{ margin: 0, color: 'white' }}>Mes Projets</h2>
                                <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
                                    Consultez tous vos projets assignés
                                </p>
                            </div>
                        </div>
                    </div>

                    {projects.length === 0 ? (
                        <div className="no-data">
                            <Folder size={64} color="#ccc" />
                            <p>📁 Aucun projet assigné pour le moment.</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                            gap: '20px'
                        }}>
                            {projects.map((project) => (
                                <div
                                    key={project.projectId}
                                    className="project-card"
                                    style={{
                                        backgroundColor: 'white', borderRadius: '12px',
                                        padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        border: '2px solid #f0f0f0', transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,176,80,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                    }}
                                >
                                    {/* ✅ CORRECTION — Header en colonne pour éviter l'écrasement */}
                                    <div style={{ marginBottom: '16px' }}>
                                        {/* Nom du projet + Badge statut sur la même ligne */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '8px',
                                            flexWrap: 'wrap'
                                        }}>
                                            <h3 style={{
                                                margin: 0, fontSize: '1.3rem',
                                                color: '#333', flex: '1'
                                            }}>
                                                {project.projectName || 'Sans nom'}
                                            </h3>
                                            <span style={{
                                                padding: '5px 12px',
                                                backgroundColor: getStatusColor(project.statusName),
                                                color: 'white', borderRadius: '20px',
                                                fontSize: '0.75rem', fontWeight: '600',
                                                whiteSpace: 'nowrap',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                flexShrink: 0
                                            }}>
                                                {mapStatusForDeveloper(project.statusName)}
                                            </span>
                                        </div>

                                        {/* ✅ Description sur ligne séparée — plus d'écrasement */}
                                        <p style={{
                                            margin: 0,
                                            fontSize: '0.9rem',
                                            color: '#666',
                                            lineHeight: '1.6',
                                            wordBreak: 'break-word',   // ✅ Fix
                                            overflowWrap: 'break-word' // ✅ Fix
                                        }}>
                                            {project.description || 'Pas de description'}
                                        </p>
                                    </div>

                                    {/* Project Manager */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        marginBottom: '16px', paddingBottom: '16px',
                                        borderBottom: '1px solid #f0f0f0'
                                    }}>
                                        <Users size={16} color="#666" />
                                        <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                            Chef de projet : <strong>{project.projectManagerName || 'Non assigné'}</strong>
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
                                                Progression
                                            </span>
                                            <span style={{
                                                fontSize: '0.95rem', fontWeight: 'bold',
                                                color: getProgressColor(project.progress || 0)
                                            }}>
                                                {project.progress || 0}%
                                            </span>
                                        </div>
                                        <div style={{
                                            width: '100%', height: '10px',
                                            backgroundColor: '#f0f0f0', borderRadius: '5px', overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${project.progress || 0}%`, height: '100%',
                                                backgroundColor: getProgressColor(project.progress || 0),
                                                transition: 'width 0.5s ease', borderRadius: '5px'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Statistics */}
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '10px', marginBottom: '16px'
                                    }}>
                                        {[
                                            { value: project.taskCount || 0, label: 'Tâches', color: '#00B050' },
                                            { value: project.completedTaskCount || 0, label: 'Terminées', color: '#4CAF50' },
                                            { value: project.teamName || 'N/A', label: 'Équipe', color: '#666', small: true }
                                        ].map((stat, i) => (
                                            <div key={i} style={{
                                                textAlign: 'center', padding: '14px 8px',
                                                backgroundColor: '#f8f9fa', borderRadius: '10px',
                                                border: '1px solid #e9ecef'
                                            }}>
                                                <div style={{
                                                    fontSize: stat.small ? '0.85rem' : '1.6rem',
                                                    fontWeight: 'bold', color: stat.color,
                                                    marginBottom: '4px',
                                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {stat.value}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: '500' }}>
                                                    {stat.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* EDB du projet */}
                                    {(projectEdbs[project.projectId] || []).length > 0 && (
                                        <div style={{
                                            marginBottom: '16px', padding: '12px',
                                            backgroundColor: '#f5fff8', borderRadius: '10px',
                                            border: '1px solid #d6f5e0'
                                        }}>
                                            <div style={{
                                                fontSize: '0.9rem', fontWeight: 600,
                                                marginBottom: '8px', color: '#006837'
                                            }}>
                                                EDB de ce projet
                                            </div>
                                            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: '#333' }}>
                                                {projectEdbs[project.projectId].map((edb) => (
                                                    <li key={edb.edbId}>
                                                        <a href={edb.fileUrl} target="_blank" rel="noopener noreferrer"
                                                            style={{ color: '#00B050', textDecoration: 'underline' }}>
                                                            {edb.fileName}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Deadline */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        marginBottom: '16px', paddingTop: '16px',
                                        borderTop: '1px solid #f0f0f0'
                                    }}>
                                        <Calendar size={16} color="#666" />
                                        <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                            Deadline : <strong>{formatDate(project.endDate)}</strong>
                                        </span>
                                    </div>

                                    {/* View Details Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/developer/projects/${project.projectId}`);
                                        }}
                                        style={{
                                            width: '100%', padding: '12px',
                                            backgroundColor: '#00B050', color: 'white',
                                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                                            fontWeight: 'bold', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', gap: '8px',
                                            transition: 'all 0.2s', fontSize: '0.95rem'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#009440';
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#00B050';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        Voir les détails <ArrowRight size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DeveloperLayout>
    );
};

export default DeveloperProjects;