/** Cart management + live pricing summary (delivery fee, free-delivery threshold). */
import { cartRepository, type CartWithItems } from '@/repositories/cart.repository';
import { productRepository } from '@/repositories/catalog.repository';
import { settingsService } from '@/modules/settings/settings.service';
import { BadRequestError, NotFoundError } from '@/core/errors/app-error';
import { moneyToNumber } from '@/core/utils/money';

export interface CartItemDTO {
  productId: string;
  name: string;
  unitLabel: string;
  price: number;
  mrp: number;
  quantity: number;
  lineTotal: number;
  image: string | null;
  inStock: boolean;
  availableStock: number;
}

export interface CartSummaryDTO {
  items: CartItemDTO[];
  itemCount: number;
  subtotal: number;
  savings: number;
  deliveryFee: number;
  total: number;
  minOrderSubtotal: number;
  meetsMinimum: boolean;
  freeDeliveryAboveSubtotal: number;
}

function buildSummary(cart: CartWithItems, config: Awaited<ReturnType<typeof settingsService.getStoreConfig>>): CartSummaryDTO {
  const items: CartItemDTO[] = cart.items.map((item) => {
    const price = moneyToNumber(item.product.price);
    const mrp = moneyToNumber(item.product.mrp);
    const stock = item.product.inventory?.stock ?? 0;
    const inStock = !!item.product.inventory && !item.product.inventory.isOutOfStock && stock > 0;
    return {
      productId: item.productId,
      name: item.product.name,
      unitLabel: item.product.unitLabel,
      price,
      mrp,
      quantity: item.quantity,
      lineTotal: Number((price * item.quantity).toFixed(2)),
      image: item.product.images[0]?.url ?? null,
      inStock,
      availableStock: stock,
    };
  });

  const subtotal = Number(items.reduce((s, i) => s + i.lineTotal, 0).toFixed(2));
  const savings = Number(items.reduce((s, i) => s + (i.mrp - i.price) * i.quantity, 0).toFixed(2));
  const deliveryFee = subtotal >= config.freeDeliveryAboveSubtotal || subtotal === 0 ? 0 : config.deliveryFee;

  return {
    items,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    savings,
    deliveryFee,
    total: Number((subtotal + deliveryFee).toFixed(2)),
    minOrderSubtotal: config.minOrderSubtotal,
    meetsMinimum: subtotal >= config.minOrderSubtotal,
    freeDeliveryAboveSubtotal: config.freeDeliveryAboveSubtotal,
  };
}

export const cartService = {
  async getSummary(userId: string): Promise<CartSummaryDTO> {
    const [cart, config] = await Promise.all([cartRepository.getOrCreate(userId), settingsService.getStoreConfig()]);
    return buildSummary(cart, config);
  },

  async addItem(userId: string, productId: string, quantity: number): Promise<CartSummaryDTO> {
    const product = await productRepository.findById(productId);
    if (!product || !product.isActive) throw new NotFoundError('Product');
    const stock = product.inventory?.stock ?? 0;
    if (!product.inventory || product.inventory.isOutOfStock || stock <= 0) {
      throw new BadRequestError('Product is out of stock');
    }
    if (quantity > stock) throw new BadRequestError(`Only ${stock} unit(s) available`);

    await cartRepository.upsertItem(userId, productId, quantity);
    return this.getSummary(userId);
  },

  async updateItem(userId: string, productId: string, quantity: number): Promise<CartSummaryDTO> {
    if (quantity <= 0) {
      await cartRepository.removeItem(userId, productId);
      return this.getSummary(userId);
    }
    return this.addItem(userId, productId, quantity);
  },

  async removeItem(userId: string, productId: string): Promise<CartSummaryDTO> {
    await cartRepository.removeItem(userId, productId);
    return this.getSummary(userId);
  },

  async clear(userId: string): Promise<CartSummaryDTO> {
    await cartRepository.clear(userId);
    return this.getSummary(userId);
  },
};
