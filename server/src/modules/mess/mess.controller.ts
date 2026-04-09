import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateMessFeedbackDto,
  CreateMessOrderDto,
  VerifyMessOrderDto,
} from './dto/mess.dto';
import { MessService } from './mess.service';

type AuthenticatedRequest = Request & {
  user: { id: string; role: string; email: string; name: string };
};

@ApiTags('Mess')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mess')
export class MessController {
  constructor(private readonly messService: MessService) {}

  @Get('summary')
  @Roles('STUDENT')
  getSummary(@Req() req: AuthenticatedRequest) {
    return this.messService.getSummary(req.user.id);
  }

  @Post('orders')
  @Roles('STUDENT')
  createOrder(@Req() req: AuthenticatedRequest, @Body() dto: CreateMessOrderDto) {
    return this.messService.createOrder(req.user.id, dto.type);
  }

  @Post('orders/verify')
  @Roles('STUDENT')
  async verify(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyMessOrderDto,
  ) {
    const order = await this.messService.verifyAndMarkPaid(req.user.id, dto);
    return { order };
  }

  @Post('feedback')
  @Roles('STUDENT')
  submitFeedback(@Req() req: AuthenticatedRequest, @Body() dto: CreateMessFeedbackDto) {
    return this.messService.submitFeedback(req.user.id, dto);
  }

  @Get('feedback/mine')
  @Roles('STUDENT')
  listMine(@Req() req: AuthenticatedRequest) {
    return this.messService.listMyFeedback(req.user.id);
  }
}

