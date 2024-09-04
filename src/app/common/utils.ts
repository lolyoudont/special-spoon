import { EntityManager } from 'typeorm';

export async function lockTables(
  m: EntityManager,
  ...tables: string[]
): Promise<void> {
  for (const t of tables) {
    await m.query(`LOCK TABLE "${t}" IN SHARE ROW EXCLUSIVE MODE`);
  }
}
