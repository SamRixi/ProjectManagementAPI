import api from './api';

const authService = {
    // ============= REGISTER =============
    register: async (userData) => {
        try {
            const payload = {
                username: userData.username,
                email: userData.email,
                password: userData.password,
                confirmPassword: userData.confirmPassword,
                firstName: userData.firstName,
                lastName: userData.lastName
            };

            console.log('Sending registration data:', payload);

            const response = await api.post('/api/auth/register', payload);

            console.log('Registration successful:', response.data);

            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Inscription réussie'
            };
        } catch (error) {
            console.error('Register error:', error);
            console.error('Error response:', error.response?.data);

            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.title ||
                    'Erreur lors de l\'inscription',
                errors: error.response?.data?.errors
            };
        }
    },

    // ============= LOGIN =============
    login: async (credentials) => {
        try {
            const payload = {
                username: credentials.username,
                password: credentials.password
            };

            console.log('Sending login data:', payload);

            const response = await api.post('/api/auth/login', payload);

            console.log('Login successful:', response.data);

            if (response.data.success) {
                let token, user, mustChangePassword;

                // 🔧 Détecter automatiquement le format de la réponse
                if (response.data.data) {
                    // Format avec data imbriqué: {success, message, data: {token, user}}
                    console.log('📦 Extracting from response.data.data');
                    token = response.data.data.token;
                    user = response.data.data.user;
                    mustChangePassword = response.data.data.user?.mustChangePassword;
                } else {
                    // Format direct: {success, message, token, user}
                    console.log('📦 Extracting from response.data');
                    token = response.data.token;
                    user = response.data.user;
                    mustChangePassword = response.data.user?.mustChangePassword;
                }

                // ✅ DEBUG
                console.log('Extracted token:', token);
                console.log('Extracted user:', user);
                console.log('Must change password:', mustChangePassword);

                // ✅ Vérifier que token et user existent
                if (!token || !user) {
                    console.error('❌ Missing token or user in response');
                    return {
                        success: false,
                        message: 'Données de connexion manquantes'
                    };
                }

                console.log('✅ Login successful - Data extracted correctly');

                return {
                    success: true,
                    token: token,
                    user: user,
                    mustChangePassword: mustChangePassword || false,
                    message: response.data.message || 'Connexion réussie'
                };
            } else {
                return {
                    success: false,
                    message: response.data.message || 'Identifiants incorrects'
                };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            console.error('Error response:', error.response?.data);

            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.title ||
                    'Erreur lors de la connexion'
            };
        }
    },

    // ============= CHANGE PASSWORD (✅ AJOUTÉ) =============
    changePassword: async (userId, passwords) => {
        try {
            console.log('🔄 Changing password for userId:', userId);
            console.log('Request payload:', {
                currentPassword: '***',
                newPassword: '***',
                confirmPassword: '***'
            });

            const response = await api.post(`/api/auth/change-password/${userId}`, {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
                confirmPassword: passwords.confirmPassword
            });

            console.log('✅ Change password response:', response.data);

            return {
                success: response.data.success,
                message: response.data.message || 'Mot de passe changé avec succès'
            };
        } catch (error) {
            console.error('❌ Change password error:', error);
            console.error('Error response:', error.response?.data);

            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.title ||
                    'Erreur lors du changement de mot de passe'
            };
        }
    },

    // ============= LOGOUT =============
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log('✅ Logged out successfully');
        return true;
    }
};

export default authService;
