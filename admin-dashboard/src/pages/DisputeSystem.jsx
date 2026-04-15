import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Gavel, MessageSquare, Map as MapIcon, RotateCcw, Check, Ban } from 'lucide-react';

const DisputeSystem = () => {
    const [disputes, setDisputes] = useState([]);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDisputes = async () => {
        try {
            const { data } = await axios.get('http://127.0.0.1:5000/api/admin/disputes', {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
            });
            setDisputes(data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchDisputes(); }, []);

    const resolveAction = async (action) => {
        const notes = prompt(`Enter resolution notes for ${action}:`);
        if (!notes) return;

        try {
            await axios.post(`http://127.0.0.1:5000/api/admin/disputes/${selectedDispute._id}/resolve`, 
                { action, notes },
                { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }}
            );
            alert("Dispute Resolved: " + action);
            setSelectedDispute(null);
            fetchDisputes();
        } catch (err) { alert("Failed to resolve"); }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: selectedDispute ? '1fr 1fr' : '1fr', gap: '2rem' }}>
            <section>
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Dispute Tribunal</h1>
                    <p style={{ color: '#64748b' }}>Mediate conflicts and ensure fairness in every transaction.</p>
                </header>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td>Loading conflicts...</td></tr> : disputes.map(d => (
                                <tr key={d._id} style={{ cursor: 'pointer', background: selectedDispute?._id === d._id ? '#f1f5f9' : 'transparent' }} onClick={() => setSelectedDispute(d)}>
                                    <td style={{ fontWeight: 600 }}>{d.reason}</td>
                                    <td><span className={`badge ${d.status === 'Resolved' ? 'badge-success' : 'badge-warning'}`}>{d.status}</span></td>
                                    <td style={{ fontSize: '0.8rem' }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                                    <td><button className="btn" style={{ padding: '0.4rem', background: '#f1f5f9' }}><Gavel size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {selectedDispute && (
                <section className="card">
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Gavel /> Dispute Details
                    </h2>
                    
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Reasoning</label>
                            <p style={{ fontWeight: 600, marginTop: '0.25rem' }}>{selectedDispute.reason}</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Requester ID</label>
                                <p style={{ fontSize: '0.875rem' }}>{selectedDispute.requesterId}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Server ID</label>
                                <p style={{ fontSize: '0.875rem' }}>{selectedDispute.serverId}</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <button className="btn" style={{ flex: 1, border: '1px solid #e2e8f0', background: 'white' }}><MessageSquare size={16} style={{ marginRight: 8 }} /> Logs</button>
                        <button className="btn" style={{ flex: 1, border: '1px solid #e2e8f0', background: 'white' }}><MapIcon size={16} style={{ marginRight: 8 }} /> History</button>
                    </div>

                    {selectedDispute.status !== 'Resolved' && (
                        <div>
                            <h4 style={{ marginBottom: '1rem' }}>Take Administrative Action:</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button className="btn" style={{ background: '#dcfce7', color: '#166534', width: '100%', textAlign: 'left' }} onClick={() => resolveAction('REFUND')}>
                                    <RotateCcw size={16} style={{ marginRight: 12 }} /> Refund Requester
                                </button>
                                <button className="btn" style={{ background: '#eff6ff', color: '#1d4ed8', width: '100%', textAlign: 'left' }} onClick={() => resolveAction('RELEASE_PAYMENT')}>
                                    <Check size={16} style={{ marginRight: 12 }} /> Release Payment to Server
                                </button>
                                <button className="btn" style={{ background: '#fee2e2', color: '#991b1b', width: '100%', textAlign: 'left' }} onClick={() => resolveAction('PENALIZE')}>
                                    <Ban size={16} style={{ marginRight: 12 }} /> Penalize Server (Suspend)
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default DisputeSystem;
