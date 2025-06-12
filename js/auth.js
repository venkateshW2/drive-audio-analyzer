// Google OAuth Configuration
const CLIENT_ID = '647906990775-iqt6dmeqo45kdqqo5dscc7tjhqfq28mv.apps.googleusercontent.com'; // Replace with your actual Client ID
const REDIRECT_URI = window.location.origin;
const SCOPE = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.profile';

// Auth functions
function getAccessTokenFromUrl() {
    const params = new URLSearchParams(window.location.hash.substr(1));
    return params.get('access_token');
}

function redirectToGoogleAuth() {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPE}&include_granted_scopes=true&prompt=consent`;
    window.location.href = authUrl;
}

async function getUserInfo(token) {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to get user info');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error getting user info:', error);
        throw error;
    }
}

// Export functions for use in app.js
window.authFunctions = {
    getAccessTokenFromUrl,
    redirectToGoogleAuth,
    getUserInfo
};