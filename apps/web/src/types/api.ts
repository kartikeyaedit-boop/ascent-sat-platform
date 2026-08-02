export interface ApiErrorBody {
  error: { code: string; message: string };
}

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: "STUDENT" | "ADMIN";
  emailVerified: boolean;
  createdAt: string;
}
