import { useState } from 'react';
import userService from '../services/userService';

const UserManagement = ({ user }) => {
    const [tempPassword, setTempPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleGenerateTempPassword = async () => {
        if (!window.confirm(`Générer un mot de passe temporaire pour ${user.firstName} ${user.lastName} ?`)) {
            return;
        }

        setLoading(true);
        try {
            const result = await userService.generateTempPassword(user.userId);
            setTempPassword(result.data);
            setShowPassword(true);

            // Copier automatiquement dans le presse-papier
            navigator.clipboard.writeText(result.data);
            alert('Mot de passe temporaire copié dans le presse-papier !');
        } catch (error) {
            alert(error.message || 'Erreur lors de la génération');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleGenerateTempPassword}
                disabled={loading}
                style={{
                    padding: '8px 16px',
                    background: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                }}
            >
                 Générer mot de passe temporaire
            </button>

            {showPassword && (
                <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#FFF3E0',
                    border: '2px solid #FF9800',
                    borderRadius: '8px'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#E65100' }}>
                         Mot de passe temporaire généré
                    </h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
                        Communiquez ce mot de passe à l'utilisateur. Il devra le changer à la prochaine connexion.
                    </p>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'white',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #FFB74D'
                    }}>
                        <code style={{
                            flex: 1,
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: '#E65100',
                            letterSpacing: '2px'
                        }}>
                            {tempPassword}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(tempPassword);
                                alert('Copié !');
                            }}
                            style={{
                                padding: '8px 16px',
                                background: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                             Copier
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;