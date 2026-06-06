/**
 * Prisma seed — idempotent.
 * Seeds roles, an admin, a seller, a demo customer, categories, products,
 * inventory and core app settings. Safe to run multiple times.
 *
 * Run with: `npm run db:seed`
 */
import { PrismaClient, RoleName, ProductUnit, type Category } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seedRoles() {
  const roles: { name: RoleName; description: string }[] = [
    { name: RoleName.CUSTOMER, description: 'End customer placing orders' },
    { name: RoleName.SELLER, description: 'Store operator managing catalog & orders' },
    { name: RoleName.ADMIN, description: 'Platform administrator' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  return prisma.role.findMany();
}

async function main() {
  console.log('🌱 Seeding database...');

  const roles = await seedRoles();
  const roleByName = (name: RoleName) => roles.find((r) => r.name === name)!.id;

  // ── Users ──────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { phone: '9000000001' },
    update: {},
    create: {
      phone: '9000000001',
      name: 'Natural greenkart Admin',
      email: 'admin@aggrimart.app',
      roleId: roleByName(RoleName.ADMIN),
    },
  });

  const seller = await prisma.user.upsert({
    where: { phone: '9000000002' },
    update: {},
    create: {
      phone: '9000000002',
      name: 'Fresh Mart Store',
      email: 'seller@aggrimart.app',
      roleId: roleByName(RoleName.SELLER),
    },
  });

  await prisma.user.upsert({
    where: { phone: '9000000003' },
    update: {},
    create: {
      phone: '9000000003',
      name: 'Demo Customer',
      email: 'customer@aggrimart.app',
      roleId: roleByName(RoleName.CUSTOMER),
    },
  });

  // ── Categories ─────────────────────────────────────────────────────────
  const categoryData = [
    { name: 'Fresh Vegetables', sortOrder: 1, imageUrl: 'https://images.aggrimart.app/cat/vegetables.png' },
    { name: 'Fresh Fruits', sortOrder: 2, imageUrl: 'https://images.aggrimart.app/cat/fruits.png' },
    { name: 'Dairy & Eggs', sortOrder: 3, imageUrl: 'https://images.aggrimart.app/cat/dairy.png' },
    { name: 'Atta, Rice & Dal', sortOrder: 4, imageUrl: 'https://images.aggrimart.app/cat/staples.png' },
    { name: 'Masala & Oil', sortOrder: 5, imageUrl: 'https://images.aggrimart.app/cat/masala.png' },
    { name: 'Snacks & Beverages', sortOrder: 6, imageUrl: 'https://images.aggrimart.app/cat/snacks.png' },
  ];

  const categories: Category[] = [];
  for (const c of categoryData) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: { sortOrder: c.sortOrder, imageUrl: c.imageUrl },
      create: { ...c, slug: slugify(c.name) },
    });
    categories.push(category);
  }
  const catId = (name: string) => categories.find((c) => c.name === name)!.id;

  // ── Products ───────────────────────────────────────────────────────────
  const productData: Array<{
    name: string;
    category: string;
    price: number;
    mrp: number;
    unit: ProductUnit;
    unitLabel: string;
    stock: number;
    image: string;
  }> = [
    { name: 'Tomato', category: 'Fresh Vegetables', price: 28, mrp: 40, unit: ProductUnit.KG, unitLabel: '1 kg', stock: 120, image: 'tomato.png' },
    { name: 'Onion', category: 'Fresh Vegetables', price: 32, mrp: 45, unit: ProductUnit.KG, unitLabel: '1 kg', stock: 200, image: 'onion.png' },
    { name: 'Potato', category: 'Fresh Vegetables', price: 30, mrp: 38, unit: ProductUnit.KG, unitLabel: '1 kg', stock: 180, image: 'potato.png' },
    { name: 'Cauliflower', category: 'Fresh Vegetables', price: 25, mrp: 35, unit: ProductUnit.PIECE, unitLabel: '1 pc (~500 g)', stock: 60, image: 'cauliflower.png' },
    { name: 'Banana (Robusta)', category: 'Fresh Fruits', price: 38, mrp: 50, unit: ProductUnit.DOZEN, unitLabel: '6 pcs', stock: 90, image: 'banana.png' },
    { name: 'Apple (Shimla)', category: 'Fresh Fruits', price: 140, mrp: 180, unit: ProductUnit.KG, unitLabel: '1 kg', stock: 70, image: 'apple.png' },
    { name: 'Pomegranate', category: 'Fresh Fruits', price: 120, mrp: 160, unit: ProductUnit.KG, unitLabel: '500 g', stock: 40, image: 'pomegranate.png' },
    { name: 'Amul Toned Milk', category: 'Dairy & Eggs', price: 27, mrp: 28, unit: ProductUnit.ML, unitLabel: '500 ml', stock: 150, image: 'milk.png' },
    { name: 'Farm Eggs', category: 'Dairy & Eggs', price: 84, mrp: 96, unit: ProductUnit.PACK, unitLabel: '12 pcs', stock: 80, image: 'eggs.png' },
    { name: 'Aashirvaad Atta', category: 'Atta, Rice & Dal', price: 245, mrp: 280, unit: ProductUnit.KG, unitLabel: '5 kg', stock: 50, image: 'atta.png' },
    { name: 'Toor Dal', category: 'Atta, Rice & Dal', price: 160, mrp: 190, unit: ProductUnit.KG, unitLabel: '1 kg', stock: 65, image: 'toordal.png' },
    { name: 'Fortune Sunflower Oil', category: 'Masala & Oil', price: 135, mrp: 160, unit: ProductUnit.LITRE, unitLabel: '1 L', stock: 70, image: 'oil.png' },
  ];

  for (const p of productData) {
    const slug = slugify(p.name);
    const product = await prisma.product.upsert({
      where: { slug },
      update: { price: p.price, mrp: p.mrp },
      create: {
        name: p.name,
        slug,
        description: `Fresh ${p.name} sourced daily for best quality.`,
        categoryId: catId(p.category),
        sellerId: seller.id,
        price: p.price,
        mrp: p.mrp,
        unit: p.unit,
        unitLabel: p.unitLabel,
      },
    });

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: { stock: p.stock, isOutOfStock: p.stock <= 0 },
      create: { productId: product.id, stock: p.stock, isOutOfStock: p.stock <= 0 },
    });

    const existingImage = await prisma.productImage.findFirst({ where: { productId: product.id } });
    if (!existingImage) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `https://images.aggrimart.app/products/${p.image}`,
          alt: p.name,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    }
  }

  // ── App settings ───────────────────────────────────────────────────────
  const settings: Array<{ key: string; value: unknown }> = [
    { key: 'store.name', value: 'Natural greenkart Fresh Store' },
    { key: 'store.isOpen', value: true },
    { key: 'delivery.fee', value: 25 },
    { key: 'delivery.freeAboveSubtotal', value: 299 },
    { key: 'order.minSubtotal', value: 99 },
    { key: 'order.codEnabled', value: true },
    { key: 'support.phone', value: '1800-200-300' },
  ];
  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value as object },
      create: { key: s.key, value: s.value as object },
    });
  }

  console.log('✅ Seed complete:');
  console.log(`   Admin    → phone 9000000001`);
  console.log(`   Seller   → phone 9000000002`);
  console.log(`   Customer → phone 9000000003`);
  console.log(`   ${categories.length} categories, ${productData.length} products`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
