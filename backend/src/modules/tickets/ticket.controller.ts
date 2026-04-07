import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import { TicketStatus } from './entities/ticket-status.enum';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @Roles(Role.REQUESTER, Role.ADMIN)
  async create(@Body() dto: CreateTicketDto, @Req() req: any) {
    return this.ticketService.create(req.user.companyId, req.user.id, dto);
  }

  @Get()
  async findAll(@Req() req: any, @Query('status') status?: TicketStatus) {
    return this.ticketService.findAll(req.user.companyId, req.user, {
      status: status as TicketStatus,
    });
  }

  @Get('mine')
  async findMyTickets(@Req() req: any, @Query('status') status?: TicketStatus) {
    return this.ticketService.findAll(req.user.companyId, {
      id: req.user.id,
      role: 'requester',
    }, {
      status: status as TicketStatus,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.ticketService.findOne(id, req.user.companyId, req.user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.ATTENDANT)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @Req() req: any,
  ) {
    return this.ticketService.updateStatus(id, req.user.companyId, req.user, dto);
  }

  @Post(':id/claim')
  @Roles(Role.ATTENDANT)
  async claim(@Param('id') id: string, @Req() req: any) {
    return this.ticketService.claim(
      id,
      req.user.companyId,
      req.user.id,
      req.user.sectorId,
    );
  }

  @Patch(':id/cancel')
  @Roles(Role.REQUESTER, Role.ADMIN)
  async cancel(@Param('id') id: string, @Req() req: any) {
    return this.ticketService.cancel(id, req.user.companyId, req.user.id);
  }
}
