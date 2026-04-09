import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { MessFeedbackType, MessOrderType } from '@prisma/client';

export class CreateMessOrderDto {
  @IsEnum(MessOrderType)
  type!: MessOrderType;
}

export class VerifyMessOrderDto {
  @IsString()
  razorpayOrderId!: string;

  @IsString()
  razorpayPaymentId!: string;

  @IsString()
  razorpaySignature!: string;
}

export class CreateMessFeedbackDto {
  @IsOptional()
  @IsEnum(MessFeedbackType)
  type?: MessFeedbackType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsString()
  title!: string;

  @IsString()
  message!: string;
}

