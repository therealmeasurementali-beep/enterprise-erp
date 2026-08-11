import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
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

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = async (print = false) => {
    if (!challan) return;
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 18;

      // ── Header ──────────────────────────────────────────────────
      doc.setFillColor(30, 30, 46);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('FUNDSROOM', margin, 12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Mini ERP & CRM Operations Portal', margin, 19);

      // Status badge (top-right)
      const statusColors: Record<string, [number, number, number]> = {
        Draft:     [100, 100, 120],
        Confirmed: [34,  197,  94],
        Cancelled: [239,  68,  68],
      };
      const [sr, sg, sb] = statusColors[challan.status] || [100, 100, 120];
      doc.setFillColor(sr, sg, sb);
      doc.roundedRect(pageW - margin - 30, 8, 30, 10, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(challan.status.toUpperCase(), pageW - margin - 15, 14.5, { align: 'center' });

      // Title
      doc.setTextColor(30, 30, 46);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SALES CHALLAN', margin, 40);

      // Horizontal rule
      doc.setDrawColor(200, 200, 210);
      doc.setLineWidth(0.4);
      doc.line(margin, 43, pageW - margin, 43);

      // ── Challan Meta ─────────────────────────────────────────────
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 100);
      doc.text('Challan Number', margin, 52);
      doc.text('Date', 90, 52);
      doc.text('Created By', 145, 52);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 40);
      doc.setFontSize(10.5);
      doc.text(challan.challanNumber, margin, 58);
      doc.text(new Date(challan.createdDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 90, 58);
      doc.text(challan.user?.name || '-', 145, 58);

      // ── Customer Section ─────────────────────────────────────────
      doc.setFillColor(245, 245, 252);
      doc.rect(margin, 66, pageW - margin * 2, 40, 'F');
      doc.setDrawColor(210, 210, 225);
      doc.rect(margin, 66, pageW - margin * 2, 40, 'S');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 130);
      doc.text('BILL TO', margin + 4, 73);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 40);
      doc.text(challan.customer?.name || '-', margin + 4, 80);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 80);
      let custY = 86;
      const addCustLine = (label: string, value: string | undefined) => {
        if (!value) return;
        doc.setFont('helvetica', 'bold'); doc.text(`${label}:`, margin + 4, custY);
        doc.setFont('helvetica', 'normal'); doc.text(value, margin + 30, custY);
        custY += 5.5;
      };
      addCustLine('Business', challan.customer?.businessName);
      addCustLine('Mobile',   challan.customer?.mobile);
      addCustLine('Email',    challan.customer?.email);
      addCustLine('GST No',   challan.customer?.gstNumber);
      addCustLine('Address',  challan.customer?.address);

      // ── Products Table ───────────────────────────────────────────
      const tableStartY = 114;
      const totalAmount = challan.items.reduce(
        (sum: number, item: any) => sum + item.unitPriceSnapshot * item.quantity, 0
      );

      autoTable(doc, {
        startY: tableStartY,
        margin: { left: margin, right: margin },
        head: [['#', 'Product Name', 'SKU', 'Qty', 'Unit Price (INR)', 'Total (INR)']],
        body: challan.items.map((item: any, idx: number) => [
          idx + 1,
          item.productNameSnapshot,
          item.skuSnapshot,
          item.quantity,
          item.unitPriceSnapshot.toFixed(2),
          (item.unitPriceSnapshot * item.quantity).toFixed(2),
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 3.5,
          textColor: [30, 30, 50],
          lineColor: [210, 210, 225],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [30, 30, 46],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        alternateRowStyles: { fillColor: [248, 248, 255] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          3: { halign: 'center', cellWidth: 14 },
          4: { halign: 'right', cellWidth: 32 },
          5: { halign: 'right', cellWidth: 32 },
        },
      });

      // ── Totals ───────────────────────────────────────────────────
      const finalY = (doc as any).lastAutoTable.finalY + 6;
      doc.setDrawColor(210, 210, 225);
      doc.line(pageW - margin - 80, finalY, pageW - margin, finalY);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 80);
      doc.text('Total Quantity:', pageW - margin - 80, finalY + 7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 40);
      doc.text(String(challan.totalQuantity), pageW - margin, finalY + 7, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 80);
      doc.text('Total Amount:', pageW - margin - 80, finalY + 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 46);
      doc.text(`INR ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageW - margin, finalY + 14, { align: 'right' });

      // ── Footer ───────────────────────────────────────────────────
      const pageH = doc.internal.pageSize.getHeight();
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(200, 200, 210);
        doc.line(margin, pageH - 18, pageW - margin, pageH - 18);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(140, 140, 160);
        doc.text('This is a system-generated document from Fundsroom ERP. No signature required.', margin, pageH - 12);
        doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 12, { align: 'right' });
      }

      // ── Output ───────────────────────────────────────────────────
      if (print) {
        doc.autoPrint();
        doc.output('dataurlnewwindow');
      } else {
        doc.save(`${challan.challanNumber}.pdf`);
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <><div className="container" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading...</div></>;
  if (error && !challan) return <><div className="container" style={{ color: 'var(--danger)', padding: '2rem' }}>{error}</div></>;
  if (!challan) return null;

  return (
    <>
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
            
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleDownloadPDF(false)}
                disabled={pdfLoading}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: pdfLoading ? 0.7 : 1 }}
                title="Download this challan as a PDF file"
              >
                {pdfLoading ? (
                  <span style={{ width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                )}
                {pdfLoading ? 'Generating...' : 'Download PDF'}
              </button>
              <button
                onClick={() => handleDownloadPDF(true)}
                disabled={pdfLoading}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: pdfLoading ? 0.7 : 1 }}
                title="Open print dialog for this challan"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print
              </button>

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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
