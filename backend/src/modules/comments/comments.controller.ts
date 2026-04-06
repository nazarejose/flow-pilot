import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('tickets/:ticketId/comments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(
    @Param('ticketId') ticketId: string,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(ticketId, req.user.companyId, req.user, dto);
  }

  @Get()
  async findAll(
    @Param('ticketId') ticketId: string,
    @Req() req: any,
  ) {
    return this.commentsService.findAllByTicket(ticketId, req.user.companyId, req.user);
  }

  @Get(':id')
  async findOne(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.commentsService.findOne(id, ticketId, req.user.companyId, req.user);
  }
}
