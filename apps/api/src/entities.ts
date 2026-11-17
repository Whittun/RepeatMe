import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 200 }) name!: string;
  @Index() @Column({ type: 'uuid', nullable: true }) parentId!: string | null;
  @ManyToOne(() => Category, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'parentId' }) parent!: Category | null;
}

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 200 }) title!: string;
  @Index() @Column({ type: 'uuid', nullable: true }) categoryId!: string | null;
  @ManyToOne(() => Category, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'categoryId' }) category!: Category | null;
  @Column({ type: 'text', default: '' }) explanation!: string;
  @Column({ type: 'text', default: '' }) criteria!: string;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) sources!: { label: string; url: string }[];
  @Column({ default: 0 }) streak!: number;
  @Column({ type: 'boolean', nullable: true }) lastResult!: boolean | null;
  @Index() @Column({ type: 'date', nullable: true }) nextReview!: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
}

@Entity('attempts')
export class Attempt {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column({ type: 'uuid' }) cardId!: string;
  @ManyToOne(() => Card, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'cardId' }) card!: Card;
  @Column() remembered!: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @Column({ type: 'date' }) nextReview!: string;
  @Column({ type: 'uuid', unique: true }) requestId!: string;
}
