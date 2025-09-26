import { NextResponse } from "next/server";
import { db } from "@/database/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q');
    
    console.log('Email search term:', searchTerm);
    
    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search by email in users collection
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '>=', searchTerm.toLowerCase()),
      where('email', '<=', searchTerm.toLowerCase() + '\uf8ff'),
      limit(10)
    );

    console.log('Executing email query...');
    const snapshot = await getDocs(usersQuery);
    console.log('Email query results:', snapshot.docs.length);
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Users found by email:', users);
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error searching users by email:', error);
    console.error('Error details:', error);
    return NextResponse.json({ 
      error: 'Failed to search users by email', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
