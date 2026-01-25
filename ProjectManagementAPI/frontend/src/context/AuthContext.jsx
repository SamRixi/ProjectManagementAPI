import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true); // ✅ Start with true

    // ✅ Load user from localStorage on app start
    useEffect(() => {
        const loadUserFromStorage = () => {
            try {
                const savedToken = localStorage.getItem('token');
                const savedUser = localStorage.getItem('user');

                if (savedToken && savedUser) {
                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));
                }
            } catch (error) {
                console.error('Error loading user from storage:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        loadUserFromStorage();
    }, []);

    // ============= LOGIN =============
    const login = async (username, password) => {
        try {
            setLoading(true);
            const response = await authService.login({ username, password });

            if (response.success) {
                // ✅ Save to state
                setUser(response.user);
                setToken(response.token);

                // ✅ Save to localStorage
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));

                return {
                    success: true,
                    mustChangePassword: response.user?.mustChangePassword || false
                };
            } else {
                return {
                    success: false,
                    message: response.message || 'Identifiants incorrects'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Erreur de connexion au serveur'
            };
        } finally {
            setLoading(false);
        }
    };

    // ============= REGISTER =============
    const register = async (userData) => {
        try {
            setLoading(true);
            const response = await authService.register(userData);

            if (response.success) {
                return {
                    success: true,
                    message: response.message || 'Inscription réussie'
                };
            } else {
                return {
                    success: false,
                    message: response.message || 'Erreur lors de l\'inscription'
                };
            }
        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Erreur d\'inscription'
            };
        } finally {
            setLoading(false);
        }
    };

    // ============= LOGOUT =============
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        authService.logout();
    };

    // ✅ Check if user has specific role(s)
    const hasRole = (roles) => {
        if (!user || !user.roleName) return false;

        if (Array.isArray(roles)) {
            return roles.includes(user.roleName);
        }

        return user.roleName === roles;
    };

    // ✅ Check if user is admin (Reporting or Manager)
    const isAdmin = () => {
        return hasRole(['Reporting', 'Manager']);
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        hasRole,
        isAdmin,
        isAuthenticated: !!token
    };

    // ✅ Show loading screen while checking localStorage
    if (loading && !user) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2rem',
                color: '#666',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <img src="/mobilis-logo.png.png" alt="Mobilis" style={{ width: '150px' }} />
                <div>Chargement...</div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
