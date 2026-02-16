import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_records')
export class AuditRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', nullable: true })
  userId!: string;

  @Column({ name: 'unit_id', nullable: true })
  unitId!: string;

  @Column({ name: 'page_name', nullable: true })
  pageName!: string;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'simple-json', name: 'json_state', nullable: true })
  jsonState!: Record<string, unknown>;

  @Column({ type: 'text', name: 'html_snapshot', nullable: true })
  htmlSnapshot!: string;

  @Column({ type: 'text', name: 'css_snapshot', nullable: true })
  cssSnapshot!: string;

  @Column({ name: 'screenshot_url', nullable: true })
  screenshotUrl!: string;

  @Column({ name: 'pdf_url', nullable: true })
  pdfUrl!: string;
}