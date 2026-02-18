import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import '../styles/Dashboard.css';
import ReportingDashboard from './dashboards/ReportingDashboard';
import DeveloperDashboard from './dashboards/DeveloperDashboard';
import ProjectManagerDashboard from './dashboards/ProjectManagerDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';

const Dashboard = () => {
    const { user, logout, hasRole } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return <div>Loading...</div>;

    if (hasRole('Manager')) return <ManagerDashboard />;
    if (hasRole('Reporting') || user.roleId === 4) return <ReportingDashboard />;
    if (hasRole('Developer')) return <DeveloperDashboard />;
    if (hasRole('Project Manager')) return <ProjectManagerDashboard />;

    // 🎯 Default fallback
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
