import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

const HOY = `(now() AT TIME ZONE 'America/La_Paz')::date`;
const MES = `date_trunc('month', now() AT TIME ZONE 'America/La_Paz')::date`;
const FECHA_LOCAL = (col: string) => `(${col} AT TIME ZONE 'America/La_Paz')::date`;

@Injectable()
export class ReportesService {
  constructor(private readonly dataSource: DataSource) {}

  async resumen() {
    const q = <T = any>(sql: string) => this.dataSource.query(sql) as Promise<T[]>;

    const [ventasHoy, ventasMes, comprasMes, conteos, ultimos7Dias, topProductos, ventasPorMetodo] =
      await Promise.all([
        q(`SELECT COALESCE(SUM(total),0)::float8 AS total, COUNT(*)::int AS cantidad
           FROM ventas WHERE estado = true AND ${FECHA_LOCAL('fecha')} = ${HOY}`),
        q(`SELECT COALESCE(SUM(total),0)::float8 AS total, COUNT(*)::int AS cantidad
           FROM ventas WHERE estado = true AND ${FECHA_LOCAL('fecha')} >= ${MES}`),
        q(`SELECT COALESCE(SUM(total),0)::float8 AS total, COUNT(*)::int AS cantidad
           FROM compras WHERE estado = true AND ${FECHA_LOCAL('fecha')} >= ${MES}`),
        q(`SELECT
             (SELECT COUNT(*) FROM productos WHERE estado = true)::int AS "productosActivos",
             (SELECT COUNT(*) FROM productos WHERE estado = true AND stock <= stock_minimo)::int AS "stockBajo",
             (SELECT COUNT(*) FROM clientes WHERE estado = true)::int AS "clientesActivos"`),
        q(`SELECT to_char(d::date, 'YYYY-MM-DD') AS fecha, COALESCE(SUM(v.total),0)::float8 AS total
           FROM generate_series(${HOY} - 6, ${HOY}, interval '1 day') d
           LEFT JOIN ventas v ON v.estado = true AND ${FECHA_LOCAL('v.fecha')} = d::date
           GROUP BY d ORDER BY d`),
        q(`SELECT p.nombre, SUM(dv.cantidad)::int AS cantidad, SUM(dv.subtotal)::float8 AS total
           FROM detalles_venta dv
           JOIN ventas v ON v.id_venta = dv.id_venta AND v.estado = true
           JOIN productos p ON p.id_producto = dv.id_producto
           WHERE ${FECHA_LOCAL('v.fecha')} >= ${MES}
           GROUP BY p.id_producto, p.nombre ORDER BY SUM(dv.cantidad) DESC LIMIT 5`),
        q(`SELECT pg.metodo_pago AS "metodoPago", COALESCE(SUM(pg.monto),0)::float8 AS total
           FROM pagos pg WHERE pg.estado = true AND pg.id_venta IS NOT NULL
             AND ${FECHA_LOCAL('pg.fecha')} >= ${MES}
           GROUP BY pg.metodo_pago ORDER BY 2 DESC`),
      ]);

    return {
      ventasHoy: ventasHoy[0],
      ventasMes: ventasMes[0],
      comprasMes: comprasMes[0],
      ...conteos[0],
      ultimos7Dias,
      topProductos,
      ventasPorMetodo,
    };
  }
}
