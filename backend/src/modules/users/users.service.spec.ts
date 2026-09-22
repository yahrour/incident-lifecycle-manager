import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "@/common/prisma/prisma.service";
import { BcryptService } from "../security/bcrypt.service";

describe("UsersService", () => {
  // 1. Define the mock types
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

  // 2. Declare the mock variables
  let fakePrisma: MockPrismaService;
  let fakeBcrypt: MockBcryptService;
  let service: UsersService;

  beforeEach(async () => {
    // 3. Initialize the mocks
    fakePrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    fakeBcrypt = {
      hash: jest.fn(),
    };

    // 4. Build the testing module with all dependencies provided
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: fakePrisma,
        },
        {
          provide: BcryptService,
          useValue: fakeBcrypt,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
