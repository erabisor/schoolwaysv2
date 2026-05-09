import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const FilterSearchSelect = ({
  value = '',
  options = [],
  placeholder = 'Todos',
  searchPlaceholder = 'Buscar...',
  getKey,
  getLabel,
  onChange,
}) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  /* Valores seleccionados como array */
  const seleccionados = value ? String(value).split(',').filter(Boolean) : [];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (abierto && inputRef.current) inputRef.current.focus();
  }, [abierto]);

  const opcionesFiltradas = options.filter((opt) =>
    getLabel(opt).toLowerCase().includes(busqueda.toLowerCase())
  );

  const toggleOpcion = (opt) => {
    const key = String(getKey(opt));
    let nuevos;
    if (seleccionados.includes(key)) {
      nuevos = seleccionados.filter((k) => k !== key);
    } else {
      nuevos = [...seleccionados, key];
    }
    onChange(nuevos.join(','));
  };

  const quitarChip = (key, e) => {
    e.stopPropagation();
    const nuevos = seleccionados.filter((k) => k !== key);
    onChange(nuevos.join(','));
  };

  const limpiarTodo = (e) => {
    e.stopPropagation();
    onChange('');
    setBusqueda('');
  };

  /* Labels de los seleccionados */
  const chips = seleccionados.map((key) => {
    const opt = options.find((o) => String(getKey(o)) === key);
    return { key, label: opt ? getLabel(opt) : key };
  });

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setAbierto(!abierto); setBusqueda(''); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 12px',
          height: '36px',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '700',
          color: '#0f172a',
          minWidth: '200px',
          maxWidth: '320px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flex: 1,
          overflow: 'hidden',
          flexWrap: 'wrap',
        }}>
          {chips.length === 0 ? (
            <span style={{ color: '#94a3b8', fontWeight: '600', whiteSpace: 'nowrap' }}>{placeholder}</span>
          ) : chips.length <= 2 ? (
            chips.map((c) => (
              <span key={c.key} style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: '#eff6ff', color: '#2563eb', borderRadius: '6px',
                padding: '2px 8px', fontSize: '12px', fontWeight: '700',
                whiteSpace: 'nowrap', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {c.label}
                <X size={12} onClick={(e) => quitarChip(c.key, e)} style={{ cursor: 'pointer', flexShrink: 0 }} />
              </span>
            ))
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              background: '#eff6ff', color: '#2563eb', borderRadius: '6px',
              padding: '2px 8px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap',
            }}>
              {chips.length} seleccionados
            </span>
          )}
        </div>

        {chips.length > 0 ? (
          <X size={14} color="#94a3b8" onClick={limpiarTodo} style={{ flexShrink: 0, cursor: 'pointer' }} />
        ) : (
          <ChevronDown size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
        )}
      </button>

      {/* Dropdown */}
      {abierto && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          minWidth: '220px',
          width: 'max-content',
          maxWidth: '340px',
          background: 'white',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 50,
          overflow: 'hidden',
        }}>
          {/* Búsqueda */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', borderBottom: '1px solid #f1f5f9',
          }}>
            <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                border: 'none', outline: 'none', fontSize: '13px',
                fontWeight: '600', width: '100%', color: '#0f172a',
              }}
            />
            {seleccionados.length > 0 && (
              <span style={{
                fontSize: '11px', fontWeight: '700', color: '#2563eb',
                background: '#eff6ff', borderRadius: '999px', padding: '1px 7px',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {seleccionados.length}
              </span>
            )}
          </div>

          {/* Seleccionar/Limpiar todo */}
          {options.length > 3 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', padding: '6px 12px',
              borderBottom: '1px solid #f1f5f9', fontSize: '11px', fontWeight: '700',
            }}>
              <span
                onClick={() => { onChange(opcionesFiltradas.map((o) => String(getKey(o))).join(',')); }}
                style={{ color: '#2563eb', cursor: 'pointer' }}
              >
                Seleccionar todo
              </span>
              <span
                onClick={() => onChange('')}
                style={{ color: '#94a3b8', cursor: 'pointer' }}
              >
                Limpiar
              </span>
            </div>
          )}

          {/* Lista */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {opcionesFiltradas.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                Sin resultados
              </div>
            ) : (
              opcionesFiltradas.map((opt) => {
                const key = String(getKey(opt));
                const activo = seleccionados.includes(key);
                return (
                  <div
                    key={key}
                    onClick={() => toggleOpcion(opt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '7px 12px', fontSize: '13px', fontWeight: activo ? '800' : '600',
                      color: activo ? '#2563eb' : '#334155',
                      background: activo ? '#eff6ff' : 'transparent',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { if (!activo) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = activo ? '#eff6ff' : 'transparent'; }}
                  >
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                      border: activo ? '2px solid #2563eb' : '2px solid #cbd5e1',
                      background: activo ? '#2563eb' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {activo && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getLabel(opt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSearchSelect;