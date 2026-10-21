// src/utils/brandedPrint.ts

export interface BrandedStatementOptions {
  title: string;
  subtitle?: string;
  summaryHtml?: string;
  tableHtml: string;
  referenceNumber?: string;
}

export function buildBrandedStatement({
  title,
  subtitle = '',
  summaryHtml = '',
  tableHtml,
  referenceNumber = '',
}: BrandedStatementOptions) {
  const logoUrl = `${window.location.origin}/images/logo.png`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0;
      background: #fff;
      color: #1a1a1a;
      position: relative;
    }
    .statement-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 40px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }
    /* Perfect watermark – centered, subtle, behind content */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      font-size: 80px;
      font-weight: 900;
      color: rgba(0, 0, 0, 0.04);
      pointer-events: none;
      white-space: nowrap;
      z-index: 0;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .content {
      position: relative;
      z-index: 1;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #1a1a1a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .logo {
      height: 45px;
    }
    .header-right {
      text-align: right;
    }
    .document-title {
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      color: #000;
    }
    .document-subtitle {
      font-size: 12px;
      color: #555;
      margin-top: 4px;
    }
    .summary-grid {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .summary-card {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 12px 16px;
      min-width: 150px;
    }
    .summary-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      margin-bottom: 6px;
    }
    .summary-value {
      font-size: 18px;
      font-weight: 700;
      color: #000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 20px;
    }
    thead th {
      background: #fafafa;
      text-align: left;
      padding: 10px 8px;
      border: 1px solid #ddd;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
      color: #444;
    }
    tbody td {
      padding: 10px 8px;
      border: 1px solid #eee;
      vertical-align: top;
    }
    tbody tr:nth-child(even) {
      background: #fcfcfc;
    }
    .footer {
      border-top: 1px solid #e0e0e0;
      padding-top: 16px;
      font-size: 10px;
      color: #777;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer .note {
      font-size: 9px;
      color: #999;
    }
    .no-print {
      text-align: right;
      margin-top: 16px;
    }
    @media print {
      body {
        margin: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .statement-container {
        border: none;
        border-radius: 0;
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="statement-container">
    <div class="watermark">ET Marketplace</div>
    <div class="content">
      <div class="header">
        <img src="${logoUrl}" alt="ET Marketplace" class="logo" onerror="this.style.display='none'" />
        <div class="header-right">
          <p class="document-title">${title}</p>
          <p class="document-subtitle">${subtitle}</p>
          ${
            referenceNumber
              ? `<p class="document-subtitle">Reference: ${referenceNumber}</p>`
              : ''
          }
        </div>
      </div>

      ${summaryHtml ? `<div class="summary-grid">${summaryHtml}</div>` : ''}

      ${tableHtml}

      <div class="footer">
        <div>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p class="note">This is a system-generated statement and does not require a physical signature.</p>
        </div>
        <div>ET Marketplace</div>
      </div>

      <div class="no-print">
        <button onclick="window.print()" style="padding:10px 20px; background:#1a1a1a; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:600;">Print / Save as PDF</button>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function openBrandedPrint(html: string) {
  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}