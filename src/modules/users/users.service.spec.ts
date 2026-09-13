import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "src/common/prisma/prisma.service";
import { BcryptService } from "../common/security/bcrypt.service";

describe("UsersService", () => {
  // 1. Define the specific types instead of using 'any'
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

  // 2. Apply the types to our variables
  let fakePrisma: MockPrismaService;
  let fakeBcrypt: MockBcryptService;
  let service: UsersService;
  beforeEach(async () => {
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
