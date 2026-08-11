import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--background)' }}>
      <div className="glass-card" style={{ width: '500px', padding: '3rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <ShieldAlert size={48} color="var(--danger)" />
        </div>
        <h1 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '2rem' }}>Unauthorized Access</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: '1.5' }}>
          You don't have permission to access this page. If you believe this is an error, please contact your system administrator.
        </p>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', fontSize: '1.1rem' }}
        >
          <ArrowLeft size={20} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
