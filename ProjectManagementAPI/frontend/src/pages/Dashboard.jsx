import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import '../styles/Dashboard.css';
import ReportingDashboard from './dashboards/ReportingDashboard';
import DeveloperDashboard from './dashboards/DeveloperDashboard';


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

    // ✅ Reporting Dashboard
    if (user.roleId === 4 || hasRole('Reporting')) {
        return <ReportingDashboard />;
    }

    // ✅ Developer Dashboard
    if (hasRole('Developer')) {
        return <DeveloperDashboard />;
    }

    // 📊 Manager Dashboard (à créer)
    if (hasRole('Manager')) {
        return (
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <h1>MANAGER DASHBOARD</h1>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={20} />
                        DECONNEXION
                    </button>
                </header>
                <div className="dashboard-content">
                    <div className="welcome-card">
                        <h2>Bienvenue, {user.firstName}!</h2>
                        <p>Votre role: {user.roleName}</p>
                        <p>Dashboard Manager en construction...</p>
                    </div>
                </div>
            </div>
        );
    }

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
