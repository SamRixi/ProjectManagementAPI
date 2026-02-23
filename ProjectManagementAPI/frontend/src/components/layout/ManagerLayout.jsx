// src/components/layout/ManagerLayout.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderKanban,
    BarChart3,
    Users,
    LogOut,
    Menu,
    RefreshCw
} from 'lucide-react';

const ManagerLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/manager/dashboard' },
        { icon: FolderKanban, label: 'Projets', path: '/manager/projects' },
        { icon: Users, label: 'Équipe', path: '/manager/team' },
        { icon: BarChart3, label: 'Statistiques', path: '/manager/statistics' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>

            {/* ====== TOP HEADER ====== */}
            <header style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
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
                        MANAGER DASHBOARD
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

            {/* ====== SIDEBAR ====== */}
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
                {sidebarOpen ? (
                    <div style={{
                        padding: '30px 20px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <div style={{
                            width: '50px', height: '50px',
                            background: 'white',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                            {user?.username || 'Manager'}
                        </p>
                    </div>
                ) : (
                    <div style={{
                        padding: '30px 0',
                        display: 'flex',
                        justifyContent: 'center',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <div style={{
                            width: '40px', height: '40px',
                            background: 'white',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                                    boxShadow: isActive ? '0 4px 8px rgba(0, 0, 0, 0.1)' : 'none'
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
                                    width: '40px', height: '40px',
                                    background: isActive ? '#00B050' : 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Icon size={20} />
                                </div>
                                {sidebarOpen && <span>{item.label}</span>}
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

            {/* ====== MAIN CONTENT ====== */}
            <main style={{
                marginLeft: sidebarOpen ? '280px' : '80px',
                marginTop: '70px',
                width: `calc(100% - ${sidebarOpen ? '280px' : '80px'})`,
                minHeight: 'calc(100vh - 70px)',
                transition: 'margin-left 0.3s ease, width 0.3s ease'
            }}>
                {children}
            </main>
        </div>
    );
};

export default ManagerLayout;