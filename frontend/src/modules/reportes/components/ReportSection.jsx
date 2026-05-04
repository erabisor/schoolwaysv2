import React from 'react';
import { Download } from 'lucide-react';
import { exportCSV } from '../reportes.utils';

const ReportSection = ({ title, description, filename, exportRows = [], children }) => (
  <section className="table-card" style={{ padding: '18px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
      <div>
        <h3 style={{ fontWeight: '900', color: '#0f172a' }}>{title}</h3>
        {description && <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>{description}</p>}
      </div>
      <button type="button" className="btn-secondary" onClick={() => exportCSV(filename, exportRows)} disabled={!exportRows.length}>
        <Download size={17} color="var(--primary)" />
        Exportar CSV
      </button>
    </div>
    {children}
  </section>
);

export default ReportSection;
