import React from 'react';

const DataTable = ({ rows = [], columns = [] }) => {
  if (!rows.length) {
    return <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '800' }}>No hay datos para mostrar.</div>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{columns.map(c => <th key={c.key} style={{ padding: '12px', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px' }}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>{columns.map(c => <td key={c.key} style={{ padding: '12px', borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>{c.render ? c.render(row) : row[c.key]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
