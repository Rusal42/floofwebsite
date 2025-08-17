// Discord OAuth2 Configuration
const DISCORD_CLIENT_ID = '1387563676961341461'; // Your Floof bot's client ID
const REDIRECT_URI = encodeURIComponent(window.location.origin + '/auth/callback');
const DISCORD_OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify%20guilds`;

// Bot invite URL with permissions
const BOT_INVITE_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=8&scope=bot`;

// API Configuration (legacy site API; keep for auth/dashboard endpoints if needed)
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const inviteBtn = document.getElementById('inviteBtn');
const inviteBtn2 = document.getElementById('inviteBtn2');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

// Initialize the website
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    setupEventListeners();
    setupSmoothScrolling();
    setupMobileNavigation();
    setupAnimations();
    setupCommandToolbars();
    sortCommandLists();
    setupGlobalCommandsFilter();
    handleAuthCallback();
    fetchAndDisplayBotVersion();
});

// Authentication Functions
function initializeAuth() {
    const token = localStorage.getItem('discord_token');
    const user = localStorage.getItem('discord_user');
    
    if (token && user) {
        updateUIForLoggedInUser(JSON.parse(user));
    }
}

// Command filter toolbar (collapsible with search)
function setupCommandToolbars() {
    document.querySelectorAll('.commands-panel').forEach(panel => {
        // Build toolbar DOM
        const toolbar = document.createElement('div');
        toolbar.className = 'command-toolbar';

        const handle = document.createElement('div');
        handle.className = 'toolbar-handle';
        handle.innerHTML = `
            <div class="toolbar-grip"></div>
            <div class="toolbar-title">Filter commands</div>
        `;

        const content = document.createElement('div');
        content.className = 'toolbar-content';
        content.innerHTML = `
            <input type="text" class="toolbar-search" placeholder="Search commands in this panel..." aria-label="Search commands">
            <div class="toolbar-chips">
                <button type="button" class="chip chip-clear" title="Clear search">Clear</button>
            </div>
        `;

        toolbar.appendChild(handle);
        toolbar.appendChild(content);

        // Insert toolbar at top of panel
        panel.insertAdjacentElement('afterbegin', toolbar);

        // Toggle open/close
        handle.addEventListener('click', () => {
            toolbar.classList.toggle('open');
        });

        // Search behavior confined to this panel
        const searchInput = content.querySelector('.toolbar-search');
        const clearBtn = content.querySelector('.chip-clear');
        const cards = () => Array.from(panel.querySelectorAll('.command'));

        function applyFilter() {
            const q = searchInput.value.trim().toLowerCase();
            cards().forEach(card => {
                const text = card.textContent.toLowerCase();
                const match = text.includes(q);
                card.style.display = match ? '' : 'none';
            });
        }

        searchInput.addEventListener('input', applyFilter);
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            applyFilter();
        });
    });
}

function login() {
    // Redirect to Discord OAuth
    window.location.href = DISCORD_OAUTH_URL;
}

function logout() {
    localStorage.removeItem('discord_token');
    localStorage.removeItem('discord_user');
    updateUIForLoggedOutUser();
}

// Sort commands alphabetically within each commands panel
function sortCommandLists() {
    document.querySelectorAll('.commands-panel .command-list').forEach(list => {
        const items = Array.from(list.children).filter(el => el.classList.contains('command'));
        items.sort((a, b) => {
            // Prefer text inside <code> if present
            const aText = (a.querySelector('code')?.textContent || a.textContent || '').trim().toLowerCase();
            const bText = (b.querySelector('code')?.textContent || b.textContent || '').trim().toLowerCase();
            return aText.localeCompare(bText);
        });
        items.forEach(el => list.appendChild(el));
    });
}

// Global filter bar: chips to switch panels + search across all panels
function setupGlobalCommandsFilter() {
    const container = document.getElementById('global-command-filter');
    if (!container) return;

    const chips = Array.from(container.querySelectorAll('.gcf-chip'));
    const search = container.querySelector('#gcf-search');
    const panels = Array.from(document.querySelectorAll('.commands-panel'));

    function showOnlyPanel(sel) {
        const target = document.querySelector(sel);
        panels.forEach(p => { p.style.display = p === target ? '' : 'none'; });
        // Clear search when switching category
        if (search) search.value = '';
        // Activate chip state
        chips.forEach(c => c.classList.toggle('active', c.getAttribute('data-panel') === sel));
        // Scroll into view if exists
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function clearPanelFilters() {
        chips.forEach(c => c.classList.remove('active'));
    }

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const sel = chip.getAttribute('data-panel');
            showOnlyPanel(sel);
        });
    });

    function applyGlobalSearch() {
        const q = (search?.value || '').trim().toLowerCase();
        if (!q) {
            // If empty search, do not force-show all; respect active chip if any, else show all
            const active = chips.find(c => c.classList.contains('active'));
            if (active) {
                showOnlyPanel(active.getAttribute('data-panel'));
            } else {
                panels.forEach(p => p.style.display = '');
                panels.forEach(p => Array.from(p.querySelectorAll('.command')).forEach(card => card.style.display = ''));
            }
            return;
        }

        // Searching: show all panels, filter cards in each
        clearPanelFilters();
        panels.forEach(p => {
            p.style.display = '';
            const cards = Array.from(p.querySelectorAll('.command'));
            let any = false;
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                const match = text.includes(q);
                card.style.display = match ? '' : 'none';
                if (match) any = true;
            });
            // If no card matches in this panel, hide the whole panel for clarity
            p.style.display = any ? '' : 'none';
        });
    }

    if (search) {
        search.addEventListener('input', applyGlobalSearch);
    }
}

function updateUIForLoggedInUser(user) {
    if (loginBtn) {
        loginBtn.innerHTML = `
            <img src="${user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '/assets/default-avatar.png'}" 
                 alt="${user.username}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;">
            ${user.username}
        `;
        loginBtn.onclick = () => window.location.href = '/dashboard';
    }
}

function updateUIForLoggedOutUser() {
    if (loginBtn) {
        loginBtn.innerHTML = '<i class="fab fa-discord"></i> Login';
        loginBtn.onclick = login;
    }
}

// Handle OAuth callback
function handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        exchangeCodeForToken(code);
    }
}

async function exchangeCodeForToken(code) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/discord`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, redirect_uri: window.location.origin + '/auth/callback' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('discord_token', data.token);
            localStorage.setItem('discord_user', JSON.stringify(data.user));
            
            // Remove code from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            updateUIForLoggedInUser(data.user);
            showNotification('Successfully logged in!', 'success');
        } else {
            showNotification('Login failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Auth error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

// Removed Discord widget integration by request.

function animateNumber(element, targetNumber, suffix = '') {
    const startNumber = 0;
    const duration = 2000;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentNumber = Math.floor(startNumber + (targetNumber - startNumber) * progress);
        element.textContent = formatNumber(currentNumber) + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
}

// Event Listeners
function setupEventListeners() {
    // Login button
    if (loginBtn) {
        loginBtn.addEventListener('click', login);
    }
    
    // Invite buttons
    if (inviteBtn) {
        inviteBtn.addEventListener('click', () => {
            window.open(BOT_INVITE_URL, '_blank');
        });
    }
    
    if (inviteBtn2) {
        inviteBtn2.addEventListener('click', () => {
            window.open(BOT_INVITE_URL, '_blank');
        });
    }
    
    // Navbar scroll effect
    window.addEventListener('scroll', handleNavbarScroll);
    
    // Intersection Observer for animations
    setupScrollAnimations();

    // Feature command panels toggle
    document.querySelectorAll('.feature-toggle').forEach((btn) => {
        btn.addEventListener('click', () => {
            const selector = btn.getAttribute('data-target');
            if (!selector) return;
            const panel = document.querySelector(selector);
            if (!panel) return;

            const isOpen = panel.style.display !== 'none';
            panel.style.display = isOpen ? 'none' : 'block';
            btn.setAttribute('aria-expanded', String(!isOpen));

            if (!isOpen) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    });
}

// Smooth Scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Mobile Navigation
function setupMobileNavigation() {
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
}

// Navbar Scroll Effect
function handleNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(15, 15, 35, 0.98)';
        navbar.style.backdropFilter = 'blur(20px)';
    } else {
        navbar.style.background = 'rgba(15, 15, 35, 0.95)';
        navbar.style.backdropFilter = 'blur(20px)';
    }
}

// Scroll Animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                
                // Trigger number animations for stats
                if (entry.target.classList.contains('stat-card')) {
                    const numberEl = entry.target.querySelector('.stat-number');
                    if (numberEl && !numberEl.dataset.animated) {
                        numberEl.dataset.animated = 'true';
                        const targetNumber = parseInt(numberEl.textContent.replace(/[^\d]/g, ''));
                        if (targetNumber) {
                            animateNumber(numberEl, targetNumber);
                        }
                    }
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.feature-card, .stat-card, .section-title').forEach(el => {
        observer.observe(el);
    });
}

function setupAnimations() {
    // Add staggered animation delays to feature cards
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Add staggered animation delays to command categories
    document.querySelectorAll('.command-category').forEach((category, index) => {
        category.style.animationDelay = `${index * 0.1}s`;
    });
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add notification styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                max-width: 300px;
            }
            .notification-success { background: #00FF7F; }
            .notification-error { background: #FF6B6B; }
            .notification-info { background: #7289DA; }
            .notification.show { transform: translateX(0); }
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}

// Utility Functions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy to clipboard', 'error');
    });
}

// Add copy functionality to command codes
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.command code').forEach(code => {
        code.style.cursor = 'pointer';
        code.title = 'Click to copy';
        
        code.addEventListener('click', () => {
            copyToClipboard(code.textContent);
        });
    });
});

// Error Handling
window.addEventListener('error', (event) => {
    console.error('Website error:', event.error);
});

// Fetch bot version and update footer
async function fetchAndDisplayBotVersion() {
    const el = document.getElementById('botVersion');
    if (!el) return;
    try {
        const res = await fetch('/api/stats', { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        const version = json?.data?.version || json?.version || '—';
        el.textContent = version;
    } catch (_) {
        // leave placeholder
    }
}

// Service Worker Registration (for PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export functions for use in other scripts
window.FloofWebsite = {
    login,
    logout,
    showNotification,
    copyToClipboard
};
