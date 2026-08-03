import { z } from "zod";

export const adjustCoinsSchema = z.object({
  delta: z.number().int().min(-100000).max(100000).refine((n) => n !== 0, {
    message: "Amount must not be zero.",
  }),
});
