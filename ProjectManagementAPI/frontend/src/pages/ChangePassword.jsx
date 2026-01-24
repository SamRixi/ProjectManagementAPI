import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';
import '../styles/Auth.css';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Vérifier si le changement est requis
        const mustChange = localStorage.getItem('mustChangePassword');
        if (!mustChange) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

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

        setLoading(true);

        try {
            await userService.changePassword(formData.currentPassword, formData.newPassword);
            setSuccess('Mot de passe changé avec succès ! Redirection...');

            // Supprimer le flag de changement obligatoire
            localStorage.removeItem('mustChangePassword');

            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err) {
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

                <h2>Changement de mot de passe obligatoire</h2>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
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
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Changement...' : 'Changer le mot de passe'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;