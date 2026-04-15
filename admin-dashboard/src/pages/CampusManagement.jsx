import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, CheckCircle, XCircle, Settings } from 'lucide-react';

const CampusManagement = () => {
    const [campuses, setCampuses] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCampuses = async () => {
        try {
            const { data } = await axios.get('http://127.0.0.1:5000/api/admin/campuses', {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
            });
            setCampuses(data.data);
        } catch (err) {
            console.error("Campus Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCampuses(); }, []);

    const toggleStatus = async (campus) => {
        try {
            await axios.patch(`http://127.0.0.1:5000/api/admin/campuses/${campus._id}`, 
                { isActive: !campus.isActive },
                { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }}
            );
            fetchCampuses();
        } catch (err) {
            alert("Update failed");
        }
    };

    const updateCommission = async (campusId, rate) => {
        const newRate = prompt("Enter new commission rate (%)", rate);
        if (newRate === null || isNaN(newRate)) return;
        
        try {
            await axios.patch(`http://127.0.0.1:5000/api/admin/campuses/${campusId}`, 
                { commissionRate: Number(newRate) },
                { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }}
            );
            fetchCampuses();
        } catch (err) {
            alert("Update failed");
        }
    };

    return (
        <div>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Campus Management</h1>
                <p style={{ color: '#64748b' }}>Configure geo-fencing, active states, and commission logic for each location.</p>
            </header>

            <div className="stats-grid">
                {loading ? (
                    <div>Scanning geo-networks...</div>
                ) : campuses.map((campus) => (
                    <div key={campus._id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{campus.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                                    <MapPin size={14} /> Geo-fence Active
                                </div>
                            </div>
                            <span className={`badge ${campus.isActive ? 'badge-success' : 'badge-danger'}`}>
                                {campus.isActive ? 'OPERATIONAL' : 'OFFLINE'}
                            </span>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Platform Commission</span>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>{campus.commissionRate}%</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button 
                                className="btn" 
                                style={{ flex: 1, border: '1px solid #e2e8f0', background: 'white', color: '#0f172a' }}
                                onClick={() => updateCommission(campus._id, campus.commissionRate)}
                            >
                                <Settings size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Rate
                            </button>
                            <button 
                                className={`btn ${campus.isActive ? 'btn-danger' : 'btn-primary'}`} 
                                style={{ flex: 2 }}
                                onClick={() => toggleStatus(campus)}
                            >
                                {campus.isActive ? <><XCircle size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Deactivate</> : <><CheckCircle size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Activate</>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => alert("Geo-fencing editor opening...")}>
                + Onboard New Campus
            </button>
        </div>
    );
};

export default CampusManagement;
