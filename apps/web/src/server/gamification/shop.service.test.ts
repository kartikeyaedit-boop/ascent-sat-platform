import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn() },
    purchase: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    shopItem: { upsert: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { listShopForUser, purchaseItem, equipItem, unequipItem } from "./shop.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listShopForUser", () => {
  it("marks a title and a pet as equipped independently", async () => {
    mockedPrisma.purchase.findMany.mockResolvedValue([
      { shopItem: { key: "wordsmith" } },
      { shopItem: { key: "pet_fox" } },
    ] as never);
    mockedPrisma.user.findUniqueOrThrow.mockResolvedValue({
      equippedTitle: { key: "wordsmith" },
      equippedPet: { key: "pet_fox" },
    } as never);

    const result = await listShopForUser("user_1");

    expect(result.find((i) => i.key === "wordsmith")?.equipped).toBe(true);
    expect(result.find((i) => i.key === "pet_fox")?.equipped).toBe(true);
    expect(result.find((i) => i.key === "pet_kitten")?.equipped).toBe(false);
  });

  it("includes category, emoji, and rarity for every item", async () => {
    mockedPrisma.purchase.findMany.mockResolvedValue([] as never);
    mockedPrisma.user.findUniqueOrThrow.mockResolvedValue({
      equippedTitle: null,
      equippedPet: null,
    } as never);

    const result = await listShopForUser("user_1");

    expect(result.every((i) => i.category === "TITLE" || i.category === "PET")).toBe(true);
    expect(result.every((i) => i.emoji.length > 0)).toBe(true);
    expect(result.every((i) => ["COMMON", "RARE", "EPIC", "LEGENDARY"].includes(i.rarity))).toBe(true);
  });
});

describe("purchaseItem", () => {
  it("throws NOT_FOUND for an unknown item key", async () => {
    await expect(purchaseItem("user_1", "not_real")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws INSUFFICIENT_COINS when the user can't afford it", async () => {
    mockedPrisma.shopItem.upsert.mockResolvedValue({ id: "shop_1" } as never);
    mockedPrisma.purchase.findUnique.mockResolvedValue(null);
    mockedPrisma.user.findUniqueOrThrow.mockResolvedValue({ coins: 10 } as never);

    await expect(purchaseItem("user_1", "wordsmith")).rejects.toMatchObject({
      code: "INSUFFICIENT_COINS",
    });
  });

  it("throws ALREADY_OWNED if the user already owns it", async () => {
    mockedPrisma.shopItem.upsert.mockResolvedValue({ id: "shop_1" } as never);
    mockedPrisma.purchase.findUnique.mockResolvedValue({ id: "purchase_1" } as never);
    mockedPrisma.user.findUniqueOrThrow.mockResolvedValue({ coins: 1000 } as never);

    await expect(purchaseItem("user_1", "wordsmith")).rejects.toMatchObject({
      code: "ALREADY_OWNED",
    });
  });

  it("deducts coins and records the purchase on success", async () => {
    mockedPrisma.shopItem.upsert.mockResolvedValue({ id: "shop_1" } as never);
    mockedPrisma.purchase.findUnique.mockResolvedValue(null);
    mockedPrisma.user.findUniqueOrThrow.mockResolvedValue({ coins: 1000 } as never);
    mockedPrisma.purchase.create.mockResolvedValue({} as never);
    mockedPrisma.user.update.mockResolvedValue({ coins: 950 } as never);

    const result = await purchaseItem("user_1", "wordsmith");

    expect(mockedPrisma.purchase.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user_1", shopItemId: "shop_1" }) }),
    );
    expect(result.coins).toBe(950);
  });
});

describe("equipItem", () => {
  it("throws NOT_OWNED if the user hasn't purchased it", async () => {
    mockedPrisma.shopItem.findUnique.mockResolvedValue({ id: "shop_1" } as never);
    mockedPrisma.purchase.findUnique.mockResolvedValue(null);

    await expect(equipItem("user_1", "wordsmith")).rejects.toMatchObject({ code: "NOT_OWNED" });
  });

  it("equips a title into equippedTitleId, not equippedPetId", async () => {
    mockedPrisma.shopItem.findUnique.mockResolvedValue({ id: "shop_1" } as never);
    mockedPrisma.purchase.findUnique.mockResolvedValue({ id: "purchase_1" } as never);
    mockedPrisma.user.update.mockResolvedValue({} as never);

    await equipItem("user_1", "wordsmith");

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { equippedTitleId: "shop_1" } }),
    );
  });

  it("equips a pet into equippedPetId, not equippedTitleId", async () => {
    mockedPrisma.shopItem.findUnique.mockResolvedValue({ id: "shop_2" } as never);
    mockedPrisma.purchase.findUnique.mockResolvedValue({ id: "purchase_2" } as never);
    mockedPrisma.user.update.mockResolvedValue({} as never);

    await equipItem("user_1", "pet_fox");

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { equippedPetId: "shop_2" } }),
    );
  });
});

describe("unequipItem", () => {
  it("clears only equippedTitleId when unequipping a title", async () => {
    mockedPrisma.user.update.mockResolvedValue({} as never);
    await unequipItem("user_1", "TITLE");
    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { equippedTitleId: null } }),
    );
  });

  it("clears only equippedPetId when unequipping a pet", async () => {
    mockedPrisma.user.update.mockResolvedValue({} as never);
    await unequipItem("user_1", "PET");
    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { equippedPetId: null } }),
    );
  });
});
