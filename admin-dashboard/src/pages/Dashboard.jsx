import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, Landmark } from 'lucide-react';

import { io } from 'socket.io-client';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const socket = io('http://127.0.0.1:5000');
        
        const fetchStats = async () => {
            try {
                const { data } = await axios.get('http://127.0.0.1:5000/api/admin/analytics', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
                });
                setStats(data.data);
            } catch (err) {
                console.error("Dashboard Stats Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        socket.on('analytics-update', (newData) => {
            setStats(prev => ({ ...prev, metrics: newData }));
        });

        return () => socket.disconnect();
    }, []);

    if (loading) return <div>Synchronizing global metrics...</div>;

    const metricsArr = [
        { title: 'Total Users', value: stats.metrics.totalUsers, icon: <Users />, color: '#3b82f6' },
        { title: 'Active Missions', value: stats.metrics.totalTasks, icon: <ShoppingBag />, color: '#10b981' },
        { title: 'Total Volume', value: `₹${stats.metrics.totalVolume}`, icon: <TrendingUp />, color: '#f59e0b' },
        { title: 'Platform Profit', value: `₹${stats.metrics.platformEarnings}`, icon: <Landmark />, color: '#ef4444' },
    ];

    return (
        <div>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Command Center</h1>
                <p style={{ color: '#64748b' }}>Real-time platform overview and financial health.</p>
            </header>

            <div className="stats-grid">
                {metricsArr.map((m, idx) => (
                    <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: `${m.color}15`, color: m.color }}>
                            {m.icon}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>{m.title}</p>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{m.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Revenue Growth (Last 7 Days)</h3>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.charts.dailyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="_id" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Mission Velocity</h3>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.charts.dailyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="_id" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="taskCount" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
