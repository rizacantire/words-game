// shared.js
// Bu dosya, tüm HTML sayfaları tarafından kullanılacak ortak fonksiyonları, Firebase yapılandırmasını ve Tema yönetimini içerir.

// Firebase Modülleri
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// KENDİ FIREBASE YAPILANDIRMANIZ BURADA
// Lütfen Firebase konsolunuzdan aldığınız kendi yapılandırma kodunuzu buraya yapıştırın.
// çoklu chatgpt den istenen en çok kullanılan 500 kelime
/*const firebaseConfig = {
    apiKey: "AIzaSyBX99YL08HxGPqywBBuELGeSFaQ7aqHsdE",
    authDomain: "italyanca-sozluk.firebaseapp.com",
    projectId: "italyanca-sozluk",
    storageBucket: "italyanca-sozluk.firebasestorage.app",
    messagingSenderId: "773584885746",
    appId: "1:773584885746:web:7bfaf9c406bb72a38a3d6b",
    measurementId: "G-K9J3K1HNQ4"
};
*/

// duolingo ile öğrenmeye başladığım kendi kelimelerimin veri tabanı kodu
const firebaseConfig = {
  apiKey: "AIzaSyAIrGvfNYjBP3omXhiXJld7IYkFzkszKOU",
  authDomain: "italyanca-2740a.firebaseapp.com",
  databaseURL: "https://italyanca-2740a-default-rtdb.firebaseio.com",
  projectId: "italyanca-2740a",
  storageBucket: "italyanca-2740a.firebasestorage.app",
  messagingSenderId: "877770240594",
  appId: "1:877770240594:web:e20666cc1dbc335822658b",
  measurementId: "G-8GBGT2SNQR"
};

// Firebase Uygulamasını Başlat
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Analytics başlatıldı
export const db = getFirestore(app); // Firestore'u dışa aktar
export const auth = getAuth(app); // Auth'u dışa aktar

// Kullanıcı bilgileri ve koleksiyon referansı (bu değerler onAuthStateChanged içinde güncellenecek)
export let userId = null;
export let userEmail = null;
export let wordsCollectionRef = null;

// Kullanıcı oturum durumu değiştiğinde dinleyici
onAuthStateChanged(auth, (user) => {
    const userInfoDisplay = document.getElementById('user-info-display');
    const userDisplayText = document.getElementById('user-display-text');
    const signOutButton = document.getElementById('sign-out-button');
    const googleSigninButton = document.getElementById('google-signin-button');
    const startGameModeButton = document.getElementById('start-game-mode-button');
    const manageWordsModeButton = document.getElementById('manage-words-mode-button');

    if (user) {
        userId = user.uid;
        userEmail = user.email || "Misafir Kullanıcı";
        if (userDisplayText) userDisplayText.textContent = `Giriş Yapan: ${userEmail}`;
        if (signOutButton) signOutButton.classList.remove('hidden');
        if (googleSigninButton) googleSigninButton.classList.add('hidden'); // Sadece varsa gizle

        // Ana menüdeki butonların görünürlüğünü güncelle
        if (startGameModeButton) startGameWordsModeButton.classList.remove('hidden');
        if (manageWordsModeButton) manageWordsModeButton.classList.remove('hidden');

        // Firestore koleksiyon referansını güncelle
        wordsCollectionRef = collection(db, `users/${userId}/words`);
        console.log("Firebase Auth State Changed: User logged in. userId:", userId);

    } else {
        userId = null;
        userEmail = null;
        if (userDisplayText) userDisplayText.textContent = "Giriş Yapılmadı";
        if (signOutButton) signOutButton.classList.add('hidden');
        if (googleSigninButton) googleSigninButton.classList.remove('hidden'); // Sadece varsa göster

        // Ana menüdeki butonların görünürlüğünü güncelle
        if (startGameModeButton) startGameModeButton.classList.add('hidden');
        if (manageWordsModeButton) manageWordsModeButton.classList.add('hidden');

        wordsCollectionRef = null; // Kullanıcı yoksa koleksiyon referansını sıfırla
        console.log("Firebase Auth State Changed: User logged out.");
    }
});

// --- Yardımcı Fonksiyonlar ---

/**
 * Bir string'in ilk harfini büyük harfe çevirir, dil duyarlılığına dikkat eder.
 * @param {string} str Giriş string'i.
 * @param {string} locale Dil kodu (örn: 'tr-TR' veya 'it-IT').
 * @returns {string} İlk harfi büyük harfe çevrilmiş string.
 */
export function capitalizeFirstLetter(str, locale = 'tr-TR') {
    if (!str) return '';
    return str.charAt(0).toLocaleUpperCase(locale) + str.slice(1);
}

/**
 * Belirtilen modalı gösterir.
 * @param {string} modalId Gösterilecek modalın ID'si.
 */
export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    } else {
        console.warn(`Modal with ID ${modalId} not found.`);
    }
}

/**
 * Belirtilen modalı gizler.
 * @param {string} modalId Gizlenecek modalın ID'si.
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        if (modalId === 'confirm-modal') {
            const confirmModalTitle = document.getElementById('confirm-modal-title');
            const confirmDetailsList = document.getElementById('confirm-details-list');
            if (confirmModalTitle) confirmModalTitle.textContent = 'Onay Gerekli';
            if (confirmDetailsList) {
                confirmDetailsList.innerHTML = '';
                confirmDetailsList.classList.add('hidden');
            }
        }
    } else {
        console.warn(`Modal with ID ${modalId} not found.`);
    }
}

/**
 * Hata modalını gösterir.
 * @param {string} message Hata mesajı.
 */
export function displayError(message) {
    const errorMessageDisplay = document.getElementById('error-message');
    if (errorMessageDisplay) {
        errorMessageDisplay.textContent = message;
        showModal('error-modal');
    } else {
        console.error("Error message display element not found.", message);
        alert("Hata: " + message); // Fallback alert
    }
}

/**
 * Genel onay modalını gösterir.
 * @param {string} message Ana onay mesajı.
 * @param {Function} callback Kullanıcı onayladığında çağrılacak fonksiyon (true/false döner).
 * @param {string} [title='Onay Gerekli'] Modal başlığı.
 * @param {string[]} [details=[]] Detaylı mesajlar veya silinecek öğelerin listesi.
 */
export function showConfirmModal(message, callback, title = 'Onay Gerekli', details = []) {
    const confirmMessage = document.getElementById('confirm-message');
    const confirmModalTitle = document.getElementById('confirm-modal-title');
    const confirmDetailsList = document.getElementById('confirm-details-list');
    const confirmYesButton = document.getElementById('confirm-yes-button');
    const confirmNoButton = document.getElementById('confirm-no-button');

    if (!confirmMessage || !confirmModalTitle || !confirmYesButton || !confirmNoButton) {
        console.error("Confirm modal elements not found.");
        alert("Onay hatası: " + message); // Fallback alert
        callback(false);
        return;
    }

    confirmModalTitle.textContent = title;
    confirmMessage.textContent = message;

    confirmYesButton.onclick = () => {
        closeModal('confirm-modal');
        callback(true);
    };
    confirmNoButton.onclick = () => {
        closeModal('confirm-modal');
        callback(false);
    };

    confirmDetailsList.innerHTML = '';
    if (details.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'list-disc list-inside text-sm text-left mx-auto max-w-xs';
        details.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
        });
        confirmDetailsList.appendChild(ul);
        confirmDetailsList.classList.remove('hidden');
    } else {
        confirmDetailsList.classList.add('hidden');
    }

    showModal('confirm-modal');
}

// --- Tema Yönetimi Fonksiyonları ---

/**
 * Temayı ayarlar ve yerel depolamaya kaydeder.
 * @param {string} theme 'light' veya 'dark'
 */
export function setTheme(theme) {
    const htmlElement = document.documentElement;
    if (theme === 'dark') {
        htmlElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        htmlElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
    updateThemeToggleButton(); // Buton simgesini güncelle
}

/**
 * Mevcut temayı değiştirir (aydınlık <-> karanlık).
 */
export function toggleTheme() {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        setTheme('light');
    } else {
        setTheme('dark');
    }
}

/**
 * Tema değiştirme butonunun simgesini ve tooltip'ini günceller.
 */
function updateThemeToggleButton() {
    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        if (currentTheme === 'dark') {
            themeToggleButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h1M4 12H3m15.325 3.325l-.707.707M5.372 5.372l-.707-.707M18.628 5.372l.707-.707M5.372 18.628l-.707.707M12 18a6 6 0 110-12 6 6 0 010 12z" />
                </svg>
            `; // Güneş simgesi
            themeToggleButton.title = "Aydınlık Moda Geç";
        } else {
            themeToggleButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            `; // Ay simgesi
            themeToggleButton.title = "Karanlık Moda Geç";
        }
    }
}

// Sayfa yüklendiğinde temayı ayarla
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark'); // Sistem karanlık modu tercih ediyorsa
    } else {
        setTheme('light'); // Varsayılan olarak aydınlık mod
    }

    // Sistem tema tercihi değiştiğinde dinleyici ekle
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        // Eğer kullanıcı manuel bir tercih yapmadıysa, sistem tercihini takip et
        if (!localStorage.getItem('theme')) {
            setTheme(event.matches ? 'dark' : 'light');
        }
    });

    // Tema değiştirme butonuna olay dinleyici ekle
    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }
});


// Firebase Firestore işlemleri için dışa aktarımlar
export { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, getDocs, writeBatch, GoogleAuthProvider, signInWithPopup, signOut };
