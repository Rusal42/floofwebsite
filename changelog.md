# 🐾 Floofs Den Website Changelog

## Recent Updates

### v2.1.2 - "Cute & Fluffy Makeover" - 2025-08-15

**Description:** Complete website redesign with adorable fluffy theme, real-time bot statistics, and enhanced user experience.

**Features:**
- ✨ **Pink Pastel Theme** - Beautiful gradient backgrounds with cute animations
- 🐾 **Floof's Avatar Showcase** - Bouncing animated profile picture with glowing effects  
- 📊 **Real-time Bot Stats** - Live server count, user count, uptime, and commands used
- 🎨 **Animated Cat Background** - Cute cat gif with sparkle effects
- 🔗 **Support Server Integration** - Direct links to Discord support server
- 🌟 **Enhanced Commands Section** - Organized by category (Gambling, Fun, Moderation, General)
- 🏥 **Cute API Health Page** - Styled health check endpoint with real-time server stats
- 🔄 **Auto-refresh Stats** - Website updates bot statistics every 30 seconds
- 🛡️ **Secure Bot Integration** - JWT authentication and bot API token system
- 📱 **Mobile Responsive** - Works perfectly on all devices

**Technical Improvements:**
- Discord OAuth2 authentication system
- RESTful API endpoints for bot integration
- Persistent stats tracking with file storage
- Command usage counter and uptime calculation
- Automatic disconnection handling
- Environment variable configuration
- Error handling and fallback systems

**Bot Integration:**
- Website stats updater utility (`utils/website-integration.js`)
- Automatic stats posting every 5 minutes
- Command usage tracking
- Uptime percentage calculation
- Changelog update system for future releases

---

## Discord Bot Command Format

For future changelog updates, use this command in your Discord bot:

```
%changelog send "v1.2.1" "Bug Fixes & Improvements" "Fixed various issues and added new features" "features"
```

**Command Parameters:**
- `version` - Version number (e.g., "v1.2.1")
- `title` - Update title (e.g., "Bug Fixes & Improvements") 
- `description` - Brief description of changes
- `type` - Update type ("features", "bugfix", "security", "performance")

**Example Usage:**
```
%changelog send "v2.1.3" "New Gaming Commands" "Added poker, blackjack, and slot machine games with virtual currency system" "features"
```
