/**
 * Export utilities — CSV and PDF generation (client-side only, no dependencies)
 */

/** Download an array of objects as a CSV file */
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      if (val == null) return '';
      const str = String(val);
      // Escape quotes, wrap in quotes if contains comma/newline/quote
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Open browser print dialog for a single invoice — uses a temporary hidden window */
export function exportInvoicePDF(invoice: {
  invoiceId: string;
  clientName?: string;
  amount: number;
  currency: string;
  status: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
}): void {
  const printContent = `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 40px;">
      <h1 style="font-size: 28px; margin-bottom: 4px;">Invoice</h1>
      <p style="color: #666; font-size: 14px; margin-bottom: 32px;">${invoice.invoiceId}</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr><td style="padding: 8px 0; font-weight: 600; width: 160px;">Client</td><td>${invoice.clientName ?? '—'}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Status</td><td>${invoice.status}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Issue Date</td><td>${invoice.issueDate ?? '—'}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Due Date</td><td>${invoice.dueDate ?? '—'}</td></tr>
      </table>
      <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 18px; font-weight: 600;">Total Amount</span>
          <span style="font-size: 28px; font-weight: 700;">${invoice.currency} ${Number(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      ${invoice.notes ? `<p style="color: #666; font-size: 14px;"><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
    </div>
  `;
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) return;
  printWindow.document.write(`<html><body>${printContent}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
