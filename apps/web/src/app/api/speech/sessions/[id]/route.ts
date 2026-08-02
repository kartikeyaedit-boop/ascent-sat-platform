import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireUser } from "@/lib/auth-server";
import { getSessionForUser } from "@/server/speech/session.service";

export const GET = withErrorHandling(
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await params;
    const session = await getSessionForUser(id, user.id);
    return apiSuccess({ session });
  },
);
