import { useState, useEffect } from 'react';
import {
    UserPlus, Edit, Key, Search, X,
    Check, Trash2, UserCheck, UserX
} from 'lucide-react';
import userService from '../../services/userService';
import ReportingLayout from '../../components/layout/ReportingLayout';
import '../../styles/UsersManagement.css';

const UsersManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedUser, setSelectedUser] = useState(null);
    const [tempPassword, setTempPassword] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveUserId, setApproveUserId] = useState(null);
    const [approveUsername, setApproveUsername] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState(1);

    const [formData, setFormData] = useState({
        username: '', email: '', password: '',
        firstName: '', lastName: '', roleId: 1
    });

    useEffect(() => { fetchUsers(); }, []);

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
            setUsers(usersArray);
        } catch (error) {
            console.error('❌ ERROR:', error);
            alert('Erreur lors de la récupération des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter((u) => {
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
        setFormData({ username: '', email: '', password: '', firstName: '', lastName: '', roleId: 1 });
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
            roleId: userToEdit.roleId ?? 1
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                const response = await userService.createUser({
                    ...formData, confirmPassword: formData.password
                });
                if (response.success) {
                    alert('Utilisateur créé avec succès !');
                    fetchUsers();
                    setShowModal(false);
                } else {
                    alert(response.message || 'Création échouée');
                }
            } else {
                const response = await userService.updateUser(selectedUser.userId, {
                    userName: formData.username,
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    roleId: formData.roleId
                });
                if (response.success) {
                    alert('Utilisateur modifié avec succès !');
                    fetchUsers();
                    setShowModal(false);
                } else {
                    alert('Erreur: ' + (response.message || 'Modification échouée'));
                }
            }
        } catch (error) {
            alert(error.message || 'Erreur lors de la sauvegarde');
        }
    };

    // ✅ APPROVE — ouvre modal pour choisir le rôle
    const handleApprove = (userId, username) => {
        setApproveUserId(userId);
        setApproveUsername(username);
        setSelectedRoleId(1);
        setShowApproveModal(true);
    };

    const confirmApprove = async () => {
        try {
            const response = await userService.approveUser(approveUserId, selectedRoleId);
            if (response.success) {
                alert(`✅ ${response.message}`);
                fetchUsers();
                setShowApproveModal(false);
            } else {
                alert(`❌ ${response.message}`);
            }
        } catch (error) {
            console.error('❌ Approve error:', error);
            alert("Erreur lors de l'approbation");
        }
    };

    // ✅ REJECT
    const handleReject = async (userId, username) => {
        if (!window.confirm(`Rejeter l'inscription de "${username}" ?\n\nCette action est irréversible.`)) return;
        try {
            const response = await userService.rejectUser(userId);
            if (response.success) {
                alert(`✅ ${response.message}`);
                fetchUsers();
            } else {
                alert(`❌ ${response.message}`);
            }
        } catch (error) {
            console.error('❌ Reject error:', error);
            alert('Erreur lors du rejet');
        }
    };

    // ✅ DEACTIVATE — endpoint séparé, pas de notification
    const handleDeactivate = async (userId, userName) => {
        if (!window.confirm(`Voulez-vous désactiver "${userName}" ?\n\nL'utilisateur verra un message sur la page Login.`)) return;
        try {
            const response = await userService.deactivateUser(userId);
            if (response.success) {
                alert(`✅ ${response.message}`);
                fetchUsers();
            } else {
                alert(`❌ ${response.message}`);
            }
        } catch {
            alert('Erreur lors de la désactivation');
        }
    };

    // ✅ ACTIVATE — endpoint séparé + notification stockée en DB
    const handleActivate = async (userId, userName) => {
        if (!window.confirm(`Voulez-vous réactiver "${userName}" ?`)) return;
        try {
            const response = await userService.activateUser(userId);
            if (response.success) {
                alert(`✅ ${response.message}\n\n⚠️ N'oubliez pas de générer un mot de passe temporaire !`);
                fetchUsers();
            } else {
                alert(`❌ ${response.message}`);
            }
        } catch {
            alert('Erreur lors de la réactivation');
        }
    };

    // ✅ DELETE
    const handleDelete = async (userId, username) => {
        if (!window.confirm(`⚠️ Supprimer définitivement "${username}" ?\n\nCette action est IRRÉVERSIBLE.`)) return;
        try {
            const response = await userService.deleteUser(userId);
            if (response.success) {
                alert(`✅ ${response.message}`);
                fetchUsers();
            } else {
                alert(`❌ ${response.message}`);
            }
        } catch {
            alert('Erreur lors de la suppression');
        }
    };

    // ✅ GENERATE TEMP PASSWORD
    const handleGenerateTempPassword = async (userId, userName) => {
        if (!window.confirm(`Générer un mot de passe temporaire pour "${userName}" ?`)) return;
        try {
            const response = await userService.generateTempPassword(userId);
            setTempPassword(response.data);
            setShowPasswordModal(true);
            navigator.clipboard.writeText(response.data);
        } catch (error) {
            alert(error.message || 'Erreur lors de la génération');
        }
    };

    const getRoleName = (roleId) => {
        if (roleId == null) return 'Aucun rôle';
        const roles = { 1: 'Developer', 2: 'Project Manager', 3: 'Manager', 4: 'Reporting' };
        return roles[roleId] || 'Unknown';
    };

    const getRoleBadgeClass = (roleId) => {
        if (roleId == null) return 'role-none';
        const classes = { 1: 'role-developer', 2: 'role-project-manager', 3: 'role-manager', 4: 'role-reporting' };
        return classes[roleId] || '';
    };

    return (
        <ReportingLayout>
            <div className="page-container">

                {/* Header */}
                <div className="page-header">
                    <h2>Gestion des Utilisateurs</h2>
                    <button className="btn-create" onClick={handleCreateUser}>
                        <UserPlus size={20} /> Créer un utilisateur
                    </button>
                </div>

                {/* Search */}
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

                {/* Table */}
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        Chargement des utilisateurs...
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nom complet</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Rôle</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((u) => {
                                        const isPending = !u.isActive && !u.lastLoginAt;
                                        return (
                                            <tr key={u.userId}>
                                                <td>{`${u.firstName || ''} ${u.lastName || ''}`.trim() || 'N/A'}</td>
                                                <td>{u.userName || 'N/A'}</td>
                                                <td>{u.email || 'N/A'}</td>
                                                <td>
                                                    <span className={`role-badge ${getRoleBadgeClass(u.roleId)}`}>
                                                        {u.roleName || getRoleName(u.roleId)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {isPending ? (
                                                        <span className="status-badge pending">⏳ En attente</span>
                                                    ) : (
                                                        <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                                                            {u.isActive ? 'Actif' : 'Désactivé'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        {isPending ? (
                                                            // ⏳ EN ATTENTE — Approuver ou Rejeter
                                                            <>
                                                                <button className="btn-icon btn-approve"
                                                                    onClick={() => handleApprove(u.userId, u.userName)}
                                                                    title="Approuver">
                                                                    <Check size={16} />
                                                                </button>
                                                                <button className="btn-icon btn-reject"
                                                                    onClick={() => handleReject(u.userId, u.userName)}
                                                                    title="Rejeter">
                                                                    <X size={16} />
                                                                </button>
                                                            </>
                                                        ) : !u.isActive ? (
                                                            // 🔴 DÉSACTIVÉ — Modifier + Réactiver + MDP + Supprimer
                                                            <>
                                                                <button className="btn-icon btn-edit"
                                                                    onClick={() => handleEditUser(u)}
                                                                    title="Modifier">
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button className="btn-icon btn-activate"
                                                                    onClick={() => handleActivate(u.userId, u.userName)}
                                                                    title="Réactiver le compte">
                                                                    <UserCheck size={16} />
                                                                </button>
                                                                <button className="btn-icon btn-key"
                                                                    onClick={() => handleGenerateTempPassword(u.userId, u.userName)}
                                                                    title="Générer mot de passe temporaire">
                                                                    <Key size={16} />
                                                                </button>
                                                                <button className="btn-icon btn-delete"
                                                                    onClick={() => handleDelete(u.userId, u.userName)}
                                                                    title="Supprimer définitivement">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            // 🟢 ACTIF — Modifier + MDP + Désactiver
                                                            <>
                                                                <button className="btn-icon btn-edit"
                                                                    onClick={() => handleEditUser(u)}
                                                                    title="Modifier">
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button className="btn-icon btn-key"
                                                                    onClick={() => handleGenerateTempPassword(u.userId, u.userName)}
                                                                    title="Générer mot de passe temporaire">
                                                                    <Key size={16} />
                                                                </button>
                                                                <button className="btn-icon btn-deactivate"
                                                                    onClick={() => handleDeactivate(u.userId, u.userName)}
                                                                    title="Désactiver le compte">
                                                                    <UserX size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-data">
                                            {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ✅ APPROVE MODAL */}
                {showApproveModal && (
                    <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>✅ Approuver l'inscription</h3>
                                <button className="modal-close" onClick={() => setShowApproveModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="modal-form">
                                <p>Approuver le compte de <strong>{approveUsername}</strong> ?</p>
                                <div className="form-group">
                                    <label>Assigner un rôle *</label>
                                    <select
                                        value={selectedRoleId}
                                        onChange={(e) => setSelectedRoleId(parseInt(e.target.value))}
                                    >
                                        <option value={1}>Developer</option>
                                        <option value={2}>Project Manager</option>
                                        <option value={3}>Manager</option>
                                        <option value={4}>Reporting</option>
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn-cancel" onClick={() => setShowApproveModal(false)}>
                                        Annuler
                                    </button>
                                    <button className="btn-submit" onClick={confirmApprove}>
                                        ✅ Approuver
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{modalMode === 'create' ? 'Créer un utilisateur' : 'Modifier un utilisateur'}</h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Prénom *</label>
                                        <input type="text" required value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Nom *</label>
                                        <input type="text" required value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Username *</label>
                                    <input type="text" required value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        disabled={modalMode === 'edit'} />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input type="email" required value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                {modalMode === 'create' && (
                                    <div className="form-group">
                                        <label>Mot de passe *</label>
                                        <input type="password" required value={formData.password} minLength={6}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Rôle *</label>
                                    <select value={formData.roleId} required
                                        onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}>
                                        <option value={1}>Developer</option>
                                        <option value={2}>Project Manager</option>
                                        <option value={3}>Manager</option>
                                        <option value={4}>Reporting</option>
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                        Annuler
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        {modalMode === 'create' ? 'Créer' : 'Modifier'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ✅ Password Modal */}
                {showPasswordModal && (
                    <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                        <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>🔑 Mot de passe temporaire généré</h3>
                                <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="password-display">
                                <p>📱 Communiquez ce mot de passe à l'utilisateur par <strong>SMS ou appel</strong> :</p>
                                <div className="password-box">
                                    <code>{tempPassword}</code>
                                    <button className="btn-copy" onClick={() => {
                                        navigator.clipboard.writeText(tempPassword);
                                        alert('✅ Mot de passe copié !');
                                    }}>
                                        Copier
                                    </button>
                                </div>
                                <p className="password-note">
                                    ⚠️ L'utilisateur devra changer ce mot de passe à la prochaine connexion.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </ReportingLayout>
    );
};

export default UsersManagement;
