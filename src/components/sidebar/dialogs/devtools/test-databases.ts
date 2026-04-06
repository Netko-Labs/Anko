import type { ConnectionConfig, DatabaseDriver } from '@/types'

// Test database configurations matching docker-compose.yml
export const TEST_DATABASES: ConnectionConfig[] = [
  {
    name: 'MySQL 8',
    host: 'localhost',
    port: 3306,
    username: 'anko',
    password: 'anko123',
    database: 'testdb',
    driver: 'mysql' as DatabaseDriver,
  },
  {
    name: 'PostgreSQL 16',
    host: 'localhost',
    port: 5432,
    username: 'anko',
    password: 'anko123',
    database: 'testdb',
    driver: 'postgresql' as DatabaseDriver,
  },
  {
    name: 'MariaDB 11',
    host: 'localhost',
    port: 3307,
    username: 'anko',
    password: ' ',
    database: 'testdb',
    driver: 'mysql' as DatabaseDriver,
  },
  {
    name: 'PostgreSQL 15',
    host: 'localhost',
    port: 5433,
    username: 'anko',
    password: 'anko123',
    database: 'appdb',
    driver: 'postgresql' as DatabaseDriver,
  },
  {
    name: 'MySQL 8.4 LTS',
    host: 'localhost',
    port: 3308,
    username: 'anko',
    password: 'anko123',
    database: 'legacydb',
    driver: 'mysql' as DatabaseDriver,
  },
  {
    name: 'SQLite Music DB',
    host: './docker/sqlite/data/music.db',
    port: 0,
    username: '',
    password: '',
    driver: 'sqlite' as DatabaseDriver,
  },
]
