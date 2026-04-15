import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, PieChart, ArrowUpRight, ArrowDownLeft, Landmark } from 'lucide-react';

const FinancePanel = () => {
    const [financeData, setFinanceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinance = async () => {
            try {
                const { data } = await axios.get('http://127.0.0.1:5000/api/admin/finance', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
                });
                setFinanceData(data.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchFinance();
    }, []);

    const handleWithdraw = () => {
        const amount = prompt("Enter amount to withdraw from platform treasury (₹):");
        if (!amount || isNaN(amount)) return;
        alert(`Initiating transfer of ₹${amount} to platform reserve bank account...`);
    };

    if (loading) return <div>Auditing platform treasury...</div>;

    return (
        <div>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Finance & Treasury</h1>
                    <p style={{ color: '#64748b' }}>Monitor platform earnings, commissions, and campus-level revenue.</p>
                </div>
                <button className="btn btn-primary" onClick={handleWithdraw}>
                    <Landmark size={18} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Withdraw Earnings
                </button>
            </header>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PieChart /> Campus Revenue Split
                </h3>
                <table>
                    <thead>
                        <tr>
                            <th>Campus</th>
                            <th>Total Volume (Gross)</th>
                            <th>Commission (Net)</th>
                            <th>Growth</th>
                        </tr>
                    </thead>
                    <tbody>
                        {financeData.campusRevenue.map((cr) => (
                            <tr key={cr._id}>
                                <td style={{ fontWeight: 600 }}>{cr.campus.name}</td>
                                <td>₹{cr.totalRevenue.toLocaleString()}</td>
                                <td style={{ color: '#059669', fontWeight: 700 }}>+₹{cr.commission.toLocaleString()}</td>
                                <td>
                                    <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>
                                        <ArrowUpRight size={14} /> 12.4%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="stats-grid">
                <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Total Commission Earned</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>
                        ₹{financeData.campusRevenue.reduce((acc, curr) => acc + curr.commission, 0).toLocaleString()}
                    </h2>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Available for Withdrawal</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>
                        ₹{financeData.campusRevenue.reduce((acc, curr) => acc + curr.commission, 0).toLocaleString()}
                    </h2>
                </div>
            </div>
        </div>
    );
};

export default FinancePanel;
