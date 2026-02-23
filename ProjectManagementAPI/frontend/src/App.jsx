import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';

// ========== DEVELOPER ==========
import DeveloperProjects from './pages/developer/DeveloperProjects';
import DeveloperDashboard from './pages/dashboards/DeveloperDashboard';
import DeveloperTasks from './pages/developer/DeveloperTasks';
import ProjectDetails from './pages/developer/ProjectDetails';
import DeveloperNotifications from './pages/developer/DeveloperNotifications';

// ========== REPORTING ==========
import ReportingDashboard from "./pages/dashboards/ReportingDashboard";
import UsersManagement from './pages/reporting/UsersManagement';
import TeamsManagement from './pages/reporting/TeamsManagement';
import ProjectsManagement from './pages/reporting/ProjectsManagement';
import EDBManagement from './pages/reporting/EDBManagement';

// ========== PROJECT MANAGER ==========
import ProjectManagerDashboard from "./pages/dashboards/ProjectManagerDashboard";
import ProjectManagerProjects from './pages/project-manager/ProjectManagerProjects';
import ProjectManagerTasks from './pages/project-manager/ProjectManagerTasks';
import ProjectManagerValidation from './pages/project-manager/ProjectManagerValidation';
import ProjectStats from './pages/project-manager/ProjectStats';
// ========== MANAGER ==========//
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import ManagerProjects from './pages/manager/ManagerProjects';
import ManagerStatistics from './pages/manager/ManagerStatsGlobales/';
import ManagerTeams from './pages/manager/ManagerTeams';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* ========== PUBLIC ROUTES ========== */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/change-password" element={<ChangePassword />} />

                    {/* ========== DEVELOPER ROUTES ========== */}
                    <Route path="/developer/dashboard" element={<DeveloperDashboard />} />
                    <Route path="/developer/projects/:projectId" element={<ProjectDetails />} />
                    <Route path="/developer/projects" element={<DeveloperProjects />} />
                    <Route path="/developer/tasks" element={<DeveloperTasks />} />
                    <Route path="/developer/notifications" element={<DeveloperNotifications />} />

                    {/* ========== REPORTING ROUTES ========== */}
                    <Route path="/reporting/dashboard" element={<ReportingDashboard />} />
                    <Route path="/reporting/users" element={<UsersManagement />} />
                    <Route path="/reporting/teams" element={<TeamsManagement />} />
                    <Route path="/reporting/projects" element={<ProjectsManagement />} />
                    <Route path="/reporting/edb" element={<EDBManagement />} />

                    {/* ========== PROJECT MANAGER ROUTES ========== */}
                    <Route path="/project-manager/dashboard" element={<ProjectManagerDashboard />} />
                    <Route path="/project-manager/projects" element={<ProjectManagerProjects />} />
                    <Route path="/project-manager/projects/:projectId/stats" element={<ProjectStats />} /> 
                    <Route path="/project-manager/tasks" element={<ProjectManagerTasks />} />
                    <Route path="/project-manager/validation" element={<ProjectManagerValidation />} />

                    {/* ========== MANAGER ROUTES ========== */}
                    <Route
                        path="/manager/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['Manager']}>
                                <ManagerDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/manager/projects"
                        element={
                            <ProtectedRoute allowedRoles={['Manager']}>
                                <ManagerProjects />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/manager/StatsGlobal"
                        element={
                            <ProtectedRoute allowedRoles={['Manager']}>
                                <ManagerStatistics />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/manager/teams"
                        element={
                            <ProtectedRoute allowedRoles={['Manager']}>
                                <ManagerTeams />
                            </ProtectedRoute>
                        }
                    />

                    {/* ========== PROTECTED DASHBOARD ========== */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* ========== DEFAULT REDIRECT ========== */}
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
