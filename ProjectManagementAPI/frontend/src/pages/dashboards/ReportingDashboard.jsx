import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Users,
    Briefcase,
    CheckSquare,
    TrendingUp,
    UserPlus,
    FolderPlus,
    LogOut,
    Settings
} from 'lucide-react';

const ReportingDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProjects: 0,
        totalTasks: 0,
        totalTeams: 0,
        activeUsers: 0,
        completedTasks: 0
    });

    useEffect(() => {
        // TODO: Fetch real stats from API
        const fetchStats = () => {
            setStats({
                totalUsers: 25,
                totalProjects: 12,
                totalTasks: 48,
                totalTeams: 5,
                activeUsers: 22,
                completedTasks: 35
            });
        };

        fetchStats();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1 style={{ margin: 0 }}>Tableau de Bord - Reporting</h1>
                    <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                        {user?.firstName} {user?.lastName}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '10px 20px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <LogOut size={20} />
                    Déconnexion
                </button>
            </div>

            {/* Welcome */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '30px',
                borderRadius: '8px',
                color: 'white',
                marginBottom: '20px'
            }}>
                <h2 style={{ margin: 0 }}>Bienvenue, {user?.firstName}! </h2>
                <p style={{ margin: '10px 0 0 0' }}>Voici un aperçu de votre système</p>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
            }}>
                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: '#3b82f6',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <Users size={32} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '32px' }}>{stats.totalUsers}</h3>
                        <p style={{ margin: '5px 0 0 0', color: '#666' }}>Utilisateurs</p>
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: '#10b981',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <Briefcase size={32} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '32px' }}>{stats.totalProjects}</h3>
                        <p style={{ margin: '5px 0 0 0', color: '#666' }}>Projets</p>
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: '#f59e0b',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <CheckSquare size={32} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '32px' }}>{stats.totalTasks}</h3>
                        <p style={{ margin: '5px 0 0 0', color: '#666' }}>Tâches</p>
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: '#8b5cf6',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '32px' }}>{stats.totalTeams}</h3>
                        <p style={{ margin: '5px 0 0 0', color: '#666' }}>Équipes</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px'
            }}>
                <button
                    onClick={() => navigate('/users')}
                    style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                    }}
                >
                    <Users size={24} style={{ color: '#3b82f6' }} />
                    <h3 style={{ margin: '10px 0 5px 0' }}>Utilisateurs</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Gérer les utilisateurs</p>
                </button>

                <button
                    onClick={() => navigate('/projects')}
                    style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                    }}
                >
                    <Briefcase size={24} style={{ color: '#10b981' }} />
                    <h3 style={{ margin: '10px 0 5px 0' }}>Projets</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Gérer les projets</p>
                </button>

                <button
                    onClick={() => navigate('/teams')}
                    style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                    }}
                >
                    <Users size={24} style={{ color: '#f59e0b' }} />
                    <h3 style={{ margin: '10px 0 5px 0' }}>Équipes</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Gérer les équipes</p>
                </button>

                <button
                    onClick={() => navigate('/tasks')}
                    style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                    }}
                >
                    <CheckSquare size={24} style={{ color: '#8b5cf6' }} />
                    <h3 style={{ margin: '10px 0 5px 0' }}>Tâches</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Voir toutes les tâches</p>
                </button>
            </div>
        </div>
    );
};

export default ReportingDashboard;
