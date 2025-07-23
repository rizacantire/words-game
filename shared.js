// Firebase SDK'sının gerekli modüllerini import et
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, onSnapshot, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

// Uygulama kimliği (Firebase Hosting'de kullanılıyorsa önemlidir, aksi takdirde 'default-app-id' kalabilir)
// Eğer kendi Firebase projenizi kullanıyorsanız, yukarıdaki firebaseConfig objesindeki appId'yi kullanmanız önerilir.
const appId = firebaseConfig.projectId || 'default-app-id'; // Proje ID'sini uygulama kimliği olarak kullan

// Canvas ortamından gelen başlangıç kimlik doğrulama token'ı (eğer ortam sağlıyorsa)
// Kendi Firebase projenizi kullanıyorsanız bu genellikle boş kalacaktır.
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;


// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Kullanıcı kimliği değişkeni
let userId = null;
let wordsCollectionRef = null; // wordsCollectionRef'i burada tanımla

// --- Firebase Kimlik Doğrulama ve Kullanıcı Yönetimi ---

// Kullanıcı durumu değiştiğinde UI'yi güncelleyen fonksiyon
function updateUIForAuthState(user) {
    const googleSigninButton = document.getElementById('google-signin-button');
    const startGameModeButton = document.getElementById('start-game-mode-button');
    const manageWordsModeButton = document.getElementById('manage-words-mode-button');
    const signOutButton = document.getElementById('sign-out-button');
    const userInfoDisplay = document.getElementById('user-info-display');
    const userDisplayText = document.getElementById('user-display-text');

    if (user) {
        // Kullanıcı oturum açmış
        userId = user.uid;
        // Kendi Firebase projeniz için daha standart bir yol kullanın: users/{userId}/words
        wordsCollectionRef = collection(db, `users/${userId}/words`);
        console.log("Kullanıcı oturum açtı:", userId);

        if (googleSigninButton) googleSigninButton.classList.add('hidden');
        if (startGameModeButton) startGameModeButton.classList.remove('hidden');
        if (manageWordsModeButton) manageWordsModeButton.classList.remove('hidden');
        if (signOutButton) signOutButton.classList.remove('hidden');
        if (userInfoDisplay) userInfoDisplay.classList.remove('hidden');
        // Sadece kullanıcının görünen adını veya e-postasını göster
        if (userDisplayText) userDisplayText.textContent = `Hoş geldiniz, ${user.displayName || user.email || 'Misafir'}!`;
    } else {
        // Kullanıcı oturum açmamış veya çıkış yapmış
        userId = null;
        wordsCollectionRef = null;
        console.log("Kullanıcı oturumu kapalı.");

        if (googleSigninButton) googleSigninButton.classList.remove('hidden');
        if (startGameModeButton) startGameModeButton.classList.add('hidden');
        if (manageWordsModeButton) manageWordsModeButton.classList.add('hidden');
        if (signOutButton) signOutButton.classList.add('hidden');
        if (userInfoDisplay) userInfoDisplay.classList.add('hidden');
        if (userDisplayText) userDisplayText.textContent = 'Yükleniyor...';
    }
}

// Kimlik doğrulama durumu değiştiğinde dinleyici
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Kullanıcı zaten oturum açmışsa veya yeni oturum açmışsa
        updateUIForAuthState(user);
    } else {
        // Kullanıcı oturum açmamışsa ve başlangıç token'ı varsa, özel token ile giriş yap
        if (initialAuthToken) {
            try {
                await signInWithCustomToken(auth, initialAuthToken);
                console.log("Özel token ile giriş yapıldı.");
            } catch (error) {
                console.error("Özel token ile giriş hatası:", error);
                // Hata durumunda anonim olarak giriş yap
                await signInAnonymously(auth);
                console.log("Anonim olarak giriş yapıldı.");
            }
        } else {
            // Başlangıç token'ı yoksa anonim olarak giriş yap
            await signInAnonymously(auth);
            console.log("Anonim olarak giriş yapıldı.");
        }
    }
});

// --- Modal Yönetimi ---
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function displayError(message) {
    const errorMessageDisplay = document.getElementById('error-message');
    if (errorMessageDisplay) {
        errorMessageDisplay.textContent = message;
        showModal('error-modal');
    } else {
        console.error("Hata mesajı gösterilemiyor, #error-message elementi bulunamadı. Hata:", message);
    }
}

let confirmResolver = null; // Onay modalı için Promise'i saklamak için

function showConfirmModal(message, callback, title = "Onay Gerekli", details = []) {
    const confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmTitle = document.getElementById('confirm-modal-title');
    const confirmYesButton = document.getElementById('confirm-yes-button');
    const confirmNoButton = document.getElementById('confirm-no-button');
    const confirmDetailsList = document.getElementById('confirm-details-list');

    if (!confirmModal || !confirmMessage || !confirmTitle || !confirmYesButton || !confirmNoButton || !confirmDetailsList) {
        console.error("Onay modalı elementleri bulunamadı.");
        callback(false); // Modal gösterilemezse varsayılan olarak hayır döndür
        return;
    }

    confirmTitle.textContent = title;
    confirmMessage.textContent = message;

    confirmDetailsList.innerHTML = '';
    if (details && details.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'list-disc list-inside text-sm text-gray-700';
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

    // Önceki olay dinleyicilerini kaldır
    confirmYesButton.onclick = null;
    confirmNoButton.onclick = null;

    return new Promise((resolve) => {
        confirmResolver = resolve; // Promise'i sakla

        confirmYesButton.onclick = () => {
            closeModal('confirm-modal');
            callback(true);
            confirmResolver(true);
        };

        confirmNoButton.onclick = () => {
            closeModal('confirm-modal');
            callback(false);
            confirmResolver(false);
        };
    });
}


// --- Yardımcı Fonksiyonlar ---

// Kelimenin ilk harfini büyük yapar
function capitalizeFirstLetter(string, locale = 'tr-TR') {
    if (!string) return '';
    return string.charAt(0).toLocaleUpperCase(locale) + string.slice(1);
}

// --- Tema Yönetimi ---
function setTheme(theme) {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
    updateThemeToggleButton(theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function updateThemeToggleButton(currentTheme) {
    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        if (currentTheme === 'dark') {
            // Güneş ikonu (aydınlık moda geçiş için)
           themeToggleButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-5 h-5 text-yellow-400">
        <path d="M12 4.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V5.25A.75.75 0 0112 4.5zm0 12a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm7.5-4.5a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zm-12 0a.75.75 0 01-.75.75H5.25a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM16.95 7.05a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06zM6.05 16.95a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06zM7.05 7.05a.75.75 0 00-1.06 1.06l1.06 1.06a.75.75 0 001.06-1.06L7.05 7.05zm10.9 9.9a.75.75 0 00-1.06 1.06l1.06 1.06a.75.75 0 001.06-1.06l-1.06-1.06zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z"/>
    </svg>
`;

            themeToggleButton.title = "Aydınlık Moda Geç";
        } else {
            // Ay ikonu (karanlık moda geçiş için)
            themeToggleButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                    <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9c.47 0 .933-.021 1.395-.064a.75.75 0 01.819.162A10.5 10.5 0 0112 22.5C6.201 22.5 1.5 17.799 1.5 12S6.201 1.5 12 1.5a10.5 10.5 0 01-2.472.218z" clip-rule="evenodd" />
                </svg>
            `;
            themeToggleButton.title = "Karanlık Moda Geç";
        }
    }
}

// Sayfa yüklendiğinde temayı uygula ve tema butonunu güncelle
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
});


// Modülleri dışa aktar
export {
    auth,
    db,
    userId, // userId'yi dışa aktar
    wordsCollectionRef, // wordsCollectionRef'i dışa aktar
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onSnapshot,
    collection,
    query,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    getDocs,
    capitalizeFirstLetter,
    showModal,
    closeModal,
    displayError,
    showConfirmModal,
    setTheme,
    toggleTheme
};
