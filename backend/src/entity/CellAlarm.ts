import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cell_alarms')
export class CellAlarm {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  cell!: string;

  @Column({ nullable: true })
  weekKey!: string;

  @Column({ default: false })
  checked!: boolean;

  @Column({ nullable: true })
  checkedAt!: string;

  @Column({ nullable: true })
  unitId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
