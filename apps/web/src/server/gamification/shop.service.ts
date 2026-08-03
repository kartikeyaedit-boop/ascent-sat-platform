import { prisma } from "@/lib/prisma";
import { GamificationErrors } from "@/lib/errors";
import { SHOP_ITEMS } from "./shop-items";

export interface ShopListItem {
  key: string;
  name: string;
  price: number;
  owned: boolean;
  equipped: boolean;
}

export async function listShopForUser(userId: string): Promise<ShopListItem[]> {
  const [purchases, user] = await Promise.all([
    prisma.purchase.findMany({
      where: { userId },
      select: { shopItem: { select: { key: true } } },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { equippedTitle: { select: { key: true } } },
    }),
  ]);

  const ownedKeys = new Set(purchases.map((p) => p.shopItem.key));

  return SHOP_ITEMS.map((item) => ({
    key: item.key,
    name: item.name,
    price: item.price,
    owned: ownedKeys.has(item.key),
    equipped: user.equippedTitle?.key === item.key,
  }));
}

export async function purchaseItem(userId: string, itemKey: string) {
  const definition = SHOP_ITEMS.find((item) => item.key === itemKey);
  if (!definition) throw GamificationErrors.itemNotFound();

  // Lazily upsert the DB row from the static catalog, same pattern as
  // achievement unlocking — the catalog in code is the source of truth.
  const shopItem = await prisma.shopItem.upsert({
    where: { key: definition.key },
    update: {},
    create: { key: definition.key, name: definition.name, price: definition.price },
  });

  const [existingPurchase, user] = await Promise.all([
    prisma.purchase.findUnique({
      where: { userId_shopItemId: { userId, shopItemId: shopItem.id } },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { coins: true } }),
  ]);

  if (existingPurchase) throw GamificationErrors.alreadyOwned();
  if (user.coins < definition.price) throw GamificationErrors.insufficientCoins();

  const [, updatedUser] = await Promise.all([
    prisma.purchase.create({
      data: { userId, shopItemId: shopItem.id, pricePaid: definition.price },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { coins: { decrement: definition.price } },
      select: { coins: true },
    }),
  ]);

  return { coins: updatedUser.coins };
}

export async function equipItem(userId: string, itemKey: string) {
  const definition = SHOP_ITEMS.find((item) => item.key === itemKey);
  if (!definition) throw GamificationErrors.itemNotFound();

  const shopItem = await prisma.shopItem.findUnique({ where: { key: itemKey } });
  const owned =
    shopItem &&
    (await prisma.purchase.findUnique({
      where: { userId_shopItemId: { userId, shopItemId: shopItem.id } },
    }));
  if (!owned || !shopItem) throw GamificationErrors.notOwned();

  await prisma.user.update({ where: { id: userId }, data: { equippedTitleId: shopItem.id } });
  return { equippedTitle: shopItem.name };
}

export async function unequipItem(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { equippedTitleId: null } });
}
