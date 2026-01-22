import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <h1>Project Management</h1>
                <button onClick={handleLogout} className="btn-logout">
                    Deconnection
                </button>
            </nav>

            <div className="dashboard-content">
                <div className="welcome-card">
                    <h2>Bienvenue, {user?.firstName} {user?.lastName} !</h2>
                    <p>Nom d'utilisateur : <strong>{user?.username}</strong></p>
                    <p>User ID : <strong>{user?.userId}</strong></p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
