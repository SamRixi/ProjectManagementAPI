// src/pages/reporting/TeamsManagement.jsx
import { useState, useEffect } from 'react';
import { UsersRound, Plus, Edit, Trash2, Users, X, UserPlus, UserMinus } from 'lucide-react';
import teamService from '../../services/teamService';
import ReportingLayout from '../../components/layout/ReportingLayout';
import '../../styles/TeamsManagement.css';

const TeamsManagement = () => {
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [isProjectManager, setIsProjectManager] = useState(false);
    const [formData, setFormData] = useState({
        teamName: '',
        description: ''
    });

    useEffect(() => {
        // ✅ Nettoyer l'ancien localStorage (plus nécessaire)
        localStorage.removeItem('deletedTeamIds');
        fetchTeams();
        fetchUsers();
    }, []);

    // ========== FETCH TEAMS ==========
    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await teamService.getAllTeams();
            const teamsArray = Array.isArray(response) ? response : response?.data || [];
            setTeams(teamsArray);
            console.log('📊 Teams loaded:', teamsArray.length);
        } catch (error) {
            console.error('❌ Fetch teams error:', error);
        } finally {
            setLoading(false);
        }
    };

    // ========== FETCH USERS ==========
    const fetchUsers = async () => {
        try {
            const response = await teamService.getAllUsers();
            const usersArray = Array.isArray(response) ? response : response?.data || [];
            setUsers(usersArray);
            console.log('👥 Loaded users:', usersArray.length);
        } catch (error) {
            console.error('❌ Fetch users error:', error);
        }
    };

    // ========== FETCH TEAM MEMBERS ==========
    const fetchTeamMembers = async (teamId) => {
        try {
            const response = await teamService.getTeamMembers(teamId);
            const membersArray = Array.isArray(response) ? response : response?.data || [];
            setTeamMembers(membersArray);
            console.log(`👥 Team ${teamId} members:`, membersArray.length);
        } catch (error) {
            console.error('❌ Fetch team members error:', error);
            setTeamMembers([]);
        }
    };

    // ========== OPEN MEMBERS MODAL ==========
    const handleManageMembers = async (team) => {
        setSelectedTeam(team);
        await fetchTeamMembers(team.teamId);
        setShowMembersModal(true);
        setSelectedUser('');
        setIsProjectManager(false);
    };

    // ========== ADD MEMBER ==========
    const handleAddMember = async (e) => {
        e.preventDefault();

        if (!selectedUser) {
            alert('⚠️ Veuillez sélectionner un utilisateur');
            return;
        }

        try {
            const response = await teamService.addMember({
                teamId: selectedTeam.teamId,
                userId: parseInt(selectedUser),
                isProjectManager: isProjectManager
            });

            if (response.success) {
                alert('✅ Membre ajouté avec succès!');
                await fetchTeamMembers(selectedTeam.teamId);
                await fetchTeams();
                setSelectedUser('');
                setIsProjectManager(false);
            } else {
                alert(`❌ ${response.message || 'Erreur lors de l\'ajout'}`);
            }
        } catch (error) {
            console.error('❌ Add member error:', error);
            alert(`❌ ${error.message || 'Erreur lors de l\'ajout du membre'}`);
        }
    };

    // ========== DELETE MEMBER ==========
    const handleDeleteMember = async (userId, userName) => {
        if (!window.confirm(`Voulez-vous vraiment retirer ${userName} de l'équipe?`)) return;

        try {
            const response = await teamService.removeMember(selectedTeam.teamId, userId);

            if (response.success) {
                alert('✅ Membre retiré avec succès!');
                await fetchTeamMembers(selectedTeam.teamId);
                await fetchTeams();
            } else {
                alert(`❌ ${response.message || 'Erreur lors de la suppression'}`);
            }
        } catch (error) {
            console.error('❌ Delete member error:', error);
            alert(`❌ ${error.message || 'Erreur lors de la suppression du membre'}`);
        }
    };

    // ========== CREATE / EDIT TEAM ==========
    const handleCreateTeam = () => {
        setModalMode('create');
        setFormData({ teamName: '', description: '' });
        setShowModal(true);
    };

    const handleEditTeam = (team) => {
        setModalMode('edit');
        setSelectedTeam(team);
        setFormData({
            teamName: team.teamName,
            description: team.description || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                const response = await teamService.createTeam(formData);
                if (response.success) {
                    alert('✅ Équipe créée avec succès !');
                    fetchTeams();
                    setShowModal(false);
                } else {
                    alert(response.message || 'Erreur lors de la création');
                }
            } else {
                const response = await teamService.updateTeam(selectedTeam.teamId, formData);
                if (response.success) {
                    alert('✅ Équipe modifiée avec succès !');
                    fetchTeams();
                    setShowModal(false);
                } else {
                    alert(response.message || 'Erreur lors de la modification');
                }
            }
        } catch (error) {
            console.error('❌ Submit error:', error);
            alert(error.message || 'Erreur lors de la sauvegarde');
        }
    };

    // ✅ DELETE TEAM — vraie suppression via API
    const handleDeleteTeam = async (teamId, teamName) => {
        if (!window.confirm(`Voulez-vous vraiment supprimer l'équipe "${teamName}" ?\nCette action est irréversible.`)) return;

        try {
            const response = await teamService.deleteTeam(teamId);

            if (response.success) {
                alert(`✅ ${response.message || 'Équipe supprimée avec succès !'}`);
                // ✅ Recharger depuis le serveur
                fetchTeams();
            } else {
                alert(`❌ ${response.message || 'Erreur lors de la suppression'}`);
            }
        } catch (error) {
            console.error('❌ Delete team error:', error);
            alert(`❌ ${error.message || 'Erreur lors de la suppression'}`);
        }
    };

    // Filter out users already members
    const availableUsers = users.filter(
        user => !teamMembers.some(member => member.userId === user.userId)
    );

    return (
        <ReportingLayout>
            <div className="page-container">
                <div className="page-header">
                    <h2>Gestion des Équipes</h2>
                    <button className="btn-create" onClick={handleCreateTeam}>
                        <Plus size={20} />
                        Créer une équipe
                    </button>
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        Chargement des équipes...
                    </div>
                ) : teams.length === 0 ? (
                    <div className="empty-state">
                        <UsersRound size={64} color="#00A651" />
                        <h3>Aucune équipe active</h3>
                        <p>Créez votre première équipe pour commencer</p>
                    </div>
                ) : (
                    <div className="teams-grid">
                        {teams.map((team) => (
                            <div key={team.teamId} className="team-card">
                                <div className="team-card-header">
                                    <div className="team-icon">
                                        <Users size={32} />
                                    </div>
                                    <div className="team-actions">
                                        <button
                                            className="btn-icon btn-members"
                                            onClick={() => handleManageMembers(team)}
                                            title="Gérer les membres"
                                        >
                                            <UserPlus size={16} />
                                        </button>
                                        <button
                                            className="btn-icon btn-edit"
                                            onClick={() => handleEditTeam(team)}
                                            title="Modifier"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="btn-icon btn-delete"
                                            onClick={() => handleDeleteTeam(team.teamId, team.teamName)}
                                            title="Supprimer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="team-card-body">
                                    <h3 className="team-name">{team.teamName}</h3>
                                    {team.description && (
                                        <p className="team-description">{team.description}</p>
                                    )}
                                    <div className="team-members">
                                        <UsersRound size={16} />
                                        <span>{team.memberCount || 0} membre{(team.memberCount || 0) > 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ========== MODAL CRÉATION/ÉDITION ÉQUIPE ========== */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{modalMode === 'create' ? 'Créer une équipe' : 'Modifier une équipe'}</h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-group">
                                    <label>Nom de l'équipe *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.teamName}
                                        onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                                        placeholder="Ex: Équipe Backend"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Description de l'équipe (optionnel)"
                                        rows={4}
                                    />
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

                {/* ========== MODAL GESTION DES MEMBRES ========== */}
                {showMembersModal && selectedTeam && (
                    <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
                        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>👥 Gestion des membres - {selectedTeam.teamName}</h3>
                                <button className="modal-close" onClick={() => setShowMembersModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="members-modal-body">
                                {/* ========== AJOUTER UN MEMBRE ========== */}
                                <div className="add-member-section">
                                    <h4>➕ Ajouter un membre</h4>
                                    <form onSubmit={handleAddMember} className="add-member-form">
                                        <div className="form-row">
                                            <select
                                                value={selectedUser}
                                                onChange={(e) => setSelectedUser(e.target.value)}
                                                className="member-select"
                                                required
                                            >
                                                <option value="">Sélectionnez un utilisateur</option>
                                                {availableUsers.map(user => (
                                                    <option key={user.userId} value={user.userId}>
                                                        {user.firstName} {user.lastName} ({user.userName})
                                                    </option>
                                                ))}
                                            </select>
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={isProjectManager}
                                                    onChange={(e) => setIsProjectManager(e.target.checked)}
                                                />
                                                Chef de projet
                                            </label>
                                            <button type="submit" className="btn-add-member">
                                                Ajouter
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* ========== LISTE DES MEMBRES ========== */}
                                <div className="members-list-section">
                                    <h4>📋 Membres actuels ({teamMembers.length})</h4>
                                    {teamMembers.length === 0 ? (
                                        <p className="empty-members">Aucun membre dans cette équipe</p>
                                    ) : (
                                        <div className="members-list">
                                            {teamMembers.map(member => (
                                                <div key={member.teamMemberId} className="member-item">
                                                    <div className="member-info">
                                                        <div className="member-avatar">
                                                            {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                                        </div>
                                                        <div className="member-details">
                                                            <p className="member-name">
                                                                {member.firstName} {member.lastName}
                                                            </p>
                                                            <p className="member-meta">
                                                                @{member.userName} • {member.roleName}
                                                            </p>
                                                            {member.isProjectManager && (
                                                                <span className="badge-pm">👑 Chef de projet</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteMember(member.userId, `${member.firstName} ${member.lastName}`)}
                                                        className="btn-remove-member"
                                                        title="Retirer ce membre"
                                                    >
                                                        <UserMinus size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ReportingLayout>
    );
};

export default TeamsManagement;
