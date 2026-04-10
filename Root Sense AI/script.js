document.addEventListener('DOMContentLoaded', () => {

    // --- ThingSpeak Configuration ---
    // (Credentials are now securely handled via the login page and localStorage)
    let fetchInterval;

    // --- Setup Navigation & Login ---
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const connectEspBtn = document.getElementById('connect-esp-btn');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const emailInput = document.getElementById('username');
    const tsChannelInput = document.getElementById('ts-channel');
    const tsApiInput = document.getElementById('ts-api');
    const loginBtn = document.getElementById('login-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');

    // Check for existing session
    const savedEmail = localStorage.getItem('rootSenseUserEmail');
    if (savedEmail) {
        showDashboard();
    }

    function showDashboard() {
        const savedEmail = localStorage.getItem('rootSenseUserEmail');
        if (savedEmail) {
            const userProfile = document.getElementById('user-profile');
            const userAvatar = document.getElementById('user-avatar');
            const userEmailDisplay = document.getElementById('user-email-display');
            if(userProfile && userAvatar && userEmailDisplay) {
                userProfile.style.display = 'flex';
                // First letter for avatar
                userAvatar.innerText = savedEmail.charAt(0);
                userEmailDisplay.innerText = savedEmail;
            }
        }

        loginSection.classList.remove('active');
        setTimeout(() => {
            dashboardSection.classList.remove('hidden');
            setTimeout(() => {
                dashboardSection.classList.add('active');
            }, 50);
        }, 500);
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const channelId = tsChannelInput.value.trim();
        const apiKey = tsApiInput.value.trim();
        
        // Ensure proper email format before proceeding
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Please enter a proper email address.");
            return;
        }
        
        if (!channelId || !apiKey) {
            alert("  3334743 || 3AH9XSMG6E8ZEMYH");
            return;
        }
        
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;

        setTimeout(() => {
            localStorage.setItem('rootSenseUserEmail', email);
            localStorage.setItem('tsChannelId', channelId);
            localStorage.setItem('tsApiKey', apiKey);
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            showDashboard();
        }, 1500);
    });

    const googleModal = document.getElementById('google-modal');
    const closeModal = document.getElementById('close-modal');
    const accountItems = document.querySelectorAll('.account-item');

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            googleModal.classList.remove('hidden');
            setTimeout(() => {
                googleModal.classList.add('active');
            }, 10);
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            googleModal.classList.remove('active');
            setTimeout(() => {
                googleModal.classList.add('hidden');
            }, 300);
        });
    }

    accountItems.forEach(item => {
        item.addEventListener('click', () => {
            const email = item.querySelector('.account-email').innerText;
            const channelId = tsChannelInput ? tsChannelInput.value.trim() : '';
            const apiKey = tsApiInput ? tsApiInput.value.trim() : '';
            
            // Close modal by removing active class then hiding
            googleModal.classList.remove('active');
            setTimeout(() => {
                googleModal.classList.add('hidden');
            }, 300);

            // Set loading state on the main button
            googleLoginBtn.classList.add('loading');
            googleLoginBtn.disabled = true;

            setTimeout(() => {
                localStorage.setItem('rootSenseUserEmail', email);
                if (channelId) localStorage.setItem('tsChannelId', channelId);
                if (apiKey) localStorage.setItem('tsApiKey', apiKey);
                
                googleLoginBtn.classList.remove('loading');
                googleLoginBtn.disabled = false;
                showDashboard();
            }, 800);
        });
    });

    connectEspBtn.addEventListener('click', () => {
        connectEspBtn.disabled = true;
        connectEspBtn.innerHTML = '⏳ Connecting via ThingSpeak...';
        
        // Start fetching from ThingSpeak
        fetchThingSpeakData();
        
        // Fetch every 15 seconds (ThingSpeak free rate limit)
        fetchInterval = setInterval(fetchThingSpeakData, 15000);
        
        setTimeout(() => {
            connectEspBtn.style.display = 'none'; // Hide button after trying to connect
        }, 500);
    });

    logoutBtn.addEventListener('click', () => {
        // Stop fetching data
        if (fetchInterval) clearInterval(fetchInterval);

        // Clear session
        localStorage.removeItem('rootSenseUserEmail');
        localStorage.removeItem('tsChannelId');
        localStorage.removeItem('tsApiKey');
        
        if (emailInput) emailInput.value = '';
        if (tsChannelInput) tsChannelInput.value = '';
        if (tsApiInput) tsApiInput.value = '';

        dashboardSection.classList.remove('active');
        setTimeout(() => {
            dashboardSection.classList.add('hidden');
            loginSection.classList.add('active');
            resetGauges();
            
            // Reset connection state
            connectEspBtn.style.display = 'flex';
            connectEspBtn.disabled = false;
            connectEspBtn.innerHTML = '🔌 Connect ESP32';
            statusDot.classList.remove('pulse');
            statusDot.classList.add('offline');
            statusText.innerText = 'Offline';
        }, 500);
    });

    // --- Gauge Logic ---
    
    // Geometry constants (matches CSS/SVG)
    const RADIUS_OUTER = 40;
    const RADIUS_INNER = 25;
    const CIRCUMFERENCE_OUTER = Math.PI * RADIUS_OUTER; // half-circle
    const CIRCUMFERENCE_INNER = Math.PI * RADIUS_INNER; // half-circle

    function setGaugeValue(cardId, value, max, isMulti = false) {
        const card = document.getElementById(cardId);
        if (!card) return;

        if (isMulti) {
            // Specifically handling DHT11 double gauge
            const tempVal = value.temp;
            const humVal = value.hum;
            const tempMax = max.temp;
            const humMax = max.hum;

            // Update text
            const tempDisplay = card.querySelector('.temp-val');
            const humDisplay = card.querySelector('.hum-val');
            animateValue(tempDisplay, 0, tempVal, 1500, false);
            animateValue(humDisplay, 0, humVal, 1500, false);

            // Update SVG
            const tempFill = card.querySelector('.gauge-fill.temp');
            const humFill = card.querySelector('.gauge-fill.hum');

            const tempOffset = CIRCUMFERENCE_OUTER - ((tempVal / tempMax) * CIRCUMFERENCE_OUTER);
            const humOffset = CIRCUMFERENCE_INNER - ((humVal / humMax) * CIRCUMFERENCE_INNER);
            
            // Constrain
            tempFill.style.strokeDashoffset = Math.max(0, tempOffset);
            humFill.style.strokeDashoffset = Math.max(0, humOffset);

        } else {
            // Update text
            const display = card.querySelector('.gauge-value .value');
            animateValue(display, 0, value, 1500, cardId === 'card-tds');

            // Update SVG
            const fill = card.querySelector('.gauge-fill');
            const offset = CIRCUMFERENCE_OUTER - ((value / max) * CIRCUMFERENCE_OUTER);
            fill.style.strokeDashoffset = Math.max(0, offset); // Prevent negative offset going over 100%
        }
    }

    async function fetchThingSpeakData() {
        const channelId = localStorage.getItem('tsChannelId');
        const apiKey = localStorage.getItem('tsApiKey');

        // If credentials are not provided
        if (!channelId || !apiKey) {
            console.warn("Please enter your ThingSpeak Channel ID and API Key on the login screen.");
            statusText.innerText = 'Missing API Key';
            statusDot.classList.remove('pulse');
            statusDot.classList.add('offline');
            return;
        }

        try {
            const response = await fetch(`https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=1`);
            
            if (!response.ok) {
                throw new Error(`ThingSpeak API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.feeds && data.feeds.length > 0) {
                const latest = data.feeds[0];
                
                // Make sure these fields correspond to your ESP32's ThingSpeak setup:
                // Field 1: Moisture, Field 2: Air Temp, Field 3: Hum, Field 4: TDS, Field 5: Water Temp
                const moisture = parseFloat(latest.field1) || 0;
                const temp = parseFloat(latest.field2) || 0;
                const hum = parseFloat(latest.field3) || 0;
                const tds = parseFloat(latest.field4) || 0;
                const waterTemp = parseFloat(latest.field5) || 0;

                setGaugeValue('card-moisture', moisture, 100);
                setGaugeValue('card-dht11', { temp: temp, hum: hum }, { temp: 50, hum: 100 }, true);
                setGaugeValue('card-tds', tds, 2000);
                setGaugeValue('card-ds18b20', waterTemp, 40);

                // Update UI to Online
                statusDot.classList.remove('offline');
                statusDot.classList.add('pulse');
                statusText.innerText = 'Connected (ThingSpeak)';
            } else {
                throw new Error('No data feeds found.');
            }
        } catch (error) {
            console.error("Connection error:", error);
            // Reset gauges to 0 if connection errors out
            resetGauges();
            
            // Update UI to Error
            statusDot.classList.remove('pulse');
            statusDot.classList.add('offline');
            statusText.innerText = 'Connection Error';
        }
    }

    function resetGauges() {
        const fills = document.querySelectorAll('.gauge-fill');
        fills.forEach(fill => {
            if (fill.classList.contains('inner')) {
                fill.style.strokeDashoffset = CIRCUMFERENCE_INNER;
            } else {
                fill.style.strokeDashoffset = CIRCUMFERENCE_OUTER;
            }
        });
        
        const values = document.querySelectorAll('.value');
        values.forEach(val => val.innerText = '0');
    }

    // Number Animation Helper
    function animateValue(obj, start, end, duration, noDecimal = false) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // easeOutQuart
            const easeOut = 1 - Math.pow(1 - progress, 4);
            
            let current = start + easeOut * (end - start);
            
            if (noDecimal) {
                obj.innerHTML = Math.floor(current);
            } else {
                // Keep 1 decimal point if end value has decimals, otherwise standard
                obj.innerHTML = current % 1 === 0 && end % 1 === 0 ? Math.floor(current) : current.toFixed(1);
            }
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = noDecimal ? Math.floor(end) : (end % 1 === 0 ? end : end.toFixed(1));
            }
        };
        window.requestAnimationFrame(step);
    }

    // Optional: Real-time simulation
    /*
    setInterval(() => {
        if(dashboardSection.classList.contains('active')) {
             setGaugeValue('card-moisture', 60 + Math.random() * 10, 100);
             // other sensors...
        }
    }, 5000);
    */
});
