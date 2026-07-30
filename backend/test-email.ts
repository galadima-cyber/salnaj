import { emailService } from "./src/services/email.service";

async function main() {
  try {
    await emailService.sendWelcome(
      "mukhtargaladeema@gmail.com",   // <-- Replace with the email where you want to receive the test
      "Muhammad"
    );

    console.log("✅ Test email sent successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

main();