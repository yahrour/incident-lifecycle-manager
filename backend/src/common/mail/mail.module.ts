import { Module } from "@nestjs/common";
import { MailService } from "./mail.service";
import { MailerModule } from "@nestjs-modules/mailer";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>("MAIL_HOST"),
          port: config.get<number>("MAIL_PORT"),
          auth: {
            user: config.get<string>("MAIL_USER"),
            pass: config.get<string>("MAIL_PASS"),
          },
        },
        defaults: {
          from: `"${config.get("MAIL_FROM_NAME")}" <${config.get("MAIL_FROM")}>`,
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
