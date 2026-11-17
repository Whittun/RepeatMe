import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1794870000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      CREATE TABLE categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(200) NOT NULL,
        "parentId" uuid REFERENCES categories(id) ON DELETE RESTRICT
      );
      CREATE INDEX ON categories ("parentId");
      CREATE TABLE cards (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar(200) NOT NULL,
        "categoryId" uuid REFERENCES categories(id) ON DELETE RESTRICT,
        explanation text NOT NULL DEFAULT '', criteria text NOT NULL DEFAULT '', sources jsonb NOT NULL DEFAULT '[]',
        streak integer NOT NULL DEFAULT 0 CHECK(streak >= 0), "lastResult" boolean,
        "nextReview" date, "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX ON cards ("categoryId"); CREATE INDEX ON cards ("nextReview");
      CREATE TABLE attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "cardId" uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        remembered boolean NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(),
        "nextReview" date NOT NULL, "requestId" uuid NOT NULL UNIQUE
      );
      CREATE INDEX ON attempts ("cardId");`);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE attempts; DROP TABLE cards; DROP TABLE categories;');
  }
}
