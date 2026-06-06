/**
 * Money helpers. Prisma returns Decimal as `Prisma.Decimal`; for API payloads we
 * serialise to a fixed-2 number string to avoid float drift. All arithmetic on
 * money should go through these helpers, never raw JS floats.
 */
import { Prisma } from '@prisma/client';

export type Money = Prisma.Decimal;

export function toMoney(value: number | string): Money {
  return new Prisma.Decimal(value);
}

export function addMoney(a: Money, b: Money): Money {
  return a.add(b);
}

export function multiplyMoney(price: Money, qty: number): Money {
  return price.mul(qty);
}

/** Serialise a Decimal to a number for JSON responses (2 dp). */
export function moneyToNumber(value: Money | number | string): number {
  return Number(new Prisma.Decimal(value).toFixed(2));
}
