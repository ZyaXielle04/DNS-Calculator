// Barangay data for each route
const routeData = {
    route1: {
        name: "Route 1",
        barangays: [
            "Bagumbayan / San Jose",
            "Matungao",
            "Panginay Guiguinto",
            "Panginay Balagtas",
            "Wawa"
        ]
    },
    route2: {
        name: "Route 2",
        barangays: [
            "Bagumbayan / San Jose",
            "Matungao",
            "Tuktukan"
        ]
    },
    route3: {
        name: "Route 3",
        barangays: [
            "Bagumbayan / San Jose",
            "Maysantol",
            "San Nicolas",
            "Pitpitan",
            "Mambog",
            "Matimbo",
            "Panasahan",
            "Bagna",
            "Atlag",
            "San Juan / Sto. Rosario",
        ]
    }
};

// DOM Elements
const routeSelect = document.getElementById('routeSelect');
const pickupSelect = document.getElementById('pickupSelect');
const dropoffSelect = document.getElementById('dropoffSelect');
const multiplierButtons = document.querySelectorAll('.multiplier-btn');
const regularBtn = document.getElementById('regularBtn');
const discountedBtn = document.getElementById('discountedBtn');
const paymentButtons = document.querySelectorAll('.payment-btn:not(.clear-btn)');
const clearButton = document.getElementById('clearPayment');
const selectedAmountDisplay = document.getElementById('selectedAmount');
const changeDisplay = document.getElementById('changeDisplay');
const barangayList = document.getElementById('barangayList');

// State variables
let selectedFareType = 'regular';
let selectedPayment = 0;
let currentMultiplier = 1;

// ========== PWA INSTALLATION & UPDATE HANDLING ==========
let deferredPrompt;
const installButton = document.getElementById('installButton');

// Detect if running on iOS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

// Show iOS installation instructions (prominent and persistent)
function showiOSInstallInstructions() {
    if (isStandalone) return; // Already installed
    
    // Remove any existing iOS banner
    const existingBanner = document.getElementById('ios-install-banner');
    if (existingBanner) existingBanner.remove();
    
    // Create a sticky banner at the top
    const iosBanner = document.createElement('div');
    iosBanner.id = 'ios-install-banner';
    iosBanner.style.cssText = `
        background: linear-gradient(135deg, #1a4b6d, #2e7d5a);
        color: white;
        padding: 15px;
        border-radius: 12px;
        margin: 10px 0 20px 0;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        border: 2px solid #ffd966;
        position: relative;
        animation: pulse 2s infinite;
    `;
    
    iosBanner.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 10px;">📱 ➕ 🏠</div>
        <h3 style="margin: 0 0 10px 0; color: #ffd966;">Install as App on iPhone/iPad</h3>
        <p style="margin: 8px 0; font-size: 1rem;">1️⃣ Tap the <strong style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 20px;">Share ⎙</strong> button below</p>
        <p style="margin: 8px 0; font-size: 1rem;">2️⃣ Scroll down & tap <strong style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 20px;">"Add to Home Screen"</strong></p>
        <p style="margin: 8px 0; font-size: 1rem;">3️⃣ Tap <strong style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 20px;">"Add"</strong> in top right</p>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
            <button id="dismiss-ios" style="
                background: transparent;
                color: white;
                border: 2px solid white;
                padding: 8px 20px;
                border-radius: 30px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.9rem;
            ">✓ Got it</button>
            <button id="remind-later-ios" style="
                background: transparent;
                color: #ffd966;
                border: 2px solid #ffd966;
                padding: 8px 20px;
                border-radius: 30px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.9rem;
            ">Remind Later</button>
        </div>
    `;
    
    // Insert at the top of the card (after h1)
    const card = document.querySelector('.card');
    const h1 = document.querySelector('h1');
    card.insertBefore(iosBanner, h1.nextSibling);
    
    // Add animation keyframes if not exists
    if (!document.getElementById('ios-animation-style')) {
        const style = document.createElement('style');
        style.id = 'ios-animation-style';
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); }
                100% { transform: scale(1); }
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            #ios-install-banner {
                transition: all 0.3s ease;
            }
            #ios-help-button {
                animation: bounce 2s infinite;
            }
            #ios-help-button:hover {
                background: #2e7d5a;
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Handle dismiss
    document.getElementById('dismiss-ios').addEventListener('click', function(e) {
        e.stopPropagation();
        iosBanner.remove();
        localStorage.setItem('iosInstallDismissed', 'true');
        showToast('You can always tap the 📱 button to install later');
    });
    
    // Handle remind later
    document.getElementById('remind-later-ios').addEventListener('click', function(e) {
        e.stopPropagation();
        iosBanner.remove();
        // Show again after 24 hours (in milliseconds)
        localStorage.setItem('iosInstallRemindTime', Date.now() + 24 * 60 * 60 * 1000);
        showToast('Reminder set for tomorrow');
    });
}

// Add a floating help button for iOS users
function addiOSHelpButton() {
    if (!isIOS || isStandalone) return;
    
    // Check if button already exists
    if (document.getElementById('ios-help-button')) return;
    
    const helpButton = document.createElement('button');
    helpButton.id = 'ios-help-button';
    helpButton.innerHTML = '📱 Install App';
    helpButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1a4b6d;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 50px;
        font-weight: 600;
        font-size: 1rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        cursor: pointer;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 2px solid #ffd966;
    `;
    
    document.body.appendChild(helpButton);
    
    // Show instructions when clicked
    helpButton.addEventListener('click', function() {
        // Remove existing banner if any
        const existingBanner = document.getElementById('ios-install-banner');
        if (existingBanner) existingBanner.remove();
        
        showiOSInstallInstructions();
        
        // Scroll to instructions smoothly
        setTimeout(() => {
            document.getElementById('ios-install-banner').scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    });
}

// Check if we should show iOS install instructions
function checkAndShowiOSInstructions() {
    if (!isIOS || isStandalone) return;
    
    // Check if user dismissed permanently
    if (localStorage.getItem('iosInstallDismissed') === 'true') {
        // Still show the help button even if dismissed
        addiOSHelpButton();
        return;
    }
    
    // Check remind later time
    const remindTime = localStorage.getItem('iosInstallRemindTime');
    if (remindTime && Date.now() < parseInt(remindTime)) {
        addiOSHelpButton();
        return;
    }
    
    // Show instructions after a short delay
    setTimeout(() => {
        showiOSInstallInstructions();
        addiOSHelpButton();
    }, 1500);
}

// Triple-tap on header to show instructions
function addTripleTapListener() {
    let tapCount = 0;
    let tapTimer;
    
    document.addEventListener('touchend', function(e) {
        // If user taps on header or its children
        if (e.target.closest('h1')) {
            tapCount++;
            
            clearTimeout(tapTimer);
            tapTimer = setTimeout(() => {
                tapCount = 0;
            }, 2000);
            
            if (tapCount === 3) {
                // Remove existing banner if any
                const existingBanner = document.getElementById('ios-install-banner');
                if (existingBanner) existingBanner.remove();
                
                showiOSInstallInstructions();
                showToast('✨ Installation guide activated!');
                tapCount = 0;
            }
        }
    });
}

// Check if already installed as PWA
if (isStandalone) {
    console.log('App is running in standalone mode (installed)');
    // Add installed badge to header
    const h1 = document.querySelector('h1');
    if (h1) {
        h1.innerHTML = h1.innerHTML + ' <span style="font-size: 0.8rem; background: #4CAF50; color: white; padding: 3px 8px; border-radius: 20px; margin-left: 10px;">✓ Installed</span>';
    }
}

// For iOS, show installation instructions
if (isIOS) {
    // Check and show instructions
    setTimeout(() => {
        checkAndShowiOSInstructions();
        addTripleTapListener();
    }, 2000);
} else {
    // For non-iOS devices, listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Only show if not already installed
        if (!isStandalone) {
            installButton.style.display = 'flex';
        }
    });

    // Install button click handler (for Android/Desktop)
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        installButton.style.display = 'none';
        deferredPrompt = null;
    });
}

// App installed event (works on both platforms after installation)
window.addEventListener('appinstalled', (evt) => {
    installButton.style.display = 'none';
    deferredPrompt = null;
    console.log('App was installed successfully');
    showToast('✅ App installed successfully!');
    
    // Remove iOS elements if present
    const iosMsg = document.getElementById('ios-install-banner');
    if (iosMsg) iosMsg.remove();
    
    const iosBtn = document.getElementById('ios-help-button');
    if (iosBtn) iosBtn.remove();
    
    // Update header with installed badge
    const h1 = document.querySelector('h1');
    if (h1 && !h1.innerHTML.includes('Installed')) {
        h1.innerHTML = h1.innerHTML + ' <span style="font-size: 0.8rem; background: #4CAF50; color: white; padding: 3px 8px; border-radius: 20px; margin-left: 10px;">✓ Installed</span>';
    }
});

// Register Service Worker with aggressive update handling
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Register with { updateViaCache: 'none' } to prevent caching of sw.js
        navigator.serviceWorker.register('/sw.js', { 
            updateViaCache: 'none' // Critical fix for updates!
        })
        .then(registration => {
            console.log('ServiceWorker registered successfully');
            
            // Immediate update check after registration
            registration.update();
            console.log('Initial update check triggered');
            
            // Check for updates every 15 minutes (more frequent)
            setInterval(() => {
                registration.update();
                console.log('Checking for service worker updates...');
            }, 15 * 60 * 1000); // 15 minutes
            
            // Check for updates when page becomes visible
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    console.log('Page became visible - checking for updates');
                    registration.update();
                }
            });
            
            // Listen for update found
            registration.addEventListener('updatefound', () => {
                console.log('🚀 Update found! New service worker installing...');
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    console.log('Service worker state changed to:', newWorker.state);
                    
                    // When new worker is installed and waiting
                    if (newWorker.state === 'installed' && registration.active) {
                        console.log('✨ New service worker installed and waiting');
                        showUpdateNotification(registration, true); // Show notification immediately
                    }
                });
            });
            
            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'UPDATE_COMPLETED') {
                    console.log('Update completed successfully:', event.data.cacheName);
                    showToast('✅ App updated successfully!');
                }
            });
        })
        .catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
        
        // Listen for controller change (when new worker takes over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Controller changed - new service worker activated');
            
            // Show reload prompt
            const reloadBanner = document.createElement('div');
            reloadBanner.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #2e7d5a;
                color: white;
                padding: 12px 24px;
                border-radius: 50px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                z-index: 10000;
                display: flex;
                gap: 15px;
                align-items: center;
                font-weight: 600;
                animation: slideDown 0.3s ease;
            `;
            
            reloadBanner.innerHTML = `
                <span>🔄 App updated! Reload to see changes</span>
                <button onclick="location.reload()" style="
                    background: white;
                    color: #2e7d5a;
                    border: none;
                    padding: 6px 16px;
                    border-radius: 30px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.9rem;
                ">Reload Now</button>
            `;
            
            document.body.appendChild(reloadBanner);
            
            // Auto-hide after 30 seconds
            setTimeout(() => {
                reloadBanner.remove();
            }, 30000);
        });
    });
    
    // Check for updates when connection is restored
    window.addEventListener('online', () => {
        console.log('Connection restored - checking for updates');
        navigator.serviceWorker.ready.then(registration => {
            registration.update();
        });
    });
}

// Show toast message
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #1a4b6d;
        color: white;
        padding: 10px 20px;
        border-radius: 30px;
        font-size: 0.9rem;
        font-weight: 500;
        z-index: 9999;
        animation: slideUp 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Show update notification to user immediately
function showUpdateNotification(registration, immediate = true) {
    // Remove existing banner if any
    const existingBanner = document.getElementById('update-banner');
    if (existingBanner) {
        existingBanner.remove();
    }
    
    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #1a4b6d;
        color: white;
        padding: 15px 25px;
        border-radius: 50px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 9999;
        display: flex;
        gap: 15px;
        align-items: center;
        font-weight: 600;
        animation: slideUp 0.3s ease;
        cursor: pointer;
        transition: transform 0.2s;
    `;
    
    banner.onmouseover = () => banner.style.transform = 'translateX(-50%) scale(1.02)';
    banner.onmouseout = () => banner.style.transform = 'translateX(-50%) scale(1)';
    
    banner.innerHTML = `
        <span>✨ New version available!</span>
        <button id="update-btn" style="
            background: white;
            color: #1a4b6d;
            border: none;
            padding: 8px 20px;
            border-radius: 30px;
            font-weight: 600;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
        ">Update Now</button>
    `;
    
    document.body.appendChild(banner);
    
    // Add animation style if not exists
    if (!document.getElementById('update-animation-style')) {
        const style = document.createElement('style');
        style.id = 'update-animation-style';
        style.textContent = `
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translate(-50%, 20px);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
            }
            @keyframes slideDown {
                from {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, 20px);
                }
            }
            #update-btn:hover {
                background: #f0f0f0;
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Handle update button click
    document.getElementById('update-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        // Send message to waiting service worker to activate
        if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            banner.innerHTML = '<span>🔄 Updating...</span>';
        } else {
            // If no waiting worker, check again
            registration.update();
            banner.innerHTML = '<span>🔄 Checking for updates...</span>';
        }
        
        setTimeout(() => {
            banner.remove();
        }, 2000);
    });
    
    // Auto-hide after 2 minutes if not interacted with
    setTimeout(() => {
        if (document.getElementById('update-banner')) {
            banner.remove();
        }
    }, 120000);
}

// ========== MULTIPLIER BUTTONS ==========
multiplierButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all multiplier buttons
        multiplierButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update current multiplier
        currentMultiplier = parseInt(this.dataset.value);
        
        // Update change display
        updateChange();
        
        // Save settings
        saveSettings();
    });
});

// ========== FARE TYPE BUTTONS ==========
regularBtn.addEventListener('click', function() {
    regularBtn.classList.add('active');
    discountedBtn.classList.remove('active');
    selectedFareType = 'regular';
    updateChange(); // Just update the change display
    saveSettings();
});

discountedBtn.addEventListener('click', function() {
    discountedBtn.classList.add('active');
    regularBtn.classList.remove('active');
    selectedFareType = 'discounted';
    updateChange(); // Just update the change display
    saveSettings();
});

// ========== PAYMENT BUTTONS ==========
paymentButtons.forEach(button => {
    button.addEventListener('click', function() {
        const amount = parseFloat(this.dataset.amount);
        selectedPayment = amount;
        selectedAmountDisplay.textContent = `Selected: ₱${selectedPayment.toFixed(2)}`;
        updateChange();
    });
});

// Clear payment button
clearButton.addEventListener('click', function() {
    selectedPayment = 0;
    selectedAmountDisplay.textContent = 'Selected: ₱0.00';
    updateChange();
});

// ========== CORE CALCULATOR FUNCTIONS ==========

// Initialize the page
function init() {
    loadSettings();
    updateBarangayList();
    populateBarangayDropdowns();
    updateChange(); // Just update change display
    
    // Set active multiplier button based on saved value
    multiplierButtons.forEach(btn => {
        if (parseInt(btn.dataset.value) === currentMultiplier) {
            btn.classList.add('active');
        }
    });
    
    // Event listeners
    routeSelect.addEventListener('change', function() {
        updateBarangayList();
        populateBarangayDropdowns();
        updateChange(); // Just update change display
        saveSettings();
    });
    
    pickupSelect.addEventListener('change', updateChange);
    dropoffSelect.addEventListener('change', updateChange);
    
    // Check for updates when page loads
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update();
        });
    }
}

// Update the displayed barangay list
function updateBarangayList() {
    const route = routeSelect.value;
    const data = routeData[route];
    barangayList.innerHTML = `<strong>${data.name} Barangays:</strong> ${data.barangays.join(', ')}`;
}

// Populate pickup and dropoff dropdowns
function populateBarangayDropdowns() {
    const route = routeSelect.value;
    const barangays = routeData[route].barangays;
    
    // Save current selections if possible
    const currentPickup = pickupSelect.value;
    const currentDropoff = dropoffSelect.value;
    
    // Clear dropdowns
    pickupSelect.innerHTML = '';
    dropoffSelect.innerHTML = '';
    
    // Populate pickup
    barangays.forEach(barangay => {
        const option = document.createElement('option');
        option.value = barangay;
        option.textContent = barangay;
        pickupSelect.appendChild(option);
    });
    
    // Populate dropoff
    barangays.forEach(barangay => {
        const option = document.createElement('option');
        option.value = barangay;
        option.textContent = barangay;
        dropoffSelect.appendChild(option);
    });
    
    // Try to restore selections, otherwise set defaults
    if (barangays.includes(currentPickup)) {
        pickupSelect.value = currentPickup;
    } else {
        pickupSelect.value = barangays[0];
    }
    
    if (barangays.includes(currentDropoff)) {
        dropoffSelect.value = currentDropoff;
    } else {
        dropoffSelect.value = barangays.length > 1 ? barangays[1] : barangays[0];
    }
}

// Calculate total fare (internal function - not displayed)
function calculateTotalFare() {
    const route = routeSelect.value;
    const barangays = routeData[route].barangays;
    const pickup = pickupSelect.value;
    const dropoff = dropoffSelect.value;
    
    // Find indices of pickup and dropoff
    const pickupIndex = barangays.indexOf(pickup);
    const dropoffIndex = barangays.indexOf(dropoff);
    
    if (pickupIndex === -1 || dropoffIndex === -1) {
        return 0;
    }
    
    // Calculate number of barangays visited (inclusive of pickup and dropoff)
    const start = Math.min(pickupIndex, dropoffIndex);
    const end = Math.max(pickupIndex, dropoffIndex);
    const barangaysVisited = end - start + 1;
    
    // Calculate base fare based on selected fare type
    let baseFarePerPerson;
    if (barangaysVisited <= 4) {
        baseFarePerPerson = selectedFareType === 'regular' ? 13 : 11;
    } else {
        const extraBarangays = barangaysVisited - 4;
        const baseRate = selectedFareType === 'regular' ? 13 : 11;
        baseFarePerPerson = baseRate + (extraBarangays * 2);
    }
    
    // Calculate total fare with multiplier
    return baseFarePerPerson * currentMultiplier;
}

// Calculate and display change automatically
function updateChange() {
    const totalFare = calculateTotalFare();
    
    // Handle different payment scenarios
    if (selectedPayment <= 0) {
        changeDisplay.innerHTML = '<span class="change-placeholder">💳 Select payment amount</span>';
        return;
    }
    
    if (selectedPayment < totalFare) {
        const kulang = (totalFare - selectedPayment).toFixed(2);
        changeDisplay.innerHTML = `<span style="color: #c44545;">⚠️ Insufficient payment — need ₱${kulang} more</span>`;
        return;
    }
    
    const change = selectedPayment - totalFare;
    
    // Format change display with visual feedback
    if (change === 0) {
        changeDisplay.innerHTML = `✅ Exact payment — no change`;
    } else {
        changeDisplay.innerHTML = `💰 Change: ₱${change.toFixed(2)}`;
    }
    
    // Add animation class for visual feedback
    changeDisplay.classList.add('fare-update');
    setTimeout(() => {
        changeDisplay.classList.remove('fare-update');
    }, 300);
}

// Add validation for pickup and dropoff to prevent same selection
function validateLocations() {
    if (pickupSelect.value === dropoffSelect.value) {
        const barangays = routeData[routeSelect.value].barangays;
        const currentIndex = barangays.indexOf(pickupSelect.value);
        if (currentIndex < barangays.length - 1) {
            dropoffSelect.value = barangays[currentIndex + 1];
        } else if (currentIndex > 0) {
            dropoffSelect.value = barangays[currentIndex - 1];
        }
        updateChange();
    }
}

// Add validation to location changes
pickupSelect.addEventListener('change', validateLocations);
dropoffSelect.addEventListener('change', validateLocations);

// Save last used settings to localStorage
function saveSettings() {
    const settings = {
        route: routeSelect.value,
        multiplier: currentMultiplier,
        fareType: selectedFareType
    };
    localStorage.setItem('fareCalculatorSettings', JSON.stringify(settings));
}

// Load saved settings
function loadSettings() {
    const saved = localStorage.getItem('fareCalculatorSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            routeSelect.value = settings.route || 'route1';
            currentMultiplier = settings.multiplier || 1;
            
            // Set fare type button
            if (settings.fareType) {
                selectedFareType = settings.fareType;
                if (selectedFareType === 'regular') {
                    regularBtn.classList.add('active');
                    discountedBtn.classList.remove('active');
                } else {
                    discountedBtn.classList.add('active');
                    regularBtn.classList.remove('active');
                }
            }
        } catch (e) {
            console.log('Error loading settings');
        }
    }
}

// Handle online/offline status
function updateOnlineStatus() {
    if (!navigator.onLine) {
        const offlineDiv = document.createElement('div');
        offlineDiv.className = 'offline-indicator';
        offlineDiv.textContent = '📴 You are offline - using cached version';
        document.body.prepend(offlineDiv);
        
        setTimeout(() => {
            offlineDiv.remove();
        }, 3000);
    } else {
        // When coming back online, check for updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.update();
            });
        }
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// Start the application
init();