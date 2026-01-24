import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import '../styles/Auth.css';

const Register = () => {
    const navigate = useNavigate();
    const { register, loading } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        email: '',  // Added email field
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });
        setError('');

        // Calculer la force du mot de passe
        if (name === 'password') {
            calculatePasswordStrength(value);
        }
    };

    const calculatePasswordStrength = (password) => {
        let strength = 0;

        if (password.length >= 6) strength += 1;
        if (password.length >= 10) strength += 1;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
        if (/\d/.test(password)) strength += 1;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

        setPasswordStrength(Math.min(strength, 4));
    };

    const getPasswordStrengthLabel = () => {
        const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
        const colors = ['#F44336', '#FF9800', '#FFC107', '#8BC34A', '#4CAF50'];
        return {
            label: labels[passwordStrength] || '',
            color: colors[passwordStrength] || '#E0E0E0'
        };
    };

    const validateForm = () => {
        if (!formData.username || !formData.email || !formData.password ||
            !formData.confirmPassword || !formData.firstName || !formData.lastName) {
            setError('Tous les champs sont obligatoires');
            return false;
        }

        if (formData.username.length < 3) {
            setError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Veuillez entrer une adresse email valide');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return false;
        }

        if (passwordStrength < 2) {
            setError('Le mot de passe est trop faible. Ajoutez des majuscules, chiffres ou caractères spéciaux');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) {
            return;
        }

        // Enlever confirmPassword avant d'envoyer
        const { confirmPassword: _, ...dataToSend } = formData;
        const result = await register(dataToSend);

        if (result.success) {
            setSuccess('Inscription réussie ! Redirection vers la connexion...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            setError(result.message || 'Erreur lors de l\'inscription');
        }
    };

    const strengthInfo = getPasswordStrengthLabel();

    return (
        <div className="auth-container">
            <div className="auth-card register-card">
                <div className="auth-logo">
                    <img src="/mobilis-logo.png.png" alt="Mobilis" />
                </div>

                <h2>Creer un compte</h2>

                {error && (
                    <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center' }}>
                        <AlertCircle size={20} style={{ marginRight: '8px', flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircle size={20} style={{ marginRight: '8px', flexShrink: 0 }} />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Prenom</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Entrez votre prenom"
                                disabled={loading}
                                autoComplete="given-name"
                            />
                        </div>

                        <div className="form-group">
                            <label>Nom</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Entrez votre nom"
                                disabled={loading}
                                autoComplete="family-name"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Nom d'utilisateur</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Entrez votre nom d'utilisateur"
                            disabled={loading}
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="votre.email@mobilis.dz"
                                disabled={loading}
                                autoComplete="email"
                                style={{ paddingLeft: '40px' }}
                            />
                            <Mail
                                size={20}
                                style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#999'
                                }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Mot de passe</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Entrez votre mot de passe"
                                disabled={loading}
                                autoComplete="new-password"
                                style={{ paddingRight: '45px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#666',
                                    padding: '4px',
                                    display: 'flex'
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {formData.password && (
                            <div style={{ marginTop: '8px' }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '4px',
                                    marginBottom: '4px'
                                }}>
                                    {[...Array(4)].map((_, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                flex: 1,
                                                height: '4px',
                                                borderRadius: '2px',
                                                background: index < passwordStrength ? strengthInfo.color : '#E0E0E0',
                                                transition: 'background 0.3s'
                                            }}
                                        />
                                    ))}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: strengthInfo.color,
                                    fontWeight: '600'
                                }}>
                                    {strengthInfo.label}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Confirmer le mot de passe</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirmez votre mot de passe"
                                disabled={loading}
                                autoComplete="new-password"
                                style={{ paddingRight: '45px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={loading}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#666',
                                    padding: '4px',
                                    display: 'flex'
                                }}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                            <div style={{
                                fontSize: '12px',
                                color: '#F44336',
                                marginTop: '4px'
                            }}>
                                Les mots de passe ne correspondent pas
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className={`btn-primary ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Inscription...' : 'S\'inscrire'}
                    </button>
                </form>

                <p className="auth-footer">
                    Vous avez deja un compte ? <Link to="/login">Se connecter</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;