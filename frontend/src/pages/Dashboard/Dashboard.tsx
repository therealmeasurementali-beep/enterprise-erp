import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { Users, Package, FileText, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/summary');
        setSummary(res.data.summary);
        setRole(res.data.role);
      } catch (err: any) {
        setError('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <><Navbar/><div className="container" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading...</div></>;

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ marginBottom: '0.5rem' }}>Welcome to Fundsroom ERP</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You are logged in as <strong style={{ color: 'var(--primary)' }}>{role}</strong></p>

        {error && <div style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {(role === 'Admin' || role === 'Sales') && (
              <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Total Customers</p>
                    <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-main)' }}>{summary.customers}</h2>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '8px', color: 'var(--primary)' }}>
                    <Users size={24} />
                  </div>
                </div>
                <Link to="/customers" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '500', fontSize: '0.875rem' }}>
                  View Customers <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {(role === 'Admin' || role === 'Warehouse') && (
              <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Total Products</p>
                    <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-main)' }}>{summary.products}</h2>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: 'var(--success)' }}>
                    <Package size={24} />
                  </div>
                </div>
                {summary.lowStock > 0 && (
                  <p style={{ color: 'var(--warning)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                    <AlertTriangle size={14} /> {summary.lowStock} products low on stock
                  </p>
                )}
                <Link to="/products" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: '500', fontSize: '0.875rem' }}>
                  Manage Inventory <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {(role === 'Admin' || role === 'Sales' || role === 'Accounts') && (
              <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Sales Challans</p>
                    <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-main)' }}>{summary.challans}</h2>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '8px', color: 'var(--secondary)' }}>
                    <FileText size={24} />
                  </div>
                </div>
                <Link to="/challans" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', fontWeight: '500', fontSize: '0.875rem' }}>
                  View Challans <ArrowRight size={14} />
                </Link>
              </div>
            )}

          </div>
        )}

        <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {(role === 'Admin' || role === 'Sales') && (
            <>
              <Link to="/customers" className="btn btn-secondary">Manage Customers</Link>
              <Link to="/challans/new" className="btn btn-secondary">Create Challan</Link>
            </>
          )}
          {(role === 'Admin' || role === 'Warehouse') && (
            <Link to="/products" className="btn btn-secondary">Manage Products</Link>
          )}
        </div>
      </div>
    </>
  );
}
