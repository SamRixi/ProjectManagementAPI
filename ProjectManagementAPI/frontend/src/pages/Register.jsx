import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import '../styles/Auth.css';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setError('');
        if (name === 'password') calculatePasswordStrength(value);
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
        return { label: labels[passwordStrength] || '', color: colors[passwordStrength] || '#E0E0E0' };
    };

    const validateForm = () => {
        if (!formData.username || !formData.email || !formData.password ||
            !formData.confirmPassword || !formData.firstName || !formData.lastName) {
            setError('Tous les champs sont obligatoires'); return false;
        }
        if (formData.username.length < 3) {
            setError("Le nom d'utilisateur doit contenir au moins 3 caractères"); return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Veuillez entrer une adresse email valide'); return false;
        }
        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères'); return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas'); return false;
        }
        if (passwordStrength < 2) {
            setError('Le mot de passe est trop faible. Ajoutez des majuscules, chiffres ou caractères spéciaux'); return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!validateForm()) return;
        setLoading(true);
        try {
            const result = await register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                firstName: formData.firstName,
                lastName: formData.lastName
            });
            if (result.success) {
                setSuccess('Inscription réussie ! Redirection vers la connexion dans 3 secondes...');
                setLoading(false);
                setFormData({ username: '', email: '', password: '', confirmPassword: '', firstName: '', lastName: '' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(result.message || "Erreur lors de l'inscription");
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch  {
            setLoading(false);
            setError('Erreur de connexion au serveur');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const strengthInfo = getPasswordStrengthLabel();

    // Styles inline pour garantir le rendu correct
    const inputStyle = {
        width: '100%',
        padding: '11px 14px',
        border: '2px solid #E8E8E8',
        borderRadius: '10px',
        fontSize: '13px',
        fontFamily: 'Outfit, sans-serif',
        boxSizing: 'border-box',
        backgroundColor: '#FAFAFA',
        color: '#333',
        outline: 'none',
        transition: 'border-color 0.3s'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '6px',
        color: '#333',
        fontWeight: '600',
        fontSize: '12px'
    };

    const fieldStyle = {
        marginBottom: '14px'
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '500px', padding: '32px 36px' }}>
                <div className="auth-logo">
                    <img src="/mobilis-logo.png.png" alt="Mobilis" />
                </div>

                <h2 style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '20px' }}>
                    Créer un compte
                </h2>

                {error && (
                    <div className="alert alert-error">
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="alert alert-success">
                        <CheckCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* ✅ Prénom + Nom côte à côte — style inline garanti */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                        <div>
                            <label style={labelStyle}>Prénom *</label>
                            <input
                                style={inputStyle}
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Prénom"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Nom *</label>
                            <input
                                style={inputStyle}
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Nom"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Nom d'utilisateur */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Nom d'utilisateur *</label>
                        <input
                            style={inputStyle}
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Entrez votre nom d'utilisateur"
                            disabled={loading}
                        />
                    </div>

                    {/* Email */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Email *</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                style={{ ...inputStyle, paddingLeft: '38px' }}
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="votre.email@mobilis.dz"
                                disabled={loading}
                            />
                            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                        </div>
                    </div>

                    {/* Mot de passe */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Mot de passe *</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                style={{ ...inputStyle, paddingRight: '42px' }}
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Minimum 6 caractères"
                                disabled={loading}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={loading}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex' }}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {formData.password && (
                            <div style={{ marginTop: '6px' }}>
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i < passwordStrength ? strengthInfo.color : '#E0E0E0', transition: 'background 0.3s' }} />
                                    ))}
                                </div>
                                <div style={{ fontSize: '11px', color: strengthInfo.color, fontWeight: '600' }}>{strengthInfo.label}</div>
                            </div>
                        )}
                    </div>

                    {/* Confirmer mot de passe */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Confirmer le mot de passe *</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                style={{ ...inputStyle, paddingRight: '42px' }}
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Retapez le mot de passe"
                                disabled={loading}
                            />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex' }}>
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                            <div style={{ fontSize: '11px', color: '#F44336', marginTop: '4px' }}>Les mots de passe ne correspondent pas</div>
                        )}
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
                        {loading ? 'Inscription...' : "S'inscrire"}
                    </button>
                </form>

                <p className="auth-footer">
                    Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;