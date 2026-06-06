/**
 * Order lifecycle service.
 *
 * `placeOrder` runs in a single transaction that:
 *   1. re-validates the cart against live stock,
 *   2. snapshots address + product details (orders are immutable),
 *   3. decrements inventory,
 *   4. clears the cart,
 *   5. emits a notification + audit entry.
 * Either everything commits or nothing does.
 */
import { prisma } from '@/core/db/prisma';
import { orderRepository } from '@/repositories/order.repository';
import { addressRepository } from '@/repositories/address.repository';
import { settingsService } from '@/modules/settings/settings.service';
import { auditService, type AuditContext } from '@/modules/audit/audit.service';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/core/errors/app-error';
import { generateOrderNumber } from '@/core/utils/ids';
import { toMoney, moneyToNumber } from '@/core/utils/money';
import { canTransition, timestampForStatus, CUSTOMER_FACING_STATUS_LABEL } from './order.status';
import { toOrderDTO } from './order.presenter';
import type { PageParams } from '@/repositories/pagination';
import { OrderStatus, RoleName } from '@prisma/client';
import type { PlaceOrderInput, UpdateOrderStatusInput } from '@/validation/order.schema';

export const orderService = {
  async placeOrder(userId: string, input: PlaceOrderInput, ctx: AuditContext) {
    const config = await settingsService.getStoreConfig();
    if (!config.isOpen) throw new BadRequestError('The store is currently closed. Please try again later.');
    if (input.paymentMethod === 'COD' && !config.codEnabled) throw new BadRequestError('Cash on delivery is unavailable');

    const address = await addressRepository.findById(input.addressId);
    if (!address) throw new NotFoundError('Address');
    if (address.userId !== userId) throw new ForbiddenError('This address does not belong to you');

    const order = await prisma.$transaction(async (tx) => {
      // Load cart with current product + inventory state inside the tx.
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: { include: { inventory: true } } } } },
      });
      if (!cart || cart.items.length === 0) throw new BadRequestError('Your cart is empty');

      let subtotal = toMoney(0);
      const orderItemsData = cart.items.map((item) => {
        const { product } = item;
        if (!product.isActive) throw new BadRequestError(`${product.name} is no longer available`);
        const stock = product.inventory?.stock ?? 0;
        if (!product.inventory || product.inventory.isOutOfStock || stock < item.quantity) {
          throw new ConflictError(`Insufficient stock for ${product.name}`);
        }
        const lineTotal = product.price.mul(item.quantity);
        subtotal = subtotal.add(lineTotal);
        return {
          productId: product.id,
          productName: product.name,
          unitLabel: product.unitLabel,
          price: product.price,
          quantity: item.quantity,
          lineTotal,
        };
      });

      const subtotalNum = moneyToNumber(subtotal);
      if (subtotalNum < config.minOrderSubtotal) {
        throw new BadRequestError(`Minimum order value is ₹${config.minOrderSubtotal}`);
      }

      const deliveryFee = subtotalNum >= config.freeDeliveryAboveSubtotal ? toMoney(0) : toMoney(config.deliveryFee);
      const total = subtotal.add(deliveryFee);

      // Decrement stock atomically; guard against races with a conditional update.
      for (const item of cart.items) {
        const updated = await tx.inventory.updateMany({
          where: { productId: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) throw new ConflictError(`Insufficient stock for ${item.product.name}`);
        // Flag out-of-stock when depleted.
        await tx.inventory.updateMany({ where: { productId: item.productId, stock: { lte: 0 } }, data: { isOutOfStock: true } });
      }

      const created = await orderRepository.createInTx(tx, {
        orderNumber: generateOrderNumber(),
        user: { connect: { id: userId } },
        address: { connect: { id: address.id } },
        shipFullName: address.fullName,
        shipPhone: address.phone,
        shipLine1: address.line1,
        shipLine2: address.line2,
        shipCity: address.city,
        shipState: address.state,
        shipPincode: address.pincode,
        paymentMethod: input.paymentMethod,
        subtotal,
        deliveryFee,
        discount: toMoney(0),
        total,
        notes: input.notes,
        items: { create: orderItemsData },
      });

      // Clear the cart.
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      // Notify the customer.
      await tx.notification.create({
        data: {
          userId,
          type: 'ORDER_STATUS',
          title: 'Order placed successfully',
          body: `Your order ${created.orderNumber} has been placed and is awaiting confirmation.`,
          data: { orderId: created.id, status: created.status },
        },
      });

      return created;
    });

    await auditService.log('ORDER_PLACED', 'Order', order.id, ctx, { total: moneyToNumber(order.total) });
    return toOrderDTO(order);
  },

  async listForCustomer(userId: string, params: PageParams) {
    const result = await orderRepository.listForUser(userId, params);
    return { ...result, items: result.items.map(toOrderDTO) };
  },

  async getForCustomer(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order || order.userId !== userId) throw new NotFoundError('Order');
    return toOrderDTO(order);
  },

  async listAll(params: PageParams & { status?: OrderStatus; search?: string }) {
    const result = await orderRepository.listAll(params);
    return { ...result, items: result.items.map(toOrderDTO) };
  },

  async getById(orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order');
    return toOrderDTO(order);
  },

  /**
   * Transition an order's status. Enforces the state machine and restocks
   * inventory when an order is rejected/cancelled.
   */
  async updateStatus(
    orderId: string,
    input: UpdateOrderStatusInput,
    actor: { id: string; role: RoleName },
    ctx: AuditContext,
  ) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order');

    const target = input.status as OrderStatus;
    if (!canTransition(order.status, target)) {
      throw new BadRequestError(`Cannot change status from ${order.status} to ${target}`);
    }

    const restock = target === OrderStatus.REJECTED || target === OrderStatus.CANCELLED;

    const updated = await prisma.$transaction(async (tx) => {
      if (restock) {
        for (const item of order.items) {
          if (!item.productId) continue;
          await tx.inventory.updateMany({
            where: { productId: item.productId },
            data: { stock: { increment: item.quantity }, isOutOfStock: false },
          });
        }
      }
      const result = await tx.order.update({
        where: { id: orderId },
        data: { status: target, ...timestampForStatus(target) },
        include: { items: true, user: { select: { id: true, name: true, phone: true } } },
      });
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: 'ORDER_STATUS',
          title: CUSTOMER_FACING_STATUS_LABEL[target],
          body: `Order ${order.orderNumber}: ${CUSTOMER_FACING_STATUS_LABEL[target]}.${input.reason ? ` ${input.reason}` : ''}`,
          data: { orderId, status: target },
        },
      });
      return result;
    });

    await auditService.log('ORDER_STATUS_CHANGED', 'Order', orderId, ctx, {
      from: order.status,
      to: target,
      by: actor.role,
    });
    return toOrderDTO(updated);
  },

  /** Customer cancels their own order (only while still pending/accepted). */
  async cancelByCustomer(userId: string, orderId: string, ctx: AuditContext) {
    const order = await orderRepository.findById(orderId);
    if (!order || order.userId !== userId) throw new NotFoundError('Order');
    return this.updateStatus(orderId, { status: 'CANCELLED' }, { id: userId, role: RoleName.CUSTOMER }, ctx);
  },

  /** Build a fresh cart from a previous order's still-available items. */
  async reorder(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order || order.userId !== userId) throw new NotFoundError('Order');

    const { cartService } = await import('@/modules/cart/cart.service');
    const skipped: string[] = [];
    for (const item of order.items) {
      if (!item.productId) {
        skipped.push(item.productName);
        continue;
      }
      try {
        await cartService.addItem(userId, item.productId, item.quantity);
      } catch {
        skipped.push(item.productName);
      }
    }
    const summary = await cartService.getSummary(userId);
    return { cart: summary, skipped };
  },
};
