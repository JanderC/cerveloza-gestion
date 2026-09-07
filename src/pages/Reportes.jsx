import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import api from '../api/axios';

const COLORES_TORTA = ['#B4241C', '#8B877F', '#1A1A1A', '#D9D5CC', '#7A1812'];
const MONEDAS = ['USD', 'COP', 'VES'];
const POR_PAGINA = 5;

function Reportes() {
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [productosMenosVendidos, setProductosMenosVendidos] = useState([]);
  const [ventasPorMoneda, setVentasPorMoneda] = useState([]);
  const [ventasPorMetodo, setVentasPorMetodo] = useState([]);
  const [tasa, setTasa] = useState(null);
  const [monedaReporte, setMonedaReporte] = useState('USD');
  const [cargando, setCargando] = useState(true);
  const [rango, setRango] = useState({ desde: '', hasta: '' });
  const [pagina, setPagina] = useState(1);
  const [paginaMenos, setPaginaMenos] = useState(1);

  useEffect(() => {
    cargarReportes();
  }, []);

  async function cargarReportes(filtro = {}) {
    setCargando(true);
    setPagina(1);
    setPaginaMenos(1);
    try {
      const params = filtro.desde && filtro.hasta ? filtro : {};

   const [respMasVendidos, respMenosVendidos, respMoneda, respMetodo, respTasa] = await Promise.all([
  api.get('/reportes/productos-mas-vendidos', { params: { ...params, limite: 50, orden: 'desc' } }),
  api.get('/reportes/menor-rotacion', { params: { ...params, limite: 50 } }),
  api.get('/reportes/ventas-por-moneda', { params }),
  api.get('/reportes/ventas-por-metodo-pago', { params }),
  api.get('/tasas/actual')
]);

      setProductosMasVendidos(respMasVendidos.data);
      setProductosMenosVendidos(respMenosVendidos.data);
      setVentasPorMoneda(respMoneda.data);
      setVentasPorMetodo(respMetodo.data);
      setTasa(respTasa.data);
    } catch (error) {
      toast.error('No se pudieron cargar los reportes');
    } finally {
      setCargando(false);
    }
  }

  function convertirAMoneda(montoUSD, monedaDestino = monedaReporte) {
    const monto = Number(montoUSD);
    if (!tasa || monedaDestino === 'USD') return monto;
    if (monedaDestino === 'VES') {
      const usdVesEfectivo = tasa.ves_cop_manual ? Number(tasa.usd_cop) / Number(tasa.ves_cop) : Number(tasa.usd_ves);
      return monto * usdVesEfectivo;
    }
    if (monedaDestino === 'COP') return monto * Number(tasa.usd_cop);
    return monto;
  }

  function aplicarFiltro(e) {
    e.preventDefault();
    if (rango.desde && rango.hasta) {
      cargarReportes(rango);
    }
  }

  const kpis = useMemo(() => {
    const totalUnidades = productosMasVendidos.reduce((acc, p) => acc + Number(p.cantidad_total), 0);
    const productoTop = productosMasVendidos[0] || null;
    return { totalUnidades, productoTop };
  }, [productosMasVendidos]);

  const totalPaginas = Math.max(1, Math.ceil(productosMasVendidos.length / POR_PAGINA));
  const productosPagina = productosMasVendidos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const totalPaginasMenos = Math.max(1, Math.ceil(productosMenosVendidos.length / POR_PAGINA));
  const productosMenosPagina = productosMenosVendidos.slice((paginaMenos - 1) * POR_PAGINA, paginaMenos * POR_PAGINA);

  function descargarExcel() {
    const libro = XLSX.utils.book_new();

    const filasMas = productosMasVendidos.map((p) => ({
      Producto: p.nombre,
      Código: p.codigo,
      'Cantidad vendida': Number(p.cantidad_total),
      'Total exacto': Number(p.total_original).toFixed(2),
      Moneda: p.moneda
    }));
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filasMas), 'Más vendidos');

    const filasMenos = productosMenosVendidos.map((p) => ({
      Producto: p.nombre,
      Código: p.codigo,
      'Cantidad vendida': Number(p.cantidad_total),
      'Total exacto': Number(p.total_original).toFixed(2),
      Moneda: p.moneda
    }));
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filasMenos), 'Menor rotación');

    const nombreArchivo = rango.desde && rango.hasta
      ? `cerveloza-reporte-${rango.desde}-a-${rango.hasta}.xlsx`
      : `cerveloza-reporte-${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(libro, nombreArchivo);
  }

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
        <h1 className="texto-display" style={{ fontSize: '22px' }}>Reportes</h1>

        <div style={{ display: 'flex', gap: 'var(--espacio-lg)', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <label style={estiloLabelMoneda}>Ver tortas en</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {MONEDAS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMonedaReporte(m)}
                  style={{
                    padding: '8px 14px',
                    border: 'var(--borde-fino)',
                    borderColor: monedaReporte === m ? 'var(--rojo-cerveloza)' : 'var(--gris-concreto)',
                    backgroundColor: monedaReporte === m ? 'var(--rojo-cerveloza)' : 'transparent',
                    color: monedaReporte === m ? 'var(--blanco-hueso)' : 'var(--grafito)',
                    fontFamily: 'var(--fuente-base)',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    borderRadius: '2px'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button onClick={descargarExcel} disabled={productosMasVendidos.length === 0} style={estiloBotonPrimario}>
            Descargar Excel
          </button>
        </div>
      </div>

      <form
        onSubmit={aplicarFiltro}
        style={{ display: 'flex', gap: 'var(--espacio-sm)', alignItems: 'flex-end', marginBottom: 'var(--espacio-xl)' }}
      >
        <CampoFecha etiqueta="Desde" valor={rango.desde} onCambiar={(v) => setRango((prev) => ({ ...prev, desde: v }))} />
        <CampoFecha etiqueta="Hasta" valor={rango.hasta} onCambiar={(v) => setRango((prev) => ({ ...prev, hasta: v }))} />
        <button type="submit" style={estiloBotonPrimario}>Filtrar</button>
        {(rango.desde || rango.hasta) && (
          <button
            type="button"
            onClick={() => {
              setRango({ desde: '', hasta: '' });
              cargarReportes();
            }}
            style={estiloBotonSecundario}
          >
            Limpiar
          </button>
        )}
      </form>

      {cargando && <p style={{ color: 'var(--gris-concreto)' }}>Cargando reportes...</p>}

      {!cargando && (
        <>
          <div
          className="grid-kpi"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 0,
              marginBottom: 'var(--espacio-xl)'
            }}
          >
            {MONEDAS.map((m) => {
              const fila = ventasPorMoneda.find((v) => v.moneda === m);
              const monto = fila ? Number(fila.total_moneda) : 0;
              return (
                <div key={m} style={estiloKpi}>
                  <span style={estiloKpiEtiqueta}>Entró en {m}</span>
                  <span
                    className="texto-display cifra-dinero"
                    style={{ fontSize: '24px', display: 'block', color: monto > 0 ? 'var(--grafito)' : 'var(--gris-concreto)' }}
                  >
                    {monto.toFixed(2)}
                  </span>
                </div>
              );
            })}

            <div style={estiloKpi}>
              <span style={estiloKpiEtiqueta}>Unidades vendidas</span>
              <span className="texto-display cifra-dinero" style={{ fontSize: '24px', display: 'block' }}>
                {kpis.totalUnidades}
              </span>
            </div>

            <div style={estiloKpi}>
              <span style={estiloKpiEtiqueta}>Producto líder</span>
              {kpis.productoTop ? (
                <span className="texto-display" style={{ fontSize: '15px', display: 'block' }}>
                  {kpis.productoTop.nombre}
                </span>
              ) : (
                <span style={{ fontSize: '14px', color: 'var(--gris-concreto)' }}>Sin datos</span>
              )}
            </div>
          </div>

          <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacio-xl)', marginBottom: 'var(--espacio-xl)' }}>
            <BloqueTorta
              titulo="Ventas por moneda"
              datos={ventasPorMoneda.map((v) => ({ moneda: v.moneda, total_usd: convertirAMoneda(v.total_moneda, 'USD') }))}
              claveEtiqueta="moneda"
              claveValor="total_usd"
              moneda={monedaReporte}
              convertir={convertirAMoneda}
            />
            <BloqueTorta
              titulo="Ventas por método de pago"
              datos={ventasPorMetodo}
              claveEtiqueta="metodo"
              claveValor="total_usd"
              moneda={monedaReporte}
              convertir={convertirAMoneda}
            />
          </div>

          <RankingProductos
            titulo="Productos más vendidos"
            subtitulo="Ordenados de mayor a menor cantidad vendida"
            productos={productosPagina}
            totalProductos={productosMasVendidos.length}
            pagina={pagina}
            totalPaginas={totalPaginas}
            onCambiarPagina={setPagina}
            colorPosicion="var(--rojo-cerveloza)"
          />

          <div style={{ marginTop: 'var(--espacio-xl)' }}>
            <RankingProductos
              titulo="Menor rotación"
              subtitulo="Productos con menos unidades vendidas en el periodo — revisa si conviene bajar precio o dejar de reponer"
              productos={productosMenosPagina}
              totalProductos={productosMenosVendidos.length}
              pagina={paginaMenos}
              totalPaginas={totalPaginasMenos}
              onCambiarPagina={setPaginaMenos}
              colorPosicion="var(--gris-concreto)"
            />
          </div>
        </>
      )}
    </div>
  );
}

function RankingProductos({ titulo, subtitulo, productos, totalProductos, pagina, totalPaginas, onCambiarPagina, colorPosicion }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--espacio-sm)' }}>
        <h2 className="texto-display" style={{ fontSize: '16px' }}>{titulo}</h2>
        <span style={{ fontSize: '14px', color: 'var(--gris-concreto)' }}>
          {totalProductos} producto{totalProductos !== 1 ? 's' : ''}
        </span>
      </div>

      <p style={{ fontSize: '16px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-sm)' }}>
        {subtitulo}
      </p>

      {productos.length === 0 && (
        <p style={{ color: 'var(--gris-concreto)', fontSize: '14px' }}>No hay datos en este rango.</p>
      )}

      {productos.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--grafito)' }}>
              <th style={estiloTh}></th>
              <th style={estiloTh}>Producto</th>
              <th style={{ ...estiloTh, textAlign: 'right' }}>Cant.</th>
              <th style={{ ...estiloTh, textAlign: 'right' }}>Total exacto</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={`${p.id}-${p.moneda}`} style={{ borderBottom: 'var(--borde-fino)' }}>
                <td style={estiloTd}>
                  <span
                    className="texto-display"
                    style={{
                      width: '24px',
                      height: '24px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      color: 'var(--blanco-hueso)',
                      backgroundColor: colorPosicion
                    }}
                  >
                    {p.cantidad_total}
                  </span>
                </td>
                <td style={estiloTd}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{p.nombre}</p>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--gris-concreto)' }}>{p.codigo}</p>
                </td>
                <td className="cifra-dinero" style={estiloTd}>{p.cantidad_total}</td>
                <td className="cifra-dinero" style={estiloTd}>
                  {Number(p.total_original).toFixed(2)} {p.moneda}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--espacio-md)', marginTop: 'var(--espacio-md)' }}>
          <button
            onClick={() => onCambiarPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            style={{ ...estiloBotonSecundario, opacity: pagina === 1 ? 0.4 : 1 }}
          >
            Anterior
          </button>
          <span style={{ fontSize: '14px', color: 'var(--gris-concreto)' }}>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => onCambiarPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            style={{ ...estiloBotonSecundario, opacity: pagina === totalPaginas ? 0.4 : 1 }}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

function BloqueTorta({ titulo, datos, claveEtiqueta, claveValor, moneda, convertir }) {
  const datosFormateados = datos.map((d) => ({
    nombre: d[claveEtiqueta],
    valor: convertir(d[claveValor])
  }));

  return (
    <div>
      <h2 className="texto-display" style={{ fontSize: '16px', marginBottom: 'var(--espacio-sm)' }}>
        {titulo}
      </h2>
      {datosFormateados.length === 0 ? (
        <p style={{ color: 'var(--gris-concreto)', fontSize: '14px' }}>Sin datos en este rango.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={datosFormateados}
              dataKey="valor"
              nameKey="nombre"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              label={({ nombre, percent }) => `${nombre} ${(percent * 100).toFixed(0)}%`}
            >
              {datosFormateados.map((_, index) => (
                <Cell key={index} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(valor) => [`${Number(valor).toFixed(2)} ${moneda}`, '']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function CampoFecha({ etiqueta, valor, onCambiar }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '14px', color: 'var(--gris-concreto)', marginBottom: '4px' }}>
        {etiqueta}
      </label>
      <input
        type="date"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        style={{ padding: '8px 10px', border: 'var(--borde-fino)', borderRadius: '2px', fontFamily: 'var(--fuente-base)', fontSize: '14px' }}
      />
    </div>
  );
}

const estiloLabelMoneda = {
  display: 'block',
  fontSize: '14px',
  color: 'var(--gris-concreto)',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const estiloKpi = {
  borderTop: '3px solid var(--grafito)',
  borderRight: 'var(--borde-fino)',
  padding: 'var(--espacio-lg)'
};

const estiloKpiEtiqueta = {
  fontSize: '14px',
  color: 'var(--gris-concreto)',
  display: 'block',
  marginBottom: 'var(--espacio-sm)'
};

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
  padding: '9px 16px',
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
  padding: '9px 16px',
  backgroundColor: 'transparent',
  color: 'var(--grafito)',
  border: 'var(--borde-fino)',
  borderRadius: '2px',
  fontFamily: 'var(--fuente-base)',
  fontSize: '14px',
  cursor: 'pointer'
};

export default Reportes;