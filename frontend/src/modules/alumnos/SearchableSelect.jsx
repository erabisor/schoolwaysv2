import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const normalizarTexto = (valor) => {
  if (valor === undefined || valor === null) return '';
  return String(valor).toLowerCase();
};

const SearchableSelect = ({
  label,
  value,
  options = [],
  placeholder = 'Seleccione una opción',
  searchPlaceholder = 'Buscar...',
  getOptionValue,
  getOptionLabel,
  onChange,
  required = false,
  disabled = false,
  allowClear = true,
  emptyText = 'No hay opciones disponibles'
}) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const contenedorRef = useRef(null);

  const opcionSeleccionada = useMemo(() => {
    return options.find((option) => {
      const optionValue = getOptionValue(option);
      return String(optionValue) === String(value);
    });
  }, [options, value, getOptionValue]);

  const opcionesFiltradas = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    if (!texto) return options;

    return options.filter((option) =>
      normalizarTexto(getOptionLabel(option)).includes(texto)
    );
  }, [options, busqueda, getOptionLabel]);

  useEffect(() => {
    const handleClickFuera = (event) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
        setAbierto(false);
      }
    };

    document.addEventListener('mousedown', handleClickFuera);

    return () => {
      document.removeEventListener('mousedown', handleClickFuera);
    };
  }, []);

  const seleccionar = (option) => {
    onChange(getOptionValue(option));
    setBusqueda('');
    setAbierto(false);
  };

  const limpiar = (event) => {
    event.stopPropagation();
    onChange('');
    setBusqueda('');
  };

  return (
    <div ref={contenedorRef} style={{ position: 'relative' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            fontWeight: '800',
            fontSize: '13px',
            color: '#64748b'
          }}
        >
          {label}
          {required && <span style={{ color: '#dc2626' }}> *</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setAbierto((prev) => !prev)}
        style={{
          width: '100%',
          minHeight: '44px',
          border: '1px solid var(--border)',
          background: disabled ? '#f8fafc' : 'white',
          borderRadius: '12px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: opcionSeleccionada ? '#0f172a' : '#94a3b8',
          fontWeight: '600',
          textAlign: 'left'
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {opcionSeleccionada ? getOptionLabel(opcionSeleccionada) : placeholder}
        </span>

        {allowClear && value && !disabled && (
          <span
            role="button"
            tabIndex={0}
            onClick={limpiar}
            onKeyDown={(event) => {
              if (event.key === 'Enter') limpiar(event);
            }}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '999px',
              background: '#f1f5f9',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
            title="Limpiar selección"
          >
            <X size={14} />
          </span>
        )}

        <ChevronDown
          size={18}
          color="#64748b"
          style={{
            transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease'
          }}
        />
      </button>

      {abierto && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 3500,
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '10px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc'
            }}
          >
            <Search size={16} color="var(--text-muted)" />

            <input
              autoFocus
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder={searchPlaceholder}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                flex: 1,
                fontWeight: '600',
                color: '#0f172a'
              }}
            />
          </div>

          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {opcionesFiltradas.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  color: 'var(--text-muted)',
                  fontWeight: '700',
                  textAlign: 'center',
                  fontSize: '13px'
                }}
              >
                {emptyText}
              </div>
            ) : (
              opcionesFiltradas.map((option) => {
                const optionValue = getOptionValue(option);
                const selected = String(optionValue) === String(value);

                return (
                  <button
                    key={optionValue}
                    type="button"
                    onClick={() => seleccionar(option)}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: selected ? '#eff6ff' : 'white',
                      color: selected ? '#2563eb' : '#0f172a',
                      padding: '12px 14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontWeight: selected ? '800' : '600',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                  >
                    {getOptionLabel(option)}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
