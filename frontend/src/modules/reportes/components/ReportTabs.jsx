import React from 'react';
import { REPORT_TABS } from '../reportes.constants';

const ReportTabs = ({ active, onChange }) => (
  <div className="card" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '12px' }}>
    {REPORT_TABS.map((tab) => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onChange(tab.id)}
        style={{
          border: 'none',
          borderRadius: '999px',
          padding: '9px 14px',
          cursor: 'pointer',
          fontWeight: '800',
          background: active === tab.id ? 'var(--primary)' : '#f1f5f9',
          color: active === tab.id ? 'white' : '#334155'
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default ReportTabs;
