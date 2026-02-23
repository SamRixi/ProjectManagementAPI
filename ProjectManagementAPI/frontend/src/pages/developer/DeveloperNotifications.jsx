// src/pages/developer/DeveloperNotifications.jsx
import DeveloperLayout from '../../components/layout/DeveloperLayout';
import DeveloperNotifications from '../../components/DeveloperNotifications'; // ✅ pas de sous-dossier

export default function DeveloperNotificationsPage() {
    return (
        <DeveloperLayout>
            <DeveloperNotifications />
        </DeveloperLayout>
    );
}