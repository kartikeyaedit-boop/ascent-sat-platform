/**
 * Static shop catalog — same pattern as achievements.ts. No avatar system
 * exists yet, so the entire catalog is profile title badges, purchasable
 * with coins earned from practicing and equippable one at a time. Prices
 * are roughly tuned against calculateSessionCoins (5-15 coins/session).
 */

export interface ShopItemDefinition {
  key: string;
  name: string;
  price: number;
}

export const SHOP_ITEMS: ShopItemDefinition[] = [
  { key: "wordsmith", name: "Wordsmith", price: 50 },
  { key: "clear_voice", name: "Clear Voice", price: 75 },
  { key: "rising_star", name: "Rising Star", price: 100 },
  { key: "storyteller", name: "Storyteller", price: 150 },
  { key: "silver_tongue", name: "Silver Tongue", price: 200 },
  { key: "podium_pro", name: "Podium Pro", price: 275 },
  { key: "orator", name: "Orator", price: 350 },
  { key: "speech_legend", name: "Speech Legend", price: 500 },
];
