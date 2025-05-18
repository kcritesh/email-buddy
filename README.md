# Discord Bot

A Discord bot that provides newsletter management, crypto information, and entertainment features.

## Requirements

- Node.js v16 or higher
- PostgreSQL database
- Discord Bot Token

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DATABASE_URL=postgres://username:password@hostname:port/database_name
```

## Local Development

1. Install dependencies:

   ```
   npm install
   ```

2. Generate Prisma client:

   ```
   npx prisma generate
   ```

3. Pull the database schema (or run migrations):

   ```
   npx prisma db pull
   ```

4. Start the bot:
   ```
   node bot.js
   ```

## Docker Deployment

1. Create a `.env` file with your environment variables

2. Build the Docker image:

   ```
   docker build -t discord-bot .
   ```

3. Run the container with environment variables:
   ```
   docker run --env-file .env discord-bot
   ```

## Troubleshooting

- **Invalid Token Error**: Make sure your DISCORD_BOT_TOKEN is correct and valid
- **Database Connection Issues**: Verify your DATABASE_URL is accessible from where the bot is running
- **Permission Errors**: Ensure your bot has the required permissions in your Discord server
