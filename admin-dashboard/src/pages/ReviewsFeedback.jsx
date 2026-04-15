import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Flag, Award, AlertCircle } from 'lucide-react';

const ReviewsFeedback = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopPerformers = async () => {
            try {
                const { data } = await axios.get('http://127.0.0.1:5000/api/admin/users?role=Server', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
                });
                setUsers(data.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchTopPerformers();
    }, []);

    const topPerformers = users.filter(u => u.rating >= 4.5).sort((a,b) => b.rating - a.rating);
    const lowRated = users.filter(u => u.rating > 0 && u.rating < 3.0);

    return (
        <div>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Reviews & Quality Control</h1>
                <p style={{ color: '#64748b' }}>Monitor platform quality, highlight top servants, and flag low-rated users.</p>
            </header>

            <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <section className="card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                        <Award /> Top Performers
                    </h3>
                    {loading ? <div>Calculating rankings...</div> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {topPerformers.map(u => (
                                <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                                    <div>
                                        <p style={{ fontWeight: 700 }}>{u.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#166534' }}>{u.email}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#166534' }}>
                                            {u.rating.toFixed(1)} <Star size={14} fill="#10b981" />
                                        </div>
                                        <p style={{ fontSize: '0.7rem' }}>Elite Status</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                        <Flag /> Flagged for Review
                    </h3>
                    {loading ? <div>Scanning for quality dips...</div> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {lowRated.map(u => (
                                <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                                    <div>
                                        <p style={{ fontWeight: 700 }}>{u.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#991b1b' }}>{u.email}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#991b1b' }}>
                                            {u.rating.toFixed(1)} <AlertCircle size={14} />
                                        </div>
                                        <p style={{ fontSize: '0.7rem' }}>Action Required</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ReviewsFeedback;
