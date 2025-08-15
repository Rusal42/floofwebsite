// Example: How to integrate your Discord bot with the website stats
// Add this code to your Discord bot to automatically update website statistics

const fetch = require('node-fetch'); // npm install node-fetch@2

// Your website API configuration
const WEBSITE_API_URL = 'http://localhost:3000/api/stats';
const BOT_API_TOKEN = process.env.BOT_API_TOKEN; // Same token from your .env file

// Function to update website stats (call this from your Discord bot)
async function updateWebsiteStats(client) {
    try {
        // Calculate real bot statistics
        const serverCount = client.guilds.cache.size;
        const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        
        // You'll need to track these in your bot
        const commandsUsed = getCommandUsageCount(); // Implement this function
        const uptime = calculateUptimePercentage(); // Implement this function
        const ping = client.ws.ping;

        // Send stats to website
        const response = await fetch(WEBSITE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-bot-token': BOT_API_TOKEN
            },
            body: JSON.stringify({
                serverCount,
                userCount,
                commandsUsed,
                uptime,
                ping
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Website stats updated successfully');
        } else {
            console.error('❌ Failed to update website stats:', result.error);
        }
    } catch (error) {
        console.error('❌ Error updating website stats:', error);
    }
}

// Example: Update stats every 5 minutes
function startStatsUpdater(client) {
    // Update immediately when bot starts
    updateWebsiteStats(client);
    
    // Then update every 5 minutes
    setInterval(() => {
        updateWebsiteStats(client);
    }, 5 * 60 * 1000); // 5 minutes
}

// Example helper functions (implement these in your bot)
function getCommandUsageCount() {
    // Return the total number of commands used
    // You'll need to track this in your bot's database or memory
    return 150; // Replace with actual count
}

function calculateUptimePercentage() {
    // Calculate your bot's uptime percentage
    // You could track disconnections and calculate percentage
    return 50.0; // Replace with actual uptime calculation
}

// Example usage in your Discord bot's ready event:
/*
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Start the stats updater
    startStatsUpdater(client);
});
*/

module.exports = {
    updateWebsiteStats,
    startStatsUpdater
};
