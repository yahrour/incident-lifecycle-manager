export function inviteTemplate(teamName: string, inviteLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif;">
        <h2>You've been invited to join ${teamName}</h2>
        <a href="${inviteLink}">Accept invite</a>
      </body>
    </html>
  `;
}
