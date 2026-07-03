# Opalescent Prism Bot

Prism is the official custom Discord bot for Opalescent Esports.

## Setup Instructions

### 1. Create the Discord Application
- Go to the [Discord Developer Portal](https://discord.com/developers/applications).
- Click "New Application" and name it "Prism".
- Go to the "Bot" tab and add a bot.
- Under "Privileged Gateway Intents", enable if necessary for future updates (currently none are strictly required, but Server Members Intent might be needed later for role management).

### 2. Invite the Bot
Generate an invite link in the Developer Portal under OAuth2 -> URL Generator:
- Scopes: `bot`, `applications.commands`
- Bot Permissions:
  - View Channels
  - Send Messages
  - Use Slash Commands
  - Embed Links
  - Attach Files
  - Read Message History

### 3. Installation
Ensure you have Node.js installed (v16.11.0 or newer for discord.js v14).
Clone the project and install dependencies:

```bash
npm install
```

### 4. Configuration
Rename `.env.example` to `.env` and fill in the required variables:
- `BOT_TOKEN`: Your bot's token from the Developer Portal.
- `CLIENT_ID`: The Application ID from the Developer Portal.
- `GUILD_ID`: The ID of your Opalescent Esports Discord server.

### 5. Deploy Slash Commands
Before starting the bot for the first time, or whenever you add new slash commands, run:

```bash
npm run deploy-commands
```

### 6. Start the Bot
Run the bot using:

```bash
npm start
```

## Opalescent Server Setup

Once the bot is running, you can use the `/setup-opalescent` command to automatically create the full role hierarchy, category structure, channels, permissions, and starter messages.

### Running the Setup

1. **Temporarily grant the bot Administrator:** Ensure the bot's role (Prism) has the `Administrator` permission in your server settings, and ensure the bot role is positioned at the top of the role list so it can manage other roles.
2. Run the command: `/setup-opalescent confirm: CONFIRM`
3. Wait for the setup to complete. The bot will send a text file containing the setup logs.
4. **Security Check:** Remove the `Administrator` permission from the bot's role after the setup completes.

### Manual Post-Setup Steps

After the automatic setup, complete these manual steps:

1. **Enable Community:** Go to Server Settings > Enable Community.
2. **Set Rules Channel:** In the Community settings, set `#rules` as the official rules channel.
3. **Set up Rules Screening:** Go to Safety Setup -> DM and Spam Protection to enable member verification and rules screening.
4. **Set up Onboarding:** Go to Server Settings > Onboarding and configure it to help users self-assign roles.
5. **Create Onboarding Prompts:**
   * **Question 1:** "What do you want to see?"
     * Call of Duty → assign `Call of Duty` role
     * League of Legends → assign `League of Legends` role
     * Tryouts / Competitive → assign `Tryouts` role
     * Events → assign `Event Pings` role
     * Content → assign `Content Pings` role
     * Just the community → no game role needed
   * **Question 2:** "What pings do you want?"
     * Match Pings → assign `Match Pings`
     * Event Pings → assign `Event Pings`
     * Content Pings → assign `Content Pings`
     * Giveaway Pings → assign `Giveaway Pings`
6. **Test the Server:** Use a non-admin account (or "View Server As Role") to verify that normal users cannot see `COD TEAM`, `LOL TEAM`, `CREATOR HQ`, `STAFF HQ`, or `ORG OPERATIONS`.
