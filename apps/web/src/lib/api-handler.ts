import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Wraps a route handler, translating thrown errors into a consistent JSON shape. */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AppError) {
        return apiError(err.code, err.message, err.status);
      }
      if (err instanceof ZodError) {
        return apiError(
          "VALIDATION_ERROR",
          err.issues.map((i) => i.message).join(", "),
          422,
        );
      }
      console.error("Unhandled API error:", err);
      return apiError("INTERNAL_ERROR", "Something went wrong.", 500);
    }
  };
}
