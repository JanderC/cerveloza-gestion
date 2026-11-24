import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPrinter, FiRotateCcw, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import ReciboImprimible from '../components/ReciboImprimible';
import { imprimirDocumento } from '../utils/imprimir';
import {
  CONFIG_POR_DEFECTO,
  leerConfigImpresora,
  guardarConfigImpresora,
  variablesTicket
} from '../utils/configImpresora';

const PX_A_MM = 25.4 / 96;

const OPCIONES_LETRA = [
  { valor: 0.85, etiqueta: 'Pequeña' },
  { valor: 1, etiqueta: 'Normal' },
  { valor: 1.15, etiqueta: 'Grande' }
];

const OPCIONES_MODO = [
  {
    valor: 'exacto',
    etiqueta: 'Alto exacto del ticket',
    detalle: 'El sistema mide el ticket y pide una hoja de ese largo. Recomendado.'
  },
  {
    valor: 'impresora',
    etiqueta: 'Lo decide la impresora',
    detalle: 'Usa el tamaño de papel configurado en Windows. Útil si el driver tiene un papel tipo "Receipt".'
  }
];

const TICKET_PRUEBA = {
  numeroVenta: 'PRUEBA-001',
  fecha: new Date().toISOString(),
  cajero: 'Prueba de impresora',
  cliente: null,
  esFiado: false,
  items: [
    { nombre: 'Polar Pilsen botella', cantidad: 2, precioUnitario: 4000, subtotal: 8000 },
    { nombre: 'Platanero', cantidad: 1, precioUnitario: 5000, subtotal: 5000 },
    { nombre: 'Regla de ancho: 1234567890123456789012345', cantidad: 1, precioUnitario: 0, subtotal: 0 }
  ],
  pagos: [{ metodo: 'Efectivo', moneda: 'COP', monto: 13000 }],
  monedaVenta: 'COP',
  totalMonedaVenta: 13000,
  vuelto: null
};

function Impresora() {
  const [config, setConfig] = useState(leerConfigImpresora);
  const [altoMm, setAltoMm] = useState(null);
  const vistaRef = useRef(null);

  const vars = useMemo(() => variablesTicket(config), [config]);

  useLayoutEffect(() => {
    if (vistaRef.current) {
      setAltoMm(Math.ceil(vistaRef.current.getBoundingClientRect().height * PX_A_MM) + (Number(config.espacioFinal) || 0));
    }
  }, [config]);

  function cambiar(campo, valor) {
    setConfig((prev) => {
      const nueva = { ...prev, [campo]: valor };
      // Al cambiar el rollo se ajusta el ancho del ticket a uno que quepa
      if (campo === 'anchoPapel') nueva.anchoTicket = valor === 58 ? 52 : 80;
      if (!guardarConfigImpresora(nueva)) toast.error('No se pudo guardar la configuración en este navegador');
      return nueva;
    });
  }

  function restablecer() {
    guardarConfigImpresora(CONFIG_POR_DEFECTO);
    setConfig({ ...CONFIG_POR_DEFECTO });
    toast.success('Configuración restablecida');
  }

  const seSale = Number(config.anchoTicket) > Number(config.anchoPapel);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--espacio-lg)', flexWrap: 'wrap', gap: 'var(--espacio-md)' }}>
        <div>
          <h1 className="texto-display" style={{ fontSize: '22px' }}>Impresora</h1>
          <p style={{ fontSize: '14px', color: 'var(--gris-concreto)', margin: '6px 0 0' }}>
            Prueba y ajusta cómo salen los tickets · la configuración se guarda en este computador
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--espacio-sm)', flexWrap: 'wrap' }}>
          <button onClick={restablecer} style={estiloBotonSecundario}>
            <FiRotateCcw size={15} /> Restablecer
          </button>
          <button onClick={() => imprimirDocumento('ticket')} style={estiloBotonPrimario}>
            <FiPrinter size={16} /> Imprimir ticket de prueba
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'var(--espacio-lg)', alignItems: 'start' }}>
        {/* ===== Ajustes ===== */}
        <div style={estiloTarjeta}>
          <h2 className="texto-display" style={{ fontSize: '16px', margin: '0 0 var(--espacio-md)' }}>Ajustes</h2>

          <label style={estiloLabel}>Ancho del rollo de papel</label>
          <div style={estiloGrupo}>
            {[80, 58].map((a) => (
              <button key={a} type="button" onClick={() => cambiar('anchoPapel', a)} style={estiloOpcion(Number(config.anchoPapel) === a)}>
                {a} mm
              </button>
            ))}
          </div>

          <label style={estiloLabel}>Ancho del ticket: {config.anchoTicket} mm</label>
          <input
            type="range"
            min={40}
            max={Number(config.anchoPapel)}
            step={1}
            value={config.anchoTicket}
            onChange={(e) => cambiar('anchoTicket', Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--rojo-cerveloza)', marginBottom: '4px' }}
          />
          <p style={estiloAyuda}>
            Si el texto se corta por los lados, bájalo (en rollos de 80 mm suele funcionar 72 mm).
          </p>

          <label style={estiloLabel}>Tamaño de letra</label>
          <div style={estiloGrupo}>
            {OPCIONES_LETRA.map((o) => (
              <button key={o.valor} type="button" onClick={() => cambiar('escalaLetra', o.valor)} style={estiloOpcion(Number(config.escalaLetra) === o.valor)}>
                {o.etiqueta}
              </button>
            ))}
          </div>

          <label style={estiloLabel}>Largo de la hoja</label>
          <div style={{ display: 'grid', gap: '8px', marginBottom: 'var(--espacio-md)' }}>
            {OPCIONES_MODO.map((o) => {
              const activo = config.modoAlto === o.valor;
              return (
                <button
                  key={o.valor}
                  type="button"
                  onClick={() => cambiar('modoAlto', o.valor)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 'var(--radio-sm)',
                    border: `1px solid ${activo ? 'var(--rojo-cerveloza)' : 'var(--linea)'}`,
                    background: activo ? 'var(--rojo-suave)' : 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'var(--fuente-base)',
                    color: 'var(--grafito)'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{o.etiqueta}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gris-concreto)', marginTop: '2px' }}>{o.detalle}</div>
                </button>
              );
            })}
          </div>

          {config.modoAlto === 'exacto' && (
            <>
              <label style={estiloLabel}>Espacio en blanco al final: {config.espacioFinal} mm</label>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={config.espacioFinal}
                onChange={(e) => cambiar('espacioFinal', Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--rojo-cerveloza)', marginBottom: '4px' }}
              />
              <p style={estiloAyuda}>Súbelo si la cuchilla corta encima del "Gracias por su compra".</p>
            </>
          )}
        </div>

        {/* ===== Vista previa ===== */}
        <div style={estiloTarjeta}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--espacio-md)', gap: '8px', flexWrap: 'wrap' }}>
            <h2 className="texto-display" style={{ fontSize: '16px', margin: 0 }}>Vista previa</h2>
            <span className="chip">
              Hoja: {config.anchoPapel} mm × {config.modoAlto === 'exacto' ? `${altoMm ?? '…'} mm` : 'la de la impresora'}
            </span>
          </div>

          {seSale && (
            <div style={estiloAviso}>
              <FiAlertTriangle size={16} style={{ flexShrink: 0 }} /> El ticket es más ancho que el papel: se va a cortar.
            </div>
          )}

          <div style={{ background: 'var(--gris-humo)', borderRadius: 'var(--radio-sm)', padding: 'var(--espacio-md)', overflowX: 'auto' }}>
            <div
              style={{
                width: `${config.anchoPapel}mm`,
                margin: '0 auto',
                background: '#fff',
                boxShadow: 'var(--sombra-sm)',
                outline: '1px dashed var(--gris-concreto)'
              }}
            >
              <div ref={vistaRef} className="zona-impresion" style={vars}>
                <ReciboImprimible datos={TICKET_PRUEBA} />
              </div>
              {config.modoAlto === 'exacto' && <div style={{ height: `${config.espacioFinal}mm` }} />}
            </div>
          </div>
          <p style={{ ...estiloAyuda, marginTop: '8px', textAlign: 'center' }}>
            El borde punteado es el papel. Así se imprime cada ticket de venta y el reporte de cierre.
          </p>
        </div>
      </div>

      {/* ===== Guía ===== */}
      <div style={{ ...estiloTarjeta, marginTop: 'var(--espacio-lg)' }}>
        <h2 className="texto-display" style={{ fontSize: '16px', margin: '0 0 var(--espacio-md)' }}>
          ¿Sigue saliendo una hoja larga?
        </h2>
        <p style={{ fontSize: '14px', margin: '0 0 var(--espacio-md)', color: 'var(--grafito)' }}>
          Imprime el ticket de prueba después de cada paso. Si el ticket sale bien pero la impresora sigue
          sacando papel en blanco, el problema está en el driver de la impresora, no en el sistema.
        </p>
        <ol style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '12px', fontSize: '14px', lineHeight: 1.5 }}>
          <li>
            <strong>En la ventana de imprimir del navegador</strong> abre "Más opciones" y deja:
            Márgenes <em>Ninguno</em>, Escala <em>Predeterminada</em> y sin marcar "Encabezados y pies de página".
            Si aparece "Tamaño del papel", elige el más corto que diga 80 mm.
          </li>
          <li>
            <strong>En Windows:</strong> Configuración → Bluetooth y dispositivos → Impresoras y escáneres → la térmica →
            Preferencias de impresión. En "Papel" o "Tamaño", elige el que diga <em>Receipt</em>, <em>Roll paper</em> o
            <em> 80 x 297</em> (no el de 3276 mm). Si hay opciones como "Alimentar papel hasta el final de página" o
            "Paper feed", ponlas en <em>No</em>, y el corte en <em>Fin del documento</em>.
          </li>
          <li>
            Si el driver ya tiene un papel tipo <em>Receipt</em> que corta solo donde termina el texto, prueba arriba la
            opción <strong>"Lo decide la impresora"</strong>.
          </li>
          <li>
            Si el texto se corta por los lados, baja el <strong>ancho del ticket</strong>. Si queda muy grande o muy
            pequeño, cambia el <strong>tamaño de letra</strong>.
          </li>
        </ol>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'var(--espacio-md)', fontSize: '13px', color: 'var(--gris-concreto)' }}>
          <FiCheckCircle size={15} /> Los cambios se guardan solos y aplican a los tickets de venta y al reporte de cierre de este computador.
        </div>
      </div>
    </div>
  );
}

const estiloTarjeta = {
  background: 'var(--superficie)',
  border: '1px solid var(--linea)',
  borderRadius: 'var(--radio-lg)',
  boxShadow: 'var(--sombra-sm)',
  padding: '20px 22px',
  minWidth: 0
};
const estiloLabel = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  marginBottom: '6px',
  color: 'var(--grafito)'
};
const estiloAyuda = {
  fontSize: '12px',
  color: 'var(--gris-concreto)',
  margin: '0 0 var(--espacio-md)'
};
const estiloGrupo = { display: 'flex', gap: '6px', marginBottom: 'var(--espacio-md)', flexWrap: 'wrap' };
const estiloAviso = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  padding: '10px 12px',
  marginBottom: 'var(--espacio-md)',
  borderRadius: 'var(--radio-sm)',
  background: 'var(--rojo-suave)',
  color: 'var(--rojo-cerveloza)',
  fontSize: '13px',
  fontWeight: 600
};
const estiloOpcion = (activa) => ({
  flex: 1,
  minWidth: '80px',
  padding: '9px 10px',
  border: `1px solid ${activa ? 'var(--rojo-cerveloza)' : 'var(--linea)'}`,
  backgroundColor: activa ? 'var(--rojo-cerveloza)' : 'transparent',
  color: activa ? 'var(--blanco-hueso)' : 'var(--grafito)',
  fontFamily: 'var(--fuente-base)',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
  borderRadius: 'var(--radio-sm)'
});
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
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 16px',
  backgroundColor: 'transparent',
  border: 'var(--borde-fino)',
  borderRadius: 'var(--radio-sm)',
  fontFamily: 'var(--fuente-base)',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer'
};

export default Impresora;
