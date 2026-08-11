import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { ArrowLeft, Edit2, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ChallanDetail() {
  const { id } = useParams();
  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchChallan = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/challans/${id}`);
      setChallan(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load challan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const handleAction = async (action: 'confirm' | 'cancel') => {
    if (action === 'confirm' && !window.confirm('Are you sure you want to CONFIRM this challan? Stock will be deducted immediately.')) return;
    if (action === 'cancel' && !window.confirm('Are you sure you want to CANCEL this challan?')) return;
    
    try {
      setActionLoading(true);
      await api.post(`/challans/${id}/${action}`);
      await fetchChallan(); // refresh
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} challan`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <><Navbar/><div className="container" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading...</div></>;
  if (error && !challan) return <><Navbar/><div className="container" style={{ color: 'var(--danger)', padding: '2rem' }}>{error}</div></>;
  if (!challan) return null;

  return (
    <>
      <Navbar />
      <div className="container">
        <Link to="/challans" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to Sales
        </Link>

        {error && <div style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ marginBottom: '0.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {challan.challanNumber}
                {challan.status === 'Draft' && <span className="badge" style={{ backgroundColor: 'var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}><Clock size={14} style={{ marginRight: '0.25rem' }}/> Draft</span>}
                {challan.status === 'Confirmed' && <span className="badge badge-active" style={{ fontSize: '0.875rem' }}><CheckCircle size={14} style={{ marginRight: '0.25rem' }}/> Confirmed</span>}
                {challan.status === 'Cancelled' && <span className="badge badge-danger" style={{ fontSize: '0.875rem' }}><XCircle size={14} style={{ marginRight: '0.25rem' }}/> Cancelled</span>}
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Created on {new Date(challan.createdDate).toLocaleString()} by {challan.user.name}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              {challan.status === 'Draft' && (
                <>
                  <Link to={`/challans/${challan.id}/edit`} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <Edit2 size={16} /> Edit
                  </Link>
                  <button className="btn" onClick={() => handleAction('confirm')} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--success)' }}>
                    <CheckCircle size={16} /> Confirm
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleAction('cancel')} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    <XCircle size={16} /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Customer</p>
              <p style={{ fontWeight: '600' }}>{challan.customer.name}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{challan.customer.businessName}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Quantity</p>
              <p style={{ fontWeight: '600', fontSize: '1.25rem' }}>{challan.totalQuantity}</p>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Challan Items Snapshot</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem' }}>Product Name</th>
                <th style={{ padding: '1rem' }}>SKU</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Unit Price (₹)</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Quantity</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item: any) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{item.productNameSnapshot}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.skuSnapshot}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>{item.unitPriceSnapshot.toFixed(2)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>{item.quantity}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>{(item.unitPriceSnapshot * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
