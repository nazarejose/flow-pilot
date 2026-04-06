import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SectorsService } from './sectors.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../../shared/enums/role.enum';

@Controller('companies/:companyId/sectors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(
    @Param('companyId') companyId: string,
    @Body() createSectorDto: CreateSectorDto,
  ) {
    return this.sectorsService.create(companyId, createSectorDto);
  }

  @Get()
  async findAll(
    @Param('companyId') companyId: string,
    @Query('active') active?: string,
  ) {
    const activeFilter = active !== undefined ? active === 'true' : undefined;
    return this.sectorsService.findAll(companyId, activeFilter);
  }

  @Get(':id')
  async findOne(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.sectorsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() updateSectorDto: UpdateSectorDto,
  ) {
    return this.sectorsService.update(id, companyId, updateSectorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    await this.sectorsService.remove(id, companyId);
    return { statusCode: HttpStatus.OK, message: 'Sector deactivated' };
  }
}
