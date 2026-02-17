import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import ProjectManagerLayout from '../../components/layout/ProjectManagerLayout';
import api from '../../services/api';

const ProjectStats = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProjectStats();
    }, [projectId]);

    const fetchProjectStats = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/projectmanager/projects/${projectId}/stats`);

            if (response.data.success) {
                setStats(response.data.data);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            console.error('Erreur:', err);
            setError(err.response?.data?.message || 'Erreur lors du chargement des stats');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ProjectManagerLayout>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                    <p style={{ fontSize: '18px', color: '#666' }}>Chargement...</p>
                </div>
            </ProjectManagerLayout>
        );
    }

    if (error) {
        return (
            <ProjectManagerLayout>
                <div style={{ padding: '20px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            background: '#00B050',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginBottom: '20px'
                        }}
                    >
                        <ArrowLeft size={20} />
                        Retour
                    </button>
                    <div style={{ padding: '20px', background: '#fee', borderRadius: '8px', color: '#c33' }}>
                        <p>❌ {error}</p>
                    </div>
                </div>
            </ProjectManagerLayout>
        );
    }

    return (
        <ProjectManagerLayout>
            <div style={{ padding: '20px' }}>
                {/* ✅ BOUTON RETOUR EN HAUT */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 20px',
                        background: '#00B050',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        marginBottom: '24px',
                        fontSize: '15px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: '0 2px 8px rgba(0, 176, 80, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = '#008040';
                        e.target.style.transform = 'translateX(-5px)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = '#00B050';
                        e.target.style.transform = 'translateX(0)';
                    }}
                >
                    <ArrowLeft size={20} />
                    Retour
                </button>

                {/* INFO PROJET */}
                <div style={{
                    background: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    marginBottom: '30px'
                }}>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        marginBottom: '8px',
                        color: '#00B050'
                    }}>
                        📊 {stats.projectName}
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                        {stats.description || 'Aucune description'}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: stats.statusColor + '20',
                            color: stats.statusColor
                        }}>
                            {stats.statusName}
                        </span>
                        <span style={{ fontSize: '14px', color: '#666' }}>
                            👥 {stats.teamName}
                        </span>
                        {stats.isDelayed && (
                            <span style={{
                                fontSize: '14px',
                                color: '#ef4444',
                                fontWeight: '600',
                                padding: '6px 12px',
                                background: '#fee2e2',
                                borderRadius: '6px'
                            }}>
                                ⚠️ En retard
                            </span>
                        )}
                    </div>
                </div>

                {/* PROGRESSION */}
                <div style={{
                    background: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    marginBottom: '30px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                            📈 Progression globale
                        </span>
                        <span style={{ fontSize: '28px', fontWeight: '700', color: '#00B050' }}>
                            {stats.progress}%
                        </span>
                    </div>
                    <div style={{
                        width: '100%',
                        height: '14px',
                        background: '#e5e7eb',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            width: `${stats.progress}%`,
                            height: '100%',
                            background: stats.progress === 100
                                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                : 'linear-gradient(90deg, #00B050 0%, #34d399 100%)',
                            transition: 'width 0.5s ease'
                        }} />
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '12px',
                        fontSize: '13px',
                        color: '#666'
                    }}>
                        <span>📅 Début: {new Date(stats.startDate).toLocaleDateString('fr-FR')}</span>
                        <span>🏁 Fin: {stats.endDate ? new Date(stats.endDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
                    </div>
                </div>

                {/* STATS CARDS */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '20px',
                    marginBottom: '30px'
                }}>
                    <StatCard
                        icon={<CheckCircle size={32} />}
                        title="Total Tâches"
                        value={stats.totalTasks}
                        color="#3b82f6"
                    />
                    <StatCard
                        icon={<CheckCircle size={32} />}
                        title="Terminées"
                        value={stats.completedTasks}
                        color="#10b981"
                    />
                    <StatCard
                        icon={<Clock size={32} />}
                        title="En cours"
                        value={stats.inProgressTasks}
                        color="#f59e0b"
                    />
                    <StatCard
                        icon={<AlertTriangle size={32} />}
                        title="À faire"
                        value={stats.todoTasks}
                        color="#6b7280"
                    />
                </div>

                {/* ✅ BOUTON RETOUR EN BAS */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '14px 28px',
                        background: '#00B050',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        width: '100%',
                        maxWidth: '300px',
                        margin: '0 auto',
                        boxShadow: '0 4px 12px rgba(0, 176, 80, 0.3)',
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = '#008040';
                        e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = '#00B050';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    <ArrowLeft size={22} />
                    Retour au Dashboard
                </button>
            </div>
        </ProjectManagerLayout>
    );
};

const StatCard = ({ icon, title, value, color }) => (
    <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        transition: 'all 0.3s',
        border: '1px solid #f3f4f6'
    }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
    >
        <div style={{
            width: '64px',
            height: '64px',
            background: `${color}20`,
            color: color,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
        }}>
            {icon}
        </div>
        <div>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 4px 0' }}>{title}</p>
            <p style={{ fontSize: '36px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>{value}</p>
        </div>
    </div>
);

export default ProjectStats;
