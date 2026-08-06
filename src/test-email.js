const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "b63dd58e1a6c66",
    pass: "ca7af59611632e",
  },
});

async function runTest() {
  try {
    await transport.sendMail({
      from: '"My NestJS App" <system@your-app.com>',
      to: "sosofian849@gmail.com", // Mailtrap will catch this!
      subject: "Test from Mailtrap Sandbox",
      html: "<h1>It works!</h1><p>Mailtrap caught the email perfectly.</p>",
    });
    console.log("✅ Success! Go check your Mailtrap Inbox.");
  } catch (error) {
    console.error("❌ Failed:", error);
  }
}

runTest();
