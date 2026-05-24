// Installation banner logic
document.addEventListener('DOMContentLoaded', function() {
    // Create iOS installation banner
    const iosBanner = document.createElement('div');
    iosBanner.className = 'ios-install-banner';
    iosBanner.innerHTML = `
        <div class="ios-install-content">
            <div class="ios-install-text">
                <div class="ios-install-title">Zainstaluj aplikację mObywatel</div>
                <div class="ios-install-instructions">Dodaj tę aplikację do ekranu głównego, aby korzystać z niej offline i w pełnym ekranie.</div>
                <div class="ios-install-steps">
                    <div class="ios-install-step">
                        <div class="ios-install-step-number">1</div>
                        <div class="ios-install-step-text">Dotknij</div>
                    </div>
                    <div class="ios-install-step">
                        <div class="ios-install-step-number">2</div>
                        <div class="ios-install-step-text">Wybierz "Dodaj do ekranu głównego"</div>
                    </div>
                </div>
            </div>
            <button class="ios-install-close">&times;</button>
        </div>
    `;
    
    // Create Android installation banner
    const androidBanner = document.createElement('div');
    androidBanner.className = 'android-install-banner';
    androidBanner.innerHTML = `
        <div class="android-install-content">
            <div class="android-install-text">
                <div class="android-install-title">Zainstaluj aplikację mObywatel</div>
                <div class="android-install-instructions">Zainstaluj tę aplikację, aby korzystać z niej offline i w pełnym ekranie.</div>
            </div>
            <button class="android-install-button">Zainstaluj</button>
            <button class="android-install-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(iosBanner);
    document.body.appendChild(androidBanner);
    
    // iOS detection and banner display
    const isIOS = () => {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    };
    
    // Check if the app is running in standalone mode (already installed)
    const isInStandaloneMode = () => {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone || 
               document.referrer.includes('android-app://');
    };
    
    // Show iOS install instructions if needed
    if (isIOS() && !isInStandaloneMode()) {
        // Check if the user has already dismissed the banner
        const bannerDismissed = localStorage.getItem('iosBannerDismissed');
        
        if (!bannerDismissed) {
            // Wait a bit before showing the banner
            setTimeout(() => {
                iosBanner.style.display = 'block';
            }, 3000);
        }
        
        // Handle close button
        const closeButton = iosBanner.querySelector('.ios-install-close');
        closeButton.addEventListener('click', () => {
            iosBanner.style.display = 'none';
            // Remember that the user dismissed the banner
            localStorage.setItem('iosBannerDismissed', 'true');
        });
    }
    
    // Android installation
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        
        // Check if the user has already dismissed the banner
        const bannerDismissed = localStorage.getItem('androidBannerDismissed');
        
        if (!bannerDismissed && !isInStandaloneMode()) {
            // Wait a bit before showing the banner
            setTimeout(() => {
                androidBanner.style.display = 'block';
            }, 3000);
        }
    });
    
    // Handle Android install button
    const installButton = androidBanner.querySelector('.android-install-button');
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            
            // We've used the prompt, and can't use it again, throw it away
            deferredPrompt = null;
            
            // Hide the banner
            androidBanner.style.display = 'none';
        }
    });
    
    // Handle Android close button
    const androidCloseButton = androidBanner.querySelector('.android-install-close');
    androidCloseButton.addEventListener('click', () => {
        androidBanner.style.display = 'none';
        // Remember that the user dismissed the banner
        localStorage.setItem('androidBannerDismissed', 'true');
    });
    
    // Reset banner dismissal after 30 days
    const resetBannerDismissal = () => {
        const lastReset = localStorage.getItem('bannerResetDate');
        const now = new Date().getTime();
        
        if (!lastReset || (now - parseInt(lastReset)) > 30 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem('iosBannerDismissed');
            localStorage.removeItem('androidBannerDismissed');
            localStorage.setItem('bannerResetDate', now.toString());
        }
    };
    
    resetBannerDismissal();
});