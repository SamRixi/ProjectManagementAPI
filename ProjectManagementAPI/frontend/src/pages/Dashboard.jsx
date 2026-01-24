import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import UserManagement from '../components/UserManagement'; 

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const result = await userService.getAllUsers();
            if (result.success) {
                setUsers(result.data);
            }
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
            
            <div style={{
                background: 'white',
                padding: '16px 32px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src="/mobilis-logo.png.png" alt="Mobilis" style={{ height: '40px' }} />
                    <h1 style={{ margin: 0, fontSize: '24px', color: '#007a33' }}>
                        Dashboard Reporting
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: '#666' }}>
                         {user?.firstName} {user?.lastName}
                    </span>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '8px 16px',
                            background: '#F44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Déconnexion
                    </button>
                </div>
            </div>

         
            <div style={{ padding: '32px' }}>
                <h2 style={{ marginBottom: '24px', color: '#333' }}>
                     Gestion des Utilisateurs
                </h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                        Chargement...
                    </div>
                ) : (
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #E0E0E0' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Nom d'utilisateur</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Nom complet</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Statut</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.userId} style={{ borderBottom: '1px solid #E0E0E0' }}>
                                        <td style={{ padding: '12px' }}>{u.userId}</td>
                                        <td style={{ padding: '12px', fontWeight: '600' }}>{u.userName}</td>
                                        <td style={{ padding: '12px' }}>{u.email}</td>
                                        <td style={{ padding: '12px' }}>
                                            {u.firstName} {u.lastName}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                background: u.isActive ? '#E8F5E9' : '#FFEBEE',
                                                color: u.isActive ? '#4CAF50' : '#F44336',
                                                fontWeight: '600'
                                            }}>
                                                {u.isActive ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <UserManagement user={u} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {users.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                Aucun utilisateur trouvé
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
