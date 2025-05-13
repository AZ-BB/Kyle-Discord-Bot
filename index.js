const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
require('dotenv').config();

// Global error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Continue running despite the error
});

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
  // Continue running despite the error
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

// Error handling for Discord client errors
client.on('error', (error) => {
  console.error('Discord Client Error:', error);
  // Don't exit, just log the error
});

client.on('shardError', (error) => {
  console.error('Websocket connection error:', error);
});

// Command definitions
const commands = [
  {
    name: 'lookup',
    description: 'Returns stock information URL',
    options: [
      {
        name: 'ticker',
        type: 3, // STRING type
        description: 'The stock ticker symbol',
        required: true
      }
    ]
  }
];

// Register commands when the bot is ready
client.once('ready', async () => {
  try {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Bot is in ${client.guilds.cache.size} server(s):`);
    
    // Log the names of all servers the bot is in
    client.guilds.cache.forEach(guild => {
      console.log(` - ${guild.name} (ID: ${guild.id}, ${guild.memberCount} members)`);
    });
    
    try {
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
      
      console.log('Started refreshing application (/) commands.');
      
      // Register commands globally
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands },
      );
      
      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error('Error refreshing commands:', error);
      // Continue anyway so the bot can operate with existing commands
    }
  } catch (error) {
    console.error('Error in ready event:', error);
  }
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  try {
    if (!interaction.isCommand()) return;
    
    const { commandName } = interaction;
    
    if (commandName === 'lookup') {
      try {
        // Acknowledge the interaction immediately to prevent timeout
        await interaction.deferReply();
        
        // Get ticker and clean it (remove special characters, only keep alphanumeric)
        let ticker = interaction.options.getString('ticker');
        
        // Remove any $ prefix and other special characters
        ticker = ticker.replace(/[^\w]/g, '');
        
        if (!ticker) {
          await interaction.editReply('Please provide a valid ticker symbol.');
          return;
        }
        
        const url = `https://stockanalysis.com/stocks/${ticker.toLowerCase()}/statistics/?ref=saveontrading`;
        await interaction.editReply(`Stock information for ${ticker.toLowerCase()}: [click here](${url})`);
      } catch (error) {
        console.error('Error processing lookup command:', error);
        
        // Try to respond to the user even if there was an error
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: 'There was an error processing your command.' });
          } else {
            await interaction.reply({ content: 'There was an error processing your command.', ephemeral: true });
          }
        } catch (replyError) {
          console.error('Error sending error response:', replyError);
        }
      }
    }
  } catch (error) {
    console.error('Error in interaction handler:', error);
  }
});

// Reconnection handling
client.on('disconnect', (event) => {
  console.log('Bot disconnected from Discord:', event);
  console.log('Attempting to reconnect...');
});

client.on('reconnecting', () => {
  console.log('Bot reconnecting to Discord...');
});

client.on('resume', (replayed) => {
  console.log(`Bot reconnected to Discord. Replayed ${replayed} events.`);
});

// Login with retry mechanism
const loginWithRetry = (token, maxRetries = 5, retryDelay = 5000) => {
  let attempts = 0;

  const attempt = () => {
    attempts++;
    console.log(`Login attempt ${attempts}/${maxRetries}`);

    client.login(token).catch(error => {
      console.error('Login error:', error);
      
      if (attempts < maxRetries) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);
        setTimeout(attempt, retryDelay);
      } else {
        console.error('Max retry attempts reached. Please check your token and connection.');
      }
    });
  };

  attempt();
};

// Start the bot with login retry mechanism
loginWithRetry(process.env.DISCORD_TOKEN);

// Periodic check to ensure bot is still connected
setInterval(() => {
  if (!client.ws.connected) {
    console.log('Connection check failed, bot appears to be offline. Attempting to reconnect...');
    client.destroy().then(() => loginWithRetry(process.env.DISCORD_TOKEN));
  } else {
    console.log('Connection check passed, bot is online.');
  }
}, 30 * 60 * 1000); // Check every 30 minutes 