// Clean app.js - NO modules, NO exports
let currentToken = null;
let fileExplorer = null;
let audioPlayer = null;

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
function showLoading(text = 'Loading...') {
    const loadingText = document.getElementById('loadingText');
    if (loadingText) loadingText.textContent = text;
    if (elements.loadingOverlay) elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    if (elements.loadingOverlay) elements.loadingOverlay.classList.add('hidden');
}

function showApp() {
    if (elements.loginView) elements.loginView.classList.add('hidden');
    if (elements.appView) elements.appView.classList.remove('hidden');
}

function showLogin() {
    if (elements.loginView) elements.loginView.classList.remove('hidden');
    if (elements.appView) elements.appView.classList.add('hidden');
}

async function initializeFileExplorer() {
    try {
        if (!fileExplorer && window.FileExplorer) {
            fileExplorer = new FileExplorer();
            if (currentToken) {
                fileExplorer.initialize(currentToken);
            }
            console.log('📁 File explorer initialized');
        }
    } catch (error) {
        console.error('❌ Error initializing file explorer:', error);
    }
}

async function initializeAudioPlayer() {
    try {
        if (!audioPlayer && window.AudioPlayer) {
            audioPlayer = new AudioPlayer();
            window.audioPlayer = audioPlayer;
            console.log('🎵 Audio player initialized');
        }
    } catch (error) {
        console.error('❌ Error initializing audio player:', error);
    }
}

// Auth handling
async function handleLogin() {
    try {
        console.log('🔐 Starting login process...');
        
        if (!window.authFunctions) {
            throw new Error('Auth functions not loaded');
        }
        
        const token = window.authFunctions.getAccessTokenFromUrl();
        
        if (token) {
            console.log('🔑 Token found in URL');
            showLoading('Logging in...');
            
            localStorage.setItem('driveToken', token);
            currentToken = token;
            
            const userInfo = await window.authFunctions.getUserInfo(token);
            console.log('👤 User info received:', userInfo.name);
            
            if (elements.userName) elements.userName.textContent = userInfo.name;
            if (elements.userAvatar) elements.userAvatar.src = userInfo.picture;
            if (elements.userInfo) elements.userInfo.classList.remove('hidden');
            if (elements.logoutBtn) elements.logoutBtn.classList.remove('hidden');
            
            window.history.replaceState({}, document.title, window.location.pathname);
            
            showApp();
            await initializeFileExplorer();
            await initializeAudioPlayer();
            hideLoading();
            
            console.log('✅ Login successful!');
        } else {
            console.log('🔍 No token in URL, checking localStorage...');
            const storedToken = localStorage.getItem('driveToken');
            
            if (storedToken) {
                console.log('💾 Found stored token');
                showLoading('Restoring session...');
                currentToken = storedToken;
                
                try {
                    const userInfo = await window.authFunctions.getUserInfo(storedToken);
                    
                    if (elements.userName) elements.userName.textContent = userInfo.name;
                    if (elements.userAvatar) elements.userAvatar.src = userInfo.picture;
                    if (elements.userInfo) elements.userInfo.classList.remove('hidden');
                    if (elements.logoutBtn) elements.logoutBtn.classList.remove('hidden');
                    
                    showApp();
                    await initializeFileExplorer();
                    await initializeAudioPlayer();
                    console.log('✅ Auto-login successful!');
                } catch (error) {
                    console.log('❌ Stored token invalid:', error);
                    localStorage.removeItem('driveToken');
                    showLogin();
                }
                hideLoading();
            } else {
                console.log('📋 No stored token, showing login');
                showLogin();
            }
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        hideLoading();
        showLogin();
    }
}

function handleLogout() {
    localStorage.removeItem('driveToken');
    currentToken = null;
    showLogin();
    if (elements.userInfo) elements.userInfo.classList.add('hidden');
    if (elements.logoutBtn) elements.logoutBtn.classList.add('hidden');
    console.log('👋 Logged out');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌐 DOM loaded, initializing app...');
    
    // Setup login button
    if (elements.loginBtn) {
        elements.loginBtn.addEventListener('click', function() {
            console.log('🔘 Login button clicked');
            if (window.authFunctions && window.authFunctions.redirectToGoogleAuth) {
                showLoading('Redirecting to Google...');
                window.authFunctions.redirectToGoogleAuth();
            } else {
                console.error('❌ Auth functions not available');
                alert('Authentication system not loaded. Please refresh the page.');
            }
        });
    }
    
    // Setup logout button
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Check for existing login
    setTimeout(handleLogin, 100);
});

console.log('📱 App.js loaded successfully');