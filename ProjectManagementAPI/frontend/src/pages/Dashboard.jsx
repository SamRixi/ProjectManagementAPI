import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Code, CheckSquare, Users, FolderKanban, Clock } from 'lucide-react';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user, logout, hasRole } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    //  Developer Dashboard
    if (hasRole('Developer')) {
        return (
            <div className="dashboard-container">
                {/* Header */}
                <header className="dashboard-header">
                    <h1>DEVELOPER DASHBOARD</h1>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={20} />
                        DECONNEXION
                    </button>
                </header>

                {/* Welcome Section */}
                <div className="dashboard-content">
                    <div className="welcome-card">
                        <h2>Bienvenue, {user.firstName}!</h2>
                        <div className="user-info">
                            <p><strong>Username:</strong> {user.userName}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Role:</strong> Developer</p>
                        </div>
                        <p className="welcome-text">
                            Vous avez acces au tableau de bord developpeur. Gerez vos taches et projets ici.
                        </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FolderKanban size={32} />
                            </div>
                            <div className="stat-content">
                                <h3>Mes Projets</h3>
                                <p className="stat-number">5</p>
                                <p className="stat-label">Projets actifs</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <CheckSquare size={32} />
                            </div>
                            <div className="stat-content">
                                <h3>Mes Taches</h3>
                                <p className="stat-number">12</p>
                                <p className="stat-label">Taches en cours</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <Code size={32} />
                            </div>
                            <div className="stat-content">
                                <h3>Code Reviews</h3>
                                <p className="stat-number">3</p>
                                <p className="stat-label">En attente</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <Clock size={32} />
                            </div>
                            <div className="stat-content">
                                <h3>Temps Aujourd'hui</h3>
                                <p className="stat-number">6.5h</p>
                                <p className="stat-label">Heures travaillees</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Tasks */}
                    <div className="recent-section">
                        <h3>Taches Recentes</h3>
                        <div className="task-list">
                            <div className="task-item">
                                <div className="task-status in-progress"></div>
                                <div className="task-details">
                                    <h4>Implementer API Authentication</h4>
                                    <p>Projet: System Backend</p>
                                    <span className="task-priority high">Haute Priorite</span>
                                </div>
                                <div className="task-meta">
                                    <span>Due: 28 Jan</span>
                                </div>
                            </div>

                            <div className="task-item">
                                <div className="task-status pending"></div>
                                <div className="task-details">
                                    <h4>Fix Dashboard UI Bugs</h4>
                                    <p>Projet: Frontend App</p>
                                    <span className="task-priority medium">Moyenne Priorite</span>
                                </div>
                                <div className="task-meta">
                                    <span>Due: 30 Jan</span>
                                </div>
                            </div>

                            <div className="task-item">
                                <div className="task-status completed"></div>
                                <div className="task-details">
                                    <h4>Database Schema Update</h4>
                                    <p>Projet: Database Migration</p>
                                    <span className="task-priority low">Complete</span>
                                </div>
                                <div className="task-meta">
                                    <span>Completed: 25 Jan</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    //  Default fallback
    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>DASHBOARD</h1>
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={20} />
                    DECONNEXION
                </button>
            </header>
            <div className="dashboard-content">
                <div className="welcome-card">
                    <h2>Bienvenue, {user.firstName}!</h2>
                    <p>Votre role: {user.roleName}</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
