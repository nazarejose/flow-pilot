import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Helpdesk } from './helpdesk.entity';

@Entity('helpdesk_companies')
@Unique(['helpdeskId', 'companyId'])
export class HelpdeskCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Helpdesk, (h) => h.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'helpdeskId' })
  helpdesk: Helpdesk;

  @Column()
  helpdeskId: string;

  @Column()
  companyId: string;
}