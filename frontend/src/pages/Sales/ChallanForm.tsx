import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

export default function ChallanForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [custRes, prodRes] = await Promise.all([
          api.get('/customers'),
          api.get('/products')
        ]);
        setCustomers(custRes.data.customers);
        setProducts(prodRes.data.products);

        if (isEdit) {
          const challanRes = await api.get(`/challans/${id}`);
          if (challanRes.data.status !== 'Draft') {
            setError('Only Draft challans can be edited.');
          }
          setCustomerId(challanRes.data.customerId);
          setItems(challanRes.data.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })));
        } else {
          // Initialize with one empty item
          setItems([{ productId: '', quantity: 1 }]);
        }
      } catch (err: any) {
        setError('Failed to load data. ' + (err.response?.data?.message || ''));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEdit]);

  const addItem = () => setItems([...items, { productId: '', quantity: 1 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return setError('Please select a customer.');
    if (items.length === 0) return setError('Add at least one product.');
    
    // Validate items
    for (let i = 0; i < items.length; i++) {
      if (!items[i].productId) return setError(`Please select a product for item ${i + 1}.`);
      if (items[i].quantity <= 0) return setError(`Quantity must be greater than 0 for item ${i + 1}.`);
    }

    try {
      setSaving(true);
      setError('');
      if (isEdit) {
        await api.put(`/challans/${id}`, { customerId, items });
      } else {
        await api.post('/challans', { customerId, items });
      }
      navigate('/challans');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save challan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <><Navbar/><div className="container" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading...</div></>;

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: '800px' }}>
        <Link to={isEdit ? `/challans/${id}` : '/challans'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
            {isEdit ? 'Edit Draft Challan' : 'Create New Challan'}
          </h2>

          {error && <div style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Customer</label>
              <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)} required>
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.businessName})</option>
                ))}
              </select>
            </div>

            <h3 style={{ margin: '2rem 0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Products
              <button type="button" className="btn btn-secondary" onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                <Plus size={14} /> Add Item
              </button>
            </h3>

            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                <div style={{ flex: 2 }}>
                  <label className="form-label">Product</label>
                  <select className="input" value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)} required>
                    <option value="">-- Select Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku}) - Stock: {p.currentStock}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Quantity</label>
                  <input type="number" className="input" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} min="1" required />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '2rem' }}>
                  <button type="button" onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem' }} disabled={items.length === 1}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <Link to={isEdit ? `/challans/${id}` : '/challans'} className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
              <button type="submit" className="btn" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
