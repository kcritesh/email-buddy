# Use official Node.js LTS image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Start the bot
CMD ["node", "bot.js"]
