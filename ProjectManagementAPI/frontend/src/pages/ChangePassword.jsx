import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import '../styles/Auth.css';

const ChangePassword = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // ✅ Récupérer userId, username et isFirstLogin depuis location.state
    const { userId, username, isFirstLogin } = location.state || {};

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

   

    useEffect(() => {
        // ✅ Vérifier si userId existe, sinon rediriger vers login
        if (!userId) {
            console.error('❌ No userId provided, redirecting to login');
            navigate('/login');
        }
    }, [userId, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validations
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError('Tous les champs sont obligatoires');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.newPassword === formData.currentPassword) {
            setError('Le nouveau mot de passe doit être différent de l\'ancien');
            return;
        }

        setLoading(true);

        try {
            console.log('🔄 Changing password for userId:', userId);

            // ✅ Appeler authService.changePassword avec userId
            const result = await authService.changePassword(userId, {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });

            console.log('Change password result:', result);

            if (result.success) {
                setSuccess('✅ Mot de passe changé avec succès ! Vous allez être redirigé vers la page de connexion...');

                // Nettoyer le localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('mustChangePassword');

                // Rediriger vers login après 2 secondes
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(result.message || 'Erreur lors du changement de mot de passe');
            }
        } catch (err) {
            console.error('❌ Error changing password:', err);
            setError(err.message || 'Erreur lors du changement de mot de passe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <img src="/mobilis-logo.png.png" alt="Mobilis" />
                </div>

                {isFirstLogin && (
                    <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                         Première connexion : vous devez changer votre mot de passe temporaire
                    </div>
                )}

                <h2>Changement de mot de passe obligatoire</h2>

                {username && (
                    <p className="change-password-subtitle">
                        Utilisateur : <strong>{username}</strong>
                    </p>
                )}

                <p className="change-password-subtitle">
                    Pour des raisons de sécurité, vous devez changer votre mot de passe.
                </p>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Mot de passe actuel (temporaire)</label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            placeholder="Entrez le mot de passe temporaire"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Nouveau mot de passe</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Minimum 6 caractères"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirmer le nouveau mot de passe</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Retapez le nouveau mot de passe"
                            disabled={loading}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Changement en cours...' : 'Changer le mot de passe'}
                    </button>
                </form>

                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                    Après le changement, vous serez redirigé vers la page de connexion.
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
