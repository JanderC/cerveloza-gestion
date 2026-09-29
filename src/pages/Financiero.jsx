import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiArrowDownLeft, FiArrowUpRight, FiCreditCard, FiDollarSign, FiSmartphone, FiRepeat } from 'react-icons/fi';
import api from '../api/axios';
import { obtenerFechaCaracas } from '../utils/fechaCaracas';

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

const SIMBOLO = { USD: '$', COP: 'COP', VES: 'Bs' };

const PERIODOS = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: 'semana', etiqueta: '7 días' },
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'todo', etiqueta: 'Todo' }
];

// Rango de fechas del periodo, siempre en hora de Venezuela (UTC-4)
function rangoPeriodo(periodo) {
  if (periodo === 'todo') return {};
  const hoy = obtenerFechaCaracas(new Date());
  let inicio = hoy;
  if (periodo === 'semana') {
    const d = new Date(`${hoy}T12:00:00-04:00`);
    d.setDate(d.getDate() - 6);
    inicio = obtenerFechaCaracas(d);
  }
  if (periodo === 'mes') inicio = `${hoy.slice(0, 8)}01`;
  return { desde: `${inicio}T00:00:00-04:00`, hasta: `${hoy}T23:59:59.999-04:00` };
}

function iconoMetodo(nombre, esEfectivo) {
  if (esEfectivo || /efectivo/i.test(nombre)) return FiDollarSign;
  if (/punto|pos|tarjeta|d[eé]bito/i.test(nombre)) return FiCreditCard;
  if (/m[oó]vil|nequi|daviplata/i.test(nombre)) return FiSmartphone;
  return FiRepeat;
}

function formatear(n) {
  return Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  const [periodoMetodos, setPeriodoMetodos] = useState('hoy');
  const [porMetodo, setPorMetodo] = useState(null);
  const [cargandoMetodos, setCargandoMetodos] = useState(true);
  const [tasa, setTasa] = useState(null);

  const POR_PAGINA = 15;

  const usuario = JSON.parse(localStorage.getItem('cerveloza_usuario') || 'null');
  const esAdmin = usuario?.rol === 'admin';

  useEffect(() => {
    cargarSaldos();
    api.get('/tasas/actual').then((r) => setTasa(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarPorMetodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoMetodos]);

  async function cargarPorMetodo() {
    setCargandoMetodos(true);
    try {
      const respuesta = await api.get('/financiero/por-metodo', { params: rangoPeriodo(periodoMetodos) });
      setPorMetodo(respuesta.data);
    } catch (error) {
      setPorMetodo(null);
    } finally {
      setCargandoMetodos(false);
    }
  }

  // Equivalente en USD solo para ordenar y dibujar la proporción de cada método
  function aUSD(monto, moneda) {
    if (moneda === 'USD') return Number(monto);
    if (!tasa) return 0;
    if (moneda === 'COP') return Number(monto) / Number(tasa.usd_cop);
    if (moneda === 'VES') {
      const usdVes = tasa.ves_cop_manual ? Number(tasa.usd_cop) / Number(tasa.ves_cop) : Number(tasa.usd_ves);
      return Number(monto) / usdVes;
    }
    return 0;
  }

  // Agrupa las filas (método + moneda) en una tarjeta por método
  const metodosAgrupados = Object.values(
    (porMetodo?.metodos || []).reduce((acc, fila) => {
      const clave = fila.metodo_id;
      if (!acc[clave]) {
        acc[clave] = { id: fila.metodo_id, nombre: fila.metodo, esEfectivo: fila.es_efectivo, monedas: {}, cantidad: 0, totalUSD: 0 };
      }
      acc[clave].monedas[fila.moneda] = (acc[clave].monedas[fila.moneda] || 0) + fila.total;
      acc[clave].cantidad += fila.cantidad;
      acc[clave].totalUSD += aUSD(fila.total, fila.moneda);
      return acc;
    }, {})
  ).sort((a, b) => b.totalUSD - a.totalUSD);

  const granTotalUSD = metodosAgrupados.reduce((acc, m) => acc + m.totalUSD, 0);
  const vueltos = (porMetodo?.vueltos || []).filter((v) => v.total > 0);

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
    cargarPorMetodo();
  }

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 'var(--espacio-lg)',
          flexWrap: 'wrap',
          gap: 'var(--espacio-md)'
        }}
      >
        <div>
          <h1 className="texto-display" style={{ fontSize: '22px' }}>Financiero</h1>
          <p style={{ fontSize: '14px', color: 'var(--gris-concreto)', margin: '6px 0 0' }}>
            Tesorería · el efectivo de cada cierre de caja entra acá
          </p>
        </div>

        {/* ===== Acciones ===== */}
        <div style={{ display: 'flex', gap: 'var(--espacio-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
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
              <button onClick={() => abrirModal('ingreso')} style={estiloBotonPrimario}>+ Ingreso manual</button>
            </>
          ) : (
            <>
              <span style={{ fontSize: '12px', color: 'var(--gris-concreto)', maxWidth: '260px' }}>
                Los pagos y retiros solo los puede registrar un administrador.
              </span>
              <button onClick={() => abrirModal('ingreso')} style={estiloBotonPrimario}>+ Ingreso manual</button>
            </>
          )}
        </div>
      </div>

      {/* ===== Saldos disponibles por moneda ===== */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--espacio-md)', marginBottom: 'var(--espacio-lg)' }}
      >
        {MONEDAS.map((m, i) => {
          const datos = saldos?.[m];
          const oscuro = i === 0;
          return (
            <div key={m} className={`kpi${oscuro ? ' kpi-oscuro' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="etiqueta-suave" style={oscuro ? { color: '#B3ADA4' } : undefined}>
                  Disponible en {etiquetaMoneda(m)}
                </span>
                <span className="chip" style={oscuro ? { background: 'rgba(255,255,255,0.1)', color: 'var(--blanco-hueso)' } : undefined}>
                  {m}
                </span>
              </div>
              <div className="texto-display cifra-dinero" style={{ fontSize: '30px', marginTop: '10px', textAlign: 'left', lineHeight: 1.1 }}>
                <span style={{ fontSize: '16px', opacity: 0.55, marginRight: '6px' }}>{SIMBOLO[m]}</span>
                {datos ? formatear(datos.saldo) : '—'}
              </div>
              {datos && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginTop: '16px',
                    paddingTop: '14px',
                    borderTop: oscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--linea)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: oscuro ? '#9A948B' : 'var(--gris-concreto)' }}>
                      <FiArrowDownLeft size={12} color="#3BB273" /> Entradas
                    </div>
                    <div className="cifra-dinero" style={{ textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>{formatear(datos.entradas)}</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: oscuro ? '#9A948B' : 'var(--gris-concreto)' }}>
                      <FiArrowUpRight size={12} color="#E5574C" /> Salidas
                    </div>
                    <div className="cifra-dinero" style={{ textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>{formatear(datos.salidas)}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== Dinero por método de pago ===== */}
      <div className="superficie" style={{ padding: 'var(--espacio-lg)', marginBottom: 'var(--espacio-lg)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 'var(--espacio-md)',
            marginBottom: 'var(--espacio-lg)'
          }}
        >
          <div>
            <h2 className="texto-display" style={{ fontSize: '17px' }}>Dinero por método de pago</h2>
            <p style={{ fontSize: '13px', color: 'var(--gris-concreto)', margin: '4px 0 0' }}>
              Lo cobrado en ventas y abonos de clientes, separado por método y moneda
              {tasa && granTotalUSD > 0 && (
                <> · total ≈ <strong style={{ color: 'var(--grafito)' }}>${formatear(granTotalUSD)}</strong></>
              )}
            </p>
          </div>

          <div
            style={{
              display: 'inline-flex',
              flexWrap: 'wrap',
              padding: '4px',
              gap: '2px',
              borderRadius: '12px',
              backgroundColor: 'var(--gris-humo)',
              border: '1px solid var(--linea)'
            }}
          >
            {PERIODOS.map((p) => (
              <button
                key={p.valor}
                onClick={() => setPeriodoMetodos(p.valor)}
                style={{
                  padding: '7px 14px',
                  border: 'none',
                  borderRadius: '9px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: periodoMetodos === p.valor ? 'var(--grafito)' : 'var(--gris-concreto)',
                  background: periodoMetodos === p.valor ? 'var(--superficie)' : 'none',
                  boxShadow: periodoMetodos === p.valor ? 'var(--sombra-sm)' : 'none'
                }}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {cargandoMetodos && !porMetodo && <p style={{ color: 'var(--gris-concreto)', fontSize: '13px' }}>Cargando...</p>}
        {!cargandoMetodos && !porMetodo && (
          <p style={{ color: 'var(--gris-concreto)', fontSize: '13px' }}>No se pudo cargar el desglose por método de pago.</p>
        )}
        {porMetodo && metodosAgrupados.length === 0 && (
          <p style={{ color: 'var(--gris-concreto)', fontSize: '13px' }}>No hay cobros registrados en este periodo.</p>
        )}

        {porMetodo && metodosAgrupados.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
              gap: 'var(--espacio-md)',
              opacity: cargandoMetodos ? 0.5 : 1,
              transition: 'opacity 160ms'
            }}
          >
            {metodosAgrupados.map((metodo) => {
              const Icono = iconoMetodo(metodo.nombre, metodo.esEfectivo);
              const porcentaje = granTotalUSD > 0 ? (metodo.totalUSD / granTotalUSD) * 100 : 0;
              return (
                <div
                  key={metodo.id}
                  style={{
                    border: '1px solid var(--linea)',
                    borderRadius: 'var(--radio-md)',
                    padding: '16px',
                    background: 'linear-gradient(180deg, var(--superficie) 0%, var(--superficie-2) 100%)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div className="kpi-icono" style={{ margin: 0, width: '36px', height: '36px', borderRadius: '10px' }}>
                      <Icono size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {metodo.nombre}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>
                        {metodo.cantidad} cobro{metodo.cantidad !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {tasa && granTotalUSD > 0 && <span className="chip">{porcentaje.toFixed(0)}%</span>}
                  </div>

                  {MONEDAS.filter((m) => metodo.monedas[m]).map((m) => (
                    <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 0' }}>
                      <span style={{ fontSize: '12px', color: 'var(--gris-concreto)', fontWeight: 600 }}>{etiquetaMoneda(m)}</span>
                      <span className="texto-display cifra-dinero" style={{ fontSize: '18px' }}>{formatear(metodo.monedas[m])}</span>
                    </div>
                  ))}

                  {tasa && granTotalUSD > 0 && (
                    <div style={{ height: '6px', borderRadius: '99px', backgroundColor: 'var(--gris-humo)', marginTop: '12px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.max(porcentaje, 2)}%`,
                          height: '100%',
                          borderRadius: '99px',
                          background: 'linear-gradient(90deg, var(--rojo-claro), var(--rojo-oscuro))',
                          transition: 'width 400ms ease'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {porMetodo && vueltos.length > 0 && (
          <p style={{ fontSize: '12px', color: 'var(--gris-concreto)', margin: 'var(--espacio-md) 0 0' }}>
            Vueltos entregados en el periodo (salen del efectivo):{' '}
            {vueltos.map((v, i) => (
              <span key={v.moneda}>
                {i > 0 && ' · '}
                <strong style={{ color: 'var(--rojo-cerveloza)' }}>−{formatear(v.total)} {etiquetaMoneda(v.moneda)}</strong>
              </span>
            ))}
          </p>
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
                  <tr style={{ borderBottom: '1px solid var(--linea)' }}>
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
                    const color = entrada ? 'var(--verde)' : 'var(--rojo-cerveloza)';
                    return (
                      <tr key={mv.id} style={{ borderBottom: 'var(--borde-fino)' }}>
                        <td style={estiloTd}>
                          {new Date(mv.fecha).toLocaleDateString()}{' '}
                          <span style={{ color: 'var(--gris-concreto)', fontSize: '12px' }}>
                            {new Date(mv.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td style={estiloTd}>
                          <span style={{ fontSize: '10px', color, border: `1px solid ${color}`, borderRadius: 'var(--radio-sm)', padding: '0 4px' }}>
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
  borderRadius: 'var(--radio-sm)',
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
  borderRadius: 'var(--radio-sm)',
  fontFamily: 'var(--fuente-base)',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer'
};
const estiloBotonSecundario = {
  padding: '10px 16px',
  backgroundColor: 'transparent',
  border: 'var(--borde-fino)',
  borderRadius: 'var(--radio-sm)',
  fontFamily: 'var(--fuente-base)',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer'
};

export default Financiero;