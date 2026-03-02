// src/lib/firebase/client.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 1) Lê as envs
const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 2) Log de diagnóstico (mascara a apiKey)
console.log("FIREBASE CFG:", {
  ...cfg,
  apiKey: cfg.apiKey ? `${cfg.apiKey.slice(0, 6)}***` : cfg.apiKey,
});

// 3) Falha cedo com erro claro se faltar env
const required: Array<keyof typeof cfg> = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const missing = required.filter((k) => !cfg[k]);
if (missing.length) {
  throw new Error(
    `Variáveis Firebase faltando no .env.local: ${missing.join(
      ", "
    )}. (Pare o servidor e rode npm run dev de novo após salvar.)`
  );
}

// 4) Config final (garantido não-undefined)
const firebaseConfig = {
  apiKey: cfg.apiKey!,
  authDomain: cfg.authDomain!,
  projectId: cfg.projectId!,
  storageBucket: cfg.storageBucket!,
  messagingSenderId: cfg.messagingSenderId!,
  appId: cfg.appId!,
};

// 5) Inicializa Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// 6) Exporta serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);