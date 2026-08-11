import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Search, Plus, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ChallanList() {
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchChallans();
  }, []);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/challans');
      setChallans(res.data.challans);
      setError('');
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('You do not have permission to view Sales Challans.');
      } else {
        setError('Failed to load challans');
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = challans.filter(c =>
    c.challanNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.customer.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft': return <span className="badge" style={{ backgroundColor: 'var(--surface-border)', color: 'var(--text-muted)' }}><Clock size={12} style={{ marginRight: '0.25rem' }}/> Draft</span>;
      case 'Confirmed': return <span className="badge badge-active"><CheckCircle size={12} style={{ marginRight: '0.25rem' }}/> Confirmed</span>;
      case 'Cancelled': return <span className="badge badge-danger"><XCircle size={12} style={{ marginRight: '0.25rem' }}/> Cancelled</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <>

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Sales Challans</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage delivery challans and shipments</p>
          </div>
          <Link to="/challans/new" className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <Plus size={16} /> Create Challan
          </Link>
        </div>

        {error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
        ) : (
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by challan number or customer..."
                  className="input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading challans...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h3>No challans found</h3>
                <p style={{ color: 'var(--text-muted)' }}>Create a new sales challan to get started.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <th style={{ padding: '1rem' }}>Challan No.</th>
                    <th style={{ padding: '1rem' }}>Date</th>
                    <th style={{ padding: '1rem' }}>Customer</th>
                    <th style={{ padding: '1rem' }}>Total Qty</th>
                    <th style={{ padding: '1rem' }}>Created By</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--primary)' }}>{c.challanNumber}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(c.createdDate).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem' }}>{c.customer.name}</td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{c.totalQuantity} items</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.user.name}</td>
                      <td style={{ padding: '1rem' }}>{getStatusBadge(c.status)}</td>
                      <td style={{ padding: '1rem' }}>
                        <Link to={`/challans/${c.id}`} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', textDecoration: 'none' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}
