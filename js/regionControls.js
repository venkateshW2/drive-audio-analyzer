// Professional Region Controls with In/Out Points
class RegionControls {
    constructor(regionManager) {
        this.regionManager = regionManager;
        this.audioPlayer = regionManager.audioPlayer;
        
        this.inPoint = null;
        this.outPoint = null;
        this.isSettingIn = false;
        this.isSettingOut = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        
        console.log('🎛️ Region controls initialized');
    }
    
    initializeElements() {
        this.elements = {
            setInBtn: document.getElementById('setInBtn'),
            setOutBtn: document.getElementById('setOutBtn'),
            createRegionBtn: document.getElementById('createRegionBtn'),
            inPoint: document.getElementById('inPoint'),
            outPoint: document.getElementById('outPoint'),
            newRegionDuration: document.getElementById('newRegionDuration'),
            newRegionName: document.getElementById('newRegionName'),
            clearAllRegionsBtn: document.getElementById('clearAllRegionsBtn'),
            currentTime: document.getElementById('currentTime'),
            totalTime: document.getElementById('totalTime')
        };
    }
    
    setupEventListeners() {
        // Set IN point
        if (this.elements.setInBtn) {
            this.elements.setInBtn.addEventListener('click', () => {
                this.setInPoint();
            });
        }
        
        // Set OUT point
        if (this.elements.setOutBtn) {
            this.elements.setOutBtn.addEventListener('click', () => {
                this.setOutPoint();
            });
        }
        
        // Create region
        if (this.elements.createRegionBtn) {
            this.elements.createRegionBtn.addEventListener('click', () => {
                this.createRegionFromInOut();
            });
        }
        
        // Clear all regions
        if (this.elements.clearAllRegionsBtn) {
            this.elements.clearAllRegionsBtn.addEventListener('click', () => {
                this.clearAllRegions();
            });
        }
        
        // Manual time inputs
        if (this.elements.inPoint) {
            this.elements.inPoint.addEventListener('change', () => {
                this.updateInPointFromInput();
            });
        }
        
        if (this.elements.outPoint) {
            this.elements.outPoint.addEventListener('change', () => {
                this.updateOutPointFromInput();
            });
        }
        
        // Auto-update region name
        if (this.elements.newRegionName) {
            this.elements.newRegionName.addEventListener('input', () => {
                this.updateCreateButton();
            });
        }
        
        // Update time display when audio plays
        if (this.audioPlayer.wavesurfer) {
            this.setupTimeUpdates();
        }
    }
    
    setupTimeUpdates() {
        // Update current time display
        const updateTime = () => {
            if (this.audioPlayer.wavesurfer && this.elements.currentTime) {
                const current = this.audioPlayer.wavesurfer.getCurrentTime();
                const total = this.audioPlayer.wavesurfer.getDuration();
                
                this.elements.currentTime.textContent = this.formatTime(current);
                if (this.elements.totalTime) {
                    this.elements.totalTime.textContent = this.formatTime(total);
                }
            }
        };
        
        // Update every 100ms when playing
        setInterval(updateTime, 100);
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only work when audio pane is open
            if (document.getElementById('audioPane').classList.contains('collapsed')) return;
            
            // I key - Set IN point
            if (e.key.toLowerCase() === 'i' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.setInPoint();
            }
            
            // O key - Set OUT point
            if (e.key.toLowerCase() === 'o' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.setOutPoint();
            }
            
            // Enter - Create region
            if (e.key === 'Enter' && !e.target.matches('input, textarea') && this.canCreateRegion()) {
                e.preventDefault();
                this.createRegionFromInOut();
            }
            
            // Space - Play/Pause
            if (e.key === ' ' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.audioPlayer.togglePlayback();
            }
        });
    }
    
    setInPoint() {
        if (!this.audioPlayer.wavesurfer) return;
        
        this.inPoint = this.audioPlayer.wavesurfer.getCurrentTime();
        this.elements.inPoint.value = this.formatTime(this.inPoint);
        
        // Auto-set OUT point if not set
        if (this.outPoint === null || this.outPoint <= this.inPoint) {
            const duration = this.audioPlayer.wavesurfer.getDuration();
            this.outPoint = Math.min(this.inPoint + 5, duration); // 5 second default
            this.elements.outPoint.value = this.formatTime(this.outPoint);
        }
        
        this.updateDurationDisplay();
        this.updateCreateButton();
        
        // Visual feedback
        this.elements.setInBtn.classList.add('bg-green-700');
        setTimeout(() => {
            this.elements.setInBtn.classList.remove('bg-green-700');
        }, 200);
        
        console.log('📍 IN point set:', this.formatTime(this.inPoint));
    }
    
    setOutPoint() {
        if (!this.audioPlayer.wavesurfer) return;
        
        this.outPoint = this.audioPlayer.wavesurfer.getCurrentTime();
        this.elements.outPoint.value = this.formatTime(this.outPoint);
        
        // Auto-set IN point if not set or if OUT is before IN
        if (this.inPoint === null || this.inPoint >= this.outPoint) {
            this.inPoint = Math.max(0, this.outPoint - 5); // 5 seconds before
            this.elements.inPoint.value = this.formatTime(this.inPoint);
        }
        
        this.updateDurationDisplay();
        this.updateCreateButton();
        
        // Visual feedback
        this.elements.setOutBtn.classList.add('bg-red-700');
        setTimeout(() => {
            this.elements.setOutBtn.classList.remove('bg-red-700');
        }, 200);
        
        console.log('📍 OUT point set:', this.formatTime(this.outPoint));
    }
    
    updateInPointFromInput() {
        const timeStr = this.elements.inPoint.value;
        const seconds = this.parseTime(timeStr);
        if (seconds !== null) {
            this.inPoint = seconds;
            this.updateDurationDisplay();
            this.updateCreateButton();
        }
    }
    
    updateOutPointFromInput() {
        const timeStr = this.elements.outPoint.value;
        const seconds = this.parseTime(timeStr);
        if (seconds !== null) {
            this.outPoint = seconds;
            this.updateDurationDisplay();
            this.updateCreateButton();
        }
    }
    
    updateDurationDisplay() {
        if (this.inPoint !== null && this.outPoint !== null) {
            const duration = Math.abs(this.outPoint - this.inPoint);
            this.elements.newRegionDuration.value = this.formatTime(duration);
        } else {
            this.elements.newRegionDuration.value = '';
        }
    }
    
    canCreateRegion() {
        return this.inPoint !== null && 
               this.outPoint !== null && 
               this.inPoint !== this.outPoint;
    }
    
    updateCreateButton() {
        const canCreate = this.canCreateRegion();
        this.elements.createRegionBtn.disabled = !canCreate;
        
        if (canCreate) {
            this.elements.createRegionBtn.classList.remove('opacity-50');
        } else {
            this.elements.createRegionBtn.classList.add('opacity-50');
        }
    }
    
    createRegionFromInOut() {
        if (!this.canCreateRegion()) return;
        
        const start = Math.min(this.inPoint, this.outPoint);
        const end = Math.max(this.inPoint, this.outPoint);
        const name = this.elements.newRegionName.value.trim() || `Region ${this.regionManager.regions.length + 1}`;
        
        const region = this.regionManager.createRegion(start, end, name);
        
        // Clear the form
        this.clearInOutPoints();
        this.elements.newRegionName.value = '';
        
        console.log('✅ Created region from IN/OUT points:', region);
        return region;
    }
    
    clearInOutPoints() {
        this.inPoint = null;
        this.outPoint = null;
        this.elements.inPoint.value = '';
        this.elements.outPoint.value = '';
        this.elements.newRegionDuration.value = '';
        this.updateCreateButton();
    }
    
    clearAllRegions() {
        if (this.regionManager.regions.length === 0) return;
        
        if (confirm(`Delete all ${this.regionManager.regions.length} regions?`)) {
            this.regionManager.regions = [];
            this.regionManager.selectedRegion = null;
            this.regionManager.elements.regionInfo?.classList.add('hidden');
            this.regionManager.renderer.renderRegionList();
            this.regionManager.autoSave();
            console.log('🗑️ Cleared all regions');
        }
    }
    
    // Enable controls when audio is loaded
    enableControls() {
        this.elements.setInBtn.disabled = false;
        this.elements.setOutBtn.disabled = false;
        
        // Set default IN/OUT points
        if (this.audioPlayer.wavesurfer) {
            const duration = this.audioPlayer.wavesurfer.getDuration();
            this.inPoint = 0;
            this.outPoint = Math.min(5, duration);
            this.elements.inPoint.value = this.formatTime(this.inPoint);
            this.elements.outPoint.value = this.formatTime(this.outPoint);
            this.updateDurationDisplay();
            this.updateCreateButton();
        }
    }
    
    // Disable controls
    disableControls() {
        this.elements.setInBtn.disabled = true;
        this.elements.setOutBtn.disabled = true;
        this.elements.createRegionBtn.disabled = true;
        this.clearInOutPoints();
    }
    
    // Utility functions
    formatTime(seconds) {
        if (seconds === null || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    parseTime(timeStr) {
        if (!timeStr) return null;
        const parts = timeStr.split(':');
        if (parts.length === 2) {
            const mins = parseInt(parts[0]) || 0;
            const secs = parseInt(parts[1]) || 0;
            return mins * 60 + secs;
        }
        return null;
    }
}

// Export
window.RegionControls = RegionControls;