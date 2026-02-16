import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderKanban,
    ListTodo,
    CheckCircle,
    LogOut,
    Menu,
    RefreshCw
} from 'lucide-react';
import api from '../../services/api';  // ✅ AJOUTÉ

const ProjectManagerLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [awaitingCount, setAwaitingCount] = useState(0);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchAwaitingValidationCount = async () => {
            try {
                // ✅ UTILISE api AU LIEU DE fetch()
                const response = await api.get('/projectmanager/tasks/awaiting-validation');

                if (response.data.success) {
                    setAwaitingCount(response.data.data.length);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des tâches en attente:', error);
                // Ne pas bloquer l'interface
            }
        };

        fetchAwaitingValidationCount();
        const interval = setInterval(fetchAwaitingValidationCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    const menuItems = [
        {
            icon: LayoutDashboard,
            label: 'Dashboard',
            path: '/project-manager/dashboard'
        },
        {
            icon: FolderKanban,
            label: 'Mes Projets',
            path: '/project-manager/projects'
        },
        {
            icon: ListTodo,
            label: 'Tâches',
            path: '/project-manager/tasks'
        },
        {
            icon: CheckCircle,
            label: 'Validation',
            path: '/project-manager/validation',
            badge: awaitingCount
        }
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            {/* TOP HEADER - FIXED - VERT MOBILIS */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                width: '100vw',
                height: '70px',
                background: 'linear-gradient(135deg, #00A651 0%, #004D29 100%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 30px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1001
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '10px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    >
                        <Menu size={24} />
                    </button>
                    <h1 style={{
                        margin: 0,
                        fontSize: '24px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '2px'
                    }}>
                        PROJECT MANAGER
                    </h1>
                </div>

                <button
                    onClick={handleRefresh}
                    style={{
                        background: 'white',
                        color: '#00A651',
                        border: '2px solid white',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.3s',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <RefreshCw size={16} />
                    <span>Actualiser</span>
                </button>
            </header>

            {/* SIDEBAR - VERT MOBILIS */}
            <aside style={{
                width: sidebarOpen ? '280px' : '80px',
                background: 'linear-gradient(180deg, #00B050 0%, #008f3f 100%)',
                color: 'white',
                transition: 'width 0.3s ease',
                position: 'fixed',
                height: 'calc(100vh - 70px)',
                top: '70px',
                left: 0,
                zIndex: 1000,
                overflow: 'hidden',
                boxShadow: '4px 0 10px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* USER INFO */}
                {sidebarOpen && (
                    <div style={{
                        padding: '30px 20px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            background: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            marginBottom: '15px',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                            👔
                        </div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', opacity: 0.9 }}>
                            Connecté en tant que
                        </p>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem' }}>
                            {user?.username || 'Project Manager'}
                        </p>
                    </div>
                )}

                {!sidebarOpen && (
                    <div style={{
                        padding: '30px 0',
                        display: 'flex',
                        justifyContent: 'center',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px'
                        }}>
                            👔
                        </div>
                    </div>
                )}

                {/* MENU */}
                <nav style={{ padding: '20px 10px', flex: 1 }}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                title={!sidebarOpen ? item.label : ''}
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    backgroundColor: isActive ? 'white' : 'transparent',
                                    color: isActive ? '#00B050' : 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                                    gap: '15px',
                                    marginBottom: '8px',
                                    fontSize: '1rem',
                                    fontWeight: isActive ? '600' : '500',
                                    transition: 'all 0.3s ease',
                                    boxShadow: isActive ? '0 4px 8px rgba(0, 0, 0, 0.1)' : 'none',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                                        e.currentTarget.style.transform = 'translateX(5px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.transform = 'translateX(0)';
                                    }
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: isActive ? '#00B050' : 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Icon size={20} />
                                </div>
                                {sidebarOpen && <span>{item.label}</span>}

                                {/* BADGE NOTIFICATION */}
                                {item.badge > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        right: sidebarOpen ? '15px' : '8px',
                                        top: sidebarOpen ? '50%' : '8px',
                                        transform: sidebarOpen ? 'translateY(-50%)' : 'none',
                                        background: '#ef4444',
                                        color: 'white',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        padding: '3px 8px',
                                        borderRadius: '12px',
                                        minWidth: '20px',
                                        textAlign: 'center',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                        animation: 'pulse 2s infinite'
                                    }}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* LOGOUT */}
                <div style={{
                    padding: '20px 10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    marginTop: 'auto'
                }}>
                    <button
                        onClick={handleLogout}
                        title={!sidebarOpen ? 'Déconnexion' : ''}
                        style={{
                            width: '100%',
                            padding: sidebarOpen ? '14px 20px' : '16px',
                            background: 'white',
                            color: '#00B050',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            transition: 'all 0.3s',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f0f0f0';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span>Déconnexion</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main style={{
                marginLeft: sidebarOpen ? '280px' : '80px',
                marginTop: '70px',
                width: `calc(100% - ${sidebarOpen ? '280px' : '80px'})`,
                minHeight: 'calc(100vh - 70px)',
                transition: 'margin-left 0.3s ease, width 0.3s ease',
                padding: '20px'
            }}>
                {children}
            </main>

            {/* ANIMATION PULSE POUR BADGE */}
            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.7;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProjectManagerLayout;
