import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Map, 
  AlertTriangle, 
  DollarSign, 
  LifeBuoy, 
  LogOut,
  Star
} from 'lucide-react';

// Components
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import TaskManagement from './pages/TaskManagement';
import CampusManagement from './pages/CampusManagement';
import DisputeSystem from './pages/DisputeSystem';
import FinancePanel from './pages/FinancePanel';
import SupportSystem from './pages/SupportSystem';
import ReviewsFeedback from './pages/ReviewsFeedback';
import Login from './pages/Login';

const Layout = ({ children }) => (
  <div className="admin-layout">
    <aside className="sidebar">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>CampusBridge</h2>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ADMIN CONTROL CENTER</p>
      </div>
      
      <nav style={{ flex: 1 }}>
        <Link to="/" className="nav-item"><LayoutDashboard size={20} style={{ marginRight: 10 }} /> Dashboard</Link>
        <Link to="/users" className="nav-item"><Users size={20} style={{ marginRight: 10 }} /> Users</Link>
        <Link to="/tasks" className="nav-item"><ClipboardList size={20} style={{ marginRight: 10 }} /> Tasks</Link>
        <Link to="/campuses" className="nav-item"><Map size={20} style={{ marginRight: 10 }} /> Campuses</Link>
        <Link to="/disputes" className="nav-item"><AlertTriangle size={20} style={{ marginRight: 10 }} /> Disputes</Link>
        <Link to="/finance" className="nav-item"><DollarSign size={20} style={{ marginRight: 10 }} /> Finance</Link>
        <Link to="/support" className="nav-item"><LifeBuoy size={20} style={{ marginRight: 10 }} /> Support</Link>
        <Link to="/reviews" className="nav-item"><Star size={20} style={{ marginRight: 10 }} /> Reviews</Link>
      </nav>

      <button className="nav-item" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer' }} onClick={() => localStorage.clear()}>
        <LogOut size={20} style={{ marginRight: 10 }} /> Logout
      </button>
    </aside>
    
    <main className="main-content">
      {children}
    </main>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken'));

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
        
        <Route path="/*" element={
          isAuthenticated ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/tasks" element={<TaskManagement />} />
                <Route path="/campuses" element={<CampusManagement />} />
                <Route path="/disputes" element={<DisputeSystem />} />
                <Route path="/finance" element={<FinancePanel />} />
                <Route path="/support" element={<SupportSystem />} />
                <Route path="/reviews" element={<ReviewsFeedback />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;
