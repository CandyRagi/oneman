import { NextResponse } from "next/server";
import { db } from "@/database/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q');
    
    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search by email (since we don't have a separate users collection yet)
    // In a real app, you'd have a users collection with displayName, email, etc.
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '>=', searchTerm),
      where('email', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );

    const snapshot = await getDocs(usersQuery);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
