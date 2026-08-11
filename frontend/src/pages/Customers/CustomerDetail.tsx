import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Phone, Mail, Building2, Calendar, FileText } from 'lucide-react';

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [addingFollowUp, setAddingFollowUp] = useState(false);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data);
    } catch (err: any) {
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingFollowUp(true);
    try {
      await api.post(`/customers/${id}/followups`, {
        notes,
        date: new Date(date).toISOString()
      });
      setNotes('');
      setDate('');
      fetchCustomer(); // refresh data
    } catch (err: any) {
      alert('Failed to add follow-up');
    } finally {
      setAddingFollowUp(false);
    }
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({ 
    name: '', email: '', mobile: '', businessName: '', gstNumber: '', 
    type: 'Retail', address: '', status: 'Lead', followUpDate: '', notes: '' 
  });
  const [saving, setSaving] = useState(false);

  const openEditModal = () => {
    setCustomerForm({
      name: customer.name || '',
      email: customer.email || '',
      mobile: customer.mobile || '',
      businessName: customer.businessName || '',
      gstNumber: customer.gstNumber || '',
      type: customer.type || 'Retail',
      address: customer.address || '',
      status: customer.status || 'Lead',
      followUpDate: customer.followUpDate ? new Date(customer.followUpDate).toISOString().slice(0,16) : '',
      notes: customer.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...customerForm,
        followUpDate: customerForm.followUpDate ? new Date(customerForm.followUpDate).toISOString() : null
      };
      await api.put(`/customers/${id}`, payload);
      setShowEditModal(false);
      fetchCustomer();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;
  if (error || !customer) return <div className="container" style={{ textAlign: 'center', color: 'var(--danger)' }}>{error || 'Customer not found'}</div>;

  return (
    <>

      <div className="container">
        <Link to="/customers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Back to Customers
        </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h1 style={{ marginBottom: '0.5rem' }}>{customer.name}</h1>
                <span className={`badge badge-${customer.status.toLowerCase()}`}>{customer.status}</span>
                <span className="badge" style={{ marginLeft: '0.5rem', background: 'rgba(79, 70, 229, 0.2)', color: 'var(--primary)' }}>{customer.type}</span>
              </div>
              <button className="btn btn-secondary" onClick={openEditModal}>Edit Customer</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Phone size={18} color="var(--text-muted)" />
                <span>{customer.mobile}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Mail size={18} color="var(--text-muted)" />
                <span>{customer.email || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Building2 size={18} color="var(--text-muted)" />
                <span>{customer.businessName || 'N/A'} {customer.gstNumber && `(GST: ${customer.gstNumber})`}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Calendar size={18} color="var(--text-muted)" />
                <span>Next Follow-up: {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
            
            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Address</h4>
                <p style={{ margin: 0 }}>{customer.address || 'N/A'}</p>
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Internal Notes</h4>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{customer.notes || 'No notes available.'}</p>
              </div>
            </div>
          </div>

          {showEditModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem 0' }}>
              <div className="glass-card" style={{ width: '600px', padding: '2rem', background: 'var(--bg-color)' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Edit Customer</h3>
                <form onSubmit={handleSaveCustomer}>
                  <div className="input-group">
                    <label>Customer Name *</label>
                    <input className="input-field" required value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label>Mobile Number *</label>
                      <input className="input-field" required value={customerForm.mobile} onChange={e => setCustomerForm({...customerForm, mobile: e.target.value})} />
                    </div>
                    <div className="input-group">
                      <label>Email</label>
                      <input type="email" className="input-field" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label>Business Name</label>
                      <input className="input-field" value={customerForm.businessName} onChange={e => setCustomerForm({...customerForm, businessName: e.target.value})} />
                    </div>
                    <div className="input-group">
                      <label>GST Number</label>
                      <input className="input-field" value={customerForm.gstNumber} onChange={e => setCustomerForm({...customerForm, gstNumber: e.target.value})} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label>Customer Type</label>
                      <select className="input-field" value={customerForm.type} onChange={e => setCustomerForm({...customerForm, type: e.target.value})}>
                        <option value="Retail">Retail</option>
                        <option value="Wholesale">Wholesale</option>
                        <option value="Distributor">Distributor</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Status</label>
                      <select className="input-field" value={customerForm.status} onChange={e => setCustomerForm({...customerForm, status: e.target.value})}>
                        <option value="Lead">Lead</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Address</label>
                    <input className="input-field" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label>Follow-up Date</label>
                      <input type="datetime-local" className="input-field" value={customerForm.followUpDate} onChange={e => setCustomerForm({...customerForm, followUpDate: e.target.value})} />
                    </div>
                    <div className="input-group">
                      <label>Notes</label>
                      <input className="input-field" value={customerForm.notes} onChange={e => setCustomerForm({...customerForm, notes: e.target.value})} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Cancel</button>
                    <button type="submit" className="btn" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : 'Save Customer'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} /> Follow-up History
            </h3>
            
            {customer.followUps?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No follow-ups recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {customer.followUps?.map((fu: any) => (
                  <div key={fu.id} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: '600' }}>{fu.assignedTo?.name || 'Unknown'}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(fu.date).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-main)' }}>{fu.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="glass-card" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} /> Add Follow-up
            </h3>
            <form onSubmit={handleAddFollowUp}>
              <div className="input-group">
                <label>Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="input-field" 
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Notes</label>
                <textarea 
                  className="input-field" 
                  rows={4} 
                  required
                  placeholder="Enter discussion details..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
              <button type="submit" className="btn" style={{ width: '100%' }} disabled={addingFollowUp}>
                {addingFollowUp ? 'Saving...' : 'Save Follow-up'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
