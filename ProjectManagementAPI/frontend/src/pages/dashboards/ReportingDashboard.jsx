import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, UserPlus, Edit, Key, Search, X, Lock, Unlock } from 'lucide-react';
import userService from '../../services/userService';
import '../../styles/ReportingDashboard.css';

const ReportingDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedUser, setSelectedUser] = useState(null);
    const [tempPassword, setTempPassword] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        roleId: 1
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await userService.getAllUsers();

            let usersArray = [];
            if (Array.isArray(response)) {
                usersArray = response;
            } else if (response?.data && Array.isArray(response.data)) {
                usersArray = response.data;
            }

            console.log('✅ Setting users:', usersArray);
            setUsers(usersArray);
        } catch (error) {
            console.error('❌ ERROR:', error);
            alert('Erreur lors de la recuperation des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            (u.firstName || '').toLowerCase().includes(search) ||
            (u.lastName || '').toLowerCase().includes(search) ||
            (u.userName || '').toLowerCase().includes(search) ||
            (u.email || '').toLowerCase().includes(search)
        );
    });

    const handleCreateUser = () => {
        setModalMode('create');
        setFormData({
            username: '',
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            roleId: 1
        });
        setShowModal(true);
    };

    const handleEditUser = (userToEdit) => {
        setModalMode('edit');
        setSelectedUser(userToEdit);
        setFormData({
            username: userToEdit.userName,
            email: userToEdit.email,
            firstName: userToEdit.firstName,
            lastName: userToEdit.lastName,
            roleId: userToEdit.roleId
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                const response = await userService.createUser({
                    ...formData,
                    confirmPassword: formData.password
                });
                if (response.success) {
                    alert('Utilisateur cree avec succes !');
                    fetchUsers();
                    setShowModal(false);
                }
            } else {
             
                const updateData = {
                    userName: formData.username, 
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    roleId: formData.roleId
                };

                const response = await userService.updateUser(selectedUser.userId, updateData);

                if (response.success) {
                    alert('Utilisateur modifie avec succes !');
                    fetchUsers();
                    setShowModal(false);
                } else {
                    alert('Erreur: ' + (response.message || 'Modification echouee'));
                }
            }
        } catch (error) {
            console.error('❌ SUBMIT ERROR:', error);
            alert(error.message || 'Erreur lors de la sauvegarde');
        }
    };

    // ✅ NEW: TOGGLE USER STATUS (ACTIVATE/DEACTIVATE)
    const handleToggleUserStatus = async (userId, userName, isActive) => {
        const action = isActive ? 'désactiver' : 'activer';
        if (!window.confirm(`Voulez-vous ${action} "${userName}" ?`)) return;
        try {
            const response = await userService.toggleUserStatus(userId);
            if (response.success) {
                alert(response.message || `Utilisateur ${action} avec succès !`);
                fetchUsers();
            }
        } catch (error) {
            console.error('❌ TOGGLE ERROR:', error);
            alert(error.message || 'Erreur lors du changement de statut');
        }
    };

    const handleGenerateTempPassword = async (userId, userName) => {
        if (!window.confirm(`Generer un mot de passe temporaire pour "${userName}" ?`)) return;
        try {
            const response = await userService.generateTempPassword(userId);
            setTempPassword(response.data);
            setShowPasswordModal(true);
            navigator.clipboard.writeText(response.data);
        } catch (error) {
            alert(error.message || 'Erreur lors de la generation');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRoleName = (roleId) => {
        const roles = {
            1: 'Developer',
            2: 'Project Manager',
            3: 'Manager',
            4: 'Reporting'
        };
        return roles[roleId] || 'Unknown';
    };

    const getRoleBadgeClass = (roleId) => {
        const classes = {
            1: 'role-developer',
            2: 'role-project-manager',
            3: 'role-manager',
            4: 'role-reporting'
        };
        return classes[roleId] || '';
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>REPORTING DASHBOARD</h1>
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={20} />
                    DECONNEXION
                </button>
            </header>

            <div className="dashboard-content">
                <div className="welcome-card">
                    <h2>Bienvenue, {user?.firstName || 'Reporting Manager'}!</h2>
                    <div className="user-info">
                        <p><strong>Username:</strong> {user?.userName}</p>
                        <p><strong>Email:</strong> {user?.email}</p>
                        <p><strong>Role:</strong> {user?.roleName}</p>
                    </div>
                    <p className="welcome-text">
                        Vous avez acces au tableau de bord Reporting. Gerez tous les utilisateurs, projets et equipes.
                    </p>
                </div>

                <div className="recent-section">
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>Gestion des Utilisateurs</h3>
                        <button className="btn-create" onClick={handleCreateUser}>
                            <UserPlus size={20} />
                            Creer un utilisateur
                        </button>
                    </div>

                    <div className="search-bar">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email ou username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm('')}>
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="loading">Chargement des utilisateurs...</div>
                    ) : (
                        <div className="users-table-container">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Nom complet</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((u) => (
                                            <tr key={u.userId}>
                                                <td style={{ color: '#000', opacity: 1 }}>{`${u.firstName || ''} ${u.lastName || ''}`.trim() || 'N/A'}</td>
                                                <td style={{ color: '#000', opacity: 1 }}>{u.userName || 'N/A'}</td>
                                                <td style={{ color: '#000', opacity: 1 }}>{u.email || 'N/A'}</td>
                                                <td>
                                                    <span className={`role-badge ${getRoleBadgeClass(u.roleId)}`}>
                                                        {u.roleName || getRoleName(u.roleId)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                                                        {u.isActive ? 'Actif' : 'Inactif'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-icon btn-edit"
                                                            onClick={() => handleEditUser(u)}
                                                            title="Modifier"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-key"
                                                            onClick={() => handleGenerateTempPassword(u.userId, u.userName)}
                                                            title="Generer mot de passe"
                                                        >
                                                            <Key size={16} />
                                                        </button>
                                                        {/* ✅ REPLACED DELETE WITH TOGGLE STATUS */}
                                                        <button
                                                            className={`btn-icon ${u.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                                                            onClick={() => handleToggleUserStatus(u.userId, u.userName || 'N/A', u.isActive)}
                                                            title={u.isActive ? 'Désactiver' : 'Activer'}
                                                            style={{
                                                                backgroundColor: u.isActive ? '#ff6b6b' : '#51cf66',
                                                                color: 'white',
                                                                border: 'none',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {u.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="no-data">Aucun utilisateur trouve</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modalMode === 'create' ? 'Creer un utilisateur' : 'Modifier un utilisateur'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Prenom *</label>
                                    <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Nom *</label>
                                    <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Username *</label>
                                <input type="text" required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} disabled={modalMode === 'edit'} />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            {modalMode === 'create' && (
                                <div className="form-group">
                                    <label>Mot de passe *</label>
                                    <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} minLength={6} />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Role *</label>
                                <select value={formData.roleId} onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })} required>
                                    <option value={1}>Developer</option>
                                    <option value={2}>Project Manager</option>
                                    <option value={3}>Manager</option>
                                    <option value={4}>Reporting</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-submit">{modalMode === 'create' ? 'Creer' : 'Modifier'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPasswordModal && (
                <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Mot de passe temporaire genere</h3>
                            <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="password-display">
                            <p>Communiquez ce mot de passe a l utilisateur :</p>
                            <div className="password-box">
                                <code>{tempPassword}</code>
                                <button className="btn-copy" onClick={() => { navigator.clipboard.writeText(tempPassword); alert('Mot de passe copie !'); }}>
                                    Copier
                                </button>
                            </div>
                            <p className="password-note">L utilisateur devra changer ce mot de passe a la prochaine connexion.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportingDashboard;
