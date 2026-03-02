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
const regularBtn = document.getElementById('regularBtn');
const discountedBtn = document.getElementById('discountedBtn');
const paymentButtons = document.querySelectorAll('.payment-btn:not(.clear-btn)');
const clearButton = document.getElementById('clearPayment');
const selectedAmountDisplay = document.getElementById('selectedAmount');
const displayPerPersonFare = document.getElementById('displayPerPersonFare');
const displayTotalFare = document.getElementById('displayTotalFare');
const changeDisplay = document.getElementById('changeDisplay');
const barangayList = document.getElementById('barangayList');

// State variables
let selectedFareType = 'regular';
let selectedPayment = 0;

// ========== PWA INSTALLATION ==========
let deferredPrompt;
const installButton = document.getElementById('installButton');

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

// ========== FARE TYPE BUTTONS ==========
regularBtn.addEventListener('click', function() {
    regularBtn.classList.add('active');
    discountedBtn.classList.remove('active');
    selectedFareType = 'regular';
    updateAllCalculations();
    saveSettings();
});

discountedBtn.addEventListener('click', function() {
    discountedBtn.classList.add('active');
    regularBtn.classList.remove('active');
    selectedFareType = 'discounted';
    updateAllCalculations();
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
    updateAllCalculations();
    
    // Event listeners
    routeSelect.addEventListener('change', function() {
        updateBarangayList();
        populateBarangayDropdowns();
        updateAllCalculations();
        saveSettings();
    });
    
    pickupSelect.addEventListener('change', updateAllCalculations);
    dropoffSelect.addEventListener('change', updateAllCalculations);
    multiplierInput.addEventListener('input', updateAllCalculations);
    
    // Add validation for multiplier
    multiplierInput.addEventListener('blur', function() {
        if (this.value === '' || parseInt(this.value) < 1) {
            this.value = 1;
            updateAllCalculations();
        }
        saveSettings();
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
            multiplierInput.value = settings.multiplier || 1;
            
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
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// Start the application
init();