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
const multiplierInput = document.getElementById('multiplierInput');
const discountSelect = document.getElementById('discountSelect');
const bayadInput = document.getElementById('bayadInput');
const displayPerPersonFare = document.getElementById('displayPerPersonFare');
const displayTotalFare = document.getElementById('displayTotalFare');
const changeDisplay = document.getElementById('changeDisplay');
const barangayList = document.getElementById('barangayList');

// ========== PWA INSTALLATION ==========
let deferredPrompt;
const installButton = document.createElement('button');
installButton.id = 'installButton';
installButton.className = 'install-btn';
installButton.innerHTML = '📲 Install App';
installButton.style.display = 'none';

// Add install button to the card
document.querySelector('.card').appendChild(installButton);

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered successfully');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = 'flex';
});

// Install button click handler
installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    installButton.style.display = 'none';
    deferredPrompt = null;
});

// App installed event
window.addEventListener('appinstalled', (evt) => {
    installButton.style.display = 'none';
    deferredPrompt = null;
    console.log('App was installed successfully');
});

// Check if app is running in standalone mode
if (window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true) {
    console.log('App is running in standalone mode');
}

// ========== CORE CALCULATOR FUNCTIONS ==========

// Initialize the page
function init() {
    updateBarangayList();
    populateBarangayDropdowns();
    updateAllCalculations();
    
    // Event listeners - all updates happen automatically
    routeSelect.addEventListener('change', function() {
        updateBarangayList();
        populateBarangayDropdowns();
        updateAllCalculations();
    });
    
    pickupSelect.addEventListener('change', updateAllCalculations);
    dropoffSelect.addEventListener('change', updateAllCalculations);
    multiplierInput.addEventListener('input', updateAllCalculations);
    discountSelect.addEventListener('change', updateAllCalculations);
    bayadInput.addEventListener('input', updateAllCalculations);
    
    // Add keyboard support for Enter key
    bayadInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            updateAllCalculations();
        }
    });
}

// Update all calculations and display
function updateAllCalculations() {
    calculateFare();
    updateChange();
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

// Calculate fare based on selections
function calculateFare() {
    const route = routeSelect.value;
    const barangays = routeData[route].barangays;
    const pickup = pickupSelect.value;
    const dropoff = dropoffSelect.value;
    const multiplier = parseInt(multiplierInput.value) || 1;
    const discountType = discountSelect.value;
    
    // Find indices of pickup and dropoff
    const pickupIndex = barangays.indexOf(pickup);
    const dropoffIndex = barangays.indexOf(dropoff);
    
    if (pickupIndex === -1 || dropoffIndex === -1) {
        return;
    }
    
    // Calculate number of barangays visited (inclusive of pickup and dropoff)
    const start = Math.min(pickupIndex, dropoffIndex);
    const end = Math.max(pickupIndex, dropoffIndex);
    const barangaysVisited = end - start + 1;
    
    // Calculate base fare
    let baseFarePerPerson;
    if (barangaysVisited <= 4) {
        baseFarePerPerson = discountType === 'regular' ? 13 : 11;
    } else {
        const extraBarangays = barangaysVisited - 4;
        const baseRate = discountType === 'regular' ? 13 : 11;
        baseFarePerPerson = baseRate + (extraBarangays * 2);
    }
    
    // Calculate total fare with multiplier
    const totalFare = baseFarePerPerson * multiplier;
    
    // Update displays
    displayPerPersonFare.textContent = `₱${baseFarePerPerson.toFixed(2)}`;
    displayTotalFare.textContent = `₱${totalFare.toFixed(2)}`;
    
    return { baseFarePerPerson, totalFare, barangaysVisited };
}

// Calculate and display change automatically
function updateChange() {
    const fareData = calculateFare();
    if (!fareData) return;
    
    const totalFare = fareData.totalFare;
    const bayad = parseFloat(bayadInput.value) || 0;
    
    // Handle different payment scenarios
    if (bayad <= 0) {
        changeDisplay.innerHTML = '<span class="change-placeholder">💳 Enter payment amount</span>';
        return;
    }
    
    if (bayad < totalFare) {
        const kulang = (totalFare - bayad).toFixed(2);
        changeDisplay.innerHTML = `<span style="color: #c44545;">⚠️ Insufficient payment — need ₱${kulang} more</span>`;
        return;
    }
    
    const change = bayad - totalFare;
    
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

// Add real-time formatting for bayad input
bayadInput.addEventListener('focus', function() {
    if (this.value === '0' || this.value === '') {
        this.value = '';
    }
});

bayadInput.addEventListener('blur', function() {
    if (this.value === '') {
        this.value = '';
        updateAllCalculations();
    }
});

// Add input validation for multiplier
multiplierInput.addEventListener('blur', function() {
    if (this.value === '' || parseInt(this.value) < 1) {
        this.value = 1;
        updateAllCalculations();
    }
});

// Add validation for pickup and dropoff to prevent same selection
function validateLocations() {
    if (pickupSelect.value === dropoffSelect.value) {
        // If same, try to set dropoff to next available
        const barangays = routeData[routeSelect.value].barangays;
        const currentIndex = barangays.indexOf(pickupSelect.value);
        if (currentIndex < barangays.length - 1) {
            dropoffSelect.value = barangays[currentIndex + 1];
        } else if (currentIndex > 0) {
            dropoffSelect.value = barangays[currentIndex - 1];
        }
        updateAllCalculations();
    }
}

// Add validation to location changes
pickupSelect.addEventListener('change', validateLocations);
dropoffSelect.addEventListener('change', validateLocations);

// Save last used settings to localStorage
function saveSettings() {
    const settings = {
        route: routeSelect.value,
        multiplier: multiplierInput.value,
        discountType: discountSelect.value
    };
    localStorage.setItem('fareCalculatorSettings', JSON.stringify(settings));
}

// Load saved settings
function loadSettings() {
    const saved = localStorage.getItem('fareCalculatorSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            routeSelect.value = settings.route;
            multiplierInput.value = settings.multiplier;
            discountSelect.value = settings.discountType;
        } catch (e) {
            console.log('Error loading settings');
        }
    }
}

// Save settings when changed
routeSelect.addEventListener('change', saveSettings);
multiplierInput.addEventListener('change', saveSettings);
discountSelect.addEventListener('change', saveSettings);

// Load settings and start
loadSettings();

// Handle online/offline status
function updateOnlineStatus() {
    if (!navigator.onLine) {
        // Show offline indicator
        const offlineDiv = document.createElement('div');
        offlineDiv.className = 'offline-indicator';
        offlineDiv.textContent = '📴 You are offline - using cached version';
        document.body.prepend(offlineDiv);
        
        setTimeout(() => {
            offlineDiv.remove();
        }, 3000);
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// Start the application
init();