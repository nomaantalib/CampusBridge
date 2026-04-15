import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, Eye, Hash } from 'lucide-react';

const TaskManagement = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const { data } = await axios.get(`http://127.0.0.1:5000/api/admin/tasks?status=${statusFilter}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
                });
                setTasks(data.data);
            } catch (err) {
                console.error("Tasks Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [statusFilter]);

    return (
        <div>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Mission Control</h1>
                    <p style={{ color: '#64748b' }}>Monitor all active and completed tasks across campuses.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Filter size={20} style={{ color: '#94a3b8' }} />
                    <select 
                        className="card" 
                        style={{ padding: '0.6rem', paddingRight: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Accepted">Accepted</option>
                        <option value="InTransit">In-Transit</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Mission ID</th>
                            <th>Requester</th>
                            <th>Servant</th>
                            <th>Type</th>
                            <th>Fare</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>Fetching mission stream...</td></tr>
                        ) : tasks.map((task) => (
                            <tr key={task._id}>
                                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{task._id.slice(-6).toUpperCase()}</td>
                                <td>{task.requesterId?.name}</td>
                                <td>{task.serverId?.name || <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>
                                <td><span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>{task.category}</span></td>
                                <td style={{ fontWeight: 600 }}>₹{task.finalFare || task.offeredFare}</td>
                                <td>
                                    <span className={`badge ${
                                        task.status === 'Completed' ? 'badge-success' : 
                                        task.status === 'Cancelled' ? 'badge-danger' : 
                                        'badge-warning'
                                    }`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(task.createdAt).toLocaleString()}</td>
                                <td>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}>
                                        <Eye size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TaskManagement;
