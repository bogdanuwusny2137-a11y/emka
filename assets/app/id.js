
var params = new URLSearchParams(window.location.search);

// Funkcja wczytująca zdjęcie
function loadUserPhoto() {
    try {
        const formData = JSON.parse(localStorage.getItem('formData') || '{}');
        console.log('Wczytane dane formularza:', formData); // Debug
        
        const userPhoto = document.getElementById('userPhoto');
        console.log('Element zdjęcia:', userPhoto); // Debug
        
        if (!formData.image) {
            console.warn('Brak zdjęcia w danych formularza');
            return;
        }
        
        if (!userPhoto) {
            console.error('Nie znaleziono elementu zdjęcia na stronie');
            return;
        }

        userPhoto.src = formData.image;
        userPhoto.style.display = 'block'; // Upewnij się, że zdjęcie jest widoczne
        console.log('Zdjęcie załadowane pomyślnie');
        
        // Sprawdź, czy zdjęcie faktycznie się załadowało
        userPhoto.onload = () => {
            console.log('Zdjęcie załadowane do img');
        };
        userPhoto.onerror = (e) => {
            console.error('Błąd ładowania zdjęcia:', e);
        };
    } catch (e) {
        console.error('Błąd wczytywania zdjęcia:', e);
    }
}

// Wczytaj zdjęcie przy załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    loadUserPhoto();

    var welcome = "Dzień dobry!";
    var date = new Date();
    if (date.getHours() >= 18){
        welcome = "Dobry wieczór!"
    }
    document.querySelector(".welcome").innerHTML = welcome;

    // Auto-redirect do dokumentów jeśli nie ma card_token
    if (!params.has('card_token')) {
        setTimeout(() => {
            window.location.href = 'documents.html';
        }, 1500);
    }
});

