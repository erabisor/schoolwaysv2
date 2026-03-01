import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  paginaActual, totalPaginas, onPageChange, 
  registrosPorPagina, onRegistrosChange, totalRegistros 
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white', borderTop: '1px solid #f1f5f9', borderRadius: '0 0 16px 16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      
      {/* Selector de cantidad */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Mostrar:</span>
        <select 
          value={registrosPorPagina} 
          onChange={(e) => onRegistrosChange(e.target.value === 'Todos' ? 'Todos' : Number(e.target.value))}
          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value="Todos">Todos</option>
        </select>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
          de {totalRegistros} registros
        </span>
      </div>

      {/* Controles de navegación */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={() => onPageChange(paginaActual - 1)} 
          disabled={paginaActual === 1 || totalPaginas === 0}
          style={{ display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', background: paginaActual === 1 ? '#f8fafc' : 'white', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', color: paginaActual === 1 ? '#cbd5e1' : '#0f172a', transition: 'all 0.2s' }}
        >
          <ChevronLeft size={18} />
        </button>
        
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', padding: '0 8px' }}>
          Página {totalPaginas === 0 ? 0 : paginaActual} de {totalPaginas}
        </span>
        
        <button 
          onClick={() => onPageChange(paginaActual + 1)} 
          disabled={paginaActual === totalPaginas || totalPaginas === 0}
          style={{ display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', background: paginaActual === totalPaginas || totalPaginas === 0 ? '#f8fafc' : 'white', cursor: paginaActual === totalPaginas || totalPaginas === 0 ? 'not-allowed' : 'pointer', color: paginaActual === totalPaginas || totalPaginas === 0 ? '#cbd5e1' : '#0f172a', transition: 'all 0.2s' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;