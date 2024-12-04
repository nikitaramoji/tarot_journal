// scripts.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDmlkmqRxQCohuSzLV6oXXSkgiRqZIgRSw",
    authDomain: "tarot-journal-a37af.firebaseapp.com",
    projectId: "tarot-journal-a37af",
    storageBucket: "tarot-journal-a37af.firebasestorage.app",
    messagingSenderId: "254712606286",
    appId: "1:254712606286:web:26c4dafa31831c98985d1f",
    measurementId: "G-NKG8B5348L"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', () => {
    initializeAuthUI();
    initializeTarotCardSelection();
    initializeJournalEntry();
});

function initializeAuthUI() {
    const signInButton = document.getElementById('sign-in-button');
    const signOutButton = document.getElementById('sign-out-button');
    const userInfo = document.getElementById('user-info');
    const journal = document.getElementById('journal-container');

    auth.onAuthStateChanged((user) => {
        if (user) {
            journal.style.display = 'block';
            userInfo.style.display = 'block';
            signInButton.style.display = 'none';
            signOutButton.style.display = 'inline-block';
            document.getElementById('user-name').textContent = `Welcome, ${user.displayName}`;
            document.getElementById('user-email').textContent = `Email: ${user.email}`;
        } else {
            journal.style.display = 'none';
            userInfo.style.display = 'none';
            signInButton.style.display = 'inline-block';
            signOutButton.style.display = 'none';
        }
    });

    signInButton.addEventListener('click', () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                const user = result.user;
                journal.style.display = 'block';
                userInfo.style.display = 'block';
                signInButton.style.display = 'none';
                signOutButton.style.display = 'inline-block';
                document.getElementById('user-name').textContent = `Welcome, ${user.displayName}`;
                document.getElementById('user-email').textContent = `Email: ${user.email}`;
            })
            .catch((error) => {
                console.error('Sign-in error:', error.message);
                alert('Sign-in error: ' + error.message);
            });
    });

    signOutButton.addEventListener('click', () => {
        signOut(auth)
            .then(() => {
                journal.style.display = 'none';
                userInfo.style.display = 'none';
                signInButton.style.display = 'inline-block';
                signOutButton.style.display = 'none';
            })
            .catch((error) => {
                console.error('Sign-out error:', error.message);
                alert('Sign-out error: ' + error.message);
            });
    });
}

async function initializeTarotCardSelection() {
    const tarotCardSelect = document.getElementById('tarot-card-select');
    const cardPaths = await fetchCardPaths();

    tarotCardSelect.addEventListener('change', (event) => {
        const cardValue = event.target.value;
        updateTarotCardImage(cardValue, cardPaths, false);
    });
}

function initializeJournalEntry() {
    const entryDatePicker = document.getElementById('entry-date-picker');
    entryDatePicker.value = new Date().toLocaleDateString('en-CA');
    entryDatePicker.addEventListener('input', loadEntryForSelectedDate);
    loadEntryForSelectedDate();
}

async function loadEntryForSelectedDate() {
    const user = auth.currentUser;
    if (!user) {
        alert('Please sign in to view your entries.');
        return;
    }
    const selectedDate = document.getElementById('entry-date-picker').value;
    if (!selectedDate) {
        return;
    }
    try {
        const docRef = doc(db, 'users', user.uid, 'entries', selectedDate);
        const docSnap = await getDoc(docRef);
        const cardPaths = await fetchCardPaths();
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.querySelector('textarea[placeholder="What\'s your focus or intention for the day?"]').value = data.morningIntentions;
            document.querySelector('textarea[placeholder="How did the day unfold? What lessons or insights emerged?"]').value = data.eveningReflection;
            document.getElementById('tarot-card-select').value = data.cardValue;
            document.getElementById('reversed-checkbox').checked = data.isReversed || false;
            updateTarotCardImage(data.cardValue, cardPaths, data.isReversed);
        } else {
            clearEntryFields();
            updateTarotCardImage('the_fool', cardPaths, false);
        }
    } catch (error) {
        console.error('Error fetching entry: ', error);
        alert('Failed to load the entry. Please try again.');
    }
}

function updateTarotCardImage(cardValue, cardPaths, isReversed) {
    const tarotCardImage = document.querySelector('#journal-container img');
    if (!tarotCardImage) return;
    const imagePath = cardPaths[cardValue];
    if (imagePath) {
        tarotCardImage.src = `https://upload.wikimedia.org/wikipedia/commons/thumb/${imagePath}`;
        tarotCardImage.alt = `${cardValue} Tarot Card`;
        tarotCardImage.style.transform = isReversed ? 'rotate(180deg)' : 'rotate(0deg)'
    } else {
        tarotCardImage.src = '';
        tarotCardImage.alt = 'Tarot Card Not Available';
    }
}

function clearEntryFields() {
    document.querySelector('textarea[placeholder="What\'s your focus or intention for the day?"]').value = '';
    document.querySelector('textarea[placeholder="How did the day unfold? What lessons or insights emerged?"]').value = '';
    document.getElementById('tarot-card-select').value = 'the_fool';
    document.getElementById('reversed-checkbox').value = false;
}
async function fetchCardPaths() {
    const response = await fetch('card_paths.htm');
    return await response.json();
}

async function getCardImagePath(cardValue) {
    const cardPaths = await fetchCardPaths();
    return cardPaths[cardValue] || '';
}
