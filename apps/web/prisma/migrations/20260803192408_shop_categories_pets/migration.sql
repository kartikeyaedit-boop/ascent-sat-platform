-- CreateEnum
CREATE TYPE "ShopItemCategory" AS ENUM ('TITLE', 'PET');

-- CreateEnum
CREATE TYPE "ShopItemRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- AlterTable
ALTER TABLE "shop_items" ADD COLUMN     "category" "ShopItemCategory" NOT NULL DEFAULT 'TITLE',
ADD COLUMN     "emoji" TEXT NOT NULL DEFAULT '🏷️',
ADD COLUMN     "rarity" "ShopItemRarity" NOT NULL DEFAULT 'COMMON';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "equippedPetId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_equippedPetId_fkey" FOREIGN KEY ("equippedPetId") REFERENCES "shop_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
