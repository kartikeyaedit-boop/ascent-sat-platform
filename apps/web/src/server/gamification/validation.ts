import { z } from "zod";

export const shopItemKeySchema = z.object({
  key: z.string().min(1).max(50),
});

export const shopCategorySchema = z.object({
  category: z.enum(["TITLE", "PET"]),
});
