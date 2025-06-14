// Audio Player with WaveSurfer.js - FIXED VERSION
class AudioPlayer {
    constructor() {
        this.wavesurfer = null;
        this.regions = null;
        this.currentFile = null;
        this.currentRegion = null;
        this.isPlaying = false;
        this.regionManager = null; // Add this line

        // Check if WaveSurfer is available
        if (typeof WaveSurfer === 'undefined') {
            console.error('❌ WaveSurfer.js not loaded!');
            return;
        }
        
        this.initializeElements();
        this.setupEventListeners();
        console.log('🎵 AudioPlayer initialized successfully');
    }
   initializeRegionManager() {
    try {
        if (!this.regionManager && typeof RegionManager !== 'undefined') {
            this.regionManager = new RegionManager(this);
            console.log('📍 Region manager integrated with audio player');
        }
    } catch (error) {
        console.error('❌ Error initializing region manager:', error);
        // Continue without region manager
    }
}
    initializeElements() {
        this.elements = {
            audioPane: document.getElementById('audioPane'),
            waveform: document.getElementById('waveform'),
            waveformPlaceholder: document.getElementById('waveformPlaceholder'),
            currentFileName: document.getElementById('currentFileName'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            stopBtn: document.getElementById('stopBtn'),
            addRegionBtn: document.getElementById('addRegionBtn'),
            analyzeRegionBtn: document.getElementById('analyzeRegionBtn'),
            closeAudioBtn: document.getElementById('closeAudioBtn'),
            regionInfo: document.getElementById('regionInfo'),
            regionStart: document.getElementById('regionStart'),
            regionEnd: document.getElementById('regionEnd'),
            regionDuration: document.getElementById('regionDuration'),
            regionName: document.getElementById('regionName'),
            deleteRegionBtn: document.getElementById('deleteRegionBtn')
        };
    }
    
    setupEventListeners() {
        // Play/Pause button
        this.elements.playPauseBtn.addEventListener('click', () => {
            this.togglePlayback();
        });
        
        // Stop button
        this.elements.stopBtn.addEventListener('click', () => {
            this.stopPlayback();
        });
        
        // Close audio pane
        this.elements.closeAudioBtn.addEventListener('click', () => {
            this.closeAudioPane();
        });
        
        // Add region button
        this.elements.addRegionBtn.addEventListener('click', () => {
            this.addRegion();
        });
        
        // Analyze region button
        this.elements.analyzeRegionBtn.addEventListener('click', () => {
            this.analyzeCurrentRegion();
        });
        
        // Delete region button
        this.elements.deleteRegionBtn.addEventListener('click', () => {
            this.deleteCurrentRegion();
        });
        
        // Region name input
        this.elements.regionName.addEventListener('input', (e) => {
            if (this.currentRegion) {
                this.currentRegion.content = e.target.value;
            }
        });
    }
    
    // Load audio file
 async loadAudioFile(file, token) {
    try {
        console.log('🎵 Loading audio file:', file.name);
        
        // Check if WaveSurfer is available
        if (typeof WaveSurfer === 'undefined') {
            throw new Error('WaveSurfer.js not loaded');
        }
        
        // Show audio pane and loading state
        this.showAudioPane();
        this.elements.currentFileName.textContent = file.name;
        this.elements.waveformPlaceholder.innerHTML = `
            <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p class="text-gray-500">Loading audio file...</p>
            </div>
        `;
        this.elements.waveformPlaceholder.style.display = 'block';
        
        // Get audio file URL
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('📥 Audio file downloaded, size:', blob.size, 'type:', blob.type);
        
        if (!blob.type.startsWith('audio/')) {
            throw new Error('File is not a valid audio format');
        }
        
        const audioUrl = URL.createObjectURL(blob);
        
        // Initialize WaveSurfer
        await this.initializeWaveSurfer(audioUrl);
        
        // Store current file
        this.currentFile = file;
        
        // Initialize region manager AFTER waveform is ready
        //this.initializeRegionManager();
        
        // Load regions for this file
        if (this.regionManager) {
            await this.regionManager.loadRegionsForFile(file);
        }
        
        // Enable controls
        this.enableControls();
        
        console.log('✅ Audio loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading audio:', error);
        this.showError(`Failed to load audio: ${error.message}`);
    }
}
    
    // Initialize WaveSurfer
    async initializeWaveSurfer(audioUrl) {
        try {
            console.log('🌊 Initializing WaveSurfer...');
            
            // Destroy existing instance
            if (this.wavesurfer) {
                this.wavesurfer.destroy();
            }
            
            // Clear waveform container
            this.elements.waveform.innerHTML = '';
            
            // Create WaveSurfer instance
            this.wavesurfer = WaveSurfer.create({
                container: this.elements.waveform,
                waveColor: '#3b82f6',
                progressColor: '#1d4ed8',
                responsive: true,
                height: 120,
                normalize: true,
                backend: 'WebAudio',
                mediaControls: false
            });
            
            // Setup wavesurfer events BEFORE loading
            this.wavesurfer.on('ready', () => {
                console.log('🎵 WaveSurfer ready, duration:', this.wavesurfer.getDuration());
                this.elements.waveformPlaceholder.style.display = 'none';
                this.initializeRegions();
                this.addDefaultRegion();
            });
            
            this.wavesurfer.on('play', () => {
                this.isPlaying = true;
                this.updatePlayButton();
            });
            
            this.wavesurfer.on('pause', () => {
                this.isPlaying = false;
                this.updatePlayButton();
            });
            
            this.wavesurfer.on('finish', () => {
                this.isPlaying = false;
                this.updatePlayButton();
            });
            
            this.wavesurfer.on('error', (error) => {
                console.error('❌ WaveSurfer error:', error);
                this.showError('Error loading audio waveform');
            });
            
            // Load audio
            await this.wavesurfer.load(audioUrl);
            
        } catch (error) {
            console.error('❌ Error initializing WaveSurfer:', error);
            this.showError('Failed to initialize audio player');
        }
    }
    
    // Initialize regions plugin
    initializeRegions() {
        try {
            // Initialize Regions plugin
            if (typeof WaveSurfer.Regions !== 'undefined') {
              console.log('🌊 WaveSurfer ready - using custom region system');
                //this.regions = this.wavesurfer.registerPlugin(WaveSurfer.Regions.create());
            } else {
                console.warn('⚠️ Regions plugin not available, using basic functionality');
                return;
            }
            
            // Setup region events
            this.setupRegionEvents();
            
        } catch (error) {
            console.error('❌ Error initializing regions:', error);
        }
    }
    
    // Setup region events
    setupRegionEvents() {
        if (!this.regions) return;
        
        // Region created
        this.regions.on('region-created', (region) => {
            console.log('📍 Region created:', region);
            this.selectRegion(region);
        });
        
        // Region clicked
        this.regions.on('region-clicked', (region, e) => {
            e.stopPropagation();
            this.selectRegion(region);
        });
        
        // Region updated
        this.regions.on('region-updated', (region) => {
            if (region === this.currentRegion) {
                this.updateRegionInfo();
            }
        });
    }
    
    // Add default region
    addDefaultRegion() {
        if (!this.regions || !this.wavesurfer) return;
        
        try {
            const duration = this.wavesurfer.getDuration();
            const regionStart = 0;
            const regionEnd = Math.min(10, duration); // 10 seconds or full duration
            
            const region = this.regions.addRegion({
                start: regionStart,
                end: regionEnd,
                color: 'rgba(59, 130, 246, 0.3)',
                content: 'Sample Region',
                drag: true,
                resize: true
            });
            
            this.selectRegion(region);
            
        } catch (error) {
            console.error('❌ Error adding default region:', error);
        }
    }
    
    // Add new region
    addRegion() {
        if (!this.regions || !this.wavesurfer) {
            alert('Regions not available');
            return;
        }
        
        try {
            const duration = this.wavesurfer.getDuration();
            const currentTime = this.wavesurfer.getCurrentTime();
            const regionStart = currentTime;
            const regionEnd = Math.min(currentTime + 5, duration); // 5 second region
            
            const region = this.regions.addRegion({
                start: regionStart,
                end: regionEnd,
                color: 'rgba(34, 197, 94, 0.3)',
                content: `Region ${this.regions.getRegions().length + 1}`,
                drag: true,
                resize: true
            });
            
            this.selectRegion(region);
            
        } catch (error) {
            console.error('❌ Error adding region:', error);
        }
    }
    
    // Select region
    selectRegion(region) {
        if (!region) return;
        
        try {
            // Clear previous selection
            if (this.regions) {
                this.regions.getRegions().forEach(r => {
                    if (r.element) {
                        r.element.style.border = 'none';
                    }
                });
            }
            
            // Highlight selected region
            if (region.element) {
                region.element.style.border = '2px solid #1d4ed8';
            }
            
            this.currentRegion = region;
            this.showRegionInfo();
            this.updateRegionInfo();
            
        } catch (error) {
            console.error('❌ Error selecting region:', error);
        }
    }
    
    // Update region info panel
    updateRegionInfo() {
        if (!this.currentRegion) return;
        
        try {
            const start = this.currentRegion.start;
            const end = this.currentRegion.end;
            const duration = end - start;
            
            this.elements.regionStart.value = this.formatTime(start);
            this.elements.regionEnd.value = this.formatTime(end);
            this.elements.regionDuration.value = this.formatTime(duration);
            this.elements.regionName.value = this.currentRegion.content || '';
            
        } catch (error) {
            console.error('❌ Error updating region info:', error);
        }
    }
    
    // Show region info panel
    showRegionInfo() {
        this.elements.regionInfo.classList.remove('hidden');
    }
    
    // Hide region info panel
    hideRegionInfo() {
        this.elements.regionInfo.classList.add('hidden');
    }
    
    // Delete current region
    deleteCurrentRegion() {
        if (this.currentRegion) {
            try {
                this.currentRegion.remove();
                this.currentRegion = null;
                this.hideRegionInfo();
            } catch (error) {
                console.error('❌ Error deleting region:', error);
            }
        }
    }
    
    // Analyze current region
    analyzeCurrentRegion() {
        if (!this.currentRegion) {
            alert('Please select a region first');
            return;
        }
        
        const regionData = {
            file: this.currentFile,
            start: this.currentRegion.start,
            end: this.currentRegion.end,
            duration: this.currentRegion.end - this.currentRegion.start,
            name: this.currentRegion.content
        };
        
        console.log('🔬 Analyzing region:', regionData);
        
        // TODO: Send to analysis API
        alert(`Region Analysis:\n\nFile: ${regionData.file.name}\nStart: ${this.formatTime(regionData.start)}\nEnd: ${this.formatTime(regionData.end)}\nDuration: ${this.formatTime(regionData.duration)}\n\nTODO: Send to analysis API`);
    }
    
    // Playback controls
    togglePlayback() {
        if (!this.wavesurfer) return;
        
        try {
            this.wavesurfer.playPause();
        } catch (error) {
            console.error('❌ Error toggling playback:', error);
        }
    }
    
    stopPlayback() {
        if (!this.wavesurfer) return;
        
        try {
            this.wavesurfer.stop();
        } catch (error) {
            console.error('❌ Error stopping playback:', error);
        }
    }
    
    // Update play button
    updatePlayButton() {
        const icon = this.elements.playPauseBtn.querySelector('i');
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }
    
    // Show audio pane
    showAudioPane() {
        this.elements.audioPane.classList.remove('collapsed');
    }
    
    // Close audio pane
    closeAudioPane() {
        this.elements.audioPane.classList.add('collapsed');
        
        // Stop and cleanup
        if (this.wavesurfer) {
            try {
                this.wavesurfer.stop();
                this.wavesurfer.destroy();
            } catch (error) {
                console.error('❌ Error destroying wavesurfer:', error);
            }
            this.wavesurfer = null;
        }
        if (this.regionManager) {
        this.regionManager.clearRegions();
        this.regionManager.disableControls();
        }
        // Reset UI
        this.elements.currentFileName.textContent = 'No file selected';
        this.elements.waveformPlaceholder.style.display = 'block';
        this.elements.waveformPlaceholder.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-music text-4xl mb-2"></i>
                <p>Click an audio file to load waveform</p>
            </div>
        `;
       this.hideRegionInfo();
        this.disableControls();
        
        // Clear current file
        this.currentFile = null;
        this.currentRegion = null;
    }
    
    // Enable controls
    enableControls() {
        this.elements.playPauseBtn.disabled = false;
        this.elements.stopBtn.disabled = false;
        this.elements.addRegionBtn.disabled = false;
        this.elements.analyzeRegionBtn.disabled = false;
    }
    
    // Disable controls
    disableControls() {
        this.elements.playPauseBtn.disabled = true;
        this.elements.stopBtn.disabled = true;
        this.elements.addRegionBtn.disabled = true;
        this.elements.analyzeRegionBtn.disabled = true;
    }
    
    // Show error
    showError(message) {
        this.elements.waveformPlaceholder.style.display = 'block';
        this.elements.waveformPlaceholder.innerHTML = `
            <div class="text-center text-red-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
                <p>${message}</p>
                <button onclick="window.audioPlayer.closeAudioPane()" class="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm">
                    Close
                </button>
            </div>
        `;
    }
    
    // Format time
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Export for use in other files
window.AudioPlayer = AudioPlayer;