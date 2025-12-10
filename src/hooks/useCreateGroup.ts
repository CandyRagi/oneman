import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/database/firebase";
import { useAuth } from "@/hooks/useAuth";
import { MATERIAL_SETS } from "@/data/materialSets";
import { Group } from "./useGroups";

interface CreateGroupParams {
    name: string;
    location: string;
    selectedCategory: string;
    selectedCompanies: string[];
    photoFile: File | null;
    activeTab: 'sites' | 'stores';
}

export function useCreateGroup() {
    const { user } = useAuth();
    const [isCreating, setIsCreating] = useState(false);

    const createGroup = async ({
        name,
        location,
        selectedCategory,
        selectedCompanies,
        photoFile,
        activeTab
    }: CreateGroupParams): Promise<Group | null> => {
        if (!user) return null;

        setIsCreating(true);

        try {
            let photoURL = null;

            // Upload photo to Cloudinary if selected
            if (photoFile) {
                const publicId = `${user.uid}/${activeTab}/${Date.now()}`;
                const signRes = await fetch("/api/cloudinary-sign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ publicId, folder: activeTab, overwrite: true }),
                });

                if (!signRes.ok) throw new Error("Failed to get Cloudinary signature");
                const { timestamp, signature, cloudName, apiKey, folder } = await signRes.json();

                const form = new FormData();
                form.append("file", photoFile);
                form.append("api_key", apiKey);
                form.append("timestamp", String(timestamp));
                form.append("signature", signature);
                form.append("public_id", publicId);
                if (folder) form.append("folder", folder);

                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: "POST",
                    body: form,
                });

                if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
                const uploadData = await uploadRes.json();
                photoURL = uploadData.secure_url;
            }

            // Get materials from selected companies
            let materials: Array<{
                id: string;
                name: string;
                unit: string;
                amount: number;
                location: string;
                company: string;
            }> = [];
            selectedCompanies.forEach(companyId => {
                const companySet = MATERIAL_SETS.find(set => set.id === companyId);
                if (companySet) {
                    const companyMaterials = companySet.materials.map(material => ({
                        id: `${Date.now()}-${Math.random()}-${companyId}`,
                        name: material.name,
                        unit: material.unit,
                        amount: 0, // Start with 0 amount
                        location: name.trim(),
                        company: companyId
                    }));
                    materials = [...materials, ...companyMaterials];
                }
            });

            // Create document in Firebase
            const newItemData = {
                name: name.trim(),
                location: location.trim(),
                photoURL,
                adminId: user.uid,
                members: [user.uid],
                materials,
                selectedCategory,
                selectedCompanies,
                createdAt: Timestamp.now(),
                lastActivity: 'Just created'
            };

            const collectionName = activeTab === 'sites' ? 'sites' : 'stores';
            const docRef = await addDoc(collection(db, collectionName), newItemData);

            return {
                id: docRef.id,
                ...newItemData,
                memberCount: 1,
                unreadCount: 0
            } as Group;

        } catch (error) {
            console.error('Error creating item:', error);
            throw error;
        } finally {
            setIsCreating(false);
        }
    };

    return { createGroup, isCreating };
}
