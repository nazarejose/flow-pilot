import { PartialType } from '@nestjs/mapped-types';
import { CreateHelpdeskDto } from './create-helpdesk.dto';

export class UpdateHelpdeskDto extends PartialType(CreateHelpdeskDto) {}
