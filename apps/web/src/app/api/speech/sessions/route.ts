import { NextRequest } from "next/server";
import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireUser } from "@/lib/auth-server";
import { createSessionSchema } from "@/server/speech/validation";
import { createSession, listSessionsForUser } from "@/server/speech/session.service";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser();
  const body = createSessionSchema.parse(await request.json());

  const { session, feedback } = await createSession({
    userId: user.id,
    ...body,
  });

  return apiSuccess({ session, feedback }, 201);
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser();
  const pageParam = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  const result = await listSessionsForUser(user.id, page);
  return apiSuccess(result);
});
