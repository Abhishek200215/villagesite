// Simple WebSocket server for real-time updates
class RealtimeClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
    }
    
    connect() {
        // For demonstration, we'll use a simple polling approach
        // In production, you'd use a WebSocket server
        this.startPolling();
    }
    
    startPolling() {
        // Check for updates every 30 seconds
        setInterval(async () => {
            await this.checkForUpdates();
        }, 30000);
    }
    
    async checkForUpdates() {
        try {
            const lastUpdate = localStorage.getItem('last_update_check') || 0;
            const currentTime = Date.now();
            
            if (currentTime - lastUpdate > 25000) { // 25 seconds
                localStorage.setItem('last_update_check', currentTime);
                
                // Check each collection for updates
                await this.checkCollection('announcements');
                await this.checkCollection('prices');
                await this.checkCollection('services');
                await this.checkCollection('jobs');
            }
        } catch (error) {
            console.log('Update check error:', error);
        }
    }
    
    async checkCollection(collection) {
        const localKey = `last_${collection}_update`;
        const localTimestamp = localStorage.getItem(localKey) || 0;
        
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
                headers: {
                    'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const collectionData = data.record[collection];
                
                if (collectionData && collectionData.length > 0) {
                    const latestItem = collectionData[0];
                    const serverTimestamp = latestItem.updatedAt || latestItem.timestamp;
                    
                    if (serverTimestamp > localTimestamp) {
                        // New update available
                        localStorage.setItem(localKey, serverTimestamp);
                        this.showCollectionUpdate(collection, latestItem);
                    }
                }
            }
        } catch (error) {
            console.log(`Failed to check ${collection}:`, error);
        }
    }
    
    showCollectionUpdate(collection, item) {
        const collectionNames = {
            'announcements': 'ಘೋಷಣೆಗಳು',
            'prices': 'ಬೆಲೆಗಳು',
            'services': 'ಸೇವೆಗಳು',
            'jobs': 'ಕೆಲಸಗಳು'
        };
        
        const name = collectionNames[collection] || collection;
        
        // Create update notification
        const notification = document.createElement('div');
        notification.className = 'realtime-update';
        notification.innerHTML = `
            <div class="update-alert">
                <i class="fas fa-bell"></i>
                <div>
                    <strong>ಹೊಸ ${name}:</strong>
                    <span>${item.title || item.crop || item.name || 'ನವೀಕರಣ'}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: white;
            color: var(--dark);
            padding: 15px;
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            z-index: 9998;
            animation: slideInUp 0.3s ease;
            border-left: 4px solid var(--primary);
            max-width: 300px;
        `;
        
        const updateAlert = notification.querySelector('.update-alert');
        updateAlert.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        const button = notification.querySelector('button');
        button.style.cssText = `
            background: none;
            border: none;
            color: var(--gray);
            cursor: pointer;
            margin-left: auto;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize real-time client
const realtimeClient = new RealtimeClient();

// Add to global scope
window.realtimeClient = realtimeClient;