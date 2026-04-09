import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MessFeedbackType, MessOrderStatus, MessOrderType } from '@prisma/client';
import crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessFeedbackDto } from './dto/mess.dto';

type RazorpayOrderCreateResponse = {
  id: string;
  amount: number;
  currency: string;
  receipt: string | null;
  status: string;
};

function parseFeeInPaiseFromEnv(key: string, fallbackPaise: number) {
  const raw = process.env[key];
  if (!raw) return fallbackPaise;

  const trimmed = raw.trim();
  if (!trimmed) return fallbackPaise;

  // Allow "3000" (INR) or "300000" (paise) or "3000inr"/"300000paise"
  const numeric = Number.parseInt(trimmed.replace(/[^\d]/g, ''), 10);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallbackPaise;

  if (/paise/i.test(trimmed)) return numeric;
  if (/inr/i.test(trimmed)) return numeric * 100;

  // Heuristic: if it's too large for INR, treat it as paise.
  return numeric >= 50_000 ? numeric : numeric * 100;
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

@Injectable()
export class MessService {
  constructor(private readonly prisma: PrismaService) {}

  private getRazorpayConfig() {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException(
        'Mess payments are not configured on the server (missing Razorpay keys).',
      );
    }

    return { keyId, keySecret };
  }

  private getFees() {
    const monthlyFeePaise = parseFeeInPaiseFromEnv(
      'MESS_MONTHLY_FEE',
      3000 * 100,
    );
    const dailyFeePaise = parseFeeInPaiseFromEnv('MESS_DAILY_FEE', 110 * 100);
    return { monthlyFeePaise, dailyFeePaise, currency: 'INR' };
  }

  async getSummary(userId: string) {
    const { start: todayStart, end: todayEnd } = getTodayRange();
    const { start: monthStart, end: monthEnd } = getCurrentMonthRange();

    const [monthly, daily, recentOrders] = await Promise.all([
      this.prisma.messOrder.findFirst({
        where: {
          userId,
          type: MessOrderType.MONTHLY,
          status: MessOrderStatus.PAID,
          periodStart: monthStart,
          periodEnd: monthEnd,
        },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.messOrder.findFirst({
        where: {
          userId,
          type: MessOrderType.DAILY,
          status: MessOrderStatus.PAID,
          periodStart: todayStart,
          periodEnd: todayEnd,
        },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.messOrder.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const fees = this.getFees();
    return {
      fees,
      access: {
        monthlyActive: Boolean(monthly),
        dailyActiveToday: Boolean(daily),
      },
      recentOrders,
      period: {
        monthStart,
        monthEnd,
        todayStart,
        todayEnd,
      },
    };
  }

  async createOrder(userId: string, type: MessOrderType) {
    const { keyId, keySecret } = this.getRazorpayConfig();
    const fees = this.getFees();

    const range =
      type === MessOrderType.MONTHLY ? getCurrentMonthRange() : getTodayRange();

    const existingPaid = await this.prisma.messOrder.findFirst({
      where: {
        userId,
        type,
        status: MessOrderStatus.PAID,
        periodStart: range.start,
        periodEnd: range.end,
      },
      select: { id: true },
    });
    if (existingPaid) {
      throw new ConflictException(
        type === MessOrderType.MONTHLY
          ? 'Monthly mess fee is already paid for this month.'
          : 'Daily meal is already paid for today.',
      );
    }

    const amountPaise =
      type === MessOrderType.MONTHLY ? fees.monthlyFeePaise : fees.dailyFeePaise;

    const receipt =
      type === MessOrderType.MONTHLY
        ? `mess_monthly_${userId}_${range.start.getFullYear()}-${String(
            range.start.getMonth() + 1,
          ).padStart(2, '0')}`
        : `mess_daily_${userId}_${range.start.toISOString().slice(0, 10)}`;

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    let razorpayOrder: RazorpayOrderCreateResponse;
    try {
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: fees.currency,
          receipt,
          notes: {
            userId,
            type,
            periodStart: range.start.toISOString(),
            periodEnd: range.end.toISOString(),
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new BadGatewayException(
          `Razorpay order create failed (${res.status}) ${text}`.trim(),
        );
      }
      razorpayOrder = (await res.json()) as RazorpayOrderCreateResponse;
    } catch (e: any) {
      if (e instanceof BadGatewayException) throw e;
      throw new BadGatewayException(
        `Unable to reach Razorpay: ${e?.message || 'Unknown error'}`,
      );
    }

    const dbOrder = await this.prisma.messOrder.create({
      data: {
        userId,
        type,
        status: MessOrderStatus.CREATED,
        amountPaise,
        currency: fees.currency,
        periodStart: range.start,
        periodEnd: range.end,
        razorpayOrderId: razorpayOrder.id,
      },
    });

    return {
      keyId,
      order: {
        id: dbOrder.id,
        type: dbOrder.type,
        amountPaise: dbOrder.amountPaise,
        currency: dbOrder.currency,
        razorpayOrderId: dbOrder.razorpayOrderId,
        periodStart: dbOrder.periodStart,
        periodEnd: dbOrder.periodEnd,
      },
    };
  }

  async verifyAndMarkPaid(userId: string, input: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const { keySecret } = this.getRazorpayConfig();

    const order = await this.prisma.messOrder.findUnique({
      where: { razorpayOrderId: input.razorpayOrderId },
    });
    if (!order || order.userId !== userId) {
      throw new BadRequestException('Order not found for this user.');
    }
    if (order.status === MessOrderStatus.PAID) {
      return order;
    }

    const payload = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(input.razorpaySignature);
    if (
      expectedBuf.length !== actualBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, actualBuf)
    ) {
      await this.prisma.messOrder.update({
        where: { id: order.id },
        data: { status: MessOrderStatus.FAILED },
      });
      throw new BadRequestException('Invalid Razorpay signature.');
    }

    return this.prisma.messOrder.update({
      where: { id: order.id },
      data: {
        status: MessOrderStatus.PAID,
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
        paidAt: new Date(),
      },
    });
  }

  async submitFeedback(userId: string, dto: CreateMessFeedbackDto) {
    const type = dto.type ?? MessFeedbackType.SUGGESTION;
    const rating = dto.rating ?? null;

    if (rating !== null && type === MessFeedbackType.APPRECIATION && rating < 3) {
      // Gentle guardrail: appreciation implies positive sentiment.
      throw new BadRequestException(
        'For appreciation, please use a rating of 3 to 5.',
      );
    }

    return this.prisma.messFeedback.create({
      data: {
        userId,
        type,
        rating,
        title: dto.title.trim(),
        message: dto.message.trim(),
      },
    });
  }

  async listMyFeedback(userId: string) {
    return this.prisma.messFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

