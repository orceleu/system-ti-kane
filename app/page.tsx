"use client";
import React from "react";
import { useState, useEffect } from "react";
import { auth } from "./firebase/config";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderIcon, Lock, Mail, ShieldCheck } from "lucide-react";
import logo from "@/public/cash.png";
import Image from "next/image";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser != null) {
        router.replace("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const HandleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      console.log(err);
      setError("Email ou mot de passe incorrect");
      setIsLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background soft pastel ambient blur */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/60">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/25">
              <Image
                src={logo}
                alt="Ti kanè"
                className="w-10 h-10 object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Ti kanè
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Finance Manager</p>
          </div>

          {/* Form */}
          <form onSubmit={HandleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-700 font-bold uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 focus-visible:ring-violet-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-700 font-bold uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 focus-visible:ring-violet-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <p className="text-xs text-rose-700 font-semibold">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-500/25 transition-all mt-2 text-sm"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? (
                <LoaderIcon className="animate-spin w-5 h-5" />
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Se connecter
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Développé par ING Orcel Euler · No 47656226
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
