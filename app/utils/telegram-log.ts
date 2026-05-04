export const sendTelegramLog = async (tag: string, log: any) => {
  const date = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  const message = `
        📌 *${tag.toUpperCase()}*
        📅 *Waktu:* ${date}
        📝 *Log:* \`\`\`json
        ${JSON.stringify(log, null, 2)}
        \`\`\`
        `.trim();

  const botToken = "5956888143:AAEtWhLDbdtc7U6LRTOY-m_ZyrvN6Poof0A";
  const chatId = "-850044576";
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (error) {
    console.error("Gagal mengirim log ke Telegram:", error);
  }
};
