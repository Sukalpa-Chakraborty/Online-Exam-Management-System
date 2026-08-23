import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import type { UserProfile } from "../types/user";

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({
    children,
}: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] =
        useState<UserProfile | null>(null);

    const [loading, setLoading] = useState(true);

    const refreshUserProfile = async () => {
        if (!auth.currentUser) {
            setUserProfile(null);
            return;
        }

        try {
            const userRef = doc(
                db,
                "users",
                auth.currentUser.uid
            );

            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                setUserProfile({
                    ...userDoc.data(),
                } as UserProfile);
            } else {
                setUserProfile(null);
            }
        } catch (error) {
            console.error(
                "Failed to refresh user profile:",
                error
            );
        }
    };

    useEffect(() => {
        let unsubscribeProfile: (() => void) | undefined;
        const unsubscribe = onAuthStateChanged(
            auth,
            async (currentUser) => {
                try {
                    setLoading(true);
                    setUser(currentUser);

                    if (currentUser) {
                        const userRef = doc(
                            db,
                            "users",
                            currentUser.uid
                        );

                        unsubscribeProfile?.();
                        unsubscribeProfile = onSnapshot(userRef, (userDoc) => {
                            setUserProfile(userDoc.exists() ? ({ ...userDoc.data() } as UserProfile) : null);
                            setLoading(false);
                        }, () => {
                            setUserProfile(null);
                            setLoading(false);
                        });
                    } else {
                        setUserProfile(null);
                    }
                } catch (error) {
                    console.error(
                        "Error loading user profile:",
                        error
                    );

                    setUserProfile(null);
                } finally { if (!currentUser) setLoading(false); }
            }
        );

        return () => { unsubscribeProfile?.(); unsubscribe(); };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                userProfile,
                loading,
                refreshUserProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside an AuthProvider"
        );
    }

    return context;
}
