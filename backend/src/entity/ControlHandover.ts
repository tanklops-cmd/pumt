import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('control_handover')
export class ControlHandover {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  date!: string;

  @Column({ type: 'text', nullable: true })
  general?: string;

  @Column({ type: 'text', nullable: true })
  visits?: string;

  @Column({ type: 'text', nullable: true })
  other?: string;
}
