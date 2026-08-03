export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const AuthErrors = {
  emailTaken: () =>
    new AppError(
      "EMAIL_TAKEN",
      "An account with this email already exists.",
      409,
    ),
  invalidCredentials: () =>
    new AppError("INVALID_CREDENTIALS", "Invalid email or password.", 401),
  emailNotVerified: () =>
    new AppError(
      "EMAIL_NOT_VERIFIED",
      "Please verify your email before logging in.",
      403,
    ),
  invalidOrExpiredToken: () =>
    new AppError("INVALID_TOKEN", "This link is invalid or has expired.", 400),
  unauthenticated: () =>
    new AppError("UNAUTHENTICATED", "You must be logged in to do that.", 401),
  notFound: () => new AppError("NOT_FOUND", "User not found.", 404),
};

export const SpeechErrors = {
  sessionNotFound: () =>
    new AppError("NOT_FOUND", "Session not found.", 404),
};

export const GamificationErrors = {
  itemNotFound: () =>
    new AppError("NOT_FOUND", "Shop item not found.", 404),
  alreadyOwned: () =>
    new AppError("ALREADY_OWNED", "You already own this item.", 409),
  insufficientCoins: () =>
    new AppError("INSUFFICIENT_COINS", "You don't have enough coins for this.", 402),
  notOwned: () =>
    new AppError("NOT_OWNED", "You don't own this item.", 403),
  achievementNotFound: () =>
    new AppError("NOT_FOUND", "Achievement not found.", 404),
};
