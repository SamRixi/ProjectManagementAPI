import { createContext, useState, useContext } from 'react';
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
    const [loading, setLoading] = useState(false);

    // ============= LOGIN =============
    const login = async (username, password) => {
        try {
            setLoading(true);
            const response = await authService.login({ username, password });

            if (response.success) {
                setUser(response.user);
                setToken(response.token);
                return { success: true };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Erreur de connexion'
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
                return { success: true, message: response.message };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Erreur d\'inscription'
            };
        } finally {
            setLoading(false);
        }
    };

    // ============= LOGOUT =============
    const logout = () => {
        setUser(null);
        setToken(null);
        authService.logout();
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};