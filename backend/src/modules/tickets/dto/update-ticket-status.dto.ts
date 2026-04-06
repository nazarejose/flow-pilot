import { IsEnum } from 'class-validator';
import { TicketStatus } from '../entities/ticket-status.enum';

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
