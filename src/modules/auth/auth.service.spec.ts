import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/common/prisma/prisma.service";
import { BcryptService } from "../security/bcrypt.service";
import { MailService } from "@/common/mail/mail.service";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";

describe("AuthService", () => {
  type MockPrismaService = {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };

  type MockBcryptService = {
    hash: jest.Mock;
  };

  type MockMailService = {
    sendEmailChangeVerification: jest.Mock;
  };

  // 2. Declare the mock variables
  let fakePrisma: MockPrismaService;
  let fakeBcrypt: MockBcryptService;
  let fakeMail: MockMailService;
  let service: AuthService;

  beforeEach(async () => {
    // 3. Initialize the mocks
    fakePrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };
    const mockUsersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    const mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };
    fakeBcrypt = {
      hash: jest.fn(),
    };

    fakeMail = {
      sendEmailChangeVerification: jest.fn().mockResolvedValue(true),
    };

    // 4. Build the testing module with all dependencies provided
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
            get: jest.fn((key: string) => {
              if (key === "APP_URL") return "http://localhost:3000";
              return null;
            }),
          },
        },
        { provide: BcryptService, useValue: fakeBcrypt },
        { provide: MailService, useValue: fakeMail },
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService }, // <-- this was missing
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });
  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
