import type { Compra, Documento, Venta } from '../types';
import { bs, fechaHora, nombreCliente } from './format';

const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

/** Abre una ventana con el comprobante de venta o compra listo para imprimir. */
export function imprimirDocumento(tipo: 'venta' | 'compra', doc: Documento | null | undefined): void {
  if (!doc) return;
  const esVenta = tipo === 'venta';
  const contraparte = esVenta ? nombreCliente((doc as Venta).cliente) : (doc as Compra).proveedor?.nombreEmpresa;
  const pago = doc.pagos?.[0];
  const filas = (doc.detalles ?? [])
    .map(
      (d) => `<tr><td>${esc(d.producto?.nombre)}</td><td class="r">${d.cantidad}</td>
      <td class="r">${bs(d.precioUnitario)}</td><td class="r">${d.descuento > 0 ? bs(d.descuento) : '-'}</td>
      <td class="r">${bs(d.subtotal)}</td></tr>`,
    )
    .join('');
  const w = window.open('', '_blank', 'width=420,height=640');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esVenta ? 'Venta' : 'Compra'} #${doc.id}</title>
  <style>
    body{font-family:system-ui,Arial,sans-serif;font-size:12px;margin:14px;color:#111}
    h1{font-size:18px;margin:0;text-align:center;letter-spacing:.08em}
    .c{text-align:center;color:#555;margin-bottom:8px} table{width:100%;border-collapse:collapse;margin-top:8px}
    th,td{padding:3px 2px;border-bottom:1px dashed #bbb;text-align:left} .r{text-align:right}
    .tot td{border:none;font-weight:700} .anul{color:#b00020;text-align:center;font-weight:700;font-size:15px}
  </style></head><body>
  <h1>RODAPRO</h1><div class="c">Repuestos mecánicos · Sucre, Bolivia</div>
  ${!doc.estado ? '<div class="anul">*** ANULADO ***</div>' : ''}
  <div><b>${esVenta ? 'Comprobante de venta' : 'Comprobante de compra'} N° ${doc.id}</b></div>
  <div>Fecha: ${fechaHora(doc.fecha)}</div>
  <div>${esVenta ? 'Cliente' : 'Proveedor'}: ${esc(contraparte)}</div>
  <div>Atendió: ${esc(doc.usuario?.nombreCompleto)}</div>
  <table><thead><tr><th>Producto</th><th class="r">Cant.</th><th class="r">P.Unit</th><th class="r">Desc.</th><th class="r">Subt.</th></tr></thead>
  <tbody>${filas}</tbody></table>
  <table class="tot">
    <tr><td colspan="4" class="r">Subtotal</td><td class="r">${bs(doc.subtotal)}</td></tr>
    <tr><td colspan="4" class="r">Descuento</td><td class="r">${bs(doc.descuento)}</td></tr>
    <tr><td colspan="4" class="r">TOTAL</td><td class="r">${bs(doc.total)}</td></tr>
  </table>
  ${pago ? `<div>Pago: ${esc(pago.metodoPago)}${pago.referencia ? ' · Ref: ' + esc(pago.referencia) : ''}</div>` : ''}
  <p class="c" style="margin-top:14px">¡Gracias por su preferencia!</p>
  <script>window.onload=()=>{window.print();}<\/script></body></html>`);
  w.document.close();
}
