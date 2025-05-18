# Use official Node.js LTS image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the code
COPY . .

# Make startup script executable
RUN chmod +x /app/start.sh

# Generate Prisma client without pulling (will do that at runtime)
RUN npx prisma generate

# Start the bot using the startup script
CMD ["/app/start.sh"]
