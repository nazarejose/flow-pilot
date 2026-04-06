import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { HelpdeskService } from './helpdesk.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../../shared/enums/role.enum';

@Controller('helpdesks/:helpdeskId/companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class HelpdeskPermissionsController {
  constructor(private readonly service: HelpdeskService) {}

  @Get()
  async listHelpdeskCompanies(@Param('helpdeskId') helpdeskId: string, @Req() req: any) {
    return this.service.listCompanyPermissions(helpdeskId, req.user.companyId);
  }

  @Post()
  async addHelpdeskCompany(
    @Param('helpdeskId') helpdeskId: string,
    @Body() body: { companyId: string },
    @Req() req: any,
  ) {
    await this.service.addCompanyPermission(helpdeskId, req.user.companyId);
    return { message: 'Company access granted' };
  }

  @Delete(':companyId')
  async removeHelpdeskCompany(
    @Param('helpdeskId') helpdeskId: string,
    @Param('companyId') companyId: string,
  ) {
    await this.service.removeCompanyPermission(helpdeskId, companyId);
    return { message: 'Company access removed' };
  }
}
