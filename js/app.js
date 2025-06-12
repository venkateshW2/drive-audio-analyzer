// App state
let currentToken = null;

// DOM elements
const elements = {
    loginView: document.getElementById('loginView'),
    appView: document.getElementById('appView'),
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    userInfo: document.getElementById('userInfo'),
    userName: document.getElementById('userName'),
    userAvatar: document.getElementById('userAvatar'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Utility functions
function showLoading() {
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

function showApp() {
    elements.loginView.classList.add('hidden');
    elements.appView.classList.remove('hidden');
}

function showLogin() {
    elements.loginView.classList.remove('hidden');
    elements.appView.classList.add('hidden');
}

// Auth handling
async function handleLogin() {
    try {
        const token = window.authFunctions.getAccessTokenFromUrl();
        
        if (token) {
            showLoading();
            
            // Store token
            localStorage.setItem('driveToken', token);
            currentToken = token;
            
            // Get user info
            const userInfo = await window.authFunctions.getUserInfo(token);
            
            // Update UI
            elements.userName.textContent = userInfo.name;
            elements.userAvatar.src = userInfo.picture;
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Show app
            showApp();
            hideLoading();
            
            console.log('✅ Login successful!', userInfo);
        } else {
            // Check for stored token
            const storedToken = localStorage.getItem('driveToken');
            if (storedToken) {
                showLoading();
                currentToken = storedToken;
                
                try {
                    const userInfo = await window.authFunctions.getUserInfo(storedToken);
                    elements.userName.textContent = userInfo.name;
                    elements.userAvatar.src = userInfo.picture;
                    showApp();
                    console.log('✅ Auto-login successful!', userInfo);
                } catch (error) {
                    console.log('❌ Stored token invalid, showing login');
                    localStorage.removeItem('driveToken');
                    showLogin();
                }
                hideLoading();
            } else {
                showLogin();
            }
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        alert('Login failed. Please try again.');
        localStorage.removeItem('driveToken');
        showLogin();
        hideLoading();
    }
}

function handleLogout() {
    localStorage.removeItem('driveToken');
    currentToken = null;
    showLogin();
    console.log('✅ Logged out successfully');
}

// Event listeners
elements.loginBtn.addEventListener('click', () => {
    console.log('🔄 Starting login process...');
    window.authFunctions.redirectToGoogleAuth();
});

elements.logoutBtn.addEventListener('click', handleLogout);

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App initializing...');
    handleLogin();
});