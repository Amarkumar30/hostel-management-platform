import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessController } from './mess.controller';
import { MessService } from './mess.service';

@Module({
  imports: [PrismaModule],
  controllers: [MessController],
  providers: [MessService],
  exports: [MessService],
})
export class MessModule {}

