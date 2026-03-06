'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import axiosInstance from '@/lib/axios';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CompanySettings } from '@/types';

interface CustomerOrder {
  id: string;
  customerId: string;
  customer?: { id: string; companyName: string; contactName: string; email: string; phone?: string };
  productId?: string;
  productName: string;
  quantity: number;
  deliveryLocation?: string;
  deliveryStreet?: string;
  deliveryStreet2?: string;
  deliveryCity?: string;
  deliveryCounty?: string;
  deliveryPostcode?: string;
  courierId?: string;
  courier?: { id: string; name: string };
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'PENDING_PAYMENT', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  switch (status) {
    case 'APPROVED': return 'success';
    case 'CONFIRMED': return 'success';
    case 'SHIPPED': return 'info';
    case 'DELIVERED': return 'success';
    case 'PENDING': return 'warning';
    case 'PENDING_PAYMENT': return 'warning';
    case 'CANCELLED': return 'danger';
    default: return 'neutral';
  }
}

export default function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const { data: order, isLoading } = useQuery<CustomerOrder>({
    queryKey: ['customer-order', id],
    queryFn: () => axiosInstance.get(`/customer-orders/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ['settings'],
    queryFn: () => axiosInstance.get('/settings').then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => axiosInstance.patch(`/customer-orders/${id}`, { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['customer-order', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      setStatusMessage(`Order status updated to ${status.replace(/_/g, ' ')}`);
      setTimeout(() => setStatusMessage(null), 4000);
    },
  });

  const deleteOrder = useMutation({
    mutationFn: () => axiosInstance.delete(`/customer-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      router.push('/customer-orders');
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <div className="p-8 text-center text-gray-400">Order not found</div>;

  const deliveryLines = [
    order.deliveryStreet,
    order.deliveryStreet2,
    order.deliveryCity,
    order.deliveryCounty,
    order.deliveryPostcode,
    order.deliveryLocation,
  ].filter(Boolean);

  const invoiceNumber = `${companySettings?.invoicePrefix || 'INV'}-${order.id.slice(0, 8).toUpperCase()}`;

  async function handleSendInvoice() {
    if (!order?.customer?.email) {
      setStatusMessage('Cannot send invoice: customer has no email address.');
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }
    setSendingInvoice(true);
    try {
      await axiosInstance.post(`/customer-orders/${id}/send-invoice`);
      setStatusMessage('Invoice sent to ' + order.customer.email);
    } catch {
      setStatusMessage('Failed to send invoice. Check SMTP settings.');
    }
    setSendingInvoice(false);
    setTimeout(() => setStatusMessage(null), 4000);
  }

  function handlePrintInvoice() {
    const printContent = invoiceRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 40px; font-size: 13px; }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
          .company-name { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 4px; }
          .company-detail { color: #6b7280; font-size: 12px; line-height: 1.5; }
          .invoice-title { font-size: 28px; font-weight: 700; color: #111827; text-align: right; }
          .invoice-meta { text-align: right; color: #6b7280; font-size: 12px; margin-top: 4px; line-height: 1.6; }
          .addresses { display: flex; gap: 40px; margin-bottom: 28px; }
          .address-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 6px; font-weight: 600; }
          .address-block p { color: #374151; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          thead th { background: #f9fafb; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
          thead th:last-child { text-align: right; }
          tbody td { padding: 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }
          tbody td:last-child { text-align: right; }
          .section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; font-weight: 600; margin-bottom: 6px; }
          .terms { background: #f9fafb; border-radius: 6px; padding: 14px; margin-bottom: 20px; }
          .terms p { color: #4b5563; font-size: 12px; line-height: 1.5; white-space: pre-wrap; }
          .bank-details { margin-bottom: 20px; }
          .bank-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; font-size: 12px; }
          .bank-grid dt { color: #9ca3af; }
          .bank-grid dd { color: #374151; font-weight: 500; }
          .footer { text-align: center; color: #9ca3af; font-size: 11px; padding-top: 16px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
          .notes { margin-bottom: 20px; }
          .notes p { color: #4b5563; font-size: 12px; line-height: 1.5; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/customer-orders')} className="text-sm text-blue-600 hover:text-blue-700 mb-1">
            ← Back to Orders
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Order from {order.customer?.companyName || order.customer?.contactName || 'Unknown'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Placed {new Date(order.createdAt).toLocaleString('en-GB')} · ID: {order.id.slice(0, 8)}…
          </p>
        </div>
        <Badge label={order.status.replace(/_/g, ' ')} variant={statusVariant(order.status)} />
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-800">✅ {statusMessage}</p>
        </div>
      )}

      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Product Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Order Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Product</dt>
              <dd className="font-medium text-gray-900">{order.productName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Quantity</dt>
              <dd className="font-medium text-gray-900">{order.quantity}</dd>
            </div>
            {order.courier && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Courier</dt>
                <dd className="font-medium text-gray-900">{order.courier.name}</dd>
              </div>
            )}
            {order.notes && (
              <div>
                <dt className="text-gray-500 mb-1">Notes</dt>
                <dd className="text-gray-700 bg-gray-50 rounded-lg p-2 text-xs">{order.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Customer</h2>
          <dl className="space-y-2 text-sm">
            {order.customer?.companyName && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Company</dt>
                <dd className="font-medium text-gray-900">{order.customer.companyName}</dd>
              </div>
            )}
            {order.customer?.contactName && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Contact</dt>
                <dd className="font-medium text-gray-900">{order.customer.contactName}</dd>
              </div>
            )}
            {order.customer?.email && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900">{order.customer.email}</dd>
              </div>
            )}
            {order.customer?.phone && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{order.customer.phone}</dd>
              </div>
            )}
          </dl>
          {deliveryLines.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-gray-500 text-sm mb-1">Delivery Address</p>
              <p className="text-sm text-gray-700">{deliveryLines.join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Actions</h2>
        <div className="flex gap-2 flex-wrap">
          {order.status === 'PENDING' && (
            <>
              <button
                onClick={() => updateStatus.mutate('APPROVED')}
                disabled={updateStatus.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                Approve Order
              </button>
              <button
                onClick={() => updateStatus.mutate('CANCELLED')}
                disabled={updateStatus.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                Cancel Order
              </button>
            </>
          )}
          {order.status === 'APPROVED' && (
            <>
              <button
                onClick={() => updateStatus.mutate('PENDING_PAYMENT')}
                disabled={updateStatus.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
              >
                Set Pending Payment
              </button>
              <button
                onClick={() => updateStatus.mutate('CONFIRMED')}
                disabled={updateStatus.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Confirm Order
              </button>
            </>
          )}
          {order.status === 'PENDING_PAYMENT' && (
            <button
              onClick={() => updateStatus.mutate('CONFIRMED')}
              disabled={updateStatus.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              Confirm Payment Received
            </button>
          )}
          {order.status === 'CONFIRMED' && (
            <button
              onClick={() => updateStatus.mutate('SHIPPED')}
              disabled={updateStatus.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              Mark as Shipped
            </button>
          )}
          {order.status === 'SHIPPED' && (
            <button
              onClick={() => updateStatus.mutate('DELIVERED')}
              disabled={updateStatus.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              Mark as Delivered
            </button>
          )}
          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <button
              onClick={() => updateStatus.mutate('CANCELLED')}
              disabled={updateStatus.isPending}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          {/* Generate Invoice */}
          <button
            onClick={() => setShowInvoice(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Generate Invoice
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this order? This cannot be undone.')) {
                deleteOrder.mutate();
              }
            }}
            disabled={deleteOrder.isPending}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50 ml-auto"
          >
            Delete Order
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      {showInvoice && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg">
          {/* Action bar */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <button
              onClick={handlePrintInvoice}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Print / Download PDF
            </button>
            <button
              onClick={handleSendInvoice}
              disabled={sendingInvoice || !order.customer?.email}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {sendingInvoice ? 'Sending…' : 'Send Invoice'}
            </button>
            <span className="text-xs text-gray-400 ml-2">
              {order.customer?.email ? `To: ${order.customer.email}` : 'No customer email'}
            </span>
            <button
              onClick={() => setShowInvoice(false)}
              className="ml-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>

          {/* Invoice content */}
          <div ref={invoiceRef} className="p-8">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 20, borderBottom: '2px solid #e5e7eb' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                  {companySettings?.companyName || 'CEGX'}
                </div>
                {companySettings?.companyAddress && (
                  <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>{companySettings.companyAddress}</div>
                )}
                {companySettings?.companyPhone && (
                  <div style={{ color: '#6b7280', fontSize: 12 }}>Tel: {companySettings.companyPhone}</div>
                )}
                {companySettings?.companyEmail && (
                  <div style={{ color: '#6b7280', fontSize: 12 }}>{companySettings.companyEmail}</div>
                )}
                {companySettings?.companyWebsite && (
                  <div style={{ color: '#6b7280', fontSize: 12 }}>{companySettings.companyWebsite}</div>
                )}
                {companySettings?.vatNumber && (
                  <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>VAT: {companySettings.vatNumber}</div>
                )}
                {companySettings?.companyRegNumber && (
                  <div style={{ color: '#6b7280', fontSize: 12 }}>Reg: {companySettings.companyRegNumber}</div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>INVOICE</div>
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>
                  <div>{invoiceNumber}</div>
                  <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
                  <div>Order Date: {new Date(order.createdAt).toLocaleDateString('en-GB')}</div>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div style={{ display: 'flex', gap: 40, marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Bill To</div>
                <div style={{ color: '#374151', lineHeight: 1.5 }}>
                  {order.customer?.companyName && <div style={{ fontWeight: 600 }}>{order.customer.companyName}</div>}
                  {order.customer?.contactName && <div>{order.customer.contactName}</div>}
                  {order.customer?.email && <div>{order.customer.email}</div>}
                  {order.customer?.phone && <div>{order.customer.phone}</div>}
                  {deliveryLines.length > 0 && <div style={{ marginTop: 4 }}>{deliveryLines.join(', ')}</div>}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr>
                  <th style={{ background: '#f9fafb', padding: '10px 12px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600, borderBottom: '2px solid #e5e7eb' }}>Description</th>
                  <th style={{ background: '#f9fafb', padding: '10px 12px', textAlign: 'right', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600, borderBottom: '2px solid #e5e7eb' }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6', color: '#374151' }}>{order.productName}</td>
                  <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6', color: '#374151', textAlign: 'right' }}>{order.quantity}</td>
                </tr>
              </tbody>
            </table>

            {order.courier && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>Courier</div>
                <div style={{ color: '#4b5563', fontSize: 12 }}>{order.courier.name}</div>
              </div>
            )}

            {order.notes && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>Notes</div>
                <div style={{ color: '#4b5563', fontSize: 12, lineHeight: 1.5 }}>{order.notes}</div>
              </div>
            )}

            {/* Payment Terms */}
            {(companySettings?.invoiceTerms) && (
              <div style={{ background: '#f9fafb', borderRadius: 6, padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>Payment Terms</div>
                <div style={{ color: '#4b5563', fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{companySettings.invoiceTerms}</div>
              </div>
            )}

            {/* Bank Details */}
            {(companySettings?.bankAccountName || companySettings?.bankSortCode || companySettings?.bankAccountNumber) && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>Bank Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', fontSize: 12 }}>
                  {companySettings.bankAccountName && <><span style={{ color: '#9ca3af' }}>Account Name</span><span style={{ color: '#374151', fontWeight: 500 }}>{companySettings.bankAccountName}</span></>}
                  {companySettings.bankSortCode && <><span style={{ color: '#9ca3af' }}>Sort Code</span><span style={{ color: '#374151', fontWeight: 500 }}>{companySettings.bankSortCode}</span></>}
                  {companySettings.bankAccountNumber && <><span style={{ color: '#9ca3af' }}>Account No.</span><span style={{ color: '#374151', fontWeight: 500 }}>{companySettings.bankAccountNumber}</span></>}
                  {companySettings.bankIban && <><span style={{ color: '#9ca3af' }}>IBAN</span><span style={{ color: '#374151', fontWeight: 500 }}>{companySettings.bankIban}</span></>}
                </div>
              </div>
            )}

            {/* Invoice Notes */}
            {companySettings?.invoiceNotes && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: '#4b5563', fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{companySettings.invoiceNotes}</div>
              </div>
            )}

            {/* Footer */}
            {companySettings?.invoiceFooter && (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 11, paddingTop: 16, borderTop: '1px solid #e5e7eb', marginTop: 20 }}>
                {companySettings.invoiceFooter}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
