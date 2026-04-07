import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Helpdesk } from '../../helpdesks/entities/helpdesk.entity';
import { User } from '../../users/entities/user.entity';
import { TicketStatus } from './ticket-status.enum';

@Entity('ticket')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Helpdesk, { nullable: false })
  @JoinColumn({ name: 'helpdeskId' })
  helpdesk: Helpdesk;

  @Column()
  helpdeskId: string;

  @Column()
  companyId: string;

  @Column()
  requesterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User | null;

  @Column({ nullable: true })
  assignedToId: string | null;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({ type: 'jsonb', default: {} })
  fieldValues: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;
}
