import { useState, useEffect } from 'react';
import {
    UserPlus, Edit, Key, Search, X,
    Check, Trash2, UserCheck, UserX, AlertTriangle
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

    const [confirmModal, setConfirmModal] = useState({
        show: false, title: '', message: '', variant: 'danger', onConfirm: null
    });

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
    };

    const openConfirm = (title, message, onConfirm, variant = 'danger') => {
        setConfirmModal({ show: true, title, message, variant, onConfirm });
    };

    const closeConfirm = () => {
        setConfirmModal({ show: false, title: '', message: '', variant: 'danger', onConfirm: null });
    };

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
            if (Array.isArray(response)) usersArray = response;
            else if (response?.data && Array.isArray(response.data)) usersArray = response.data;
            setUsers(usersArray);
        } catch {
            showToast('Erreur lors de la récupération des utilisateurs', 'error');
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
                const response = await userService.createUser({ ...formData, confirmPassword: formData.password });
                if (response.success) {
                    showToast('Utilisateur créé avec succès !');
                    fetchUsers();
                    setShowModal(false);
                } else {
                    showToast(response.message || 'Création échouée', 'error');
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
                    showToast('Utilisateur modifié avec succès !');
                    fetchUsers();
                    setShowModal(false);
                } else {
                    showToast(response.message || 'Modification échouée', 'error');
                }
            }
        } catch (error) {
            showToast(error.message || 'Erreur lors de la sauvegarde', 'error');
        }
    };

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
                showToast(response.message);
                fetchUsers();
                setShowApproveModal(false);
            } else {
                showToast(response.message, 'error');
            }
        } catch {
            showToast("Erreur lors de l'approbation", 'error');
        }
    };

    const handleReject = (userId, username) => {
        openConfirm(
            '❌ Rejeter l\'inscription',
            `Voulez-vous rejeter l'inscription de "${username}" ? Cette action est irréversible.`,
            async () => {
                try {
                    const response = await userService.rejectUser(userId);
                    showToast(response.message, response.success ? 'success' : 'error');
                    if (response.success) fetchUsers();
                } catch {
                    showToast('Erreur lors du rejet', 'error');
                }
                closeConfirm();
            },
            'danger'
        );
    };

    const handleDeactivate = (userId, userName) => {
        openConfirm(
            '⚠️ Désactiver le compte',
            `Voulez-vous désactiver le compte de "${userName}" ? L'utilisateur ne pourra plus se connecter.`,
            async () => {
                try {
                    const response = await userService.deactivateUser(userId);
                    showToast(response.message, response.success ? 'success' : 'error');
                    if (response.success) fetchUsers();
                } catch {
                    showToast('Erreur lors de la désactivation', 'error');
                }
                closeConfirm();
            },
            'warning'
        );
    };

    const handleActivate = (userId, userName) => {
        openConfirm(
            '✅ Réactiver le compte',
            `Voulez-vous réactiver le compte de "${userName}" ?`,
            async () => {
                try {
                    const response = await userService.activateUser(userId);
                    showToast(response.message, response.success ? 'success' : 'error');
                    if (response.success) fetchUsers();
                } catch {
                    showToast('Erreur lors de la réactivation', 'error');
                }
                closeConfirm();
            },
            'warning'
        );
    };

    const handleDelete = (userId, username) => {
        openConfirm(
            '🗑️ Supprimer définitivement',
            `Supprimer définitivement "${username}" ? Cette action est IRRÉVERSIBLE et supprime toutes les données associées.`,
            async () => {
                try {
                    const response = await userService.deleteUser(userId);
                    showToast(response.message, response.success ? 'success' : 'error');
                    if (response.success) fetchUsers();
                } catch {
                    showToast('Erreur lors de la suppression', 'error');
                }
                closeConfirm();
            },
            'danger'
        );
    };

    const handleGenerateTempPassword = (userId, userName) => {
        openConfirm(
            '🔑 Générer mot de passe temporaire',
            `Générer un nouveau mot de passe temporaire pour "${userName}" ?`,
            async () => {
                try {
                    const response = await userService.generateTempPassword(userId);
                    setTempPassword(response.data);
                    setShowPasswordModal(true);
                    navigator.clipboard.writeText(response.data);
                } catch (error) {
                    showToast(error.message || 'Erreur lors de la génération', 'error');
                }
                closeConfirm();
            },
            'warning'
        );
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

                {/* Toast */}
                {toast.show && (
                    <div style={{
                        position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                        padding: '14px 20px', borderRadius: '12px', fontWeight: '600',
                        fontSize: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        background: toast.type === 'success' ? '#00A651' : '#FF4444',
                        color: 'white', display: 'flex', alignItems: 'center', gap: '8px',
                        animation: 'slideDown 0.3s ease'
                    }}>
                        {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                    </div>
                )}

                {/* Modal de confirmation */}
                {confirmModal.show && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9998, backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{
                            background: 'white', borderRadius: '16px', padding: '32px',
                            maxWidth: '420px', width: '90%',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                            animation: 'slideIn 0.3s ease'
                        }}>
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '50%',
                                    background: confirmModal.variant === 'danger' ? '#FFF0F0' : '#FFFBF0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto'
                                }}>
                                    <AlertTriangle size={28} color={confirmModal.variant === 'danger' ? '#FF4444' : '#F59E0B'} />
                                </div>
                            </div>
                            <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px' }}>
                                {confirmModal.title}
                            </h3>
                            <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '28px' }}>
                                {confirmModal.message}
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={closeConfirm} style={{
                                    flex: 1, padding: '12px', borderRadius: '10px',
                                    border: '2px solid #E8E8E8', background: 'white',
                                    color: '#666', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
                                }}>
                                    Annuler
                                </button>
                                <button onClick={confirmModal.onConfirm} style={{
                                    flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                                    background: confirmModal.variant === 'danger'
                                        ? 'linear-gradient(135deg, #FF4444, #CC0000)'
                                        : 'linear-gradient(135deg, #00A651, #004D29)',
                                    color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                                }}>
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                        // ✅ FIX : En attente = pas actif ET pas de rôle assigné
                                        // Un compte désactivé a toujours un roleId > 0
                                        const isPending = !u.isActive && (!u.roleId || u.roleId === 0);

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
                                                            <>
                                                                <button className="btn-icon btn-edit"
                                                                    onClick={() => handleEditUser(u)} title="Modifier">
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
                                                            <>
                                                                <button className="btn-icon btn-edit"
                                                                    onClick={() => handleEditUser(u)} title="Modifier">
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

                {/* APPROVE MODAL */}
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
                                    <select value={selectedRoleId}
                                        onChange={(e) => setSelectedRoleId(parseInt(e.target.value))}>
                                        <option value={1}>Developer</option>
                                        <option value={2}>Project Manager</option>
                                        <option value={3}>Manager</option>
                                        <option value={4}>Reporting</option>
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn-cancel" onClick={() => setShowApproveModal(false)}>Annuler</button>
                                    <button className="btn-submit" onClick={confirmApprove}>✅ Approuver</button>
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
                                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                                    <button type="submit" className="btn-submit">
                                        {modalMode === 'create' ? 'Créer' : 'Modifier'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Password Modal */}
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
                                        showToast('Mot de passe copié !');
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