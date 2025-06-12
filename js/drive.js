// Updated DriveAPI class - replace your js/drive.js with this:
class DriveAPI {
    constructor(token) {
        this.token = token;
        this.baseUrl = 'https://www.googleapis.com/drive/v3';
    }
    
    // Get files from a folder (FIXED VERSION)
    async getFiles(folderId = 'root', pageSize = 100) {
        try {
            let query = '';
            let url = '';
            
            if (folderId === 'root') {
                // For root, use 'root' in parents specifically
                query = "'root' in parents";
                url = `${this.baseUrl}/files?q=${encodeURIComponent(query)}&pageSize=${pageSize}&fields=files(id,name,mimeType,modifiedTime,size,parents)&orderBy=folder,name`;
            } else {
                // For specific folders
                query = `'${folderId}' in parents`;
                url = `${this.baseUrl}/files?q=${encodeURIComponent(query)}&pageSize=${pageSize}&fields=files(id,name,mimeType,modifiedTime,size,parents)&orderBy=folder,name`;
            }
            
            console.log('🌐 API URL:', url);
            console.log('🔍 Query:', query);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`📊 API returned ${data.files?.length || 0} files for folder ${folderId}`);
            console.log('📁 File names:', data.files?.slice(0, 10).map(f => f.name));
            
            return data.files || [];
            
        } catch (error) {
            console.error('❌ Error fetching files:', error);
            return [];
        }
    }
    
    // Get only audio files
    async getAudioFiles(folderId = 'root') {
        const files = await this.getFiles(folderId);
        return files.filter(file => 
            file.mimeType && file.mimeType.startsWith('audio/')
        );
    }
    
    // Get only folders
    async getFolders(folderId = 'root') {
        const files = await this.getFiles(folderId);
        return files.filter(file => 
            file.mimeType === 'application/vnd.google-apps.folder'
        );
    }
    
    // Search for files
    async searchFiles(query, mimeType = null) {
        try {
            let searchQuery = `name contains '${query}'`;
            if (mimeType) {
                searchQuery += ` and mimeType='${mimeType}'`;
            }
            
            const url = `${this.baseUrl}/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,mimeType,modifiedTime,size,parents)`;
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            const data = await response.json();
            return data.files || [];
            
        } catch (error) {
            console.error('Error searching files:', error);
            return [];
        }
    }
}

// Export for use in other files
window.DriveAPI = DriveAPI;