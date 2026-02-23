import { useState, useEffect, useRef } from 'react';
import notificationService from '../services/notificationService';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const result = await notificationService.getUnreadCount();
            if (result.success) setUnreadCount(result.data);
        } catch (error) {
            console.error('Erreur compteur notifications:', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const result = await notificationService.getMyNotifications();
            if (result.success) setNotifications(result.data);
        } catch (error) {
            console.error('Erreur chargement notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen) fetchNotifications();
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Erreur mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Erreur mark all as read:', error);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await notificationService.deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
            fetchUnreadCount();
        } catch (error) {
            console.error('Erreur suppression notification:', error);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Success': return '#27ae60';
            case 'Warning': return '#f39c12';
            case 'Error': return '#e74c3c';
            default: return '#3498db';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Success': return '✅';
            case 'Warning': return '⚠️';
            case 'Error': return '❌';
            default: return 'ℹ️';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>

            {/* ✅ BOUTON CLOCHE — Style blanc/transparent pour header vert */}
            <button
                onClick={handleBellClick}
                style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    fontSize: '22px',
                    padding: '10px',
                    borderRadius: '8px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
                🔔
                {/* Badge rouge */}
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        background: '#e74c3c',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        border: '2px solid white'
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* 📋 Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    right: '0',
                    top: '50px',
                    width: '380px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    zIndex: 2000,
                    border: '1px solid #eee'
                }}>
                    {/* Header dropdown */}
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, #00A651 0%, #004D29 100%)',
                        borderRadius: '12px 12px 0 0'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: 'white' }}>
                            🔔 Notifications
                            {unreadCount > 0 && (
                                <span style={{
                                    background: '#e74c3c',
                                    color: 'white',
                                    borderRadius: '12px',
                                    padding: '2px 8px',
                                    fontSize: '12px',
                                    marginLeft: '8px'
                                }}>
                                    {unreadCount} non lue(s)
                                </span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    padding: '4px 8px',
                                    borderRadius: '6px'
                                }}
                            >
                                Tout marquer lu
                            </button>
                        )}
                    </div>

                    {/* Liste */}
                    {loading ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                            ⏳ Chargement...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                            ✅ Aucune notification
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <div
                                key={notification.notificationId}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #f5f5f5',
                                    background: notification.isRead ? 'white' : '#f0f7ff',
                                    display: 'flex',
                                    gap: '10px',
                                    alignItems: 'flex-start',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <span style={{ fontSize: '20px', marginTop: '2px' }}>
                                    {getTypeIcon(notification.type)}
                                </span>

                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontWeight: notification.isRead ? 'normal' : 'bold',
                                        fontSize: '14px',
                                        color: getTypeColor(notification.type)
                                    }}>
                                        {notification.title}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                                        {notification.message}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                                        {formatDate(notification.createdAt)}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {!notification.isRead && (
                                        <button
                                            onClick={() => handleMarkAsRead(notification.notificationId)}
                                            title="Marquer comme lu"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            👁️
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(notification.notificationId)}
                                        title="Supprimer"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
