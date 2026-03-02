"use client";

import { onAuthStateChanged, User, getIdTokenResult } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/client";

export type UserRole = "admin" | "direcao" | "secretaria" | "professor" | "responsavel";

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  teacherId?: string;
  studentIds?: string[]; // Para responsáveis
  photoURL?: string;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isStaff: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      console.log("AUTH STATE CHANGE:", u?.uid);
      setUser(u);
      (window as any).firebaseUser = u;

      if (!u) {
        console.log("NO USER - STOPPING LOADING");
        setProfile(null);
        setLoading(false);
        return;
      }

      console.log("USER FOUND - ATTEMPTING PROFILE LOAD:", u.uid);
      // Listen to profile changes in Firestore
      const profileRef = doc(db, "users", u.uid);
      const unsubProfile = onSnapshot(profileRef, (snap) => {
        if (snap.exists()) {
          console.log("PROFILE SNAPSHOT RECEIVED (EXISTS)");
          const data = snap.data() as UserProfile;
          setProfile({ ...data, uid: u.uid, email: u.email || "" });
        } else {
          console.log("PROFILE SNAPSHOT RECEIVED (NOT EXISTS)");
          setProfile(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("FIREBASE PERMISSION ERROR OR OTHER:", error);
        setProfile(null);
        setLoading(false);
      });

      return () => unsubProfile();
    });

    return () => unsubAuth();
  }, []);

  const isAdmin = profile?.role === "admin";
  const isStaff = ["admin", "direcao", "secretaria", "professor"].includes(profile?.role || "");

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);