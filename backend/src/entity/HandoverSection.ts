import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('handovers')
export class HandoverSection {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  unitId!: string;

  @Column({ nullable: true })
  date!: string;

  @Column({ nullable: true })
  standingOrders!: string;

  @Column({ nullable: true })
  medicalNotes!: string;

  @Column({ nullable: true })
  peopleOffPrivileges!: string;

  @Column({ nullable: true })
  confinement!: string;

  @Column({ nullable: true })
  scoName!: string;

  @Column({ nullable: true })
  co1Name!: string;

  @Column({ nullable: true })
  co2Name!: string;

  @Column({ nullable: true })
  co3Name!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
