// templates/email-confirmation.template.ts
interface EmailConfirmationOptions {
  name: string;
  confirmUrl: string;
  heading: string;
  message: string;
}

export function emailConfirmationTemplate({
  name,
  confirmUrl,
  heading,
  message,
}: EmailConfirmationOptions): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; max-width: 500px; margin: auto;">
        <h2>${heading}</h2>
        <p>Hi ${name},</p>
        <p>${message}</p>
        <a href="${confirmUrl}" style="display:inline-block; padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">
          Confirm Email
        </a>
        <p style="color: #666; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      </body>
    </html>
  `;
}
