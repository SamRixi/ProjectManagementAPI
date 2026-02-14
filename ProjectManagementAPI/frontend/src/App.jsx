import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; 
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';
import DeveloperProjects from './pages/developer/DeveloperProjects';  
import DeveloperDashboard from './pages/dashboards/DeveloperDashboard';
import DeveloperTasks from './pages/developer/DeveloperTasks';



const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/change-password" element={<ChangePassword />} />
                    <Route path="/developer/dashboard" element={<DeveloperDashboard />} />
                    <Route path="/developer/projects" element={<DeveloperProjects />} />
                    <Route path="/developer/tasks" element={<DeveloperTasks />} />


                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;