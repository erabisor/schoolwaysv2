import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

/* ── Paleta ── */
const C = {
  primary: [37, 99, 235],
  dark: [15, 23, 42],
  muted: [100, 116, 139],
  light: [248, 250, 252],
  white: [255, 255, 255],
};

const MX = 14;           // margen horizontal
const PW = 210;           // ancho A4
const CW = PW - MX * 2;  // ancho útil

/* ── Crear instancia ── */
export const crearPDF = () => new jsPDF({ unit: 'mm', format: 'a4' });

/* ── Header azul ── */
export const agregarHeader = (doc, { titulo, fechaInicio, fechaFin }) => {
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, PW, 30, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...C.white);
  doc.text('SchoolWaySV', MX, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(titulo, MX, 20);

  doc.setFontSize(8);
  if (fechaInicio && fechaFin) {
    doc.text(`Período: ${fechaInicio}  —  ${fechaFin}`, PW - MX, 12, { align: 'right' });
  }
  doc.text(`Generado: ${new Date().toLocaleString('es-SV')}`, PW - MX, 20, { align: 'right' });

  return 36;
};

/* ── KPIs ── */
export const agregarKPIs = (doc, y, kpis = []) => {
  if (!kpis.length) return y;

  const gap = 4;
  const cardW = (CW - (kpis.length - 1) * gap) / kpis.length;
  const cardH = 18;

  kpis.forEach((kpi, i) => {
    const x = MX + i * (cardW + gap);

    doc.setFillColor(...C.light);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...(kpi.color || C.dark));
    doc.text(String(kpi.value ?? 0), x + cardW / 2, y + 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(kpi.label, x + cardW / 2, y + 14, { align: 'center' });
  });

  return y + cardH + 6;
};

/* ── Gráfica (captura DOM) ── */
export const agregarGrafica = async (doc, y, chartRef, maxAlto = 70) => {
  if (!chartRef?.current) return y;

  try {
    const canvas = await html2canvas(chartRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const ratio = canvas.height / canvas.width;
    const imgW = CW;
    const imgH = Math.min(imgW * ratio, maxAlto);

    if (y + imgH > 280) {
      doc.addPage();
      y = 14;
    }

    doc.addImage(imgData, 'PNG', MX, y, imgW, imgH);
    return y + imgH + 6;
  } catch (err) {
    console.warn('[PDF] Error al capturar gráfica:', err.message);
    return y;
  }
};

/* ── Título de sección ── */
export const agregarTitulo = (doc, y, texto) => {
  if (y > 270) { doc.addPage(); y = 14; }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...C.dark);
  doc.text(texto, MX, y);

  return y + 6;
};

/* ── Tabla ── */
export const agregarTabla = (doc, y, { columnas = [], filas = [] }) => {
  if (!filas.length) return y;
  if (y > 250) { doc.addPage(); y = 14; }

  autoTable(doc, {
    startY: y,
    margin: { left: MX, right: MX },
    head: [columnas.map((c) => c.label)],
    body: filas.map((row) =>
      columnas.map((c) => (c.render ? c.render(row) : row[c.key] ?? '—'))
    ),
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: C.primary,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  return doc.lastAutoTable.finalY + 6;
};

/* ── Footer con paginación ── */
export const guardarPDF = (doc, filename) => {
  const total = doc.internal.getNumberOfPages();

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(`SchoolWaySV  —  Página ${i} de ${total}`, PW / 2, 290, { align: 'center' });
  }

  doc.save(filename);
};