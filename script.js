// ====== CONFIGURATION ======
const CONFIG = {
    ADMIN_CODE: '123456',
    VILLAGE_NAME: 'ವೀರಪುರ',
    DISTRICT: 'ಹಾವೇರಿ',
    STATE: 'ಕರ್ನಾಟಕ',
    
    // JSONBin.io Configuration
    JSONBIN_BIN_ID: '672c7a21ad19ca34f8b8d63e',
    JSONBIN_MASTER_KEY: '$2a$10$4Y3K5r6S7T8U9V0W1X2Y3Z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q',
    
    // Voice commands in Kannada
    VOICE_COMMANDS: {
        'ಬೆಲೆ': 'market',
        'ಬೆಲೆಗಳು': 'market',
        'ಕೃಷಿ': 'market',
        'ತುರ್ತು': 'emergency',
        'ಆಂಬ್ಯುಲೆನ್ಸ್': 'emergency',
        'ಪೊಲೀಸ್': 'emergency',
        'ಹವಾಮಾನ': 'weather',
        'ಮಳೆ': 'weather',
        'ಕೆಲಸ': 'jobs',
        'ಉದ್ಯೋಗ': 'jobs',
        'ಸೇವೆ': 'services',
        'ವಿದ್ಯುತ್': 'services',
        'ಪ್ಲಂಬರ್': 'services',
        'ಯೋಜನೆ': 'schemes',
        'ಸಹಾಯಧನ': 'schemes',
        'ಘಟನೆ': 'events',
        'ಹಬ್ಬ': 'events',
        'ಸಾರಿಗೆ': 'transport',
        'ಬಸ್': 'transport',
        'ಆಟೋ': 'transport',
        'ಪ್ರವಾಸಿ': 'tourist',
        'ದೇವಸ್ಥಾನ': 'tourist'
    },

     // Real-time update configuration
    UPDATE_CHECK_INTERVAL: 30000, // Check for updates every 30 seconds
    LAST_UPDATE_KEY: 'veerapura_last_update',
    UPDATE_TYPES: {
        PRICES: 'prices',
        SERVICES: 'services',
        ANNOUNCEMENTS: 'announcements',
        JOBS: 'jobs',
        EMERGENCY: 'emergency'
    }
};

// ====== GLOBAL VARIABLES ======
let currentUser = null;
let isAdmin = false;
let deferredPrompt = null;
let voiceRecognition = null;
let isListening = false;
let currentLanguage = 'kn';

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
            }, 500);
        }, 2000);

        // Setup real-time updates
        await setupRealtimeUpdates();
        
        // Load user session
        loadUserSession();
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup voice recognition
        setupVoiceRecognition();
        
        // Setup PWA
        setupPWA();
        
        // Load initial data
        await loadInitialData();
        
        // Show welcome message
        showToast('ವೀರಪುರ ಗ್ರಾಮಕ್ಕೆ ಸುಸ್ವಾಗತ! 🏘️', 'success');
        
        // Check online status
        checkOnlineStatus();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('ಆರಂಭಿಕಗೊಳಿಸಲು ದೋಷ ಸಂಭವಿಸಿದೆ', 'error');
    }
}

// ====== USER SESSION ======
function loadUserSession() {
    const savedUser = localStorage.getItem('veerapura_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (currentUser.role === 'admin') {
            isAdmin = true;
        }
    }
}

function saveUserSession() {
    if (currentUser) {
        localStorage.setItem('veerapura_user', JSON.stringify(currentUser));
    }
}

// ====== EVENT LISTENERS ======
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            scrollToSection(targetId);
            
            // Update active nav
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterServices(category);
            
            // Update active button
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Transport tabs
    document.querySelectorAll('.transport-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            showTransportSchedule(type);
            
            // Update active tab
            document.querySelectorAll('.transport-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Online/offline events
    window.addEventListener('online', () => {
        showToast('ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಪುನಃಸ್ಥಾಪಿಸಲಾಗಿದೆ', 'success');
        syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
        showToast('ಆಫ್‌ಲೈನ್ ಮೋಡ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ', 'warning');
    });
}

// ====== NAVIGATION ======
function scrollToSection(sectionId) {
    const section = document.querySelector(sectionId);
    if (section) {
        window.scrollTo({
            top: section.offsetTop - 100,
            behavior: 'smooth'
        });
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    mobileNav.classList.toggle('show');
}

// ====== LANGUAGE TOGGLE ======
function toggleLanguage() {
    currentLanguage = currentLanguage === 'kn' ? 'en' : 'kn';
    document.getElementById('lang-btn').textContent = currentLanguage === 'kn' ? 'English' : 'ಕನ್ನಡ';
    // In a full implementation, this would update all text on the page
    showToast(`ಭಾಷೆ ${currentLanguage === 'kn' ? 'ಕನ್ನಡ' : 'English'} ಆಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ`, 'info');
}

// ====== ADMIN FUNCTIONS ======
function showAdminLogin() {
    document.getElementById('admin-modal').style.display = 'flex';
}

function closeAdminModal() {
    document.getElementById('admin-modal').style.display = 'none';
}

function showLoginType(type) {
    document.querySelectorAll('.login-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.login-form').forEach(form => form.classList.add('hidden'));
    
    if (type === 'villager') {
        document.querySelector('.login-tab:nth-child(1)').classList.add('active');
        document.getElementById('villager-form').classList.remove('hidden');
    } else {
        document.querySelector('.login-tab:nth-child(2)').classList.add('active');
        document.getElementById('admin-form').classList.remove('hidden');
    }
}

function setVillagerName() {
    const name = document.getElementById('villager-name-input').value.trim();
    if (!name) {
        showToast('ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ನಮೂದಿಸಿ', 'error');
        return;
    }
    
    currentUser = {
        name: name,
        role: 'villager',
        village: CONFIG.VILLAGE_NAME
    };
    
    saveUserSession();
    closeAdminModal();
    showToast(`ಸುಸ್ವಾಗತ ${name} ಸರ್!`, 'success');
}

function adminLogin() {
    const code = document.getElementById('admin-code-input').value.trim();
    
    if (code === CONFIG.ADMIN_CODE) {
        currentUser = {
            name: 'ನಿರ್ವಾಹಕ',
            role: 'admin',
            village: CONFIG.VILLAGE_NAME
        };
        
        isAdmin = true;
        saveUserSession();
        closeAdminModal();
        showToast('ನಿರ್ವಾಹಕರಾಗಿ ಪ್ರವೇಶಿಸಲಾಗಿದೆ', 'success');
        showAdminPanel();
    } else {
        showToast('ತಪ್ಪು ಕೋಡ್', 'error');
    }
}

function showAdminPanel() {
    if (!isAdmin) {
        showAdminLogin();
        return;
    }
    
    document.getElementById('admin-panel-modal').style.display = 'flex';
    loadAdminPanel();
}

function closeAdminPanelModal() {
    document.getElementById('admin-panel-modal').style.display = 'none';
}

function loadAdminPanel() {
    const tabs = [
        { id: 'announcements', name: '📢 ಘೋಷಣೆಗಳು', live: true },
        { id: 'prices', name: '🌾 ಬೆಲೆಗಳು', live: true },
        { id: 'services', name: '🛠️ ಸೇವೆಗಳು', live: true },
        { id: 'emergency', name: '🚑 ತುರ್ತು ಸಂಪರ್ಕ', live: false },
        { id: 'jobs', name: '👷 ಕೆಲಸಗಳು', live: true },
        { id: 'events', name: '📅 ಘಟನೆಗಳು', live: false }
    ];
    
    const tabsContainer = document.getElementById('admin-panel-tabs');
    tabsContainer.innerHTML = '';
    
    tabs.forEach((tab, index) => {
        const button = document.createElement('button');
        button.innerHTML = tab.name;
        if (tab.live) {
            button.innerHTML += ' <span class="live-badge">LIVE</span>';
        }
        button.onclick = () => loadAdminSection(tab.id);
        if (index === 0) button.classList.add('active');
        tabsContainer.appendChild(button);
    });
    
    loadAdminSection(tabs[0].id);
}

function loadAdminSection(sectionId) {
    const contentContainer = document.getElementById('admin-panel-content');
    const tabsContainer = document.getElementById('admin-panel-tabs');
    
    // Update active tab
    tabsContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    switch(sectionId) {
        case 'announcements':
            contentContainer.innerHTML = `
                <h4>ಹೊಸ ಘೋಷಣೆ ಸೇರಿಸಿ</h4>
                <div class="form-group">
                    <input type="text" id="announcement-title" class="form-control" placeholder="ಶೀರ್ಷಿಕೆ">
                </div>
                <div class="form-group">
                    <textarea id="announcement-text" class="form-control" placeholder="ವಿವರಣೆ" rows="4"></textarea>
                </div>
                <button class="btn btn-primary" onclick="saveAnnouncement()">
                    <i class="fas fa-save"></i> ಘೋಷಣೆ ಸೇರಿಸಿ
                </button>
                <div class="mt-3">
                    <h5>ಹಿಂದಿನ ಘೋಷಣೆಗಳು</h5>
                    <div id="announcements-list"></div>
                </div>
            `;
            loadAnnouncementsList();
            break;
            
        case 'prices':
            contentContainer.innerHTML = `
                <h4>ಕೃಷಿ ಬೆಲೆ ಸೇರಿಸಿ</h4>
                <div class="form-group">
                    <input type="text" id="price-crop" class="form-control" placeholder="ಬೆಳೆ ಹೆಸರು">
                </div>
                <div class="form-group">
                    <input type="text" id="price-amount" class="form-control" placeholder="ಬೆಲೆ (₹/100kg)">
                </div>
                <div class="form-group">
                    <input type="text" id="price-market" class="form-control" placeholder="ಮಾರುಕಟ್ಟೆ">
                </div>
                <button class="btn btn-primary" onclick="savePrice()">
                    <i class="fas fa-save"></i> ಬೆಲೆ ಸೇರಿಸಿ
                </button>
            `;
            break;
            
        default:
            contentContainer.innerHTML = `<p>${sectionId} ನಿರ್ವಹಣೆ ಶೀಘ್ರದಲ್ಲಿ ಲಭ್ಯವಾಗುವುದು</p>`;
    }
}

// ====== DATA MANAGEMENT ======
async function saveAnnouncement() {
    const title = document.getElementById('announcement-title').value.trim();
    const text = document.getElementById('announcement-text').value.trim();
    
    if (!title || !text) {
        showToast('ಶೀರ್ಷಿಕೆ ಮತ್ತು ವಿವರಣೆ ಅಗತ್ಯ', 'error');
        return;
    }
    
    try {
        // Save to database
        await saveToDatabase('announcements', {
            title,
            text,
            date: new Date().toLocaleDateString('kn-IN'),
            type: 'announcement'
        });
        
        showToast('ಘೋಷಣೆ ಸೇರಿಸಲಾಗಿದೆ', 'success');
        document.getElementById('announcement-title').value = '';
        document.getElementById('announcement-text').value = '';
        
        // Update announcement bar
        document.getElementById('announcement-text').textContent = text;
        
        // Reload list
        loadAnnouncementsList();
        
    } catch (error) {
        console.error('Save error:', error);
        showToast('ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ', 'error');
    }
}

async function savePrice() {
    const crop = document.getElementById('price-crop').value.trim();
    const price = document.getElementById('price-amount').value.trim();
    const market = document.getElementById('price-market').value.trim() || CONFIG.DISTRICT + ' ಮಾರುಕಟ್ಟೆ';
    
    if (!crop || !price) {
        showToast('ಬೆಳೆ ಮತ್ತು ಬೆಲೆ ಅಗತ್ಯ', 'error');
        return;
    }
    
    try {
        await saveToDatabase('prices', {
            crop,
            price,
            market,
            date: new Date().toLocaleDateString('kn-IN'),
            type: 'price'
        });
        
        showToast('ಬೆಲೆ ಸೇರಿಸಲಾಗಿದೆ', 'success');
        document.getElementById('price-crop').value = '';
        document.getElementById('price-amount').value = '';
        document.getElementById('price-market').value = '';
        
        // Refresh prices table
        loadPrices();
        
    } catch (error) {
        console.error('Save error:', error);
        showToast('ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ', 'error');
    }
}

async function saveToDatabase(collection, data) {
    try {
        // Try to save to JSONBin.io
        const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY
            },
            body: JSON.stringify({
                [collection]: [data, ...(await getFromDatabase(collection))]
            })
        });
        
        if (response.ok) {
            // Also save locally
            saveToLocalStorage(collection, data);
            return true;
        } else {
            throw new Error('Server save failed');
        }
        
    } catch (error) {
        // Fallback to local storage
        saveToLocalStorage(collection, data);
        showToast('ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ', 'warning');
        return false;
    }
}

async function getFromDatabase(collection) {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.record[collection] || [];
        } else {
            throw new Error('Fetch failed');
        }
        
    } catch (error) {
        // Fallback to local storage
        return getFromLocalStorage(collection);
    }
}

function saveToLocalStorage(collection, data) {
    const key = `veerapura_${collection}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(data);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 50))); // Keep only 50 items
}

function getFromLocalStorage(collection) {
    const key = `veerapura_${collection}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
}

// ====== LOAD DATA FUNCTIONS ======
async function loadInitialData() {
    try {
        // Load prices
        await loadPrices();
        
        // Load services
        await loadServices();
        
        // Load announcements
        await loadAnnouncements();
        
        // Load local emergency contacts
        await loadLocalContacts();
        
        // Load jobs
        await loadJobs();
        
    } catch (error) {
        console.error('Data load error:', error);
        showToast('ಮಾಹಿತಿ ಲೋಡ್ ಮಾಡಲು ವಿಫಲ', 'error');
    }
}

async function loadPrices() {
    try {
        const prices = await getFromDatabase('prices');
        const tbody = document.getElementById('prices-table-body');
        
        if (!tbody) return;
        
        if (prices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <p>ಇನ್ನೂ ಬೆಲೆಗಳು ಸೇರಿಸಲಾಗಿಲ್ಲ</p>
                        <button class="btn btn-outline mt-2" onclick="showAdminLogin()">
                            ಬೆಲೆ ಸೇರಿಸಲು ನಿರ್ವಾಹಕರಾಗಿ ಲಾಗಿನ್ ಆಗಿ
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        prices.slice(0, 10).forEach(price => {
            html += `
                <tr>
                    <td><strong>${price.crop}</strong></td>
                    <td><span class="price-value">${price.price}</span></td>
                    <td>${price.market}</td>
                    <td>
                        <span class="trend-up">
                            <i class="fas fa-arrow-up"></i> ಹೆಚ್ಚಳ
                        </span>
                    </td>
                    <td>${price.date}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('Load prices error:', error);
    }
}

async function loadServices() {
    try {
        const services = await getFromDatabase('services');
        const container = document.getElementById('services-grid');
        
        if (!container) return;
        
        if (services.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; padding: 40px;">
                    <i class="fas fa-tools" style="font-size: 3rem; color: var(--gray); margin-bottom: 20px;"></i>
                    <p>ಇನ್ನೂ ಸೇವೆಗಳು ಸೇರಿಸಲಾಗಿಲ್ಲ</p>
                    <button class="btn btn-outline mt-2" onclick="showAdminLogin()">
                        ಸೇವೆ ಸೇರಿಸಲು ನಿರ್ವಾಹಕರಾಗಿ ಲಾಗಿನ್ ಆಗಿ
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        services.forEach(service => {
            html += `
                <div class="service-card" data-category="${service.category || 'other'}">
                    <div class="service-header">
                        <h4>${service.name}</h4>
                        <span class="service-category">${getCategoryName(service.category)}</span>
                    </div>
                    <div class="service-body">
                        <p><i class="fas fa-user"></i> ${service.person}</p>
                        <p><i class="fas fa-phone"></i> ${service.phone}</p>
                        ${service.description ? `<p>${service.description}</p>` : ''}
                    </div>
                    <div class="service-actions">
                        <button class="btn btn-outline" onclick="callNumber('${service.phone}')">
                            <i class="fas fa-phone"></i> ಕರೆ
                        </button>
                        <button class="btn btn-outline" onclick="whatsappNumber('${service.phone}')">
                            <i class="fab fa-whatsapp"></i> ವಾಟ್ಸಾಪ್
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Load services error:', error);
    }
}

async function loadAnnouncements() {
    try {
        const announcements = await getFromDatabase('announcements');
        if (announcements.length > 0) {
            const latest = announcements[0];
            document.getElementById('announcement-text').textContent = latest.text;
        }
    } catch (error) {
        console.error('Load announcements error:', error);
    }
}

async function loadAnnouncementsList() {
    try {
        const announcements = await getFromDatabase('announcements');
        const container = document.getElementById('announcements-list');
        
        if (!container) return;
        
        if (announcements.length === 0) {
            container.innerHTML = '<p>ಯಾವುದೇ ಘೋಷಣೆಗಳಿಲ್ಲ</p>';
            return;
        }
        
        let html = '';
        announcements.slice(0, 5).forEach(ann => {
            html += `
                <div class="announcement-item">
                    <h6>${ann.title}</h6>
                    <p>${ann.text}</p>
                    <small>${ann.date}</small>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Load announcements list error:', error);
    }
}

async function loadLocalContacts() {
    try {
        const contacts = await getFromDatabase('emergency');
        const container = document.getElementById('local-contacts');
        
        if (!container) return;
        
        if (contacts.length === 0) {
            // Add default contacts
            const defaultContacts = [
                { name: 'ಗ್ರಾಮ ಸೇವಕ', phone: '9480012345', description: 'ಗ್ರಾಮ ಕಚೇರಿ' },
                { name: 'ಪಂಚಾಯತ್ ಅಧ್ಯಕ್ಷ', phone: '9448012345', description: 'ಗ್ರಾಮ ಪಂಚಾಯತ್' },
                { name: 'ಕೃಷಿ ಅಧಿಕಾರಿ', phone: '9481123456', description: 'ಕೃಷಿ ಕಚೇರಿ' },
                { name: 'ವಿದ್ಯುತ್ ದೂರವಾಣಿ', phone: '1912', description: 'ವಿದ್ಯುತ್ ದೂರವಾಣಿ' }
            ];
            
            let html = '';
            defaultContacts.forEach(contact => {
                html += `
                    <div class="local-contact">
                        <h5>${contact.name}</h5>
                        <p>${contact.description}</p>
                        <div class="contact-number">${contact.phone}</div>
                        <div class="contact-actions">
                            <button class="btn btn-outline" onclick="callNumber('${contact.phone}')">
                                <i class="fas fa-phone"></i> ಕರೆ
                            </button>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            return;
        }
        
        // Load from database
        let html = '';
        contacts.forEach(contact => {
            html += `
                <div class="local-contact">
                    <h5>${contact.name}</h5>
                    <p>${contact.description}</p>
                    <div class="contact-number">${contact.phone}</div>
                    <div class="contact-actions">
                        <button class="btn btn-outline" onclick="callNumber('${contact.phone}')">
                            <i class="fas fa-phone"></i> ಕರೆ
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Load local contacts error:', error);
    }
}

async function loadJobs() {
    try {
        const jobs = await getFromDatabase('jobs');
        const container = document.getElementById('jobs-list');
        
        if (!container) return;
        
        if (jobs.length === 0) {
            // Add default jobs
            const defaultJobs = [
                { title: 'ದಿನಗೂಲಿ ಕೆಲಸ', salary: '₹500/ದಿನ', location: 'ಗ್ರಾಮದಲ್ಲಿ', description: 'ನಿರ್ಮಾಣ ಕೆಲಸ', contact: '9880012345' },
                { title: 'ಕೃಷಿ ಸಹಾಯಕ', salary: '₹400/ದಿನ', location: 'ಕೃಷಿ ಭೂಮಿ', description: 'ಬೆಳೆ ಕಾಯುವಿಕೆ', contact: '9880012346' },
                { title: 'ಚಾಕರಿ', salary: '₹10,000/ತಿಂಗಳು', location: 'ಹತ್ತಿರದ ಪಟ್ಟಣ', description: 'ಕಾರ್ಖಾನೆ ಕೆಲಸ', contact: '9880012347' }
            ];
            
            let html = '';
            defaultJobs.forEach(job => {
                html += `
                    <div class="job-item">
                        <div class="job-header">
                            <h4>${job.title}</h4>
                            <span class="job-salary">${job.salary}</span>
                        </div>
                        <div class="job-body">
                            <p><i class="fas fa-map-marker-alt"></i> ${job.location}</p>
                            <p>${job.description}</p>
                            <p><i class="fas fa-phone"></i> ${job.contact}</p>
                        </div>
                        <div class="job-actions">
                            <button class="btn btn-primary" onclick="callNumber('${job.contact}')">
                                <i class="fas fa-phone"></i> ಸಂಪರ್ಕಿಸಿ
                            </button>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            return;
        }
        
        // Load from database
        let html = '';
        jobs.forEach(job => {
            html += `
                <div class="job-item">
                    <div class="job-header">
                        <h4>${job.title}</h4>
                        <span class="job-salary">${job.salary}</span>
                    </div>
                    <div class="job-body">
                        <p><i class="fas fa-map-marker-alt"></i> ${job.location}</p>
                        <p>${job.description}</p>
                        <p><i class="fas fa-phone"></i> ${job.contact}</p>
                    </div>
                    <div class="job-actions">
                        <button class="btn btn-primary" onclick="callNumber('${job.contact}')">
                            <i class="fas fa-phone"></i> ಸಂಪರ್ಕಿಸಿ
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Load jobs error:', error);
    }
}

// ====== UTILITY FUNCTIONS ======
function getCategoryName(category) {
    const categories = {
        'electrician': 'ವಿದ್ಯುತ್',
        'plumber': 'ಪ್ಲಂಬಿಂಗ್',
        'transport': 'ಸಾರಿಗೆ',
        'agriculture': 'ಕೃಷಿ',
        'other': 'ಇತರೆ'
    };
    return categories[category] || 'ಇತರೆ';
}

function filterServices(category) {
    const services = document.querySelectorAll('.service-card');
    services.forEach(service => {
        if (category === 'all' || service.getAttribute('data-category') === category) {
            service.style.display = 'block';
        } else {
            service.style.display = 'none';
        }
    });
}

function showTransportSchedule(type) {
    // This would load different schedules based on type
    // For now, we just show the bus schedule
    const schedule = document.getElementById('bus-schedule');
    // In a full implementation, you would show/hide different schedules
}

function filterPrices() {
    const filter = document.getElementById('market-filter').value;
    const date = document.getElementById('price-date').value;
    // Implement filtering logic
    showToast('ಬೆಲೆಗಳು ಫಿಲ್ಟರ್ ಮಾಡಲಾಗುತ್ತಿದೆ', 'info');
}

function showMorePrices() {
    // Load more prices
    showToast('ಹೆಚ್ಚಿನ ಬೆಲೆಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ', 'info');
}

function showSchemeDetails(schemeId) {
    const schemes = {
        'pmkisan': 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಕಿಸಾನ್: ರೈತರಿಗೆ ವಾರ್ಷಿಕ ₹6000 ಸಹಾಯಧನ',
        'scholarship': 'ವಿದ್ಯಾರ್ಥಿ ವೇತನ: 10ನೇ ತರಗತಿ ಉತ್ತೀರ್ಣರಿಗೆ ₹5000',
        'womenshaki': 'ಮಹಿಳಾ ಶಕ್ತಿ: ಸ್ವಯಂ ಸಹಾಯಕ ಗುಂಪುಗಳಿಗೆ ₹1 ಲಕ್ಷದವರೆಗೆ ಸಾಲ',
        'ruralhouse': 'ಗ್ರಾಮೀಣ ಮನೆ: ಬಡವರಿಗೆ ಮನೆ ನಿರ್ಮಾಣಕ್ಕೆ ₹1.2 ಲಕ್ಷ ಸಹಾಯಧನ'
    };
    
    alert(schemes[schemeId] || 'ಯೋಜನೆ ವಿವರಗಳು ಲಭ್ಯವಿಲ್ಲ');
}

// ====== EMERGENCY FUNCTIONS ======
function callEmergency(number) {
    if (confirm(`${number} ಗೆ ಕರೆ ಮಾಡಲು ಬಯಸುವಿರಾ?`)) {
        window.location.href = `tel:${number}`;
    }
}

function callNumber(number) {
    window.location.href = `tel:${number}`;
}

function whatsappEmergency(number) {
    window.open(`https://wa.me/91${number}`, '_blank');
}

function whatsappNumber(number) {
    window.open(`https://wa.me/91${number}`, '_blank');
}

// ====== VOICE FUNCTIONS ======
function setupVoiceRecognition() {
    if ('webkitSpeechRecognition' in window) {
        voiceRecognition = new webkitSpeechRecognition();
        voiceRecognition.lang = 'kn-IN';
        voiceRecognition.continuous = false;
        voiceRecognition.interimResults = false;
        
        voiceRecognition.onstart = () => {
            isListening = true;
            updateVoiceUI(true);
        };
        
        voiceRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            processVoiceCommand(transcript);
        };
        
        voiceRecognition.onend = () => {
            isListening = false;
            updateVoiceUI(false);
        };
        
        voiceRecognition.onerror = (event) => {
            console.error('Voice error:', event.error);
            isListening = false;
            updateVoiceUI(false);
            showToast('ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ದೋಷ', 'error');
        };
    }
}

function startVoiceSearch() {
    showVoiceModal();
}

function showVoiceModal() {
    document.getElementById('voice-modal').style.display = 'flex';
}

function closeVoiceModal() {
    document.getElementById('voice-modal').style.display = 'none';
    if (isListening) {
        voiceRecognition.stop();
    }
}

function startVoiceRecognition() {
    if (!voiceRecognition) {
        showToast('ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ', 'error');
        return;
    }
    
    if (isListening) {
        voiceRecognition.stop();
        return;
    }
    
    try {
        voiceRecognition.start();
    } catch (error) {
        showToast('ಧ್ವನಿ ಅನುಮತಿ ಅಗತ್ಯವಿದೆ', 'error');
    }
}

function updateVoiceUI(listening) {
    const startBtn = document.getElementById('voice-start-btn');
    const statusDiv = document.getElementById('voice-status');
    
    if (listening) {
        startBtn.innerHTML = '<i class="fas fa-stop"></i> ನಿಲ್ಲಿಸಿ';
        startBtn.classList.add('listening');
        statusDiv.innerHTML = `
            <div class="voice-icon">
                <i class="fas fa-microphone" style="color: var(--danger);"></i>
            </div>
            <p>ಕೇಳುತ್ತಿದ್ದೇನೆ... ಮಾತನಾಡಿ</p>
        `;
    } else {
        startBtn.innerHTML = '<i class="fas fa-microphone"></i> ಮಾತನಾಡಿ';
        startBtn.classList.remove('listening');
        statusDiv.innerHTML = `
            <div class="voice-icon">
                <i class="fas fa-microphone"></i>
            </div>
            <p>ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ ಮತ್ತು ಮಾತನಾಡಿ</p>
        `;
    }
}

function processVoiceCommand(transcript) {
    const resultDiv = document.getElementById('voice-result-display');
    resultDiv.innerHTML = `<p><strong>ನೀವು ಹೇಳಿದ್ದು:</strong> "${transcript}"</p>`;
    
    // Convert to lowercase for matching
    const command = transcript.toLowerCase();
    
    // Check for matches in voice commands
    let matchedSection = null;
    for (const [kannadaWord, section] of Object.entries(CONFIG.VOICE_COMMANDS)) {
        if (command.includes(kannadaWord)) {
            matchedSection = section;
            break;
        }
    }
    
    if (matchedSection) {
        setTimeout(() => {
            scrollToSection(`#${matchedSection}`);
            showToast(`${matchedSection} ವಿಭಾಗಕ್ಕೆ ನಿಮ್ಮನ್ನು ಕರೆದೊಯ್ಯಲಾಗುತ್ತಿದೆ`, 'success');
            closeVoiceModal();
        }, 1000);
    } else {
        showToast('ನಿಮ್ಮ ಆದೇಶವನ್ನು ಗುರುತಿಸಲಾಗಲಿಲ್ಲ', 'warning');
    }
}

// ====== TOAST NOTIFICATIONS ======
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast';
    toast.classList.add(type);
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ====== PWA FUNCTIONS ======
function setupPWA() {
    // Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
    
    // Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBtn = document.getElementById('install-app-btn');
        if (installBtn) {
            installBtn.style.display = 'inline-flex';
            installBtn.onclick = installApp;
        }
    });
    
    // App installed
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        showToast('ಅಪ್ಲಿಕೇಶನ್ ಸ್ಥಾಪಿಸಲಾಗಿದೆ!', 'success');
        const installBtn = document.getElementById('install-app-btn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    });
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted install');
            }
            deferredPrompt = null;
        });
    } else {
        showToast('ಅಪ್ಲಿಕೇಶನ್ ಈಗಾಗಲೇ ಸ್ಥಾಪಿಸಲಾಗಿದೆ', 'info');
    }
}

function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'ವೀರಪುರ ಗ್ರಾಮ ಅಪ್ಲಿಕೇಶನ್',
            text: 'ನಮ್ಮ ಹಳ್ಳಿಯ ಡಿಜಿಟಲ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್',
            url: window.location.href
        }).then(() => {
            console.log('Shared successfully');
        }).catch(error => {
            console.log('Share failed:', error);
        });
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                showToast('ಲಿಂಕ್ ನಕಲಿಸಲಾಗಿದೆ', 'success');
            })
            .catch(() => {
                prompt('ಲಿಂಕ್ ನಕಲಿಸಿ:', window.location.href);
            });
    }
}

// ====== UTILITY FUNCTIONS ======
function checkOnlineStatus() {
    if (!navigator.onLine) {
        showToast('ಆಫ್‌ಲೈನ್ ಮೋಡ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ', 'warning');
    }
}

function syncOfflineData() {
    // This would sync any offline data when coming online
    showToast('ಆಫ್‌ಲೈನ್ ಡೇಟಾ ಸಿಂಕ್ ಮಾಡಲಾಗುತ್ತಿದೆ', 'info');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function closeAnnouncement() {
    document.querySelector('.announcement-bar').style.display = 'none';
}

// ====== INITIAL DATA SETUP ======
// This ensures some default data is always available
function setupDefaultData() {
    // Check if default data is already set
    if (localStorage.getItem('veerapura_default_set')) {
        return;
    }
    
    // Default services
    const defaultServices = [
        {
            name: 'ವಿದ್ಯುತ್ ಕೆಲಸಗಾರ',
            person: 'ರಾಮು',
            phone: '9880123456',
            category: 'electrician',
            description: 'ಎಲ್ಲಾ ರೀತಿಯ ವಿದ್ಯುತ್ ದುರಸ್ತಿ ಕೆಲಸ'
        },
        {
            name: 'ಪ್ಲಂಬರ್',
            person: 'ಶಂಕರ್',
            phone: '9845012345',
            category: 'plumber',
            description: 'ನೀರು ಸರಬರಾಜು ಮತ್ತು ದುರಸ್ತಿ'
        }
    ];
    
    defaultServices.forEach(service => {
        saveToLocalStorage('services', service);
    });
    
    // Default prices
    const defaultPrices = [
        {
            crop: 'ಭತ್ತ',
            price: '₹2,800',
            market: 'ಹಾವೇರಿ ಮಾರುಕಟ್ಟೆ',
            date: new Date().toLocaleDateString('kn-IN'),
            type: 'price'
        },
        {
            crop: 'ಕಬ್ಬು',
            price: '₹3,200',
            market: 'ಹಿರೇಕೇರೂರು ಮಾರುಕಟ್ಟೆ',
            date: new Date().toLocaleDateString('kn-IN'),
            type: 'price'
        }
    ];
    
    defaultPrices.forEach(price => {
        saveToLocalStorage('prices', price);
    });
    
    // Mark as set
    localStorage.setItem('veerapura_default_set', 'true');
}

// Run default data setup
setupDefaultData();


// ====== REAL-TIME UPDATES ======
let updateInterval = null;
let lastUpdateTimestamp = null;

async function setupRealtimeUpdates() {
    // Load last update timestamp
    lastUpdateTimestamp = localStorage.getItem(CONFIG.LAST_UPDATE_KEY) || Date.now();
    
    // Start checking for updates
    startUpdateChecking();
    
    // Also check immediately
    await checkForUpdates();
}

function startUpdateChecking() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    updateInterval = setInterval(async () => {
        await checkForUpdates();
    }, CONFIG.UPDATE_CHECK_INTERVAL);
}

async function checkForUpdates() {
    try {
        // Get latest timestamp from server
        const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const serverTimestamp = data.record.timestamp || 0;
            
            if (serverTimestamp > lastUpdateTimestamp) {
                // There are updates!
                lastUpdateTimestamp = serverTimestamp;
                localStorage.setItem(CONFIG.LAST_UPDATE_KEY, serverTimestamp);
                
                // Show update notification
                showUpdateNotification();
                
                // Update all data
                await loadInitialData();
            }
        }
    } catch (error) {
        console.log('Update check failed (offline mode):', error);
    }
}

function showUpdateNotification() {
    // Create a floating update notification
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <div class="update-content">
            <i class="fas fa-sync-alt"></i>
            <span>ಹೊಸ ಮಾಹಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ!</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 15px 20px;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
    `;
    
    const updateContent = notification.querySelector('.update-content');
    updateContent.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const button = notification.querySelector('button');
    button.style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        margin-left: 10px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Update the saveToDatabase function to include timestamp
async function saveToDatabase(collection, data) {
    try {
        // First get current data
        const currentData = await getFromDatabase('all');
        
        // Update the collection
        if (!currentData[collection]) {
            currentData[collection] = [];
        }
        currentData[collection].unshift(data);
        
        // Add timestamp
        currentData.timestamp = Date.now();
        
        // Save to JSONBin.io
        const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY
            },
            body: JSON.stringify(currentData)
        });
        
        if (response.ok) {
            // Also save locally
            saveToLocalStorage(collection, data);
            
            // Show success message
            showToast(`${collection} ನವೀಕರಿಸಲಾಗಿದೆ!`, 'success');
            
            // Notify all users about the update
            notifyUsersAboutUpdate(collection);
            
            return true;
        } else {
            throw new Error('Server save failed');
        }
        
    } catch (error) {
        // Fallback to local storage
        saveToLocalStorage(collection, data);
        showToast('ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ', 'warning');
        return false;
    }
}

function notifyUsersAboutUpdate(type) {
    // This function would send a notification to all connected users
    // For simplicity, we'll just update the timestamp
    localStorage.setItem(CONFIG.LAST_UPDATE_KEY, Date.now());
}

// Update the getFromDatabase function
async function getFromDatabase(collection) {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (collection === 'all') {
                return data.record || {};
            }
            return data.record[collection] || [];
        } else {
            throw new Error('Fetch failed');
        }
        
    } catch (error) {
        // Fallback to local storage
        return getFromLocalStorage(collection);
    }
}