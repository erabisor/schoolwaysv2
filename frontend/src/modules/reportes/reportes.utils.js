export const textoSeguro = (valor) => (valor === undefined || valor === null ? '' : String(valor));

export const formatDate = (valor) => {
  if (!valor) return '—';
  return new Date(valor).toLocaleDateString('es-SV');
};

export const formatDateTime = (valor) => {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'short' });
};

export const formatMoney = (valor) => {
  if (valor === undefined || valor === null || valor === '') return '—';
  return Number(valor).toLocaleString('es-SV', { style: 'currency', currency: 'USD' });
};

export const exportCSV = (filename, rows = []) => {
  if (!rows.length) return false;
  const headers = Object.keys(rows[0]);
  const csv = [headers, ...rows.map((row) => headers.map((h) => textoSeguro(row[h])))]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};
