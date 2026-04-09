-- CreateEnum
CREATE TYPE "public"."MessOrderType" AS ENUM ('MONTHLY', 'DAILY');

-- CreateEnum
CREATE TYPE "public"."MessOrderStatus" AS ENUM ('CREATED', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."MessFeedbackType" AS ENUM ('COMPLAINT', 'SUGGESTION', 'APPRECIATION');

-- CreateTable
CREATE TABLE "public"."mess_orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."MessOrderType" NOT NULL,
    "status" "public"."MessOrderStatus" NOT NULL DEFAULT 'CREATED',
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mess_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mess_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."MessFeedbackType" NOT NULL DEFAULT 'SUGGESTION',
    "rating" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mess_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mess_orders_razorpayOrderId_key" ON "public"."mess_orders"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "mess_orders_userId_createdAt_idx" ON "public"."mess_orders"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "mess_orders_status_createdAt_idx" ON "public"."mess_orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "mess_orders_type_periodStart_idx" ON "public"."mess_orders"("type", "periodStart");

-- CreateIndex
CREATE INDEX "mess_feedback_userId_createdAt_idx" ON "public"."mess_feedback"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."mess_orders" ADD CONSTRAINT "mess_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mess_feedback" ADD CONSTRAINT "mess_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

