/**
 * Utility for downloading ready-to-print formatted documents (HTML/SVG)
 * directly to the user's computer when clicking Print/Cetak.
 */

export function downloadHtmlDocument(filename: string, title: string, bodyHtml: string, extraCss: string = '') {
  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f8f9fa;
      color: #212529;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }

    .doc-container {
      background: #ffffff;
      border: 1px solid #dee2e6;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      padding: 32px;
      max-width: 800px;
      width: 100%;
    }

    .download-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-print {
      background-color: #b81d24;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .btn-print:hover {
      background-color: #9c181e;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .doc-container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .download-header {
        display: none !important;
      }
    }

    ${extraCss}
  </style>
</head>
<body>
  <div class="doc-container">
    <div class="download-header">
      <div>
        <strong style="font-size: 13px; color: #b81d24;">PR. SEKAR ANOM</strong>
        <span style="font-size: 11px; color: #6c757d; margin-left: 8px;">Dokumen Cetak Resmi</span>
      </div>
      <button class="btn-print" onclick="window.print()">Cetak ke Printer</button>
    </div>
    <div id="print-content">
      ${bodyHtml}
    </div>
  </div>
  <script>
    // Auto-prompt print if opened in separate tab
    window.addEventListener('load', function() {
      // document ready
    });
  </script>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
