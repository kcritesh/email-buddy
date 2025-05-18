// bot.js
import { Client, GatewayIntentBits, Events } from "discord.js";
import { config } from "dotenv";
import { Buffer } from "node:buffer";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

// Load .env variables
const result = config();
if (result.error) {
  console.warn(
    "Warning: .env file not found or could not be parsed. Using process.env values."
  );
} else {
  console.log("Environment variables loaded from .env");
}

// Clean up the token in case it has quotes
const token = process.env.DISCORD_BOT_TOKEN?.replace(/["']/g, "");

// Validate critical environment variables
if (!token) {
  console.error("ERROR: DISCORD_BOT_TOKEN environment variable is missing!");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is missing!");
  process.exit(1);
}

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

  // Bahun Ko Khasi dialogues array
  const khasi_quotes = [
    "He he he, hasayo muji!",
    "Paji Bahun!",
    "Chup muji!",
    "Haina ho Serey!",
    "Yo khasi ta Bahun ko ho!",
    "Aba k garne, Kothe? Khasi ta jungle bhagyo!",
    "Paji Bahun ko khasi le sabaiko mukh ma hawa lagaidyo!",
    "Ma janchu? Tero bau jancha, muji! Sanga sanga hid!",
    "Oi Kothe, yo khasi her na, kati ramro! Dashainko bali perfect cha!",
  ];

  // Dialogue scenes array
  const dialogue_scenes = [
    `**Scene: Kothebahadur and Sherbahadur spot a goat for Dashain**

Sherbahadur: "Oi Kothe, yo khasi her na, kati ramro! Dashainko bali perfect cha!"
Kothebahadur: "He he he, hasayo muji! Yo khasi ta Bahun ko ho, paji Bahun le kinya hola!"
Sherbahadur: "Haina ho Serey, yo khasi ta kei paisa ma bikcha? Lutna parcha!"
Kothebahadur: "Chup muji, chor banna khojya ho? Bahun ko khasi choryo bhane Dashain bigrincha!"`,

    `**Scene: The goat escapes, leading to chaos**

Sherbahadur: "Aba k garne, Kothe? Khasi ta jungle bhagyo!"
Kothebahadur: "Paji Bahun ko khasi le sabaiko mukh ma hawa lagaidyo! Ja, samatna ja!"
Sherbahadur: "Ma janchu? Tero bau jancha, muji! Sanga sanga hid!"
Kothebahadur: "He he he, hasayo muji! Thik cha, jaam jungle!"`,

    `**Scene: Arguing about who will catch the goat**

Kothebahadur: "Oi Shere, ta agadi ja, khasi samat!"
Sherbahadur: "Ma agadi? Tero dimag thik cha? Ta ja na!"
Kothebahadur: "Haina ho Serey, ta bhanda ma dhilo daudinchu!"
Sherbahadur: "Chup muji! Aba dubai jana jaam, khasi bagyo!"`,
  ];

  // Command: Random Bahun Ko Khasi quote
  if (command === "nepquote") {
    const randomQuote =
      khasi_quotes[Math.floor(Math.random() * khasi_quotes.length)];
    return await message.reply(`🇳🇵 **Bahun Ko Khasi Quote:** ${randomQuote}`);
  }

  // Command: "hasayo" meme response
  if (command === "hasayo") {
    return await message.reply("🤣 **He he he, hasayo muji!**");
  }

  // Command: Information about Bahun Ko Khasi
  if (command === "bahunko") {
    return await message.reply(`
🎬 **Bahun Ko Khasi by Official Twake Production**

A popular Nepali comedy video famous for its raw street-style humor and iconic dialogues. The video follows the misadventures of characters like Kothebahadur and Sherbahadur around Dashain festival and a goat (Khasi).

👨‍👨‍👦 **Main Characters:**
• Kothebahadur 
• Sherbahadur

🗣️ **Famous Dialogues:**
• "He he he, hasayo muji!"
• "Paji Bahun!"
• "Chup muji!"
• "Haina ho Serey!"
    `);
  }

  // Command: Random dialogue scene
  if (command === "dialogue") {
    const randomScene =
      dialogue_scenes[Math.floor(Math.random() * dialogue_scenes.length)];
    return await message.reply(randomScene);
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

client.login(token).catch((error) => {
  console.error("Failed to login with Discord token:", error.message);
  console.error(
    "Please check that your Discord bot token is valid and try again."
  );
  process.exit(1);
});
