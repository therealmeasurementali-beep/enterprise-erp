import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

export default function StockMovementHistory() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setLoading(true);
        const res = await api.get('/stock/movements');
        setMovements(res.data.movements);
        setError('');
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('You do not have permission to view stock history.');
        } else {
          setError(err.response?.data?.message || 'Failed to load stock movements');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, []);

  return (
    <>

      <div className="container">
        <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Back to Inventory
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Stock Movement History</h1>
            <p style={{ color: 'var(--text-muted)' }}>Audit log of all IN and OUT inventory changes</p>
          </div>
        </div>

        {error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</div>
        ) : movements.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <Clock size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No stock movements found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Movements will appear here once you record IN/OUT transactions.</p>
          </div>
        ) : (
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '1rem' }}>Date & Time</th>
                  <th style={{ padding: '1rem' }}>Product</th>
                  <th style={{ padding: '1rem' }}>Type</th>
                  <th style={{ padding: '1rem' }}>Quantity</th>
                  <th style={{ padding: '1rem' }}>Reason</th>
                  <th style={{ padding: '1rem' }}>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => {
                  const isIn = m.type === 'IN';
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {new Date(m.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600' }}>{m.product.name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>SKU: {m.product.sku}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${isIn ? 'badge-active' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          {isIn ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />} {m.type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: isIn ? 'var(--success)' : 'var(--danger)' }}>
                        {isIn ? '+' : '-'}{m.quantityChanged}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{m.reason || '-'}</td>
                      <td style={{ padding: '1rem' }}>{m.user.name}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
