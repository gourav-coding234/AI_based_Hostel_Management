import { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { watchAuthState, signOut as firebaseSignOut } from "../firebase/auth";
import { getUserProfile } from "../firebase/firestore";
import { db } from "../firebase/config";
import { getLocalProfilePhoto } from "../utils/localProfilePhotos";

function withLocalProfilePhoto(uid, profile) {
  if (!profile) return profile;
  const localPhoto = getLocalProfilePhoto(uid);
  // Photos are browser-local by design; don't fall back to an old or broken
  // remote URL. An empty local override means the user removed the photo.
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
    let unsubscribeProfile = null;
    const unsubscribeAuth = watchAuthState((firebaseUser) => {
      const requestId = ++profileRequest;
      unsubscribeProfile?.();
      unsubscribeProfile = null;
      setError(null);
      setUser(firebaseUser);
      setProfile(null);
      setLoading(Boolean(firebaseUser));

      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      unsubscribeProfile = onSnapshot(doc(db, "users", firebaseUser.uid), (snapshot) => {
        if (requestId !== profileRequest) return;
        const nextProfile = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
        if (nextProfile?.status === "Inactive") {
          setProfile(null);
          setError("This account has been deactivated. Contact the administrator if you need access restored.");
          setLoading(false);
          firebaseSignOut().catch((signOutError) => console.error("Could not end the deactivated session:", signOutError));
          return;
        }
        setProfile(withLocalProfilePhoto(firebaseUser.uid, nextProfile));
        setLoading(false);
      }, (err) => {
        if (requestId !== profileRequest) return;
        console.error("Failed to load user profile:", err);
        setError(err?.code === "resource-exhausted"
          ? "Firebase reached its usage limit while loading your account profile. Check Firestore Usage in Firebase Console."
          : err?.code === "permission-denied"
            ? "Firebase denied access to your account profile. Check your user document and Firestore rules."
            : `Couldn't load your profile: ${err?.message || "Please refresh."}`);
        setLoading(false);
      });
    });

    return () => {
      profileRequest += 1;
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  // Profile photos are intentionally stored in this browser (no Firebase
  // Storage). Keep the avatar in other open tabs in sync with that local copy.
  useEffect(() => {
    if (!user?.uid) return undefined;
    const key = `gce-hostel:profile-photo:v1:${user.uid}`;
    function syncPhoto(event) {
      if (event.key !== key) return;
      setProfile((current) => current ? { ...current, photoURL: event.newValue ?? "" } : current);
    }
    window.addEventListener("storage", syncPhoto);
    return () => window.removeEventListener("storage", syncPhoto);
  }, [user?.uid]);

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
