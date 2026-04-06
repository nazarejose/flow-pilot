import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Helpdesk } from './entities/helpdesk.entity';
import { HelpdeskCompany } from './entities/helpdesk-company.entity';
import { HelpdeskService } from './helpdesk.service';
import { HelpdeskController } from './helpdesk.controller';
import { HelpdeskPermissionsController } from './helpdesk-permissions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Helpdesk, HelpdeskCompany])],
  controllers: [HelpdeskController, HelpdeskPermissionsController],
  providers: [HelpdeskService],
  exports: [HelpdeskService],
})
export class HelpdesksModule {}
