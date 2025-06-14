// File Explorer functionality with FIXED methods
class FileExplorer {
    constructor() {
        this.driveAPI = null;
        this.currentFolderId = 'root';
        this.currentPath = [{id: 'root', name: 'My Drive'}];
        this.selectedFiles = new Set();
        this.allFiles = [];
        this.currentFolders = [];
        this.isLoading = false;
        
        this.initializeElements();
        this.setupEventListeners();
    }
    
    initializeElements() {
        this.elements = {
            folderTree: document.getElementById('folderTree'),
            fileTable: document.getElementById('fileTable'),
            pathBar: document.getElementById('pathBar'),
            selectedCount: document.getElementById('selectedCount'),
            refreshBtn: document.getElementById('refreshBtn'),
            totalFiles: document.getElementById('totalFiles'),
            audioFiles: document.getElementById('audioFiles'),
            totalFolders: document.getElementById('totalFolders'),
            emptyState: document.getElementById('emptyState'),
            loadingState: document.getElementById('loadingState'),
            selectAllCheckbox: document.getElementById('selectAllCheckbox'),
            backBtn: document.getElementById('backBtn'),
            upBtn: document.getElementById('upBtn')
        };
    }
    
    setupEventListeners() {
        // Refresh button
        this.elements.refreshBtn.addEventListener('click', () => {
            this.refreshCurrentFolder();
        });
        
        // Root button
        const rootBtn = document.getElementById('rootBtn');
        if (rootBtn) {
            rootBtn.addEventListener('click', () => {
                console.log('🏠 Root button clicked');
                this.forceNavigateToRoot();
            });
        }
        
        // Back button
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', () => {
                this.navigateBack();
            });
        }
        
        // Up button
        if (this.elements.upBtn) {
            this.elements.upBtn.addEventListener('click', () => {
                this.navigateUp();
            });
        }
        
        // Select all checkbox
        if (this.elements.selectAllCheckbox) {
            this.elements.selectAllCheckbox.addEventListener('change', (e) => {
                this.selectAll(e.target.checked);
            });
        }
    }
    
    // Initialize with token
    initialize(token) {
        this.driveAPI = new DriveAPI(token);
        
        // Force reset to actual root
        this.currentFolderId = 'root';
        this.currentPath = [{id: 'root', name: 'My Drive'}];
        
        console.log('🔄 FORCE RESET to root folder');
        console.log('Current folder ID:', this.currentFolderId);
        
        this.loadCurrentFolder();
    }
    
    // Force navigate to actual root
    async forceNavigateToRoot() {
        console.log('🏠 FORCING navigation to actual root...');
        
        this.currentFolderId = 'root';
        this.currentPath = [{id: 'root', name: 'My Drive'}];
        
        await this.loadCurrentFolder();
    }
    
    // Navigate back (same as up)
    navigateBack() {
        this.navigateUp();
    }
    
    // Navigate up one level
    navigateUp() {
        if (this.currentPath.length <= 1) {
            console.log('👆 Already at root, cannot go up');
            return;
        }
        
        console.log('👆 Navigating up one level');
        
        // Remove last folder from path
        this.currentPath = this.currentPath.slice(0, -1);
        this.currentFolderId = this.currentPath[this.currentPath.length - 1].id;
        
        console.log('📍 New path after going up:', this.currentPath);
        this.loadCurrentFolder();
    }
    
    // Update navigation button states
    updateNavigationButtons() {
        const canGoUp = this.currentPath.length > 1;
        
        if (this.elements.backBtn) {
            this.elements.backBtn.disabled = !canGoUp;
        }
        
        if (this.elements.upBtn) {
            this.elements.upBtn.disabled = !canGoUp;
        }
    }
    
    // Navigate to a specific folder
    async navigateToFolder(folderId, folderName = null) {
        if (this.isLoading) {
            console.log('⚠️ Navigation already in progress, skipping...');
            return;
        }
        
        console.log(`📂 Navigating to folder: ${folderId} (${folderName})`);
        
        if (folderId === 'root') {
            this.currentFolderId = 'root';
            this.currentPath = [{id: 'root', name: 'My Drive'}];
        } else {
            this.currentFolderId = folderId;
            
            // Check if folder is already in path (going back)
            const existingIndex = this.currentPath.findIndex(p => p.id === folderId);
            if (existingIndex !== -1) {
                // Going back - trim path to that point
                this.currentPath = this.currentPath.slice(0, existingIndex + 1);
            } else {
                // Going forward - add to path
                this.currentPath.push({
                    id: folderId, 
                    name: folderName || 'Unknown Folder'
                });
            }
        }
        
        console.log('📍 New path:', this.currentPath);
        await this.loadCurrentFolder();
    }
    
    // Navigate from breadcrumb path
    async navigateToPathIndex(pathIndex) {
        if (this.isLoading) return;
        
        console.log(`🧭 Navigating to path index: ${pathIndex}`);
        
        // Trim path to clicked index
        this.currentPath = this.currentPath.slice(0, pathIndex + 1);
        this.currentFolderId = this.currentPath[pathIndex].id;
        
        console.log('📍 Updated path:', this.currentPath);
        await this.loadCurrentFolder();
    }
    
    // Refresh current folder
    async refreshCurrentFolder() {
        await this.loadCurrentFolder();
    }
    
    // Load files from current folder
    async loadCurrentFolder() {
        if (this.isLoading) {
            console.log('⚠️ Already loading, skipping...');
            return;
        }
        
        this.isLoading = true;
        
        try {
            this.showLoading();
            console.log(`📂 Loading folder: ${this.currentFolderId}`);
            console.log(`📍 Current path:`, this.currentPath);
            
            // Get files from current folder ONLY
            const allFiles = await this.driveAPI.getFiles(this.currentFolderId);
            console.log(`📄 Found ${allFiles.length} items in current folder`);
            
            // Separate files and folders
            const files = allFiles.filter(file => 
                file.mimeType !== 'application/vnd.google-apps.folder'
            );
            const folders = allFiles.filter(file => 
                file.mimeType === 'application/vnd.google-apps.folder'
            );
            
            console.log(`📁 Folders in current directory: ${folders.length}`);
            console.log(`📄 Files in current directory: ${files.length}`);
            
            // Filter audio files
            const audioFiles = files.filter(file => this.isAudioFile(file));
            console.log(`🎵 Audio files: ${audioFiles.length}`);
            
            this.allFiles = files;
            this.currentFolders = folders;
            
            // Update UI
            this.renderSidebar();
            this.renderMainTable(folders, audioFiles);
            this.updateStats(files, folders, audioFiles);
            this.updatePathBar();
            this.updateNavigationButtons();
            
            this.hideLoading();
            
        } catch (error) {
            console.error('❌ Error loading folder:', error);
            this.hideLoading();
        } finally {
            this.isLoading = false;
        }
    }
    
    // Check if file is audio
    isAudioFile(file) {
        if (!file.mimeType && !file.name) return false;
        
        // Check MIME type
        if (file.mimeType && file.mimeType.startsWith('audio/')) return true;
        
        // Check file extension
        if (!file.name) return false;
        
        const audioExtensions = [
            '.mp3', '.wav', '.flac', '.aac', '.ogg', 
            '.m4a', '.wma', '.aiff', '.opus', '.3gp'
        ];
        
        const fileName = file.name.toLowerCase();
        return audioExtensions.some(ext => fileName.endsWith(ext));
    }
    
    // Render sidebar
    renderSidebar() {
        console.log('🌳 Rendering sidebar...');
        
        let sidebarHtml = '';
        
        // Build sidebar based on current path
        this.currentPath.forEach((pathFolder, index) => {
            const isCurrentFolder = index === this.currentPath.length - 1;
            const indentLevel = index;
            
            sidebarHtml += `
                <div class="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer ${isCurrentFolder ? 'bg-blue-50 font-medium' : ''}" 
                     style="margin-left: ${indentLevel * 16}px;"
                     data-folder-id="${pathFolder.id}" 
                     data-path-index="${index}">
                    <i class="fas fa-${index === 0 ? 'home' : 'folder'} ${isCurrentFolder ? 'text-blue-500' : index === 0 ? 'text-blue-500' : 'text-yellow-500'} mr-2"></i>
                    <span class="text-sm">${this.escapeHtml(pathFolder.name)}</span>
                </div>
            `;
        });
        
        // Add subfolders of current folder
        if (this.currentFolders.length > 0) {
            sidebarHtml += `
                <div class="mt-2 ml-4">
                    <div class="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-1">
                        Subfolders (${this.currentFolders.length})
                    </div>
            `;
            
            this.currentFolders.forEach(folder => {
                sidebarHtml += `
                    <div class="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer ml-4" 
                         data-folder-id="${folder.id}" 
                         data-folder-name="${this.escapeHtml(folder.name)}">
                        <i class="fas fa-folder text-yellow-500 mr-2"></i>
                        <span class="text-sm">${this.escapeHtml(folder.name)}</span>
                    </div>
                `;
            });
            
            sidebarHtml += `</div>`;
        }
        
        this.elements.folderTree.innerHTML = sidebarHtml;
        this.setupSidebarClickHandlers();
    }
    
    // Setup sidebar click handlers
    setupSidebarClickHandlers() {
        // Remove existing listeners to prevent duplicates
        const newFolderTree = this.elements.folderTree.cloneNode(true);
        this.elements.folderTree.parentNode.replaceChild(newFolderTree, this.elements.folderTree);
        this.elements.folderTree = newFolderTree;
        
        this.elements.folderTree.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const folderElement = e.target.closest('[data-folder-id]');
            if (!folderElement) return;
            
            const folderId = folderElement.dataset.folderId;
            const folderName = folderElement.dataset.folderName;
            const pathIndex = folderElement.dataset.pathIndex;
            
            console.log('🖱️ Sidebar click:', {folderId, folderName, pathIndex});
            
            if (pathIndex !== undefined) {
                // Click on path folder (breadcrumb)
                this.navigateToPathIndex(parseInt(pathIndex));
            } else {
                // Click on subfolder
                this.navigateToFolder(folderId, folderName);
            }
        });
    }
    
    // Render main table
    renderMainTable(folders, audioFiles) {
        console.log('📋 Rendering main table...');
        
        // Combine folders and audio files
        const itemsToShow = [
            ...folders.map(folder => ({...folder, itemType: 'folder'})),
            ...audioFiles.map(file => ({...file, itemType: 'audio'}))
        ];
        
        if (itemsToShow.length === 0) {
            this.elements.fileTable.innerHTML = '';
            this.elements.emptyState.classList.remove('hidden');
            return;
        }
        
        this.elements.emptyState.classList.add('hidden');
        
        this.elements.fileTable.innerHTML = itemsToShow.map(item => {
            if (item.itemType === 'folder') {
                return `
                    <tr class="folder-row hover:bg-gray-50 cursor-pointer" 
                        data-folder-id="${item.id}" 
                        data-folder-name="${this.escapeHtml(item.name)}">
                        <td class="px-4 py-3"></td>
                        <td class="px-4 py-3">
                            <div class="flex items-center">
                                <i class="fas fa-folder text-yellow-500 mr-3"></i>
                                <div>
                                    <div class="font-medium text-gray-900">${this.escapeHtml(item.name)}</div>
                                    <div class="text-sm text-gray-500">Folder</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-600">Folder</td>
                        <td class="px-4 py-3 text-sm text-gray-600">${this.formatDate(item.modifiedTime)}</td>
                        <td class="px-4 py-3 text-sm text-gray-600">-</td>
                    </tr>
                `;
            } else {
                const isSelected = this.selectedFiles.has(item.id);
                return `
                    <tr class="file-row hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}" 
                        data-file-id="${item.id}">
                        <td class="px-4 py-3">
                            <input type="checkbox" class="file-checkbox rounded border-gray-300" ${isSelected ? 'checked' : ''}>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center">
                                <i class="fas fa-music text-blue-500 mr-3"></i>
                                <div>
                                    <div class="font-medium text-gray-900 file-name-clickable">${this.escapeHtml(item.name)}</div>
                                    <div class="text-sm text-gray-500">${item.mimeType || 'Audio file'}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-600">Audio</td>
                        <td class="px-4 py-3 text-sm text-gray-600">${this.formatDate(item.modifiedTime)}</td>
                        <td class="px-4 py-3 text-sm text-gray-600">${this.formatFileSize(item.size)}</td>
                    </tr>
                `;
            }
        }).join('');
        
        this.setupTableClickHandlers();
    }
    
    // FIXED: Setup table click handlers
    setupTableClickHandlers() {
        // Folder clicks
        document.querySelectorAll('.folder-row').forEach(row => {
            row.addEventListener('dblclick', (e) => {
                e.preventDefault();
                const folderId = row.dataset.folderId;
                const folderName = row.dataset.folderName;
                console.log('📁 Double-click folder:', folderName);
                this.navigateToFolder(folderId, folderName);
            });
        });
        
        // File row handling
        document.querySelectorAll('.file-row').forEach(row => {
            const checkbox = row.querySelector('.file-checkbox');
            const fileName = row.querySelector('.file-name-clickable');
            
            if (!checkbox) return;
            
            // Checkbox click - independent
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('☑️ Checkbox clicked:', checkbox.checked);
                this.handleFileSelection(row, checkbox.checked);
            });
            
            // File name click - independent action
            if (fileName) {
                fileName.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('🎵 File name clicked:', fileName.textContent);
                    this.handleFileNameClick(row);
                });
            }
        });
    }
    
    // Handle file name click (separate from checkbox)
    // Update this method in your FileExplorer class
handleFileNameClick(row) {
    const fileId = row.dataset.fileId;
    const fileName = row.querySelector('.file-name-clickable').textContent;
    
    console.log('🎵 Opening audio file:', fileName);
    
    // Find the file object
    const file = this.allFiles.find(f => f.id === fileId);
    if (!file) {
        console.error('File not found:', fileId);
        return;
    }
    
    // Add visual feedback
    row.classList.add('bg-yellow-50');
    setTimeout(() => {
        row.classList.remove('bg-yellow-50');
    }, 200);
    
    // Load in audio player
    if (window.audioPlayer) {
        window.audioPlayer.loadAudioFile(file, this.driveAPI.token);
    } else {
        console.error('Audio player not initialized');
    }
}
    
    // Handle file selection (checkbox)
    handleFileSelection(row, isSelected) {
        const fileId = row.dataset.fileId;
        
        if (isSelected) {
            this.selectedFiles.add(fileId);
            row.classList.add('bg-blue-50');
        } else {
            this.selectedFiles.delete(fileId);
            row.classList.remove('bg-blue-50');
        }
        
        this.updateSelectionCount();
    }
    
    // Update path bar with breadcrumbs
    updatePathBar() {
        const breadcrumbs = this.currentPath.map((folder, index) => {
            const isLast = index === this.currentPath.length - 1;
            return `
                <span class="hover:text-blue-600 cursor-pointer ${isLast ? 'font-medium text-blue-600' : 'text-gray-600'}" 
                      data-path-index="${index}">
                    ${this.escapeHtml(folder.name)}
                </span>
                ${!isLast ? '<i class="fas fa-chevron-right text-gray-400 mx-2"></i>' : ''}
            `;
        }).join('');
        
        this.elements.pathBar.innerHTML = breadcrumbs;
        
        // Add breadcrumb click handlers
        this.elements.pathBar.addEventListener('click', (e) => {
            const pathElement = e.target.closest('[data-path-index]');
            if (pathElement) {
                const pathIndex = parseInt(pathElement.dataset.pathIndex);
                this.navigateToPathIndex(pathIndex);
            }
        });
    }
    
    // Update selection count
    updateSelectionCount() {
        const count = this.selectedFiles.size;
        this.elements.selectedCount.textContent = `${count} selected`;
        
        const audioFiles = this.allFiles.filter(f => this.isAudioFile(f));
        if (this.elements.selectAllCheckbox) {
            this.elements.selectAllCheckbox.indeterminate = count > 0 && count < audioFiles.length;
            this.elements.selectAllCheckbox.checked = count > 0 && count === audioFiles.length;
        }
    }
    
    // Select all files
    selectAll(select) {
        const audioFiles = this.allFiles.filter(f => this.isAudioFile(f));
        
        if (select) {
            audioFiles.forEach(file => this.selectedFiles.add(file.id));
        } else {
            this.selectedFiles.clear();
        }
        
        document.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.checked = select;
        });
        
        document.querySelectorAll('.file-row').forEach(row => {
            if (select) {
                row.classList.add('bg-blue-50');
            } else {
                row.classList.remove('bg-blue-50');
            }
        });
        
        this.updateSelectionCount();
    }
    
    // Update stats
    updateStats(files, folders, audioFiles) {
        this.elements.totalFiles.textContent = files.length;
        this.elements.audioFiles.textContent = audioFiles.length;
        this.elements.totalFolders.textContent = folders.length;
    }
    
    // Utility functions
    showLoading() {
        this.elements.loadingState.classList.remove('hidden');
        this.elements.emptyState.classList.add('hidden');
    }
    
    hideLoading() {
        this.elements.loadingState.classList.add('hidden');
    }
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }
    
    formatFileSize(bytes) {
        if (!bytes) return '-';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use in other files
window.FileExplorer = FileExplorer;