// mail.service.ts
import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { emailConfirmationTemplate } from "./templates/email-confirmation.template";
import { inviteTemplate } from "./templates/invite.template";

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendEmailVerification(to: string, name: string, verifyUrl: string) {
    await this.mailerService.sendMail({
      to,
      subject: "Verify your email address",
      html: emailConfirmationTemplate({
        name,
        confirmUrl: verifyUrl,
        heading: "Verify your email",
        message:
          "Click below to verify your email address and activate your account.",
      }),
    });
  }

  async sendEmailChangeVerification(
    to: string,
    name: string,
    verifyUrl: string
  ) {
    await this.mailerService.sendMail({
      to,
      subject: "Confirm your new email address",
      html: emailConfirmationTemplate({
        name,
        confirmUrl: verifyUrl,
        heading: "Confirm your new email",
        message: "Click below to confirm this is your new email address.",
      }),
    });
  }

  async sendInvite(to: string, teamName: string, inviteLink: string) {
    await this.mailerService.sendMail({
      to,
      subject: `You've been invited to join ${teamName}`,
      html: inviteTemplate(teamName, inviteLink),
    });
  }
}
