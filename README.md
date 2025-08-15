# Floofs Den Website

A modern, professional website and authentication portal for the Floofs Den Discord Bot. Features Discord OAuth2 integration, real-time bot statistics, and a beautiful responsive design.

## 🌟 Features

- **Discord OAuth2 Authentication** - Secure login with Discord accounts
- **Real-time Bot Statistics** - Live server count, user count, and performance metrics
- **Responsive Design** - Beautiful UI that works on all devices
- **Modern Animations** - Smooth scrolling, fade-in effects, and interactive elements
- **Bot Invitation** - Easy bot invitation with proper permissions
- **Dashboard Ready** - Backend prepared for user dashboard features

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- A Discord application with bot configured
- Basic knowledge of Discord OAuth2

### Installation

1. **Clone or download the website files**
   ```bash
   cd floofwebsite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example environment file
   copy .env.example .env
   
   # Edit .env with your Discord application details
   notepad .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Visit your website**
   Open http://localhost:3000 in your browser

## ⚙️ Configuration

### Discord Application Setup

1. **Go to Discord Developer Portal**
   - Visit https://discord.com/developers/applications
   - Select your bot application

2. **Configure OAuth2**
   - Go to OAuth2 → General
   - Add redirect URI: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`

3. **Get your credentials**
   - Copy Client ID and Client Secret
   - Add them to your `.env` file

### Environment Variables

```bash
# Required - Get from Discord Developer Portal
DISCORD_CLIENT_ID=your_bot_client_id
DISCORD_CLIENT_SECRET=your_bot_client_secret

# Required - Generate a secure random string
JWT_SECRET=your_secure_jwt_secret

# Required - Create a secure token for bot API calls
BOT_API_TOKEN=your_secure_api_token

# Optional - Server port (default: 3000)
PORT=3000
```

### Frontend Configuration

Update the following values in `script.js`:

```javascript
// Replace with your actual bot client ID
const DISCORD_CLIENT_ID = 'your_bot_client_id';

// Replace with your actual API domain
const API_BASE_URL = 'https://your-api-domain.com/api';
```

## 🔧 Integration with Your Bot

### Updating Bot Statistics

Your Discord bot can send statistics to the website using the API:

```javascript
// Example: Update bot stats from your Discord bot
const updateStats = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-bot-token': process.env.BOT_API_TOKEN
            },
            body: JSON.stringify({
                serverCount: client.guilds.cache.size,
                userCount: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
                commandsUsed: totalCommandsUsed,
                uptime: 99.9,
                ping: client.ws.ping
            })
        });
        
        const data = await response.json();
        console.log('Stats updated:', data);
    } catch (error) {
        console.error('Failed to update stats:', error);
    }
};

// Call this function periodically (e.g., every 5 minutes)
setInterval(updateStats, 5 * 60 * 1000);
```

## 📁 File Structure

```
floofwebsite/
├── index.html          # Main website page
├── styles.css          # Website styling
├── script.js           # Frontend JavaScript
├── server.js           # Backend Express server
├── package.json        # Node.js dependencies
├── .env.example        # Environment variables template
├── .env               # Your environment variables (create this)
└── README.md          # This file
```

## 🌐 API Endpoints

### Public Endpoints

- `GET /` - Main website
- `GET /api/health` - Health check
- `GET /api/stats` - Get bot statistics
- `POST /api/auth/discord` - Discord OAuth2 callback

### Protected Endpoints

- `POST /api/stats` - Update bot statistics (requires bot token)
- `GET /api/user/dashboard` - Get user dashboard data (requires user auth)

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
   ```bash
   # Use secure, production values
   DISCORD_CLIENT_ID=your_production_client_id
   DISCORD_CLIENT_SECRET=your_production_client_secret
   JWT_SECRET=very_secure_random_string_here
   BOT_API_TOKEN=secure_bot_api_token
   PORT=3000
   ```

2. **Update OAuth2 Redirect URI**
   - In Discord Developer Portal
   - Add your production domain: `https://yourdomain.com/auth/callback`

3. **Update Frontend Configuration**
   ```javascript
   // In script.js
   const API_BASE_URL = 'https://yourdomain.com/api';
   ```

### Hosting Options

- **Heroku**: Easy deployment with git integration
- **Railway**: Modern hosting with automatic deployments
- **DigitalOcean**: VPS hosting with more control
- **Vercel/Netlify**: For static hosting (frontend only)

### Example Deployment Commands

```bash
# Build for production
npm install --production

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start server.js --name "floof-website"
```

## 🔒 Security Notes

- **Never commit your `.env` file** - Add it to `.gitignore`
- **Use strong JWT secrets** - Generate random strings for production
- **Enable HTTPS** - Use SSL certificates in production
- **Validate all inputs** - The backend includes basic validation
- **Rate limiting** - Consider adding rate limiting for production

## 🛠️ Development

### Available Scripts

```bash
npm start      # Start production server
npm run dev    # Start development server with auto-reload
npm test       # Run tests (not implemented yet)
```

### Adding New Features

1. **Frontend**: Edit `index.html`, `styles.css`, and `script.js`
2. **Backend**: Add new routes in `server.js`
3. **Styling**: All CSS is in `styles.css` with CSS variables for easy theming

## 🐛 Troubleshooting

### Common Issues

1. **"Client ID not found" error**
   - Check your `.env` file has correct `DISCORD_CLIENT_ID`
   - Verify the client ID in `script.js` matches

2. **OAuth2 redirect error**
   - Ensure redirect URI in Discord matches exactly
   - Check for trailing slashes and http vs https

3. **Stats not updating**
   - Verify `BOT_API_TOKEN` matches between bot and website
   - Check bot is calling the correct API endpoint

4. **Website not loading**
   - Check if port 3000 is available
   - Verify all dependencies are installed with `npm install`

### Getting Help

- Check the browser console for JavaScript errors
- Check server logs for backend errors
- Verify all environment variables are set correctly

## 📝 License

MIT License - feel free to modify and use for your own Discord bot projects!

## 🤝 Contributing

This website was created for the Floofs Den Discord Bot. Feel free to adapt it for your own bot projects or contribute improvements!

---

**Happy coding! 🎉**
