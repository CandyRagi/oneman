import { NextResponse } from "next/server";
import { db } from "@/database/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q');
    
    console.log('Search term:', searchTerm);
    
    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Get all users and filter client-side to avoid index requirements
    const usersRef = collection(db, 'users');
    console.log('Executing query...');
    const snapshot = await getDocs(usersRef);
    console.log('Query results:', snapshot.docs.length);
    
    const allUsers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{
      id: string;
      username?: string;
      email?: string;
      displayName?: string;
      photoURL?: string;
    }>;

    // Filter users by username (case-insensitive partial match)
    const filteredUsers = allUsers.filter(user => 
      user.username && 
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Limit to 10 results

    console.log('Users found:', filteredUsers);
    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    console.error('Error searching users:', error);
    console.error('Error details:', error);
    return NextResponse.json({ 
      error: 'Failed to search users', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
