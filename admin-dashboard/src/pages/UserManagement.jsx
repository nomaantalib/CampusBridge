import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ShieldAlert, UserCheck, Eye } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await axios.get(`http://127.0.0.1:5000/api/admin/users?search=${search}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
                });
                setUsers(data.data);
            } catch (err) {
                console.error("Users Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [search]);

    const toggleSuspension = async (userId) => {
        try {
            await axios.patch(`http://127.0.0.1:5000/api/admin/users/${userId}/suspend`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
            });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isSuspended: !u.isSuspended } : u));
        } catch (err) {
            alert("Action failed: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>User Management</h1>
                    <p style={{ color: '#64748b' }}>Oversee and control all accounts across the platform.</p>
                </div>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                        className="card" 
                        style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Campus</th>
                            <th>Ratings</th>
                            <th>Balance</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>Downloading user matrix...</td></tr>
                        ) : users.map((user) => (
                            <tr key={user._id}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{user.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
                                </td>
                                <td><span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{user.role}</span></td>
                                <td>{user.campusId?.name || 'N/A'}</td>
                                <td>{user.rating?.toFixed(1) || '0.0'} ⭐</td>
                                <td style={{ fontWeight: 600 }}>₹{user.walletBalance?.toFixed(2)}</td>
                                <td>
                                    {user.isSuspended ? (
                                        <span className="badge badge-danger">Suspended</span>
                                    ) : (
                                        <span className="badge badge-success">Active</span>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button 
                                            onClick={() => toggleSuspension(user._id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: user.isSuspended ? '#10b981' : '#ef4444' }}
                                            title={user.isSuspended ? "Unsuspend" : "Suspend"}
                                        >
                                            {user.isSuspended ? <UserCheck size={20} /> : <ShieldAlert size={20} />}
                                        </button>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }} title="View Details">
                                            <Eye size={20} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
