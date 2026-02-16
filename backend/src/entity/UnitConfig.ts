import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class UnitConfig {
  @PrimaryColumn()
  unitId!: string;

  @Column('simple-json', { default: '[]' })
  cells!: string[];

  @Column('simple-json', { default: '[]' })
  facilities!: string[];

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
