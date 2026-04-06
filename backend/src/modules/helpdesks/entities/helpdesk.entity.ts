import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { HelpdeskCompany } from './helpdesk-company.entity';

@Entity('helpdesk')
export class Helpdesk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sectorId: string;

  @Column()
  companyId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: [] })
  schema: FieldSchema[];

  @Column({ default: false })
  published: boolean;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => HelpdeskCompany, (hc) => hc.helpdesk, { cascade: true })
  permissions: HelpdeskCompany[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface FieldSchema {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'checkbox';
  label: string;
  required: boolean;
  options?: string[];
}
