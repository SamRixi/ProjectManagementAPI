// src/pages/reporting/EDBManagement.jsx
import { useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, Search, X, Eye, FolderOpen } from 'lucide-react';
import edbService from '../../services/edbService';
import projectService from '../../services/projectService';
import ReportingLayout from '../../components/layout/ReportingLayout';
import '../../styles/Dashboard.css';

const EDBManagement = () => {
    const [edbs, setEdbs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [edbsResponse, projectsResponse] = await Promise.all([
                edbService.getAllEDBs(),
                projectService.getAllProjects()
            ]);
            if (edbsResponse.success) setEdbs(edbsResponse.data || []);
            if (projectsResponse.success) setProjects(projectsResponse.data || []);
        } catch (error) {
            console.error('❌ Fetch data error:', error);
            alert('Erreur lors de la récupération des données');
        } finally {
            setLoading(false);
        }
    };

    const filteredEdbs = edbs.filter(edb => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            (edb.fileName || '').toLowerCase().includes(s) ||
            (edb.projectName || '').toLowerCase().includes(s) ||
            (edb.edbId?.toString() || '').includes(s)
        );
    });

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) setSelectedFile(file);
    };

    // ✅ Upload sans projet — la liaison se fait depuis "Créer un projet"
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) { alert('Veuillez sélectionner un fichier'); return; }

        try {
            setUploading(true);
            const response = await edbService.uploadEDB(selectedFile, null, description);

            if (response.success) {
                alert('✅ EDB uploadé avec succès ! Assignez-le à un projet depuis "Créer/Modifier un projet".');
                setShowUploadModal(false);
                setSelectedFile(null);
                setDescription('');
                fetchData();
            } else {
                alert('❌ ' + response.message);
            }
        } catch (error) {
            console.error('❌ Upload error:', error);
            alert("Erreur lors de l'upload");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (edb) => {
        try {
            const response = await edbService.downloadEDB(edb.edbId, edb.fileName);
            if (response.success) {
                alert('✅ ' + response.message);
            } else {
                alert('❌ ' + response.message);
            }
        } catch (error) {
            console.error('❌ Download error:', error);
            alert('Erreur lors du téléchargement');
        }
    };

    const handleDelete = async (edbId, fileName) => {
        if (!window.confirm(`Voulez-vous supprimer "${fileName}" ?`)) return;
        try {
            const response = await edbService.deleteEDB(edbId);
            if (response.success) {
                alert('✅ EDB supprimé avec succès !');
                fetchData();
            } else {
                alert('❌ ' + response.message);
            }
        } catch (error) {
            console.error('❌ Delete error:', error);
            alert('Erreur lors de la suppression');
        }
    };

    // ✅ Gère null, undefined et 0
    const isAssigned = (edb) => edb.projectId && edb.projectId !== 0;

    const getProjectName = (projectId) => {
        if (!projectId || projectId === 0) return 'Non assigné';
        const project = projects.find(p => p.projectId === projectId);
        return project?.projectName || 'Projet inconnu';
    };

    return (
        <ReportingLayout>
            <div className="page-container">

                {/* HEADER */}
                <div className="page-header">
                    <h2>Gestion des EDB</h2>
                    <button className="btn-create" onClick={() => setShowUploadModal(true)}>
                        <Upload size={20} />
                        Uploader un EDB
                    </button>
                </div>

                {/* STATS */}
                <div className="stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #00A651, #004D29)' }}>
                            <FileText size={28} />
                        </div>
                        <div className="stat-content">
                            <h3>Total EDB</h3>
                            <p className="stat-number" style={{ color: '#00A651' }}>{edbs.length}</p>
                            <p className="stat-label">Fichiers uploadés</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                            <FolderOpen size={28} />
                        </div>
                        <div className="stat-content">
                            <h3>Non assignés</h3>
                            <p className="stat-number" style={{ color: '#F59E0B' }}>
                                {edbs.filter(e => !isAssigned(e)).length}
                            </p>
                            <p className="stat-label">Sans projet</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
                            <FolderOpen size={28} />
                        </div>
                        <div className="stat-content">
                            <h3>Assignés</h3>
                            <p className="stat-number" style={{ color: '#3B82F6' }}>
                                {edbs.filter(e => isAssigned(e)).length}
                            </p>
                            <p className="stat-label">Avec projet</p>
                        </div>
                    </div>
                </div>

                {/* SEARCH */}
                <div className="search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom de fichier, projet ou ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm('')}>
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* ✅ Info banner */}
                <div style={{
                    padding: '0.75rem 1rem',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 10,
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    color: '#1E40AF'
                }}>
                    💡 Pour lier un EDB à un projet, utilisez le dropdown <strong>"EDB associée"</strong> dans la page <strong>Gestion des Projets</strong> lors de la création ou modification d'un projet.
                </div>

                {/* TABLE */}
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        Chargement des EDB...
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nom du fichier</th>
                                    <th>Projet assigné</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEdbs.length > 0 ? (
                                    filteredEdbs.map((edb) => (
                                        <tr key={edb.edbId}>
                                            <td>
                                                <span style={{ fontWeight: 700, color: '#00A651', fontSize: '0.95rem' }}>
                                                    #{edb.edbId}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <FileText size={18} style={{ color: '#00A651' }} />
                                                    <span style={{ fontWeight: 600 }}>{edb.fileName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    color: isAssigned(edb) ? '#333' : '#999',
                                                    fontStyle: isAssigned(edb) ? 'normal' : 'italic'
                                                }}>
                                                    {getProjectName(edb.projectId)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${isAssigned(edb) ? 'active' : 'inactive'}`}>
                                                    {isAssigned(edb) ? '✅ Assigné' : 'Non assigné'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => window.open(edb.fileUrl, '_blank')}
                                                        title="Voir"
                                                        style={{ background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)', color: '#1976D2' }}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => handleDownload(edb)}
                                                        title="Télécharger"
                                                        style={{ background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', color: '#388E3C' }}
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-icon btn-deactivate"
                                                        onClick={() => handleDelete(edb.edbId, edb.fileName)}
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="no-data">
                                            {searchTerm ? 'Aucun EDB trouvé' : 'Aucun EDB uploadé'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── UPLOAD MODAL ── */}
                {showUploadModal && (
                    <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Uploader un EDB</h3>
                                <button className="modal-close" onClick={() => setShowUploadModal(false)} disabled={uploading}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleUpload} className="modal-form">

                                {/* Fichier */}
                                <div className="form-group">
                                    <label>Fichier EDB *</label>
                                    <input
                                        type="file"
                                        onChange={handleFileSelect}
                                        required
                                        disabled={uploading}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                                        style={{
                                            padding: '0.75rem',
                                            border: '2px dashed #00A651',
                                            borderRadius: 12,
                                            background: 'rgba(0,166,81,0.05)'
                                        }}
                                    />
                                    {selectedFile && (
                                        <p style={{ marginTop: '0.5rem', color: '#00A651', fontWeight: 600, fontSize: '0.95rem' }}>
                                            📄 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </p>
                                    )}
                                </div>

                                {/* ✅ Info — pas de sélection de projet ici */}
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    background: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                    borderRadius: 10,
                                    fontSize: '0.875rem',
                                    color: '#1E40AF'
                                }}>
                                    💡 L'EDB sera disponible dans le dropdown lors de la <strong>création ou modification d'un projet</strong>.
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <label>Description (optionnel)</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Ajouter une description..."
                                        rows={3}
                                        disabled={uploading}
                                        style={{
                                            width: '100%', padding: '0.75rem',
                                            border: '2px solid #ddd', borderRadius: 12,
                                            fontSize: '1rem', fontFamily: 'Outfit, sans-serif',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowUploadModal(false)} disabled={uploading}>
                                        Annuler
                                    </button>
                                    <button type="submit" className="btn-submit" disabled={uploading || !selectedFile}>
                                        {uploading ? 'Upload en cours...' : 'Uploader'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </ReportingLayout>
    );
};

export default EDBManagement;
