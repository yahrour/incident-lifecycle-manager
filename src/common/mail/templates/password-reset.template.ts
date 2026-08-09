export function passwordResetTemplate(
  name: string,
  resetUrl: string,
  expiresInHours = 3 // must match your actual ResetToken expiresAt duration — keep in sync
): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; max-width: 500px; margin: auto; color: #24292f;">
        <p>Hi ${name},</p>

        <p>We heard that you lost your password for [Your App Name]. Sorry about that!</p>

        <p>But don't worry! You can use the button below to reset your password:</p>

        <p style="margin: 24px 0;">
          <a href="${resetUrl}"
             style="display:inline-block; padding: 10px 24px; background: #1f883d; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Reset your password
          </a>
        </p>

        <p style="color: #57606a; font-size: 13px;">
          If you don't use this link within ${expiresInHours} hour${expiresInHours === 1 ? "" : "s"},
          it will expire. If you didn't request this, you can safely ignore this email.
        </p>

        <p>Thanks,<br>The Pulse Team</p>
      </body>
    </html>
  `;
}
