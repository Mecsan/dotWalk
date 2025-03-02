import { createPool } from 'mysql2';
import { Kysely, MysqlDialect } from 'kysely'
const database = 'cinema';

let pool = createPool({
  database: database,
  host: 'localhost',
  user: 'root',
  password: '',
  port: 3306,
  connectionLimit: 10,
})

export const db = new Kysely({
  dialect: new MysqlDialect({
    pool: pool
  })
})

export async function getDatabaseMetadata() {
  try {
    // Get the list of tables in the database
    const [tables] = await pool.promise().query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);

    const metadata = {};

    for (const tableName of tableNames) {
      // Get columns and their types
      const [columns] = await pool.promise().query(`DESCRIBE ${tableName}`);

      // Fetch foreign key information for this table
      const [foreignKeys] = await pool.promise().query(`
        SELECT 
          COLUMN_NAME, 
          REFERENCED_TABLE_NAME, 
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = '${database}' AND TABLE_NAME = '${tableName}' AND REFERENCED_TABLE_NAME IS NOT NULL
      `);

      // Create a map for fast lookup of foreign key references for each column
      const foreignKeyMap = foreignKeys.reduce((acc, fk) => {
        acc[fk.COLUMN_NAME] = {
          referencedTable: fk.REFERENCED_TABLE_NAME,
          referencedColumn: fk.REFERENCED_COLUMN_NAME
        };
        return acc;
      }, {});

      // Build the metadata for this table, including foreign key info in each column
      metadata[tableName] = columns.reduce((acc, col) => {
        // Check if this column has a foreign key reference
        const foreignKey = foreignKeyMap[col.Field] || null;

        return {

          ...acc,
          [col.Field]: {

            name: col.Field,
            type: col.Type,
            // nullable: col.Null,
            // key: col.Key,
            // default: col.Default,
            // extra: col.Extra,
            foreignKey: foreignKey
          }
        };
      }, {});
    }

    return metadata;
  } catch (error) {
    console.error('Error retrieving metadata:', error);
  } finally {
    pool.end();
  }
}
