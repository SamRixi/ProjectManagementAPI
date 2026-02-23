// src/components/Developer/DeveloperNotifications.jsx
import { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

export default function DeveloperNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadNotifications = async () => {
        setLoading(true);
        const res = await notificationService.getMyNotifications();
        if (res.success) setNotifications(res.data);
        setLoading(false);
    };

    // ✅ Après
    useEffect(() => {
        let isMounted = true;

        const fetchNotifications = async () => {
            setLoading(true);
            const res = await notificationService.getMyNotifications();
            if (isMounted && res.success) {
                setNotifications(res.data);
            }
            if (isMounted) setLoading(false);
        };

        fetchNotifications();

        return () => { isMounted = false; }; // cleanup
    }, []);

    const handleMarkAllRead = async () => {
        await notificationService.markAllAsRead();
        loadNotifications();
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12
                border-b-2 border-green-500" />
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto">

            {/* ─── Header ─────────────────────────────────── */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    🔔 Mes Notifications
                </h1>
                {notifications.some(n => !n.isRead) && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-sm text-green-600 hover:underline"
                    >
                        Tout marquer comme lu
                    </button>
                )}
            </div>

            {/* ─── Empty ──────────────────────────────────── */}
            {notifications.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <div className="text-5xl mb-4">🎉</div>
                    <p className="text-lg">Aucune notification pour l'instant</p>
                </div>
            )}

            {/* ─── List ───────────────────────────────────── */}
            <div className="space-y-4">
                {notifications.map((notif) => (
                    <div
                        key={notif.notificationId}
                        className={`rounded-xl p-4 border shadow-sm transition
                            ${notif.isRead
                                ? 'bg-white border-gray-200'
                                : 'bg-green-50 border-green-300'
                            }`}
                    >
                        {/* Notif Header */}
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">
                                    {notif.type === 'TASK_ASSIGNED' ? '📋' :
                                        notif.type === 'TASK_VALIDATED' ? '✅' :
                                            notif.type === 'TASK_REJECTED' ? '❌' : '🔔'}
                                </span>
                                <span className={`text-sm font-semibold
                                    ${notif.isRead
                                        ? 'text-gray-600'
                                        : 'text-green-700'}`}>
                                    {notif.title}
                                </span>
                                {!notif.isRead && (
                                    <span className="bg-green-500 text-white
                                        text-xs px-2 py-0.5 rounded-full">
                                        Nouveau
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                    {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                                        day: '2-digit', month: 'short',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                                {!notif.isRead && (
                                    <button
                                        onClick={async () => {
                                            await notificationService.markAsRead(notif.notificationId);
                                            loadNotifications();
                                        }}
                                        className="text-xs text-gray-400 hover:text-green-600"
                                    >
                                        ✓ Lu
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-gray-600 mb-3">
                            {notif.message}
                        </p>

                        {/* Task Details */}
                        {notif.task && (
                            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">

                                {/* Infos tâche */}
                                <div className="flex flex-wrap gap-4">
                                    <span>
                                        📌 <strong>{notif.task.title}</strong>
                                    </span>
                                    <span>
                                        ⏰ Deadline :
                                        <strong className="text-red-500 ml-1">
                                            {new Date(notif.task.deadline)
                                                .toLocaleDateString('fr-FR')}
                                        </strong>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        🎯 Priorité :
                                        <PriorityBadge priority={notif.task.priority} />
                                    </span>
                                </div>

                                {/* Description */}
                                {notif.task.description && (
                                    <p className="text-xs text-gray-500 italic">
                                        {notif.task.description}
                                    </p>
                                )}

                                {/* ─── Statut selon type ─── */}

                                {/* 📋 TASK_ASSIGNED */}
                                {notif.type === 'TASK_ASSIGNED' && (
                                    <div className="flex items-center gap-2
                                        bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
                                        <span>📋</span>
                                        <span className="text-xs font-medium">
                                            Assignée par{' '}
                                            <strong>
                                                {notif.assignedBy
                                                    ? `${notif.assignedBy.firstName} ${notif.assignedBy.lastName}`
                                                    : 'Chef de Projet'}
                                            </strong>
                                        </span>
                                    </div>
                                )}

                                {/* ✅ TASK_VALIDATED */}
                                {notif.type === 'TASK_VALIDATED' && (
                                    <div className="flex items-center gap-2
                                        bg-green-100 text-green-700 px-3 py-2 rounded-lg">
                                        <span>✅</span>
                                        <span className="text-xs font-medium">
                                            Validée par{' '}
                                            <strong>
                                                {notif.assignedBy
                                                    ? `${notif.assignedBy.firstName} ${notif.assignedBy.lastName}`
                                                    : 'Chef de Projet'}
                                            </strong>
                                        </span>
                                    </div>
                                )}

                                {/* ❌ TASK_REJECTED + Cause */}
                                {notif.type === 'TASK_REJECTED' && (
                                    <div className="bg-red-50 border border-red-200
                                        px-3 py-2 rounded-lg space-y-1">
                                        <div className="flex items-center gap-2
                                            text-red-600 text-xs font-medium">
                                            <span>❌</span>
                                            <span>
                                                Rejetée par{' '}
                                                <strong>
                                                    {notif.assignedBy
                                                        ? `${notif.assignedBy.firstName} ${notif.assignedBy.lastName}`
                                                        : 'Chef de Projet'}
                                                </strong>
                                            </span>
                                        </div>
                                        {notif.task.rejectionReason && (
                                            <p className="text-xs text-red-500 italic">
                                                💬 Cause : "{notif.task.rejectionReason}"
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Priority Badge ────────────────────────────────────────────
function PriorityBadge({ priority }) {
    const config = {
        High: { label: 'Haute', color: 'bg-red-100 text-red-600' },
        Medium: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-600' },
        Low: { label: 'Basse', color: 'bg-green-100 text-green-600' }
    };
    const c = config[priority] || config.Medium;
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
            {c.label}
        </span>
    );
}
