import React from 'react';

const KpiGrid = ({ items = [] }) => (
  <div className="stats-grid">
    {items.map((item) => (
      <div key={item.label} className="card">
        <p style={{ color: 'var(--text-muted)', fontWeight: '800', fontSize: '13px' }}>{item.label}</p>
        <h3 style={{ fontSize: '1.7rem', fontWeight: '900', color: item.color || '#0f172a' }}>{item.value ?? 0}</h3>
      </div>
    ))}
  </div>
);

export default KpiGrid;
