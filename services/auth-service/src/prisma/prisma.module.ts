import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { ConfigModule } from "@nestjs/config";
import Joi from "joi";
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string()
          .uri({ scheme: ["postgres", "postgresql"] })
          .required(),
        PORT: Joi.number().port().default(3001),
      }),
    }),
  ],
  providers: [PrismaService],
})
export class PrismaModule {}
