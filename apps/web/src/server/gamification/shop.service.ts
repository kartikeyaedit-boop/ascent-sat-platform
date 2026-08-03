import { prisma } from "@/lib/prisma";
import { GamificationErrors } from "@/lib/errors";
import { SHOP_ITEMS, type ShopItemCategory, type ShopItemRarity } from "./shop-items";

export interface ShopListItem {
  key: string;
  name: string;
  category: ShopItemCategory;
  emoji: string;
  rarity: ShopItemRarity;
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
      select: {
        equippedTitle: { select: { key: true } },
        equippedPet: { select: { key: true } },
      },
    }),
  ]);

  const ownedKeys = new Set(purchases.map((p) => p.shopItem.key));
  const equippedKeys = new Set(
    [user.equippedTitle?.key, user.equippedPet?.key].filter((k): k is string => Boolean(k)),
  );

  return SHOP_ITEMS.map((item) => ({
    key: item.key,
    name: item.name,
    category: item.category,
    emoji: item.emoji,
    rarity: item.rarity,
    price: item.price,
    owned: ownedKeys.has(item.key),
    equipped: equippedKeys.has(item.key),
  }));
}

/** Lazily upserts (and re-syncs) the DB row from the static catalog, same
 * pattern as achievement unlocking — the catalog in code is the source of
 * truth, so a price/rarity change in code corrects existing rows too. */
async function upsertShopItemRow(definition: (typeof SHOP_ITEMS)[number]) {
  return prisma.shopItem.upsert({
    where: { key: definition.key },
    update: {
      name: definition.name,
      category: definition.category,
      emoji: definition.emoji,
      rarity: definition.rarity,
      price: definition.price,
    },
    create: {
      key: definition.key,
      name: definition.name,
      category: definition.category,
      emoji: definition.emoji,
      rarity: definition.rarity,
      price: definition.price,
    },
  });
}

export async function purchaseItem(userId: string, itemKey: string) {
  const definition = SHOP_ITEMS.find((item) => item.key === itemKey);
  if (!definition) throw GamificationErrors.itemNotFound();

  const shopItem = await upsertShopItemRow(definition);

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

  // Titles and pets occupy separate slots — equipping a pet never affects
  // an already-equipped title, and vice versa.
  await prisma.user.update({
    where: { id: userId },
    data:
      definition.category === "PET"
        ? { equippedPetId: shopItem.id }
        : { equippedTitleId: shopItem.id },
  });

  return { name: shopItem.name, category: definition.category };
}

export async function unequipItem(userId: string, category: ShopItemCategory) {
  await prisma.user.update({
    where: { id: userId },
    data: category === "PET" ? { equippedPetId: null } : { equippedTitleId: null },
  });
}
