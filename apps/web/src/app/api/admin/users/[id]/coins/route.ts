import { NextRequest } from "next/server";
import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireAdmin } from "@/lib/auth-server";
import { adjustCoinsSchema } from "@/server/admin/validation";
import { adjustUserCoins } from "@/server/admin/admin.service";

export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = await params;
    const { delta } = adjustCoinsSchema.parse(await request.json());
    const result = await adjustUserCoins(id, delta);
    return apiSuccess(result);
  },
);
