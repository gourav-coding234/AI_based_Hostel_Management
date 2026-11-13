import { createContext, useContext, useEffect, useState } from "react";
import { watchAuthState, signOut as firebaseSignOut } from "../firebase/auth";
import { getUserProfile } from "../firebase/firestore";
import { getLocalProfilePhoto } from "../utils/localProfilePhotos";

function withLocalProfilePhoto(uid, profile) {
  if (!profile) return profile;
  const localPhoto = getLocalProfilePhoto(uid);
  // Profile photos are browser-local. Do not fall back to a stale Firebase URL.
  return { ...profile, photoURL: localPhoto || "" };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // firebase auth user
  const [profile, setProfile] = useState(null); // users/{uid} doc
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let profileRequest = 0;
    const unsubscribe = watchAuthState(async (firebaseUser) => {
      const requestId = ++profileRequest;
      setError(null);
      setUser(firebaseUser);
      setProfile(null);
      setLoading(Boolean(firebaseUser));

      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      try {
        const userProfile = await getUserProfile(firebaseUser.uid);
        if (requestId !== profileRequest) return;
        setProfile(withLocalProfilePhoto(firebaseUser.uid, userProfile));
      } catch (err) {
        if (requestId !== profileRequest) return;
        console.error("Failed to load user profile:", err);
        setError(err?.code === "resource-exhausted"
          ? "Firebase reached its usage limit while loading your account profile. Check Firestore Usage in Firebase Console."
          : err?.code === "permission-denied"
            ? "Firebase denied access to your account profile. Check your user document and Firestore rules."
            : `Couldn't load your profile: ${err?.message || "Please refresh."}`);
      } finally {
        if (requestId === profileRequest) setLoading(false);
      }
    });

    return () => {
      profileRequest += 1;
      unsubscribe();
    };
  }, []);

  async function logout() {
    await firebaseSignOut();
    setUser(null);
    setProfile(null);
  }

  // Re-fetches the current user's profile doc without a full page reload —
  // used after a self-service profile edit so the sidebar/topbar reflect
  // the new name/photo right away. Doesn't touch the auth session itself.
  async function refreshProfile() {
    if (!user) return;
    setError(null);
    try {
      const userProfile = await getUserProfile(user.uid);
      setProfile(withLocalProfilePhoto(user.uid, userProfile));
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
      setError(err?.code === "resource-exhausted"
        ? "Firebase reached its usage limit while loading your account profile. Check Firestore Usage in Firebase Console."
        : err?.code === "permission-denied"
          ? "Firebase denied access to your account profile. Check your user document and Firestore rules."
          : `Couldn't load your profile: ${err?.message || "Please refresh."}`);
    }
  }

  function setLocalProfilePhoto(photoURL) {
    setProfile((current) => current ? { ...current, photoURL: photoURL || "" } : current);
  }

  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    error,
    isAuthenticated: Boolean(user),
    logout,
    refreshProfile,
    setLocalProfilePhoto,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
