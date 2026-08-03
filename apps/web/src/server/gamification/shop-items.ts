/**
 * Static shop catalog — same pattern as achievements.ts. Two categories:
 * profile titles and collectible pets, each equipped independently (a user
 * can have one title and one pet equipped at once). "Images" are emoji
 * rather than actual asset files — zero-cost, zero asset pipeline, and
 * they render everywhere without a CDN.
 *
 * Pricing is a deliberate long-term progression curve against
 * calculateSessionCoins (5-15 coins/session, ~10 average): common items
 * are a first-week goal, rare a first-month goal, epic a real commitment,
 * and legendary (10k-15k) is a months-long chase — something to keep
 * practicing toward, not something a few sessions casually unlocks.
 */

export type ShopItemCategory = "TITLE" | "PET";
export type ShopItemRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export interface ShopItemDefinition {
  key: string;
  name: string;
  category: ShopItemCategory;
  emoji: string;
  rarity: ShopItemRarity;
  price: number;
}

export const SHOP_ITEMS: ShopItemDefinition[] = [
  // --- Titles ---
  { key: "wordsmith", name: "Wordsmith", category: "TITLE", emoji: "🖊️", rarity: "COMMON", price: 100 },
  { key: "clear_voice", name: "Clear Voice", category: "TITLE", emoji: "🎤", rarity: "COMMON", price: 150 },
  { key: "rising_star", name: "Rising Star", category: "TITLE", emoji: "⭐", rarity: "COMMON", price: 200 },
  { key: "storyteller", name: "Storyteller", category: "TITLE", emoji: "📖", rarity: "RARE", price: 600 },
  { key: "silver_tongue", name: "Silver Tongue", category: "TITLE", emoji: "🥈", rarity: "RARE", price: 900 },
  { key: "podium_pro", name: "Podium Pro", category: "TITLE", emoji: "🏆", rarity: "EPIC", price: 2500 },
  { key: "orator", name: "Orator", category: "TITLE", emoji: "🎙️", rarity: "EPIC", price: 3500 },
  { key: "speech_legend", name: "Speech Legend", category: "TITLE", emoji: "👑", rarity: "LEGENDARY", price: 10000 },

  // --- Pets ---
  { key: "pet_chick", name: "Chick", category: "PET", emoji: "🐥", rarity: "COMMON", price: 80 },
  { key: "pet_kitten", name: "Kitten", category: "PET", emoji: "🐱", rarity: "COMMON", price: 120 },
  { key: "pet_puppy", name: "Puppy", category: "PET", emoji: "🐶", rarity: "COMMON", price: 120 },
  { key: "pet_turtle", name: "Turtle", category: "PET", emoji: "🐢", rarity: "COMMON", price: 150 },
  { key: "pet_butterfly", name: "Butterfly", category: "PET", emoji: "🦋", rarity: "COMMON", price: 200 },
  { key: "pet_fox", name: "Fox", category: "PET", emoji: "🦊", rarity: "RARE", price: 700 },
  { key: "pet_owl", name: "Owl", category: "PET", emoji: "🦉", rarity: "RARE", price: 900 },
  { key: "pet_panda", name: "Panda", category: "PET", emoji: "🐼", rarity: "RARE", price: 1100 },
  { key: "pet_wolf", name: "Wolf", category: "PET", emoji: "🐺", rarity: "RARE", price: 1300 },
  { key: "pet_lion", name: "Lion", category: "PET", emoji: "🦁", rarity: "EPIC", price: 3000 },
  { key: "pet_unicorn", name: "Unicorn", category: "PET", emoji: "🦄", rarity: "EPIC", price: 4000 },
  { key: "pet_dragon", name: "Dragon", category: "PET", emoji: "🐉", rarity: "LEGENDARY", price: 15000 },
];
