"use client";

import { useState } from "react";
import { auth, db } from "../../database/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // Save extra fields in Firestore
      await setDoc(doc(db, "users", user.uid), {
        username,
        email,
        createdAt: new Date(),
      });

      router.push("/"); // redirect to home after signup
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-16 right-12 w-36 h-36 bg-blue-100 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute bottom-20 left-8 w-44 h-44 bg-blue-200 rounded-full opacity-15 blur-2xl"></div>
      </div>

      {/* Main form container */}
      <div className="relative w-full max-w-sm">
        <form 
          onSubmit={handleSignup} 
          className="bg-white/80 backdrop-blur-xl border border-gray-200/30 rounded-3xl shadow-lg shadow-black/5 p-8 space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Create Account</h1>
            <p className="text-gray-500 text-sm">Join us and start your journey</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Input fields */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Username"
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-lg transition-all duration-200 text-base"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="relative">
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-lg transition-all duration-200 text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-lg transition-all duration-200 text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Sign up button */}
          <button 
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all duration-200 text-base"
          >
            Create Account
          </button>

          {/* Sign in link */}
          <div className="text-center pt-2">
            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <span 
                className="text-blue-600 font-medium hover:text-blue-700 cursor-pointer transition-colors duration-200" 
                onClick={() => router.push("/signin")}
              >
                Sign In
              </span>
            </p>
          </div>
        </form>
      </div>

      <style jsx global>{`
        /* Prevent scrolling on this page */
        html, body {
          overflow: hidden;
          height: 100vh;
        }
        
        /* Enhanced focus styles for accessibility */
        input:focus {
          outline: none;
        }
        
        /* Smooth animations for mobile */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Prevent zoom on input focus (iOS Safari) */
        input {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}