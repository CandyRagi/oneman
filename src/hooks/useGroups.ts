import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/database/firebase";
import { useAuth } from "@/hooks/useAuth";

export interface Group {
    id: string;
    name: string;
    location: string;
    photoURL?: string | null;
    lastActivity: string;
    memberCount: number;
    unreadCount: number;
    adminId: string;
    members: string[];
    createdAt: Date | { toDate(): Date };
}

export function useGroups() {
    const { user } = useAuth();
    const [sites, setSites] = useState<Group[]>([]);
    const [stores, setStores] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Load sites where user is a member
                const sitesQuery = query(
                    collection(db, 'sites'),
                    where('members', 'array-contains', user.uid)
                );
                const sitesSnapshot = await getDocs(sitesQuery);
                const sitesData = sitesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    memberCount: doc.data().members?.length || 0,
                    unreadCount: 0 // TODO: Calculate from messages
                })) as Group[];
                setSites(sitesData);

                // Load stores where user is a member
                const storesQuery = query(
                    collection(db, 'stores'),
                    where('members', 'array-contains', user.uid)
                );
                const storesSnapshot = await getDocs(storesQuery);
                const storesData = storesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    memberCount: doc.data().members?.length || 0,
                    unreadCount: 0 // TODO: Calculate from messages
                })) as Group[];
                setStores(storesData);

            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [user]);

    return { sites, setSites, stores, setStores, loading };
}
