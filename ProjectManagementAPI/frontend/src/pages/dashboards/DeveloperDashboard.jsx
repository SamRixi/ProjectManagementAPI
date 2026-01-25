import { useAuth } from '../../context/AuthContext';
import '../../styles/Dashboard.css';

const DeveloperDashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="dashboard-container">
            {/* Navigation */}
            <nav className="dashboard-nav">
                <h1> Developer Dashboard</h1>
                <button onClick={logout} className="btn-logout">
                    Deconnexion
                </button>
            </nav>

            {/* Content */}
            <div className="dashboard-content">
                <div className="welcome-card">
                    <h2>Bienvenue, {user?.firstName || 'Developer'}! </h2>
                    <p>
                        <strong>Username:</strong> {user?.userName}
                    </p>
                    <p>
                        <strong>Email:</strong> {user?.email}
                    </p>
                    <p>
                        <strong>Role:</strong> {user?.roleName}
                    </p>
                    <p>
                        Vous avez acces au tableau de bord developpeur.
                        Gerez vos taches et projets ici.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DeveloperDashboard;

