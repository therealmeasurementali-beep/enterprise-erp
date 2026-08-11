import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { Search, Plus, User, Building2 } from 'lucide-react';

export default function CustomerList() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?search=${search}`);
      setCustomers(res.data.customers);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState({ 
    name: '', email: '', mobile: '', businessName: '', gstNumber: '', 
    type: 'Retail', address: '', status: 'Lead', followUpDate: '', notes: '' 
  });
  const [saving, setSaving] = useState(false);

  const openAddModal = () => {
    setEditingId(null);
    setCustomerForm({ name: '', email: '', mobile: '', businessName: '', gstNumber: '', type: 'Retail', address: '', status: 'Lead', followUpDate: '', notes: '' });
    setShowModal(true);
  };

  const location = useLocation();
  useEffect(() => {
    if ((location.state as any)?.openNew) {
      openAddModal();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const openEditModal = (customer: any) => {
    setEditingId(customer.id);
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
    setShowModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...customerForm,
        followUpDate: customerForm.followUpDate ? new Date(customerForm.followUpDate).toISOString() : null
      };

      if (editingId) {
        await api.put(`/customers/${editingId}`, payload);
      } else {
        await api.post('/customers', payload);
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Customers</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage your CRM leads and clients</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Add Customer
            </button>
          </div>
        </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem 0' }}>
          <div className="glass-card" style={{ width: '600px', padding: '2rem', background: 'var(--bg-color)' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Customer' : 'Add New Customer'}</h3>
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
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : 'Save Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search by name, email, or business..." 
            style={{ paddingLeft: '3rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
      ) : loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
          <User size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No customers found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Get started by adding a new customer.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Contact</th>
                <th style={{ padding: '1rem' }}>Type</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '600' }}>{customer.name}</div>
                    {customer.businessName && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Building2 size={12} /> {customer.businessName}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>{customer.mobile}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{customer.email}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{customer.type}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge badge-${customer.status.toLowerCase()}`}>{customer.status}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEditModal(customer)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                        Edit
                      </button>
                      <Link to={`/customers/${customer.id}`} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </>
  );
}
