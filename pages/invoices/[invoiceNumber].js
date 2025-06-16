import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';

export default function InvoiceView() {
  const router = useRouter();
  const { invoiceNumber } = router.query;
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceNumber) return;

      try {
        console.log('Fetching invoice:', invoiceNumber);
        setLoading(true);
        setError('');

        const response = await fetch(`/api/invoices/${invoiceNumber}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed to fetch invoice');
        if (!data) throw new Error('Invoice not found');

        console.log('Invoice data received:', data);
        setInvoice(data);
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError(err.message || 'Failed to load invoice');
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      fetchInvoice();
    }
  }, [invoiceNumber, router.isReady]);

  const handlePrint = () => {
    window.print();
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="text-gray-600">Loading invoice...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-center">
            <div className="text-red-600 font-medium mb-2">Error</div>
            <div className="text-gray-600">{error}</div>
            <button
              onClick={() => router.push('/invoices')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-center">
            <div className="text-gray-800 font-medium mb-2">Invoice Not Found</div>
            <div className="text-gray-600 mb-4">
              The invoice you're looking for could not be found.
            </div>
            <button
              onClick={() => router.push('/invoices')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Screen-only controls */}
      <div className="print:hidden">
        <div className="max-w-4xl mx-auto mb-4">
          <div className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/invoices')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Invoices
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            </div>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Print Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div id="invoice-content" className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-8 print:shadow-none print:p-4">
          {/* Print-only company header */}
          <div className="hidden print:block mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Hein Khant Zaw</h1>
            <p className="text-sm text-gray-600">38 လမ်း ၈၁ * ၈၂ ကြား မန္တလေးမြို့ </p>
            <p className="text-sm text-gray-600">Phone: 09-2000826</p>
            <p className="text-sm text-gray-600">Email: contact@heinkhantzawhendrick@gmailc.</p>
          </div>

          {/* Invoice Header */}
          <div className="border-b border-gray-200 pb-6 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
              <p className="text-gray-600">Invoice Number: {invoice.invoiceNumber}</p>
              <p className="text-gray-600">Date: {new Date(invoice.date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-8">
            
            <p className="text-gray-800 font-medium">{invoice.customerName}</p>
          </div>

          {/* Items Table */}
          <div className="mb-8 overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50 print:bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item Description</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Unit Price</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={index} className="print:bg-white">
                    <td className="px-4 py-4 text-sm text-gray-900">{item.nameMM}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">{item.quantity}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">${item.price.toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td colSpan="3" className="px-4 py-4 text-sm font-semibold text-gray-900 text-right">Total Amount:</td>
                  <td className="px-4 py-4 text-sm font-bold text-gray-900 text-right">${invoice.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Terms */}
          <div className="hidden print:block mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Terms & Conditions:</h3>
            <ol className="text-xs text-gray-600 list-decimal pl-4 space-y-1">
              <li>Payment is due within 30 days.</li>
              <li>Please include invoice number on your payment.</li>
            
            </ol>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">Thank you for your business!</p>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }

          body * {
            visibility: hidden !important;
          }

          #invoice-content, #invoice-content * {
            visibility: visible !important;
          }

          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            box-shadow: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          thead {
            display: table-header-group;
          }

          tr, td, table {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}
