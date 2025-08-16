const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const WEBSITE_VERSION = process.env.WEBSITE_VERSION || 'v2.1.5';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Discord OAuth2 Configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-this';
const BOT_API_TOKEN = process.env.BOT_API_TOKEN; // used to authenticate bot -> website updates
const DISCORD_API_BASE = 'https://discord.com/api/v10';

// Bot Statistics (these would come from your bot's database in a real implementation)
let botStats = {
    serverCount: 8,
    userCount: 30,
    commandsUsed: 150,
    uptime: 50.0,
    ping: 42
};

// Routes

// Serve the main website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to get bot statistics
app.get('/api/stats', (req, res) => {
    res.json({
        success: true,
        data: botStats
    });
});

// API endpoint to update bot statistics
app.post('/api/update-stats', (req, res) => {
    // simple header-based auth
    const token = req.headers['x-bot-token'];
    if (!BOT_API_TOKEN) {
        return res.status(500).json({ success: false, error: 'Server BOT_API_TOKEN not configured' });
    }
    if (!token || token !== BOT_API_TOKEN) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { serverCount, userCount, commandsUsed, uptime, ping, timestamp } = req.body || {};

    if (serverCount !== undefined) botStats.serverCount = serverCount;
    if (userCount !== undefined) botStats.userCount = userCount;
    if (commandsUsed !== undefined) botStats.commandsUsed = commandsUsed;
    if (uptime !== undefined) botStats.uptime = uptime;
    if (ping !== undefined) botStats.ping = ping;

    // Update timestamp
    botStats.lastUpdated = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

    return res.json({
        success: true,
        message: 'Stats updated successfully',
        data: botStats
    });
});

// Simple health endpoint for uptime checks
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', port: PORT, time: new Date().toISOString(), version: WEBSITE_VERSION, environment: process.env.NODE_ENV || 'development' });
});

// Discord OAuth2 callback
app.post('/api/auth/discord', async (req, res) => {
    try {
        const { code, redirect_uri } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: 'No authorization code provided' });
        }

        // Exchange code for access token
        const tokenResponse = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirect_uri,
                scope: 'identify guilds'
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Discord token exchange failed:', tokenData);
            return res.status(400).json({ success: false, error: 'Failed to exchange code for token' });
        }

        // Get user information
        const userResponse = await fetch(`${DISCORD_API_BASE}/users/@me`, {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            console.error('Discord user fetch failed:', userData);
            return res.status(400).json({ success: false, error: 'Failed to fetch user data' });
        }

        // Get user's guilds (optional, for dashboard features)
        const guildsResponse = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });

        let guildsData = [];
        if (guildsResponse.ok) {
            guildsData = await guildsResponse.json();
        }

        // Create JWT token for our application
        const jwtToken = jwt.sign(
            { 
                userId: userData.id,
                username: userData.username,
                discriminator: userData.discriminator,
                avatar: userData.avatar
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Store tokens (in a real app, you'd store this in a database)
        // For now, we'll just return the JWT token to the client

        res.json({
            success: true,
            token: jwtToken,
            user: {
                id: userData.id,
                username: userData.username,
                discriminator: userData.discriminator,
                avatar: userData.avatar,
                guilds: guildsData.filter(guild => guild.permissions & 0x8) // Only guilds where user has admin permissions
            }
        });

    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get bot statistics
app.get('/api/stats', async (req, res) => {
    try {
        // In a real implementation, you would fetch these stats from your bot's database
        // or directly from the Discord bot client
        
        // You could also make this dynamic by connecting to your bot's process
        // or reading from shared data files/database
        
        res.json({
            success: true,
            data: botStats
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch bot statistics' });
    }
});

// Update bot statistics (called by your bot)
app.post('/api/stats', authenticateBot, (req, res) => {
    try {
        const { serverCount, userCount, commandsUsed, uptime, ping } = req.body;
        
        botStats = {
            serverCount: serverCount || botStats.serverCount,
            userCount: userCount || botStats.userCount,
            commandsUsed: commandsUsed || botStats.commandsUsed,
            uptime: uptime || botStats.uptime,
            ping: ping || botStats.ping
        };
        
        res.json({ success: true, message: 'Stats updated successfully' });
    } catch (error) {
        console.error('Stats update error:', error);
        res.status(500).json({ success: false, error: 'Failed to update statistics' });
    }
});

// Get user dashboard data
app.get('/api/user/dashboard', authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        
        // In a real implementation, you would fetch user-specific data
        // like their servers, settings, etc.
        
        res.json({
            success: true,
            data: {
                user: user,
                servers: [], // Would be populated with user's servers where the bot is present
                settings: {}, // User preferences
                recentActivity: [] // Recent bot usage
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
    }
});

// Middleware to authenticate bot requests
function authenticateBot(req, res, next) {
    const botToken = req.headers['x-bot-token'];
    
    if (!botToken || botToken !== process.env.BOT_API_TOKEN) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    next();
}

// Middleware to authenticate user requests
function authenticateUser(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
}

// Health check endpoint - both JSON API and cute HTML page
app.get('/api/health', (req, res) => {
    const uptime = process.uptime();
    const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;
    
    // If requesting JSON (API call)
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        const shardSnapshot = [{
            id: 0,
            status: 'operational',
            uptime: uptimeFormatted,
            latencyMs: botStats.ping,
            servers: botStats.serverCount,
            users: botStats.userCount,
            updatedAt: new Date().toISOString()
        }];

        return res.json({ 
            success: true,
            status: 'healthy',
            message: '🐾 Floofs Den API is purring along nicely!',
            server: {
                name: 'Floofs Den API',
                version: WEBSITE_VERSION,
                uptime: uptimeFormatted,
                environment: process.env.NODE_ENV || 'development'
            },
            endpoints: {
                stats: '/api/stats',
                auth: '/api/auth/discord',
                health: '/api/health'
            },
            shards: shardSnapshot,
            timestamp: new Date().toISOString(),
            cute_message: '✨ All systems floofy! ✨'
        });
    }
    
    // Otherwise serve cute HTML page
    const htmlPage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🐾 Floofs Den API Health</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow-x: hidden;
            }
            
            body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: url('https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif') center/cover;
                opacity: 0.1;
                z-index: -1;
            }
            
            .health-container {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 25px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(255, 105, 180, 0.3);
                text-align: center;
                max-width: 600px;
                width: 90%;
                border: 3px solid rgba(255, 182, 193, 0.5);
                animation: float 3s ease-in-out infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            .floof-avatar {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                margin: 0 auto 20px;
                border: 5px solid #ff69b4;
                box-shadow: 0 0 30px rgba(255, 105, 180, 0.6);
                animation: bounce 2s infinite;
                background: url('https://cdn.discordapp.com/avatars/1264025932990976041/a_01b2e4c6b9b4e8c8e8c8e8c8e8c8e8c8.gif') center/cover;
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
            
            h1 {
                color: #ff1493;
                font-size: 2.5em;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(255, 105, 180, 0.3);
            }
            
            .status-badge {
                display: inline-block;
                background: linear-gradient(45deg, #32cd32, #98fb98);
                color: white;
                padding: 10px 20px;
                border-radius: 50px;
                font-weight: bold;
                font-size: 1.2em;
                margin: 20px 0;
                box-shadow: 0 5px 15px rgba(50, 205, 50, 0.4);
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            
            .stat-card {
                background: linear-gradient(135deg, #ffeef8, #fff0f5);
                padding: 20px;
                border-radius: 15px;
                border: 2px solid rgba(255, 182, 193, 0.3);
                box-shadow: 0 5px 15px rgba(255, 105, 180, 0.1);
            }
            
            .stat-label {
                color: #ff69b4;
                font-weight: bold;
                font-size: 0.9em;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .stat-value {
                color: #d63384;
                font-size: 1.4em;
                font-weight: bold;
                margin-top: 5px;
            }
            
            .endpoints {
                background: linear-gradient(135deg, #e8f5ff, #f0f8ff);
                padding: 20px;
                border-radius: 15px;
                margin: 20px 0;
                border: 2px solid rgba(135, 206, 250, 0.3);
            }
            
            .endpoints h3 {
                color: #4169e1;
                margin-bottom: 15px;
            }
            
            .endpoint-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid rgba(135, 206, 250, 0.2);
            }
            
            .endpoint-item:last-child {
                border-bottom: none;
            }
            
            .endpoint-path {
                font-family: 'Courier New', monospace;
                background: rgba(135, 206, 250, 0.1);
                padding: 4px 8px;
                border-radius: 5px;
                color: #4169e1;
            }
            
            .cute-message {
                font-size: 1.3em;
                color: #ff1493;
                margin: 20px 0;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(255, 105, 180, 0.3);
            }
            
            .sparkles {
                position: absolute;
                width: 100%;
                height: 100%;
                pointer-events: none;
                overflow: hidden;
            }
            
            .sparkle {
                position: absolute;
                color: #ff69b4;
                font-size: 20px;
                animation: sparkle 3s linear infinite;
            }
            
            @keyframes sparkle {
                0% { transform: translateY(100vh) rotate(0deg); opacity: 1; }
                100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
            }
            
            .back-btn {
                display: inline-block;
                background: linear-gradient(45deg, #ff69b4, #ff1493);
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin-top: 20px;
                transition: transform 0.3s ease;
                box-shadow: 0 5px 15px rgba(255, 105, 180, 0.4);
            }
            
            .back-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 7px 20px rgba(255, 105, 180, 0.6);
            }
        </style>
    </head>
    <body>
        <div class="sparkles">
            <div class="sparkle" style="left: 10%; animation-delay: 0s;">✨</div>
            <div class="sparkle" style="left: 20%; animation-delay: 0.5s;">🌟</div>
            <div class="sparkle" style="left: 30%; animation-delay: 1s;">✨</div>
            <div class="sparkle" style="left: 40%; animation-delay: 1.5s;">💫</div>
            <div class="sparkle" style="left: 50%; animation-delay: 2s;">✨</div>
            <div class="sparkle" style="left: 60%; animation-delay: 2.5s;">🌟</div>
            <div class="sparkle" style="left: 70%; animation-delay: 3s;">✨</div>
            <div class="sparkle" style="left: 80%; animation-delay: 3.5s;">💫</div>
            <div class="sparkle" style="left: 90%; animation-delay: 4s;">✨</div>
        </div>
        
        <div class="health-container">
            <div class="floof-avatar"></div>
            <h1>🐾 Floofs Den API</h1>
            <div class="status-badge">✅ Healthy & Purring!</div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Server Uptime</div>
                    <div class="stat-value">${uptimeFormatted}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Environment</div>
                    <div class="stat-value">${process.env.NODE_ENV || 'Development'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Version</div>
                    <div class="stat-value">${WEBSITE_VERSION}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Status</div>
                    <div class="stat-value">🟢 Online</div>
                </div>
            </div>
            
            <div class="endpoints">
                <h3>🔗 Available Endpoints</h3>
                <div class="endpoint-item">
                    <span>Bot Statistics</span>
                    <span class="endpoint-path">/api/stats</span>
                </div>
                <div class="endpoint-item">
                    <span>Discord Auth</span>
                    <span class="endpoint-path">/api/auth/discord</span>
                </div>
                <div class="endpoint-item">
                    <span>Health Check</span>
                    <span class="endpoint-path">/api/health</span>
                </div>
            </div>
            
            <div class="cute-message">✨ All systems floofy! ✨</div>
            <div style="color: #666; font-size: 0.9em; margin: 10px 0;">
                Last checked: ${new Date().toLocaleString()}
            </div>
            
            <a href="/" class="back-btn">🏠 Back to Home</a>
        </div>
        
        <script>
            // Auto-refresh every 30 seconds
            setTimeout(() => {
                window.location.reload();
            }, 30000);
        </script>
    </body>
    </html>`;
    
    res.send(htmlPage);
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Serve static files for any other routes (SPA fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Floofs Den website server running on port ${PORT}`);
    console.log(`📱 Website: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    
    // Log configuration status
    console.log('\n📋 Configuration:');
    console.log(`   Discord Client ID: ${DISCORD_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Discord Client Secret: ${DISCORD_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   JWT Secret: ${JWT_SECRET !== 'your-jwt-secret-change-this' ? '✅ Set' : '⚠️  Using default (change this!)'}`);
    console.log(`   Bot API Token: ${process.env.BOT_API_TOKEN ? '✅ Set' : '❌ Missing'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
