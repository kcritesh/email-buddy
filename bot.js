// bot.js
import { Client, GatewayIntentBits, Events } from "discord.js";
import { config } from "dotenv";
import { Buffer } from "node:buffer";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

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

🪙 **Crypto Commands:**
• \`@buddy price <symbol>\` – Get current price (e.g., BTC, ETH)
• \`@buddy cryptonews\` – Get latest crypto news
• \`@buddy marketcap <symbol>\` – Get market cap for a coin
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

  // CryptoCompare API - get current price
  if (command === "price") {
    const coin = (args[0] || "BTC").toUpperCase();

    try {
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/price?fsym=${coin}&tsyms=USD,EUR`
      );

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.USD) {
        return await message.reply(
          `💹 **${coin}**: $${parseFloat(
            data.USD
          ).toLocaleString()} (€${parseFloat(data.EUR).toLocaleString()})`
        );
      } else {
        return await message.reply(
          "❌ Invalid coin symbol. Try something like BTC, ETH, SOL, etc."
        );
      }
    } catch (error) {
      console.error("CryptoCompare API error:", error);
      return await message.reply(
        "❌ Error fetching price data. Try again later."
      );
    }
  }

  // CryptoCompare API - get latest news
  if (command === "cryptonews") {
    try {
      const response = await fetch(
        "https://min-api.cryptocompare.com/data/v2/news/?lang=EN"
      );
      const data = await response.json();

      if (data.Data && data.Data.length > 0) {
        const news = data.Data.slice(0, 3); // Get top 3 news

        let reply = "📰 **Latest Crypto News:**\n\n";
        news.forEach((item) => {
          reply += `**${item.title}**\n${item.url}\n\n`;
        });

        return await message.reply(reply);
      } else {
        return await message.reply("❌ No news available at the moment.");
      }
    } catch (error) {
      console.error("CryptoCompare API error:", error);
      return await message.reply(
        "❌ Error fetching crypto news. Try again later."
      );
    }
  }

  // CryptoCompare API - get market cap
  if (command === "marketcap") {
    const coin = (args[0] || "BTC").toUpperCase();

    try {
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${coin}&tsyms=USD`
      );
      const data = await response.json();

      if (data.DISPLAY && data.DISPLAY[coin] && data.DISPLAY[coin].USD) {
        const coinData = data.DISPLAY[coin].USD;

        return await message.reply(`
💰 **${coin}/USD Market Data:**
Price: ${coinData.PRICE}
24h Change: ${coinData.CHANGEPCT24HOUR}%
Market Cap: ${coinData.MKTCAP}
Volume 24h: ${coinData.VOLUME24HOUR}
        `);
      } else {
        return await message.reply(
          `❌ Couldn't find data for ${coin}. Try a valid coin symbol like BTC, ETH, SOL, etc.`
        );
      }
    } catch (error) {
      console.error("CryptoCompare API error:", error);
      return await message.reply(
        "❌ Error fetching market data. Try again later."
      );
    }
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
