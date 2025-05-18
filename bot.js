// bot.js
import { Client, GatewayIntentBits, Events } from "discord.js";
import { config } from "dotenv";
import { Buffer } from "node:buffer";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

config(); // Load .env variables

const prisma = new PrismaClient();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`🤖 Bot ready as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const mention = `<@${client.user.id}>`;

  if (!message.content.startsWith(mention)) return;

  const args = message.content.slice(mention.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  if (command === "help") {
    return await message.reply(`
📖 **Available Commands:**
• \`@buddy help\` – Show this message
• \`@buddy count\` – Show total number of subscribers
• \`@buddy latest\` – Show latest subscriber
• \`@buddy find <email>\` – Find subscriber by email
• \`@buddy download\` – Export subscribers as CSV (Admin only)
    `);
  }

  if (command === "count") {
    const count = await prisma.newsletter.count();
    return await message.reply(`📊 Total subscribers: **${count}**`);
  }

  if (command === "latest") {
    const latest = await prisma.newsletter.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (!latest) return await message.reply(`No subscribers found.`);
    return await message.reply(
      `🆕 Latest subscriber: **${latest.name}** (${latest.email})`
    );
  }

  if (command === "find") {
    const email = args[0];
    if (!email) return await message.reply("Please provide an email.");
    const user = await prisma.newsletter.findUnique({ where: { email } });
    if (!user) return await message.reply(`❌ No subscriber found.`);
    return await message.reply(`✅ Found: **${user.name}** (${user.email})`);
  }

  if (command === "gandu") {
    return await message.reply(
      "Sushant is a gandu, and he knows it. He is the one who made emailora."
    );
  }

  if (command === "download" || command === "export") {
    const isAdmin = message.member.roles.cache.some(
      (role) => role.name === "Emailora"
    );

    if (!isAdmin) {
      return await message.reply(
        "⛔ You are not authorized to use this command."
      );
    }

    const subscribers = await prisma.newsletter.findMany();

    if (!subscribers.length) {
      return await message.reply("No subscribers found.");
    }

    const csvRows = [
      ["Name", "Email", "Created At"],
      ...subscribers.map((s) => [s.name, s.email, s.createdAt.toISOString()]),
    ];

    const csvContent = csvRows.map((r) => r.join(",")).join("\n");
    const buffer = Buffer.from(csvContent, "utf-8");

    return await message.reply({
      content: "📎 Exported subscribers:",
      files: [{ attachment: buffer, name: "subscribers.csv" }],
    });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
