import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const MONEDAS = ['USD', 'COP', 'VES'];

function etiquetaMoneda(m) {
  return m === 'VES' ? 'Bs' : m;
}

const TIPOS_SALIDA = [
  { valor: 'pago_factura', etiqueta: 'Pago de factura' },
  { valor: 'pago_empleado', etiqueta: 'Pago a empleado' },
  { valor: 'retiro', etiqueta: 'Retiro' }
];

const ETIQUETAS_TIPO = {
  deposito_cierre: 'Depósito de cierre',
  ingreso: 'Ingreso',
  pago_factura: 'Pago de factura',
  pago_empleado: 'Pago a empleado',
  retiro: 'Retiro'
};

const TIPOS_ENTRADA = ['deposito_cierre', 'ingreso'];

function esEntrada(tipo) {
  return TIPOS_ENTRADA.includes(tipo);
}

function Financiero() {
  const [saldos, setSaldos] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [filtroMoneda, setFiltroMoneda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [tipoInicial, setTipoInicial] = useState('pago_factura');

  const POR_PAGINA = 15;

  const usuario = JSON.parse(localStorage.getItem('cerveloza_usuario') || 'null');
  const esAdmin = usuario?.rol === 'admin';

  useEffect(() => {
    cargarSaldos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarMovimientos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, filtroMoneda, filtroTipo]);

  async function cargarSaldos() {
    try {
      const respuesta = await api.get('/financiero/saldos');
      setSaldos(respuesta.data);
    } catch (error) {
      toast.error('No se pudieron cargar los saldos del financiero');
    }
  }

  async function cargarMovimientos() {
    setCargando(true);
    try {
      const params = { pagina, por_pagina: POR_PAGINA };
      if (filtroMoneda) params.moneda = filtroMoneda;
      if (filtroTipo) params.tipo = filtroTipo;

      const respuesta = await api.get('/financiero/movimientos', { params });
      setMovimientos(respuesta.data.movimientos);
      setTotal(respuesta.data.total);
    } catch (error) {
      toast.error('No se pudieron cargar los movimientos');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal(tipo) {
    setTipoInicial(tipo);
    setMostrarModal(true);
  }

  function alGuardar() {
    setMostrarModal(false);
    setPagina(1);
    cargarSaldos();
    cargarMovimientos();
  }

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 'var(--espacio-lg)',
          flexWrap: 'wrap',
          gap: 'var(--espacio-sm)'
        }}
      >
        <h1 className="texto-display" style={{ fontSize: '22px' }}>Financiero</h1>
        <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>
          Tesorería · el efectivo de cada cierre de caja entra acá
        </span>
      </div>

      {/* ===== Saldos disponibles por moneda ===== */}
      <div
        className="grid-kpi"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--espacio-md)', marginBottom: 'var(--espacio-lg)' }}
      >
        {MONEDAS.map((m) => {
          const datos = saldos?.[m];
          return (
            <div key={m} className="superficie" style={{ padding: 'var(--espacio-lg)' }}>
              <div style={{ fontSize: '12px', color: 'var(--gris-concreto)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Disponible {etiquetaMoneda(m)}
              </div>
              <div className="texto-display cifra-dinero" style={{ fontSize: '26px', marginTop: '4px', textAlign: 'left' }}>
                {datos ? datos.saldo.toFixed(2) : '—'}
              </div>
              {datos && (
                <div style={{ fontSize: '12px', color: 'var(--gris-concreto)', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Entradas</span>
                    <span className="cifra-dinero">{datos.entradas.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Salidas</span>
                    <span className="cifra-dinero">{datos.salidas.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== Acciones ===== */}
      <div style={{ display: 'flex', gap: 'var(--espacio-sm)', flexWrap: 'wrap', marginBottom: 'var(--espacio-lg)' }}>
        {esAdmin ? (
          <>
            {TIPOS_SALIDA.map((t) => (
              <button
                key={t.valor}
                onClick={() => abrirModal(t.valor)}
                style={{ ...estiloBotonSecundario, borderColor: 'var(--rojo-cerveloza)', color: 'var(--rojo-cerveloza)' }}
              >
                − {t.etiqueta}
              </button>
            ))}
            <button onClick={() => abrirModal('ingreso')} style={estiloBotonSecundario}>+ Ingreso manual</button>
          </>
        ) : (
          <>
            <button onClick={() => abrirModal('ingreso')} style={estiloBotonSecundario}>+ Ingreso manual</button>
            <span style={{ fontSize: '12px', color: 'var(--gris-concreto)', alignSelf: 'center' }}>
              Los pagos y retiros solo los puede registrar un administrador.
            </span>
          </>
        )}
      </div>

      {/* ===== Historial ===== */}
      <div className="superficie" style={{ padding: 'var(--espacio-lg)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--espacio-md)',
            flexWrap: 'wrap',
            gap: 'var(--espacio-sm)'
          }}
        >
          <h2 className="texto-display" style={{ fontSize: '16px' }}>Movimientos</h2>
          <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
            <select
              value={filtroMoneda}
              onChange={(e) => { setFiltroMoneda(e.target.value); setPagina(1); }}
              style={estiloInput}
            >
              <option value="">Todas las monedas</option>
              {MONEDAS.map((m) => <option key={m} value={m}>{etiquetaMoneda(m)}</option>)}
            </select>
            <select
              value={filtroTipo}
              onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}
              style={estiloInput}
            >
              <option value="">Todos los tipos</option>
              {Object.entries(ETIQUETAS_TIPO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>{etiqueta}</option>
              ))}
            </select>
          </div>
        </div>

        {cargando && <p style={{ color: 'var(--gris-concreto)', fontSize: '13px' }}>Cargando...</p>}
        {!cargando && movimientos.length === 0 && (
          <p style={{ color: 'var(--gris-concreto)', fontSize: '13px' }}>No hay movimientos registrados todavía.</p>
        )}

        {!cargando && movimientos.length > 0 && (
          <>
            <div className="tabla-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--grafito)' }}>
                    <th style={estiloTh}>Fecha</th>
                    <th style={estiloTh}>Tipo</th>
                    <th style={estiloTh}>Concepto</th>
                    <th style={estiloTh}>Registró</th>
                    <th style={{ ...estiloTh, textAlign: 'right' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mv) => {
                    const entrada = esEntrada(mv.tipo);
                    const color = entrada ? '#2e7d32' : 'var(--rojo-cerveloza)';
                    return (
                      <tr key={mv.id} style={{ borderBottom: 'var(--borde-fino)' }}>
                        <td style={estiloTd}>
                          {new Date(mv.fecha).toLocaleDateString()}{' '}
                          <span style={{ color: 'var(--gris-concreto)', fontSize: '12px' }}>
                            {new Date(mv.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td style={estiloTd}>
                          <span style={{ fontSize: '10px', color, border: `1px solid ${color}`, borderRadius: '2px', padding: '0 4px' }}>
                            {ETIQUETAS_TIPO[mv.tipo] || mv.tipo}
                          </span>
                        </td>
                        <td style={estiloTd}>
                          {mv.concepto}
                          {mv.beneficiario && (
                            <span style={{ color: 'var(--gris-concreto)', fontSize: '12px' }}> · {mv.beneficiario}</span>
                          )}
                          {mv.referencia && (
                            <span style={{ color: 'var(--gris-concreto)', fontSize: '12px' }}> · Ref: {mv.referencia}</span>
                          )}
                        </td>
                        <td style={estiloTd}>{mv.usuario_nombre}</td>
                        <td className="cifra-dinero" style={{ ...estiloTd, color, fontWeight: 600 }}>
                          {entrada ? '+' : '-'}{Number(mv.monto).toFixed(2)} {etiquetaMoneda(mv.moneda)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--espacio-md)', marginTop: 'var(--espacio-md)' }}>
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  style={{ ...estiloBotonSecundario, opacity: pagina === 1 ? 0.4 : 1 }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>
                  Página {pagina} de {totalPaginas} · {total} movimiento{total !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  style={{ ...estiloBotonSecundario, opacity: pagina === totalPaginas ? 0.4 : 1 }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {mostrarModal && (
        <ModalMovimientoFinanciero
          tipoInicial={tipoInicial}
          esAdmin={esAdmin}
          saldos={saldos}
          onCerrar={() => setMostrarModal(false)}
          onGuardado={alGuardar}
        />
      )}
    </div>
  );
}

function ModalMovimientoFinanciero({ tipoInicial, esAdmin, saldos, onCerrar, onGuardado }) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [concepto, setConcepto] = useState('');
  const [beneficiario, setBeneficiario] = useState('');
  const [referencia, setReferencia] = useState('');
  const [moneda, setMoneda] = useState('COP');
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  const esSalida = tipo !== 'ingreso';
  const disponible = saldos?.[moneda]?.saldo ?? 0;
  const montoNumero = Number(monto || 0);
  const excedeSaldo = esSalida && montoNumero > disponible + 0.005;

  async function manejarSubmit(e) {
    e.preventDefault();
    if (!concepto.trim() || !monto) {
      toast.error('Completá el concepto y el monto');
      return;
    }
    if (excedeSaldo) {
      toast.error(`No hay saldo suficiente en ${etiquetaMoneda(moneda)}`);
      return;
    }

    setGuardando(true);
    try {
      await api.post('/financiero/movimiento', {
        tipo,
        concepto: concepto.trim(),
        moneda,
        monto: montoNumero,
        beneficiario: beneficiario.trim() || null,
        referencia: referencia.trim() || null,
        nota: nota.trim() || null
      });
      toast.success('Movimiento registrado');
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo registrar el movimiento');
    } finally {
      setGuardando(false);
    }
  }

  const opcionesTipo = esAdmin ? [...TIPOS_SALIDA, { valor: 'ingreso', etiqueta: 'Ingreso manual' }] : [{ valor: 'ingreso', etiqueta: 'Ingreso manual' }];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(26, 26, 26, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, padding: 'var(--espacio-md)'
      }}
      onClick={onCerrar}
    >
      <form
        onSubmit={manejarSubmit}
        className="superficie"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '420px', padding: 'var(--espacio-lg)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <h2 className="texto-display" style={{ fontSize: '17px', marginBottom: 'var(--espacio-md)' }}>
          Registrar movimiento
        </h2>

        <label style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>Tipo</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ ...estiloInput, width: '100%', marginBottom: 'var(--espacio-md)' }}>
          {opcionesTipo.map((t) => (
            <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
          ))}
        </select>

        <label style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>Concepto</label>
        <input
          placeholder={tipo === 'pago_empleado' ? 'Ej: quincena de septiembre' : 'Ej: factura de proveedor de hielo'}
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          style={{ ...estiloInput, width: '100%', marginBottom: 'var(--espacio-md)' }}
        />

        {tipo !== 'ingreso' && (
          <>
            <label style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>
              {tipo === 'pago_empleado' ? 'Empleado' : 'Beneficiario'} (opcional)
            </label>
            <input
              value={beneficiario}
              onChange={(e) => setBeneficiario(e.target.value)}
              style={{ ...estiloInput, width: '100%', marginBottom: 'var(--espacio-md)' }}
            />
          </>
        )}

        <label style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>Monto</label>
        <div style={{ display: 'flex', gap: 'var(--espacio-sm)', marginBottom: '4px' }}>
          <select value={moneda} onChange={(e) => setMoneda(e.target.value)} style={{ ...estiloInput, flex: '0 0 90px' }}>
            {MONEDAS.map((m) => <option key={m} value={m}>{etiquetaMoneda(m)}</option>)}
          </select>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={monto}
            onChange={(e) => setMonto(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))}
            style={{ ...estiloInput, flex: 1 }}
          />
        </div>

        {esSalida && (
          <p style={{ fontSize: '12px', color: excedeSaldo ? 'var(--rojo-cerveloza)' : 'var(--gris-concreto)', marginBottom: 'var(--espacio-md)', fontWeight: excedeSaldo ? 700 : 400 }}>
            Disponible en {etiquetaMoneda(moneda)}: {disponible.toFixed(2)}
            {excedeSaldo && ' — el monto supera el saldo'}
          </p>
        )}

        <label style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>Referencia (opcional)</label>
        <input
          placeholder="N° de factura, transferencia, etc."
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          style={{ ...estiloInput, width: '100%', marginBottom: 'var(--espacio-md)' }}
        />

        <label style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>Nota (opcional)</label>
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
          style={{ ...estiloInput, width: '100%', marginBottom: 'var(--espacio-lg)', resize: 'vertical' }}
        />

        <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
          <button type="button" onClick={onCerrar} style={{ ...estiloBotonSecundario, flex: 1 }}>Cancelar</button>
          <button
            type="submit"
            disabled={guardando || excedeSaldo}
            style={{ ...estiloBotonPrimario, flex: 1, justifyContent: 'center', opacity: guardando || excedeSaldo ? 0.5 : 1 }}
          >
            {guardando ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  );
}

const estiloInput = {
  padding: '8px 10px',
  border: 'var(--borde-fino)',
  borderRadius: '2px',
  fontFamily: 'var(--fuente-base)',
  fontSize: '14px',
  boxSizing: 'border-box'
};
const estiloTh = {
  textAlign: 'left',
  padding: 'var(--espacio-sm)',
  fontSize: '12px',
  color: 'var(--gris-concreto)'
};
const estiloTd = {
  padding: 'var(--espacio-sm)',
  fontSize: '14px'
};
const estiloBotonPrimario = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 16px',
  backgroundColor: 'var(--rojo-cerveloza)',
  color: 'var(--blanco-hueso)',
  border: 'none',
  borderRadius: '2px',
  fontFamily: 'var(--fuente-base)',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer'
};
const estiloBotonSecundario = {
  padding: '10px 16px',
  backgroundColor: 'transparent',
  border: 'var(--borde-fino)',
  borderRadius: '2px',
  fontFamily: 'var(--fuente-base)',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer'
};

export default Financiero;