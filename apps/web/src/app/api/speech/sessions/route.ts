import { NextRequest } from "next/server";
import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireUser } from "@/lib/auth-server";
import { createSessionSchema } from "@/server/speech/validation";
import { createSession } from "@/server/speech/session.service";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser();
  const body = createSessionSchema.parse(await request.json());

  const { session, feedback } = await createSession({
    userId: user.id,
    ...body,
  });

  return apiSuccess({ session, feedback }, 201);
});
