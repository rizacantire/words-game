// shared.js
// Bu dosya, tüm HTML sayfaları tarafından kullanılacak ortak fonksiyonları ve Firebase yapılandırmasını içerir.

// Firebase Modülleri
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// KENDİ FIREBASE YAPILANDIRMANIZ BURADA
// Lütfen Firebase konsolunuzdan aldığınız kendi yapılandırma kodunuzu buraya yapıştırın.
const firebaseConfig = {
    apiKey: "AIzaSyBX99YL08HxGPqywBBuELGeSFaQ7aqHsdE",
    authDomain: "italyanca-sozluk.firebaseapp.com",
    projectId: "italyanca-sozluk",
    storageBucket: "italyanca-sozluk.firebasestorage.app",
    messagingSenderId: "773584885746",
    appId: "1:773584885746:web:7bfaf9c406bb72a38a3d6b",
    measurementId: "G-K9J3K1HNQ4"
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
        userDisplayText.textContent = `Giriş Yapan: ${userEmail}`;
        signOutButton.classList.remove('hidden');
        if (googleSigninButton) googleSigninButton.classList.add('hidden'); // Sadece varsa gizle

        // Ana menüdeki butonların görünürlüğünü güncelle
        if (startGameModeButton) startGameModeButton.classList.remove('hidden');
        if (manageWordsModeButton) manageWordsModeButton.classList.remove('hidden');

        // Firestore koleksiyon referansını güncelle
        wordsCollectionRef = collection(db, `users/${userId}/words`);
        console.log("Firebase Auth State Changed: User logged in. userId:", userId);

        // Her sayfada kendi onSnapshot dinleyicisini kurmak daha iyi bir yaklaşım olacaktır.
        // Bu shared.js dosyasında genel bir onSnapshot tutmak yerine,
        // her sayfa kendi DOM'una özel veri çekme ve güncelleme işlemini yapar.

    } else {
        userId = null;
        userEmail = null;
        userDisplayText.textContent = "Giriş Yapılmadı";
        signOutButton.classList.add('hidden');
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
    console.log(`Attempting to show modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        console.log(`Modal ${modalId} display set to flex.`);
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
        if (modalId === 'edit-word-modal') {
            // currentEditingDocId bu sayfaya özel olacak, burada sıfırlanmayacak
        }
        if (modalId === 'confirm-modal') {
            // confirmActionCallback bu sayfaya özel olacak, burada sıfırlanmayacak
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
 * Callback fonksiyonu bu modala özel olarak atanacak.
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

    // Callback'i global bir değişkene atamak yerine, doğrudan olay dinleyicilerinde kullanacağız
    // Bu, shared.js'in daha temiz kalmasını sağlar ve her sayfanın kendi callback'ini yönetmesine izin verir.
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

// Firebase Firestore işlemleri için dışa aktarımlar
export { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, getDocs, writeBatch, GoogleAuthProvider, signInWithPopup, signOut };

