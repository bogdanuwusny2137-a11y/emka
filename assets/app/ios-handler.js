// Sprawdzenie czy aplikacja jest uruchomiona w trybie standalone (PWA)
var isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                    ('standalone' in window.navigator && window.navigator.standalone);

// Generuj token gościa jeśli brak - to kluczowa funkcja dla PWA
function ensureGuestToken() {
    var token = localStorage.getItem('activeToken');
    if (!token) {
        token = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('activeToken', token);
        localStorage.setItem('isGuest', 'true');
        console.log('PWA: wygenerowano token gościa:', token);
    }
}

// Przy starcie w trybie standalone - zapewnij token gościa
if (isStandalone) {
    ensureGuestToken();
}

// Backup przy każdym załadowaniu strony (niezawodniejsze niż beforeunload)
window.addEventListener('pageshow', function() {
    if (isStandalone) {
        ensureGuestToken();
    }
});