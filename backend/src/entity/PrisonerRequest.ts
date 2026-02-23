import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum RequestType {
  SOCIAL_VISIT = 'social_visit',
  AVL_VISIT = 'avl_visit',
  PROPERTY_REQUEST = 'property_request'
}

export enum RequestStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  DECLINED = 'declined',
  PCO_REQUIRED = 'pco_required',
  PCO_APPROVED = 'pco_approved',
  PCO_DECLINED = 'pco_declined'
}

export enum RequestAction {
  CREATED = 'created',
  APPROVED = 'approved',
  DECLINED = 'declined',
  SCHEDULED = 'scheduled',
  FORWARDED_TO_PCO = 'forwarded_to_pco',
  PCO_APPROVED = 'pco_approved',
  PCO_DECLINED = 'pco_declined',
  COMPLETED = 'completed',
  UPDATED = 'updated'
}

@Entity('prisoner_requests')
export class PrisonerRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'prisoner_id' })
  prisonerId!: string

  @Column({ name: 'prisoner_name' })
  prisonerName!: string

  @Column({ name: 'prisoner_cell' })
  prisonerCell!: string

  @Column({ type: 'varchar' })
  type!: RequestType

  @Column({ type: 'varchar', default: RequestStatus.PENDING })
  status!: RequestStatus

  @Column({ name: 'unit_id' })
  unitId!: string

  @Column({ type: 'simple-json', nullable: true })
  metadata!: {
    // For visits
    contactName?: string
    relationship?: string
    preferredDate?: string
    preferredTime?: string
    reason?: string
    notes?: string
    // For property
    propertyItems?: string[]
    propertyCategory?: string
    urgency?: string
  }

  @Column({ name: 'staff_notes', nullable: true })
  staffNotes!: string

  @Column({ name: 'pco_notes', nullable: true })
  pcoNotes!: string

  @Column({ name: 'scheduled_time', nullable: true })
  scheduledTime!: Date

  @Column({ name: 'declined_reason', nullable: true })
  declinedReason!: string

  @Column({ name: 'created_by', nullable: true })
  createdBy!: string

  @Column({ name: 'staff_id', nullable: true })
  staffId!: string

  @Column({ name: 'pco_id', nullable: true })
  pcoId!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}

@Entity('prisoner_request_actions')
export class PrisonerRequestAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'request_id' })
  requestId!: string

  @Column({ type: 'varchar' })
  action!: RequestAction

  @Column({ name: 'performed_by' })
  performedBy!: string

  @Column({ name: 'staff_id', nullable: true })
  staffId!: string

  @Column({ name: 'previous_status', nullable: true })
  previousStatus!: string

  @Column({ name: 'new_status', nullable: true })
  newStatus!: string

  @Column({ type: 'simple-json', nullable: true })
  changes!: Record<string, any>

  @Column({ nullable: true })
  notes!: string

  @CreateDateColumn({ name: 'performed_at' })
  performedAt!: Date
}
