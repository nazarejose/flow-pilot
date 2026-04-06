import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { HelpdeskService } from './helpdesk.service';
import { CreateHelpdeskDto } from './dto/create-helpdesk.dto';
import { UpdateHelpdeskDto } from './dto/update-helpdesk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../../shared/enums/role.enum';

@Controller('helpdesks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HelpdeskController {
  constructor(private readonly service: HelpdeskService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateHelpdeskDto, @Req() req: any) {
    return this.service.create(req.user.companyId, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll(@Req() req: any) {
    return this.service.findAll(req.user.companyId, req.user);
  }

  @Get('mine')
  async getMyHelpdesks(@Req() req: any) {
    return this.service.findByCompany(req.user.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.user.companyId, req.user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHelpdeskDto,
    @Req() req: any,
  ) {
    return this.service.update(id, req.user.companyId, dto);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string, @Req() req: any) {
    return this.service.publish(id, req.user.companyId);
  }

  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string, @Req() req: any) {
    return this.service.unpublish(id, req.user.companyId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.service.remove(id, req.user.companyId);
    return { statusCode: 200, message: 'Helpdesk deactivated' };
  }
}