import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Register = () => {
    const navigate = useNavigate();
    const { register, loading } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        firstName: '',
        lastName: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

        if (!formData.username || !formData.password || !formData.firstName || !formData.lastName) {
            setError('Tous les champs sont obligatoires');
            return;
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        const result = await register(formData);

        if (result.success) {
            setSuccess('Inscription réussie ! Redirection vers la connexion...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <img src="/mobilis-logo.png.png" alt="Mobilis" />
                </div>

                <h2>CREE UN COMPTE</h2>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>NOM D'UTILISATEUR</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="ENTREZ VOTRE NOM D'UTILISATEUR"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>PRENOM</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="ENTREZ VOTRE PRENOM"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>NOM</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="ENTREZ VOTRE NOM"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>MOT DE PASSE</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="ENTREZ VOTRE MOT DE PASSE"
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Inscription...' : 'S\'inscrire'}
                    </button>
                </form>

                <p className="auth-footer">
                    VOUS AVEZ DEJA UN COMPTE ? <Link to="/login">SE CONNECTER</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;