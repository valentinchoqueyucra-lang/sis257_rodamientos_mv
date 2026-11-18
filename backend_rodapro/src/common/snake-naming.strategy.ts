import { DefaultNamingStrategy, NamingStrategyInterface, Table } from 'typeorm';

const toSnake = (s: string) =>
  s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

/** Nombre de tabla sin esquema ("public.clientes" -> "clientes"). */
const tabla = (t: Table | string): string => (typeof t === 'string' ? t : t.name).split('.').pop() as string;

/**
 * En el código las propiedades van en camelCase (nombreCompleto)
 * y en PostgreSQL las columnas quedan en snake_case (nombre_completo).
 */
export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  tableName(className: string, customName: string): string {
    return customName ? customName : toSnake(className);
  }

  columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    const prefix = embeddedPrefixes.length
      ? toSnake(embeddedPrefixes.join('_')) + '_'
      : '';
    return prefix + (customName ? customName : toSnake(propertyName));
  }

  relationName(propertyName: string): string {
    return toSnake(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return toSnake(relationName + '_' + referencedColumnName);
  }

  // ---- Nombres de restricciones (legibles, en vez del hash por defecto de TypeORM) ----
  // pk_<tabla> · fk_<tabla>_<columnas> · uq_<tabla>_<columnas> · ix_<tabla>_<columnas>

  primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    return `pk_${tabla(tableOrName)}_${columnNames.join('_')}`;
  }

  foreignKeyName(tableOrName: Table | string, columnNames: string[]): string {
    return `fk_${tabla(tableOrName)}_${columnNames.join('_')}`;
  }

  uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    return `uq_${tabla(tableOrName)}_${columnNames.join('_')}`;
  }

  relationConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    return `rel_${tabla(tableOrName)}_${columnNames.join('_')}`;
  }

  indexName(tableOrName: Table | string, columnNames: string[]): string {
    return `ix_${tabla(tableOrName)}_${columnNames.join('_')}`;
  }
}