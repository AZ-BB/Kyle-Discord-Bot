# Discord Lookup Bot

A simple Discord bot with a `/lookup` command that returns a greeting message.

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following content:
   ```
   DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
   ```
   Replace `YOUR_BOT_TOKEN_HERE` with your actual Discord bot token.

4. Start the bot:
   ```
   npm start
   ```

## Commands

- `/lookup` - Returns a greeting message

## Adding to Your Discord Server

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application
3. Go to the "OAuth2" tab and then "URL Generator"
4. Select the "bot" and "applications.commands" scopes
5. Select permissions: "Send Messages" and "Use Slash Commands"
6. Copy the generated URL and open it in a browser
7. Select the server where you want to add the bot and follow the prompts 