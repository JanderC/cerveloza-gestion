import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

function Tasas() {
  const [tasaActual, setTasaActual] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [formManual, setFormManual] = useState({ usd_ves: '', usd_cop: '' });
  const [guardandoManual, setGuardandoManual] = useState(false);
  const [editandoVesCop, setEditandoVesCop] = useState(false);
  const [valorVesCop, setValorVesCop] = useState('');
  const [guardandoVesCop, setGuardandoVesCop] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    try {
      const [respActual, respHistorial] = await Promise.all([
        api.get('/tasas/actual').catch(() => ({ data: null })),
        api.get('/tasas/historial')
      ]);
      setTasaActual(respActual.data);
      setHistorial(respHistorial.data);
    } catch (error) {
      toast.error('No se pudo cargar la información de tasas');
    } finally {
      setCargando(false);
    }
  }

  async function actualizarAutomatica() {
    setActualizando(true);
    try {
      await api.post('/tasas/actualizar');
      toast.success('Tasa actualizada desde BCV / dolarapi');
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar la tasa automáticamente');
    } finally {
      setActualizando(false);
    }
  }

  async function registrarManual(e) {
    e.preventDefault();
    setGuardandoManual(true);
    try {
      await api.post('/tasas/manual', {
        usd_ves: Number(formManual.usd_ves),
        usd_cop: Number(formManual.usd_cop)
      });
      toast.success('Tasa manual registrada');
      setFormManual({ usd_ves: '', usd_cop: '' });
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo registrar la tasa manual');
    } finally {
      setGuardandoManual(false);
    }
  }

  async function guardarVesCop() {
    if (!valorVesCop || isNaN(Number(valorVesCop))) {
      toast.error('Ingresa un número válido');
      return;
    }

    setGuardandoVesCop(true);
    try {
      await api.patch('/tasas/actual/ves-cop', { ves_cop: Number(valorVesCop) });
      toast.success('Tasa VES/COP actualizada');
      setEditandoVesCop(false);
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar');
    } finally {
      setGuardandoVesCop(false);
    }
  }

  async function restablecerAutomatico() {
    if (!window.confirm('¿Volver a calcular VES/COP automáticamente con la tasa actual?')) return;

    try {
      await api.patch('/tasas/actual/ves-cop/restablecer');
      toast.success('VES/COP vuelve a calcularse automáticamente');
      cargarDatos();
    } catch (error) {
      toast.error('No se pudo restablecer');
    }
  }

  return (
    <div>
      <h1 className="texto-display" style={{ fontSize: '22px', marginBottom: 'var(--espacio-lg)' }}>
        Tasas de cambio
      </h1>

      {cargando && <p style={{ color: 'var(--gris-concreto)' }}>Cargando...</p>}

      {!cargando && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacio-xl)' }}>
          {/* Columna izquierda: tasa vigente + botón de actualización automática */}
          <div>
            <h2 className="texto-display" style={{ fontSize: '16px', marginBottom: 'var(--espacio-sm)' }}>
              Tasa vigente
            </h2>

            {!tasaActual && (
              <p style={{ color: 'var(--rojo-cerveloza)', fontSize: '14px' }}>
                No hay ninguna tasa registrada todavía. Las ventas no funcionarán hasta que registres una.
              </p>
            )}

            {tasaActual && (
              <div
                style={{
                  borderTop: '3px solid var(--grafito)',
                  paddingTop: 'var(--espacio-md)',
                  marginBottom: 'var(--espacio-lg)'
                }}
              >
                <FilaTasa etiqueta="1 USD = ___ VES" valor={Number(tasaActual.usd_ves).toFixed(4)} />
                <FilaTasa etiqueta="1 USD = ___ COP" valor={Number(tasaActual.usd_cop).toFixed(4)} />

                {/* Fila editable de VES/COP */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--espacio-xs)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>1 VES = ___ COP</span>

                  {!editandoVesCop ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacio-sm)' }}>
                      <span className="texto-display cifra-dinero" style={{ fontSize: '16px' }}>
                        {Number(tasaActual.ves_cop).toFixed(4)}
                      </span>
                      <button
                        onClick={() => {
                          setValorVesCop(Number(tasaActual.ves_cop).toFixed(4));
                          setEditandoVesCop(true);
                        }}
                        style={estiloBotonEditar}
                      >
                        Editar
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="0.0001"
                        value={valorVesCop}
                        onChange={(e) => setValorVesCop(e.target.value)}
                        style={{
                          width: '90px',
                          padding: '4px 6px',
                          border: 'var(--borde-fino)',
                          borderRadius: '2px',
                          fontFamily: 'var(--fuente-base)',
                          fontSize: '13px',
                          textAlign: 'right'
                        }}
                      />
                      <button onClick={guardarVesCop} disabled={guardandoVesCop} style={estiloBotonEditar}>
                        {guardandoVesCop ? '...' : 'Guardar'}
                      </button>
                      <button onClick={() => setEditandoVesCop(false)} style={{ ...estiloBotonEditar, color: 'var(--gris-concreto)' }}>
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                {tasaActual.ves_cop_manual && (
                  <p style={{ fontSize: '14px', color: 'var(--rojo-cerveloza)', margin: '4px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>🔒 Valor fijado manualmente</span>
                    <button onClick={restablecerAutomatico} style={{ ...estiloBotonEditar, fontSize: '11px' }}>
                      Restablecer
                    </button>
                  </p>
                )}

                <p style={{ fontSize: '14px', color: 'var(--gris-concreto)', marginTop: 'var(--espacio-sm)' }}>
                  Fuente: {tasaActual.fuente} · {new Date(tasaActual.fecha).toLocaleDateString()}
                </p>
              </div>
            )}

            <button onClick={actualizarAutomatica} disabled={actualizando} style={estiloBotonPrimario}>
              {actualizando ? 'Consultando BCV...' : 'Actualizar ahora (BCV / dolarapi)'}
            </button>
            <p style={{ fontSize: '14px', color: 'var(--gris-concreto)', marginTop: 'var(--espacio-sm)' }}>
              También se actualiza automáticamente todos los días a las 8:00 AM.
            </p>
          </div>

          {/* Columna derecha: registrar tasa manual */}
          <div className="superficie" style={{ padding: 'var(--espacio-lg)', alignSelf: 'start' }}>
            <h2 className="texto-display" style={{ fontSize: '16px', marginBottom: 'var(--espacio-md)' }}>
              Registrar tasa manual
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-md)' }}>
              Úsalo si necesitas forzar un valor distinto al de la fuente automática.
            </p>

            <form onSubmit={registrarManual}>
              <CampoTexto
                etiqueta="1 USD = ___ VES"
                valor={formManual.usd_ves}
                onCambiar={(v) => setFormManual((prev) => ({ ...prev, usd_ves: v }))}
                requerido
              />
              <CampoTexto
                etiqueta="1 USD = ___ COP"
                valor={formManual.usd_cop}
                onCambiar={(v) => setFormManual((prev) => ({ ...prev, usd_cop: v }))}
                requerido
              />
              <button type="submit" disabled={guardandoManual} style={{ ...estiloBotonPrimario, width: '100%' }}>
                {guardandoManual ? 'Guardando...' : 'Registrar tasa manual'}
              </button>
            </form>
          </div>

          {/* Historial */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2 className="texto-display" style={{ fontSize: '16px', marginBottom: 'var(--espacio-sm)' }}>
              Historial reciente
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--grafito)' }}>
                  <th style={estiloTh}>Fecha</th>
                  <th style={{ ...estiloTh, textAlign: 'right' }}>USD/VES</th>
                  <th style={{ ...estiloTh, textAlign: 'right' }}>USD/COP</th>
                  <th style={{ ...estiloTh, textAlign: 'right' }}>VES/COP</th>
                  <th style={estiloTh}>Fuente</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((t) => (
                  <tr key={t.id} style={{ borderBottom: 'var(--borde-fino)' }}>
                    <td style={estiloTd}>{new Date(t.fecha).toLocaleDateString()}</td>
                    <td className="cifra-dinero" style={estiloTd}>{Number(t.usd_ves).toFixed(4)}</td>
                    <td className="cifra-dinero" style={estiloTd}>{Number(t.usd_cop).toFixed(4)}</td>
                    <td className="cifra-dinero" style={estiloTd}>
                      {Number(t.ves_cop).toFixed(4)} {t.ves_cop_manual && '🔒'}
                    </td>
                    <td style={estiloTd}>{t.fuente}</td>
                  </tr>
                ))}
                {historial.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ ...estiloTd, color: 'var(--gris-concreto)' }}>
                      Sin historial todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FilaTasa({ etiqueta, valor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--espacio-xs)' }}>
      <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>{etiqueta}</span>
      <span className="texto-display cifra-dinero" style={{ fontSize: '16px' }}>{valor}</span>
    </div>
  );
}

function CampoTexto({ etiqueta, valor, onCambiar, requerido }) {
  return (
    <div style={{ marginBottom: 'var(--espacio-md)' }}>
      <label style={{ display: 'block', fontSize: '13px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-xs)' }}>
        {etiqueta}
      </label>
      <input
        type="number"
        step="0.0001"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        required={requerido}
        style={{
          width: '100%',
          padding: '8px 10px',
          border: 'var(--borde-fino)',
          borderRadius: '2px',
          fontFamily: 'var(--fuente-base)',
          fontSize: '14px',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
}

const estiloTh = {
  textAlign: 'left',
  padding: 'var(--espacio-sm)',
  fontSize: '14px',
  color: 'var(--gris-concreto)'
};

const estiloTd = {
  padding: 'var(--espacio-sm)',
  fontSize: '14px'
};

const estiloBotonPrimario = {
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

const estiloBotonEditar = {
  background: 'none',
  border: 'none',
  color: 'var(--rojo-cerveloza)',
  fontFamily: 'var(--fuente-base)',
  fontSize: '12px',
  cursor: 'pointer',
  textDecoration: 'underline',
  padding: 0
};

export default Tasas;