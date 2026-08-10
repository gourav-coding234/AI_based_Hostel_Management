import { createContext, useContext, useEffect, useState } from "react";
import { watchAuthState, signOut as firebaseSignOut } from "../firebase/auth";
import { getUserProfile } from "../firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // firebase auth user
  const [profile, setProfile] = useState(null); // users/{uid} doc
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = watchAuthState(async (firebaseUser) => {
      setError(null);
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setError("Couldn't load your profile. Please refresh.");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function logout() {
    await firebaseSignOut();
    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    error,
    isAuthenticated: Boolean(user),
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
