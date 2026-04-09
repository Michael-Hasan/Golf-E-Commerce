import { AuthService } from "./auth.service";
import { UserRole } from "../users/user-role.enum";
import type { User } from "../users/user.entity";
import type { JwtService } from "@nestjs/jwt";
import type { AppLogger } from "../logging/logger.service";

describe("AuthService", () => {
  let authService: AuthService;
  const mockJwt: { signAsync: jest.Mock; verifyAsync: jest.Mock } = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const mockLogger: AppLogger = {
    withContext: jest.fn().mockReturnThis(),
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  } as unknown as AppLogger;

  beforeEach(() => {
    process.env.ADMIN_EMAILS = "";
    jest.clearAllMocks();
    authService = new AuthService({} as any, mockJwt as unknown as JwtService, mockLogger);
  });

  afterAll(() => {
    delete process.env.ADMIN_EMAILS;
  });

  it("flags admin emails regardless of case or whitespace", () => {
    process.env.ADMIN_EMAILS = "admin@example.com, OTHER@domain.COM ";
    expect((authService as any).isAdminEmail(" Admin@example.com ")).toBe(true);
    expect((authService as any).isAdminEmail("other@domain.com")).toBe(true);
    expect((authService as any).isAdminEmail("user@domain.com")).toBe(false);
  });

  it("masks malformed addresses to unknown", () => {
    expect((authService as any).maskEmail("not-an-email")).toBe("unknown");
    expect((authService as any).maskEmail("")).toBe("unknown");
  });

  it("masks normal emails with asterisks", () => {
    const masked = (authService as any).maskEmail("Sales@Greenlinks.COM");
    expect(masked).toBe("sa***@greenlinks.com");
  });

  it("issues access and refresh tokens with the proper payload shape", async () => {
    const user = {
      id: "user-id",
      email: "player@example.com",
      role: UserRole.CUSTOMER,
    } as User;
    mockJwt.signAsync
      .mockResolvedValueOnce("access-token")
      .mockResolvedValueOnce("refresh-token");

    const tokens = await (authService as any).issueTokens(user);

    expect(tokens).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    expect(mockJwt.signAsync).toHaveBeenCalledTimes(2);
    expect(mockJwt.signAsync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ tokenType: "access" }),
      expect.objectContaining({ expiresIn: expect.any(String) }),
    );
    expect(mockJwt.signAsync).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ tokenType: "refresh" }),
      expect.objectContaining({
        expiresIn: expect.any(String),
        secret: expect.any(String),
      }),
    );
  });
});
