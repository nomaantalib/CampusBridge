import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LifeBuoy, Send, CheckCircle, Clock } from 'lucide-react';

const SupportSystem = () => {
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchTickets = async () => {
        try {
            const { data } = await axios.get('http://127.0.0.1:5000/api/admin/support/tickets', {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
            });
            setTickets(data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTickets(); }, []);

    const sendReply = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`http://127.0.0.1:5000/api/admin/support/${selectedTicket._id}/reply`, 
                { message: reply, status: 'In-Progress' },
                { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }}
            );
            setReply('');
            fetchTickets();
            alert("Reply Transmitted");
        } catch (err) { alert("Transmission failed"); }
    };

    const resolveTicket = async (ticketId) => {
        try {
            await axios.post(`http://127.0.0.1:5000/api/admin/support/${ticketId}/reply`, 
                { message: "Ticket resolved and marked closed by administrator.", status: 'Resolved' },
                { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }}
            );
            fetchTickets();
            setSelectedTicket(null);
        } catch (err) { alert("Resolution failed"); }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 400px) 1fr', gap: '2rem', height: 'calc(100vh - 120px)' }}>
            <section className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LifeBuoy size={20} /> Help Desk
                    </h2>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? <div style={{ padding: '1.5rem' }}>Accessing support queue...</div> : tickets.map(t => (
                        <div 
                            key={t._id} 
                            onClick={() => setSelectedTicket(t)}
                            style={{ 
                                padding: '1.25rem', 
                                borderBottom: '1px solid #f1f5f9', 
                                cursor: 'pointer',
                                background: selectedTicket?._id === t._id ? '#f1f5f9' : 'transparent'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span className={`badge ${t.status === 'Resolved' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}><Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {new Date(t.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.25rem' }}>{t.subject}</h4>
                            <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>From: {t.userId?.name}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="card" style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
                {selectedTicket ? (
                    <>
                        <div style={{ padding: '1.5rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontWeight: 800 }}>{selectedTicket.subject}</h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Reference ID: #{selectedTicket._id.toUpperCase()}</p>
                            </div>
                            {selectedTicket.status !== 'Resolved' && (
                                <button className="btn btn-primary" onClick={() => resolveTicket(selectedTicket._id)}>
                                    <CheckCircle size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Resolve Entry
                                </button>
                            )}
                        </div>

                        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', marginBottom: '0.5rem' }}>ORIGINAL MESSAGE</p>
                                <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{selectedTicket.message}</p>
                            </div>

                            {selectedTicket.replies.map((rep, idx) => (
                                <div key={idx} style={{ background: rep.adminId ? '#eff6ff' : 'white', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', alignSelf: rep.adminId ? 'flex-end' : 'flex-start', border: '1px solid #e2e8f0' }}>
                                    <p style={{ fontSize: '0.875rem' }}>{rep.message}</p>
                                    <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem' }}>{new Date(rep.timestamp).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: '1.5rem', background: 'white', borderTop: '1px solid #e2e8f0' }}>
                            <form style={{ display: 'flex', gap: '1rem' }} onSubmit={sendReply}>
                                <input 
                                    className="card" 
                                    style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1' }} 
                                    placeholder="Enter administrative response..."
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    required
                                />
                                <button className="btn btn-primary"><Send size={18} /></button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>
                        Select a ticket from the queue to start communication.
                    </div>
                )}
            </section>
        </div>
    );
};

export default SupportSystem;
