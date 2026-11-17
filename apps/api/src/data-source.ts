import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { Category, Card, Attempt } from './entities';
import { Initial1794870000000 } from './migrations/1794870000000-Initial';

config({ path: resolve(__dirname, '../../../.env') });
const dataSource = new DataSource({
  type: 'postgres', url: process.env.DATABASE_URL ?? 'postgresql://repeatme:repeatme@localhost:5432/repeatme',
  entities: [Category, Card, Attempt], migrations: [Initial1794870000000], synchronize: false, uuidExtension: 'pgcrypto',
});
export default dataSource;
