import { IsNotEmpty, IsObject, IsUUID } from 'class-validator';

export class CreateTicketDto {
  @IsNotEmpty()
  @IsUUID()
  helpdeskId: string;

  @IsObject()
  fieldValues: Record<string, unknown>;
}
