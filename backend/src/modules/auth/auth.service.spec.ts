import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/common/prisma/prisma.service";
import { BcryptService } from "../security/bcrypt.service";
import { MailService } from "@/common/mail/mail.service";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import {
  NotFoundException,
  GoneException,
} from "@nestjs/common";

describe("AuthService", () => {
  // We strictly define SafeMock to avoid 'any'
  type SafeMock = jest.Mock<unknown, unknown[]>;

  type MockPrismaService = {
    $transaction: jest.Mock<
      Promise<unknown>,
      [(prisma: MockPrismaService) => Promise<unknown>]
    >;
    user: {
      findUnique: SafeMock;
      create: SafeMock;
      delete: SafeMock;
      update: SafeMock;
    };
    emailVerificationToken: {
      findUnique: SafeMock;
      update: SafeMock;
    };
  };

  type MockBcryptService = {
    hash: SafeMock;
  };

  type MockMailService = {
    sendEmailChangeVerification: SafeMock;
  };

  let fakePrisma: MockPrismaService;
  let fakeBcrypt: MockBcryptService;
  let fakeMail: MockMailService;
  let service: AuthService;

  beforeEach(async () => {
    // 1. We add <unknown, unknown[]> to every jest.fn() to prevent ESLint 'any' errors
    fakePrisma = {
      $transaction: jest.fn(
        async (callback: (prisma: MockPrismaService) => Promise<unknown>) => {
          return await callback(fakePrisma);
        }
      ),
      user: {
        findUnique: jest.fn<unknown, unknown[]>(),
        create: jest.fn<unknown, unknown[]>(),
        delete: jest.fn<unknown, unknown[]>(),
        update: jest.fn<unknown, unknown[]>(),
      },
      emailVerificationToken: {
        findUnique: jest.fn<unknown, unknown[]>(),
        update: jest.fn<unknown, unknown[]>(),
      },
    };

    const mockUsersService = {
      create: jest.fn<unknown, unknown[]>(),
      findByEmail: jest.fn<unknown, unknown[]>(),
      findById: jest.fn<unknown, unknown[]>(),
    };

    const mockJwtService = {
      signAsync: jest.fn<unknown, unknown[]>(),
      verifyAsync: jest.fn<unknown, unknown[]>(),
    };

    fakeBcrypt = {
      hash: jest.fn<unknown, unknown[]>(),
    };

    fakeMail = {
      sendEmailChangeVerification: jest
        .fn<unknown, unknown[]>()
        .mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: fakePrisma,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn<unknown, unknown[]>((key: unknown) => {
              if (key === "APP_URL") return "http://localhost:3000";
              return null;
            }),
          },
        },
        { provide: BcryptService, useValue: fakeBcrypt },
        { provide: MailService, useValue: fakeMail },
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("verifySignupEmail", () => {
    it("throws NotFoundException when token doesn't exist", async () => {
      fakePrisma.emailVerificationToken.findUnique.mockResolvedValue(null);

      await expect(service.verifySignupEmail("badtoken")).rejects.toThrow(
        NotFoundException
      );
    });

    it("throws GoneException when token is expired", async () => {
      fakePrisma.emailVerificationToken.findUnique.mockResolvedValue({
        expiresAt: new Date(Date.now() - 1000),
        used: false,
        user: { isVerified: false },
      });

      await expect(service.verifySignupEmail("token")).rejects.toThrow(
        GoneException
      );
    });

    it("returns already verified response when token already used", async () => {
      fakePrisma.emailVerificationToken.findUnique.mockResolvedValue({
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        used: true,
        user: { isVerified: false },
      });

      await expect(service.verifySignupEmail("token")).resolves.toEqual({
        message: "Email already verified",
        alreadyVerified: true,
      });
    });

    it("returns already verified response when account already verified", async () => {
      fakePrisma.emailVerificationToken.findUnique.mockResolvedValue({
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        used: false,
        user: { isVerified: true },
      });

      await expect(service.verifySignupEmail("token")).resolves.toEqual({
        message: "Email already verified",
        alreadyVerified: true,
      });
    });

    it("marks token used and verifies user on success", async () => {
      fakePrisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: "token-id",
        userId: "user-id",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        used: false,
        user: { isVerified: false },
      });

      const result = await service.verifySignupEmail("token");

      expect(fakePrisma.emailVerificationToken.update).toHaveBeenCalledWith({
        where: { id: "token-id" },
        data: { used: true },
      });

      expect(fakePrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-id" },
        data: { isVerified: true },
      });

      expect(result).toEqual({ message: "Email verified successfully" });
    });
  });
});
