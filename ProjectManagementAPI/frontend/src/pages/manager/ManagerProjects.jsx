// src/pages/dashboards/ManagerProjects.jsx
import { useEffect, useState } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import projectService from '../../services/projectService';
import teamService from '../../services/teamService';
import userService from '../../services/userService';
import { FolderKanban, Users, Clock, CheckCircle, Search, X, Eye, Edit2, Ban, Plus, AlertTriangle } from 'lucide-react';
import '../../styles/Dashboard.css';

const getStatusBadge = (statusId, statusName) => {
    const id = parseInt(statusId);
    if (id === 1) return { label: statusName || 'Planifié', bg: '#E5E7EB', color: '#374151' };
    if (id === 2) return { label: statusName || 'En cours', bg: '#DBEAFE', color: '#1D4ED8' };
    if (id === 3) return { label: statusName || 'Terminé', bg: '#DCFCE7', color: '#15803D' };
    if (id === 4) return { label: statusName || 'Annulé', bg: '#FEE2E2', color: '#B91C1C' };
    return { label: statusName || 'N/A', bg: '#E5E7EB', color: '#374151' };
};

const getPriorityLabel = (id) => {
    if (parseInt(id) === 1) return { label: '🟢 Basse', bg: '#dcfce7', color: '#15803d' };
    if (parseInt(id) === 2) return { label: '🟡 Moyenne', bg: '#fef9c3', color: '#a16207' };
    if (parseInt(id) === 3) return { label: '🔴 Haute', bg: '#fee2e2', color: '#dc2626' };
    return { label: 'N/A', bg: '#f3f4f6', color: '#6b7280' };
};

const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.95rem',
    backgroundColor: '#ffffff',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
};

const labelStyle = {
    fontWeight: 600,
    display: 'block',
    marginBottom: 6,
    color: '#374151',
    fontSize: '0.875rem',
};

// ✅✅✅ FormModal COMPLÈTEMENT EN DEHORS de ManagerProjects ✅✅✅
const FormModal = ({ title, onSubmit, onClose, isEdit = false, saving, form, setForm, teams, managers }) => (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
        <div className="modal-content" onClick={e => e.stopPropagation()}
            style={{ maxWidth: 580, background: '#ffffff' }}>
            <div className="modal-header">
                <h3 style={{ color: '#111827' }}>{title}</h3>
                <button className="modal-close" onClick={onClose} disabled={saving}><X size={22} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff' }}>

                <div>
                    <label style={labelStyle}>Nom du projet *</label>
                    <input type="text" value={form.projectName}
                        onChange={e => setForm({ ...form, projectName: e.target.value })}
                        disabled={saving} placeholder="Ex: Digitalisation RH"
                        style={inputStyle} />
                </div>

                <div>
                    <label style={labelStyle}>Description</label>
                    <textarea value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        rows={3} disabled={saving} placeholder="Description du projet..."
                        style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isEdit ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Priorité</label>
                        <select value={form.priorityId}
                            onChange={e => setForm({ ...form, priorityId: e.target.value })}
                            disabled={saving} style={inputStyle}>
                            <option value="1">🟢 Basse</option>
                            <option value="2">🟡 Moyenne</option>
                            <option value="3">🔴 Haute</option>
                        </select>
                    </div>
                    {isEdit && (
                        <div>
                            <label style={labelStyle}>Statut</label>
                            <select value={form.projectStatusId}
                                onChange={e => setForm({ ...form, projectStatusId: e.target.value })}
                                disabled={saving} style={inputStyle}>
                                <option value="1">Planifié</option>
                                <option value="2">En cours</option>
                                <option value="3">Terminé</option>
                                <option value="4">Annulé</option>
                            </select>
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Date de début *</label>
                        <input type="date" value={form.startDate}
                            onChange={e => setForm({ ...form, startDate: e.target.value })}
                            disabled={saving} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Date de fin *</label>
                        <input type="date" value={form.endDate}
                            onChange={e => setForm({ ...form, endDate: e.target.value })}
                            disabled={saving} style={inputStyle} />
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Chef de projet</label>
                    <select value={form.projectManagerId}
                        onChange={e => setForm({ ...form, projectManagerId: e.target.value })}
                        disabled={saving} style={inputStyle}>
                        <option value="">-- Aucun chef --</option>
                        {managers.map(m => (
                            <option key={m.userId} value={m.userId}>
                                {m.firstName ? `${m.firstName} ${m.lastName || ''}` : m.username || m.userName}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Équipe assignée</label>
                    <select value={form.teamId}
                        onChange={e => setForm({ ...form, teamId: e.target.value })}
                        disabled={saving} style={inputStyle}>
                        <option value="">-- Aucune équipe --</option>
                        {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button onClick={onClose} disabled={saving}
                        style={{ padding: '10px 24px', borderRadius: 8, border: '1.5px solid #e5e7eb', cursor: 'pointer', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.9rem' }}>
                        Annuler
                    </button>
                    <button onClick={onSubmit} disabled={saving}
                        style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#00A651,#004D29)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(0,166,81,0.3)' }}>
                        {saving ? '⏳ Enregistrement...' : isEdit ? '✅ Mettre à jour' : '✅ Créer le projet'}
                    </button>
                </div>
            </div>
        </div>
    </div>
);
// ✅✅✅ FIN FormModal ✅✅✅

const ManagerProjects = () => {
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
    };

    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
    const openConfirm = (title, message, onConfirm) => setConfirmModal({ show: true, title, message, onConfirm });
    const closeConfirm = () => setConfirmModal({ show: false, title: '', message: '', onConfirm: null });

    const initialForm = {
        projectName: '', description: '', priority: 'Moyenne',
        priorityId: 2, startDate: '', endDate: '',
        teamId: '', projectManagerId: '', projectStatusId: 1,
    };
    const [form, setForm] = useState(initialForm);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [projectsRes, teamsRes, usersRes] = await Promise.all([
                projectService.getAllProjects(),
                teamService.getAllTeams(),
                userService.getAllUsers(),
            ]);
            if (projectsRes.success) setProjects(projectsRes.data || []);
            if (teamsRes.success) setTeams(teamsRes.data || []);
            if (usersRes.success) {
                const pms = (usersRes.data || []).filter(
                    u => u.role === 'ChefDeProjet' || u.role === 'ProjectManager'
                        || u.roleId === 2 || u.roleName === 'Project Manager'
                );
                setManagers(pms);
            }
        } catch { setError('Erreur de connexion au serveur'); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!form.projectName || !form.startDate || !form.endDate) {
            showToast('Nom, date de début et date de fin sont requis', 'error'); return;
        }
        if (new Date(form.endDate) < new Date(form.startDate)) {
            showToast('La date de fin doit être après la date de début', 'error'); return;
        }
        try {
            setSaving(true);
            const payload = {
                projectName: form.projectName.trim(),
                description: form.description?.trim() || '',
                startDate: new Date(form.startDate).toISOString(),
                endDate: new Date(form.endDate).toISOString(),
                priorityId: parseInt(form.priorityId) || 2,
                projectManagerId: form.projectManagerId ? parseInt(form.projectManagerId) : null,
            };
            const res = await projectService.createProject(payload);
            if (!res.success) { showToast(res.message || 'Erreur', 'error'); return; }

            const newId = res.data?.projectId || res.data?.ProjectId || res.data?.id;
            if (parseInt(form.teamId) > 0 && newId) {
                await projectService.assignTeamToProject(newId, parseInt(form.teamId));
            }
            showToast('Projet créé avec succès !');
            setShowCreateModal(false);
            setForm(initialForm);
            await loadData();
        } catch { showToast('Erreur de connexion', 'error'); }
        finally { setSaving(false); }
    };

    const handleEdit = async () => {
        if (!form.projectName || !form.startDate || !form.endDate) {
            showToast('Champs requis manquants', 'error'); return;
        }
        try {
            setSaving(true);
            const payload = {
                projectId: selectedProject.projectId,
                projectName: form.projectName.trim(),
                description: form.description?.trim() || '',
                startDate: new Date(form.startDate).toISOString(),
                endDate: new Date(form.endDate).toISOString(),
                priorityId: parseInt(form.priorityId) || 2,
                projectManagerId: form.projectManagerId ? parseInt(form.projectManagerId) : null,
                projectStatusId: parseInt(form.projectStatusId) || 1,
            };
            const res = await projectService.updateProject(selectedProject.projectId, payload);
            if (!res.success) { showToast(res.message || 'Erreur', 'error'); return; }

            if (parseInt(form.teamId) > 0) {
                await projectService.assignTeamToProject(selectedProject.projectId, parseInt(form.teamId));
            }
            showToast('Projet mis à jour !');
            setShowEditModal(false);
            setSelectedProject(null);
            setForm(initialForm);
            await loadData();
        } catch { showToast('Erreur de connexion', 'error'); }
        finally { setSaving(false); }
    };

    const handleCancel = (projectId, projectName) => {
        openConfirm(
            '⚠️ Annuler le projet',
            `Voulez-vous vraiment annuler "${projectName}" ? Cette action notifiera toute l'équipe.`,
            async () => {
                try {
                    const res = await projectService.cancelProject(projectId);
                    showToast(res.success ? 'Projet annulé !' : res.message, res.success ? 'success' : 'error');
                    if (res.success) await loadData();
                } catch { showToast("Erreur lors de l'annulation", 'error'); }
                closeConfirm();
            }
        );
    };

    const openEditModal = (p) => {
        setSelectedProject(p);
        setForm({
            projectName: p.projectName || '',
            description: p.description || '',
            priorityId: p.priorityId || 2,
            startDate: p.startDate ? p.startDate.split('T')[0] : '',
            endDate: p.endDate ? p.endDate.split('T')[0] : '',
            teamId: p.teamId || '',
            projectManagerId: p.projectManagerId || '',
            projectStatusId: p.projectStatusId || 1,
        });
        setShowEditModal(true);
    };

    const filteredProjects = projects.filter(p => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            p.projectName?.toLowerCase().includes(s) ||
            p.teamName?.toLowerCase().includes(s) ||
            p.projectManagerName?.toLowerCase().includes(s)
        );
    });

    const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : 'N/A';
    const getProgressColor = v => v >= 75 ? '#10b981' : v >= 40 ? '#f59e0b' : '#ef4444';
    const now = new Date();

    const total = projects.length;
    const withTeam = projects.filter(p => p.teamName && p.teamName !== 'N/A').length;
    const lateCount = projects.filter(p =>
        p.endDate && new Date(p.endDate) < now
        && parseInt(p.projectStatusId) !== 3
        && parseInt(p.projectStatusId) !== 4
    ).length;
    const avgProgress = total
        ? Math.round(projects.reduce((a, p) => a + (p.progress ?? 0), 0) / total)
        : 0;

    return (
        <ManagerLayout>
            <div className="dashboard-container">
                <div className="dashboard-content">

                    {/* Toast */}
                    {toast.show && (
                        <div style={{
                            position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                            padding: '14px 20px', borderRadius: '12px', fontWeight: '600',
                            fontSize: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            background: toast.type === 'success' ? '#00A651' : '#FF4444',
                            color: 'white', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                        </div>
                    )}

                    {/* Confirm Modal */}
                    {confirmModal.show && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, backdropFilter: 'blur(4px)' }}>
                            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '90%', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
                                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                        <AlertTriangle size={28} color="#F59E0B" />
                                    </div>
                                </div>
                                <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px' }}>{confirmModal.title}</h3>
                                <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '28px' }}>{confirmModal.message}</p>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={closeConfirm} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid #E8E8E8', background: 'white', color: '#666', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Annuler</button>
                                    <button onClick={confirmModal.onConfirm} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Confirmer</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HEADER */}
                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>Gestion des Projets</h2>
                            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                                Créer, modifier, annuler des projets · Assigner équipes et chefs de projet
                            </p>
                        </div>
                        <button onClick={() => { setForm(initialForm); setShowCreateModal(true); }}
                            style={{ background: 'linear-gradient(135deg,#00A651,#004D29)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
                            <Plus size={18} /> Nouveau Projet
                        </button>
                    </div>

                    {/* KPI CARDS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            { label: 'Total Projets', value: total, color: '#111827', icon: <FolderKanban size={22} /> },
                            { label: 'Avec Équipe', value: withTeam, color: '#3b82f6', icon: <Users size={22} /> },
                            { label: 'En Retard', value: lateCount, color: '#ef4444', icon: <Clock size={22} /> },
                            { label: 'Progression Moy.', value: `${avgProgress}%`, color: '#10b981', icon: <CheckCircle size={22} /> },
                        ].map((kpi, i) => (
                            <div key={i} className="stat-card" style={{ padding: '1.5rem' }}>
                                <div style={{ width: 44, height: 44, background: `${kpi.color}20`, color: kpi.color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                                    {kpi.icon}
                                </div>
                                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: kpi.color }}>{kpi.value}</p>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{kpi.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* SEARCH */}
                    <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
                        <Search size={18} />
                        <input type="text" placeholder="Rechercher par nom, équipe ou chef de projet..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        {searchTerm && <button className="clear-search" onClick={() => setSearchTerm('')}><X size={16} /></button>}
                    </div>

                    {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ {error}</p>}

                    {/* TABLE */}
                    {loading ? (
                        <div className="loading"><div className="spinner" />Chargement des projets...</div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Projet</th>
                                        <th>Chef de projet</th>
                                        <th>Équipe</th>
                                        <th>Priorité</th>
                                        <th>Progression</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProjects.length > 0 ? filteredProjects.map(p => {
                                        const status = getStatusBadge(p.projectStatusId, p.statusName);
                                        const priority = getPriorityLabel(p.priorityId);
                                        return (
                                            <tr key={p.projectId}>
                                                <td style={{ fontWeight: 700, color: '#00A651' }}>#{p.projectId}</td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{p.projectName}</div>
                                                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Fin : {formatDate(p.endDate)}</div>
                                                </td>
                                                <td>
                                                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', background: p.projectManagerName ? '#d1fae5' : '#f3f4f6', color: p.projectManagerName ? '#065f46' : '#6b7280' }}>
                                                        {p.projectManagerName || 'Non assigné'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', background: p.teamName ? '#dbeafe' : '#f3f4f6', color: p.teamName ? '#1d4ed8' : '#6b7280' }}>
                                                        {p.teamName || 'Aucune'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, background: priority.bg, color: priority.color }}>
                                                        {priority.label}
                                                    </span>
                                                </td>
                                                <td style={{ minWidth: 120 }}>
                                                    <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>{p.progress ?? 0}%</div>
                                                    <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${p.progress ?? 0}%`, background: getProgressColor(p.progress ?? 0), borderRadius: 3, transition: 'width 0.3s' }} />
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, background: status.bg, color: status.color }}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button className="btn-icon" title="Voir détails"
                                                            onClick={() => { setSelectedProject(p); setShowDetails(true); }}
                                                            style={{ background: 'linear-gradient(135deg,#E3F2FD,#BBDEFB)', color: '#1976D2' }}>
                                                            <Eye size={15} />
                                                        </button>
                                                        {parseInt(p.projectStatusId) !== 4 && (
                                                            <button className="btn-icon btn-edit" title="Modifier"
                                                                onClick={() => openEditModal(p)}>
                                                                <Edit2 size={15} />
                                                            </button>
                                                        )}
                                                        {parseInt(p.projectStatusId) !== 3 && parseInt(p.projectStatusId) !== 4 && (
                                                            <button className="btn-icon" title="Annuler le projet"
                                                                onClick={() => handleCancel(p.projectId, p.projectName)}
                                                                style={{ background: 'linear-gradient(135deg,#FEE2E2,#FECACA)', color: '#DC2626' }}>
                                                                <Ban size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan={8} className="no-data">{searchTerm ? 'Aucun projet trouvé' : 'Aucun projet'}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* DETAILS MODAL */}
                    {showDetails && selectedProject && (
                        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
                                <div className="modal-header">
                                    <h3>Détails du projet</h3>
                                    <button className="modal-close" onClick={() => setShowDetails(false)}><X size={22} /></button>
                                </div>
                                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {[
                                        { label: 'Nom', value: selectedProject.projectName },
                                        { label: 'Description', value: selectedProject.description || 'N/A' },
                                        { label: 'Chef de projet', value: selectedProject.projectManagerName || 'Non assigné' },
                                        { label: 'Équipe', value: selectedProject.teamName || 'Aucune' },
                                        { label: 'Priorité', value: getPriorityLabel(selectedProject.priorityId).label },
                                        { label: 'Statut', value: getStatusBadge(selectedProject.projectStatusId, selectedProject.statusName).label },
                                        { label: 'Date début', value: formatDate(selectedProject.startDate) },
                                        { label: 'Date fin', value: formatDate(selectedProject.endDate) },
                                        { label: 'Progression', value: `${selectedProject.progress ?? 0}%` },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                                            <span style={{ fontWeight: 600, minWidth: 130, color: '#111827' }}>{item.label} :</span>
                                            <span style={{ color: '#6b7280' }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ✅ FormModal reçoit tout en props — stable, pas de re-mount */}
                    {showCreateModal && (
                        <FormModal
                            title="➕ Nouveau Projet"
                            onSubmit={handleCreate}
                            onClose={() => setShowCreateModal(false)}
                            saving={saving}
                            form={form}
                            setForm={setForm}
                            teams={teams}
                            managers={managers}
                        />
                    )}
                    {showEditModal && selectedProject && (
                        <FormModal
                            title="✏️ Modifier le Projet"
                            onSubmit={handleEdit}
                            onClose={() => { setShowEditModal(false); setSelectedProject(null); }}
                            isEdit
                            saving={saving}
                            form={form}
                            setForm={setForm}
                            teams={teams}
                            managers={managers}
                        />
                    )}
                </div>
            </div>
        </ManagerLayout>
    );
};

export default ManagerProjects;