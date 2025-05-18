#!/bin/sh
echo "Checking environment variables..."
if [ -z "$DISCORD_BOT_TOKEN" ]; then
  echo "ERROR: DISCORD_BOT_TOKEN is not set!"
  exit 1
fi
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set!"
  exit 1
fi
echo "Running Prisma migrations and starting bot..."
npx prisma db pull
node bot.js
