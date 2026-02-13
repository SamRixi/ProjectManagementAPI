import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import '../styles/Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const { login, loading } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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

        // Validation
        if (!formData.username || !formData.password) {
            setError('Tous les champs sont obligatoires');
            return;
        }

        if (formData.username.length < 3) {
            setError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
            return;
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        try {
            const result = await login(formData.username, formData.password);
            console.log('RESULT LOGIN ===>', result);

            if (result.success) {
                const user = result.user;
                console.log('USER ===>', user);
                console.log(
                    'mustChangePassword ===>',
                    result.mustChangePassword,
                    user?.mustChangePassword
                );

                // ✅ Vérifier si l'utilisateur doit changer son mot de passe
                if (user?.mustChangePassword || result.mustChangePassword) {
                    console.log('🔒 User must change password');
                    console.log('Navigating with userId:', user.userId);
                    console.log('Navigating with username:', user.userName);

                    // ✅ Passer userId et username via state
                    navigate('/change-password', {
                        state: {
                            userId: user.userId,
                            username: user.userName,
                            isFirstLogin: true
                        }
                    });
                    return;
                }

                // Sinon, redirection normale vers le dashboard
                localStorage.removeItem('mustChangePassword');
                navigate('/dashboard');
            } else {
                setError(result.message || 'Erreur de connexion');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Erreur de connexion au serveur');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <img src="/mobilis-logo.png.png" alt="Mobilis" />
                </div>

                <h2>Connexion</h2>

                {error && (
                    <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center' }}>
                        <AlertCircle size={20} style={{ marginRight: '8px', flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
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
                        <label>Mot de passe</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Entrez votre mot de passe"
                                disabled={loading}
                                autoComplete="current-password"
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
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <p
                            style={{
                                textAlign: 'center',
                                color: '#666',
                                fontSize: '14px',
                                margin: '10px 0 0 0',
                                fontStyle: 'italic',
                                cursor: 'default'
                            }}
                        >
                            Mot de passe oublié ? Contactez le service Reporting
                        </p>
                    </div>

                    <button
                        type="submit"
                        className={`btn-primary ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <p className="auth-footer">
                    Pas encore de compte ? <Link to="/register">S'inscrire</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
