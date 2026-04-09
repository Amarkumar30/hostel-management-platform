import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    const maxRetries = Number.parseInt(
      process.env.PRISMA_CONNECT_MAX_RETRIES || '12',
      10,
    );
    const baseDelayMs = Number.parseInt(
      process.env.PRISMA_CONNECT_BASE_DELAY_MS || '1000',
      10,
    );
    const maxDelayMs = Number.parseInt(
      process.env.PRISMA_CONNECT_MAX_DELAY_MS || '10000',
      10,
    );

    let attempt = 0;
    // Neon/Render can occasionally take a few seconds to accept connections (cold starts, deploy timing).
    // Retrying here avoids the whole service crash-looping on a transient P1001.
    while (true) {
      attempt += 1;
      try {
        await this.$connect();
        if (attempt > 1) {
          console.log(`[Prisma] Connected after ${attempt} attempts`);
        }
        break;
      } catch (err: any) {
        const code = err?.errorCode || err?.code;
        const msg = err?.message || String(err);
        console.error(
          `[Prisma] Connect failed (attempt ${attempt}/${maxRetries}) ${code ? `[${code}]` : ''} ${msg}`,
        );

        if (attempt >= maxRetries) throw err;

        const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
