import Firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import { seedDatabase } from '../seed';

const config = {
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

function createLocalFirebaseFallback() {
  const listeners = new Set();
  const collections = new Map();

  function getCollection(name) {
    if (!collections.has(name)) {
      collections.set(name, []);
    }

    return collections.get(name);
  }

  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem('authUser'));
  } catch (e) {
    // Ignore JSON parsing errors
  }

  if (storedUser && (!storedUser.displayName || !storedUser.photoURL)) {
    storedUser.displayName = storedUser.displayName || 'Subscriber';
    storedUser.photoURL = storedUser.photoURL || '1';
    localStorage.setItem('authUser', JSON.stringify(storedUser));
  }

  const previewUser = {
    displayName: storedUser?.displayName || 'Subscriber',
    email: storedUser?.email || '',
    photoURL: storedUser?.photoURL || '1',
    uid: storedUser?.uid || 'local-preview-user',
    updateProfile(updates = {}) {
      Object.assign(previewUser, updates);
      auth.currentUser = { ...previewUser };
      localStorage.setItem('authUser', JSON.stringify(previewUser));
      listeners.forEach((listener) => listener(auth.currentUser));

      return Promise.resolve();
    },
  };

  const auth = {
    currentUser: storedUser ? { ...previewUser } : null,
    onAuthStateChanged(callback) {
      listeners.add(callback);
      const timer = setTimeout(() => callback(auth.currentUser), 0);

      return () => {
        clearTimeout(timer);
        listeners.delete(callback);
      };
    },
    signInWithEmailAndPassword(email, password) {
      previewUser.email = email;
      previewUser.displayName = email ? email.split('@')[0] : 'Subscriber';
      previewUser.photoURL = '1';
      previewUser.uid = `${email || 'local-preview'}:${password || 'password'}`;
      auth.currentUser = { ...previewUser };
      localStorage.setItem('authUser', JSON.stringify(previewUser));
      listeners.forEach((listener) => listener(auth.currentUser));

      return Promise.resolve({ user: auth.currentUser });
    },
    createUserWithEmailAndPassword(email, password) {
      previewUser.email = email;
      previewUser.displayName = email ? email.split('@')[0] : 'Subscriber';
      previewUser.photoURL = '1';
      previewUser.uid = `${email || 'local-preview'}:${password || 'password'}`;
      auth.currentUser = { ...previewUser };
      localStorage.setItem('authUser', JSON.stringify(previewUser));
      listeners.forEach((listener) => listener(auth.currentUser));

      return Promise.resolve({ user: auth.currentUser });
    },
    signOut() {
      auth.currentUser = null;
      localStorage.removeItem('authUser');
      listeners.forEach((listener) => listener(null));

      return Promise.resolve();
    },
  };

  const firestore = {
    collection(name) {
      return {
        add(document) {
          const storedDocument = {
            id: document.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            data: () => ({ ...document }),
          };

          getCollection(name).push(storedDocument);

          return Promise.resolve(storedDocument);
        },
        get() {
          return Promise.resolve({ docs: getCollection(name) });
        },
      };
    },
  };

  return {
    auth: () => auth,
    firestore: () => firestore,
  };
}

const firebase = Object.values(config).every(Boolean) ? Firebase.initializeApp(config) : createLocalFirebaseFallback();

if (!Object.values(config).every(Boolean)) {
  seedDatabase(firebase);
}

export { firebase };
