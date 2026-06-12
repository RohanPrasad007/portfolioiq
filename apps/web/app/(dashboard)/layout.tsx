"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useProfileStore } from "@/lib/profile-store";
import { setClientToken } from "@/lib/api-client";
import { useTheme } from "../providers";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isDemo, setIsDemo] = useState(false);
  const { profile: userProfile, fetchProfile } = useProfileStore();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const demoToken = window.localStorage.getItem("demo_token");
      setIsDemo(!!demoToken);
    }
  }, []);

  // Sync user profile stats
  useEffect(() => {
    const syncProfile = async () => {
      let token = "";
      if (session) {
        token = (session as any).accessToken;
        setClientToken(token);
      } else if (isDemo) {
        token = "demo-token";
      }

      if (!token && status !== "loading") {
        router.push("/login");
        return;
      }

      if (token) {
        await fetchProfile(token);
      }
    };

    if (status !== "loading") {
      syncProfile();
    }
  }, [(session as any)?.accessToken, isDemo, status, fetchProfile]);

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("demo_token");
    }
    setClientToken("");
    signOut({ callbackUrl: "/" });
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { name: "New Analysis", path: "/analysis/new", icon: "analytics" },
    { name: "Settings", path: "/settings", icon: "settings" },
  ];

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark text-on-surface dark:text-inverse-on-surface flex font-body-base overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-screen w-60 bg-surface dark:bg-surface-dark border-r border-border-subtle dark:border-border-subtle hidden md:flex flex-col py-6 z-50">
        <div className="px-6 mb-8 cursor-pointer" onClick={() => router.push("/")}>
          <h1 className="font-display-lg text-primary dark:text-primary-fixed-dim tracking-tight font-bold">PortfolioIQ</h1>
          <p className="font-body-sm text-on-surface-variant dark:text-surface-variant text-[11px] uppercase tracking-widest mt-1">AI Career Engine</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? "text-primary dark:text-primary-fixed-dim bg-primary/10 border-l-2 border-primary font-semibold"
                    : "text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant/5 dark:hover:bg-surface-variant/5"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-body-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6 space-y-4">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="font-label-caps text-primary dark:text-primary-fixed-dim text-xs font-bold mb-1">PRO PLAN</p>
            <p className="font-body-sm text-on-surface-variant dark:text-surface-variant text-xs mb-3">Unlimited AI deep-scans</p>
            <button className="w-full py-2 bg-primary text-white text-[12px] font-semibold rounded hover:bg-primary/90 transition-colors">Upgrade to Pro</button>
          </div>
          <div className="pt-4 border-t border-border-subtle dark:border-border-subtle space-y-1">
            <a className="flex items-center gap-3 px-2 py-2 text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors text-sm" href="#">
              <span className="material-symbols-outlined text-[20px]">help</span>
              <span className="font-body-sm">Help Center</span>
            </a>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-2 py-2 text-on-surface-variant dark:text-surface-variant hover:text-error transition-colors text-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="font-body-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <div className="md:ml-60 flex-grow h-screen flex flex-col overflow-hidden w-full">
        
        {/* Sticky Demo Banner */}
        {isDemo && (
          <div className="bg-amber-500 text-black py-2 px-margin-mobile md:px-margin-desktop font-semibold text-sm flex items-center justify-between z-50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">warning</span>
              <span className="text-xs sm:text-sm">Recruiter Demo Mode. Write actions disabled.</span>
            </div>
            <button 
              onClick={handleSignOut}
              className="underline font-bold text-xs hover:opacity-85 cursor-pointer flex-shrink-0"
            >
              Sign in
            </button>
          </div>
        )}

        {/* Header Bar */}
        <header className="sticky top-0 h-16 flex items-center justify-between px-margin-mobile md:px-margin-desktop bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-xl z-40 border-b border-border-subtle dark:border-border-subtle flex-shrink-0">
          <div>
            {/* Desktop greeting */}
            <div className="hidden md:block">
              <h2 className="font-headline-md text-on-surface dark:text-primary-fixed-dim font-semibold text-lg">
                Welcome back, {userProfile?.username || "Developer"}
              </h2>
              <p className="font-body-sm text-on-surface-variant dark:text-surface-variant text-[11px]">
                {isDemo ? "Viewing seeded demo insights profile" : "AI Alignment engine active"}
              </p>
            </div>
            {/* Mobile logo & title */}
            <div className="flex items-center gap-2.5 md:hidden">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-primary-container flex items-center justify-center text-on-primary-container border border-primary/20">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <div>
                <h1 className="font-headline-md text-md font-bold text-primary-fixed-dim tracking-tight leading-none">PortfolioIQ</h1>
                <p className="font-body-sm text-surface-variant text-[9px] uppercase tracking-wider mt-0.5">AI Career Engine</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            {/* Two-button Theme Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-variant/10 dark:bg-surface-variant/5 rounded-full border border-border-subtle dark:border-transparent">
              <button 
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 ${
                  theme === "light" 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-on-surface-variant dark:text-surface-variant hover:text-primary"
                }`}
                title="Light Mode"
              >
                <span className="material-symbols-outlined text-[18px]">light_mode</span>
              </button>
              <button 
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 ${
                  theme === "dark" 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-on-surface-variant dark:text-surface-variant hover:text-primary"
                }`}
                title="Dark Mode"
              >
                <span className="material-symbols-outlined text-[18px]">dark_mode</span>
              </button>
            </div>
            {/* Desktop Profile Info */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-border-subtle dark:border-border-subtle">
              <div className="text-right">
                <p className="font-body-sm font-semibold text-on-surface dark:text-primary-fixed-dim text-sm">{userProfile?.username || "User"}</p>
                <p className="text-[11px] text-on-surface-variant dark:text-surface-variant">{userProfile?.location || "Developer"}</p>
              </div>
              <img
                alt="Profile Avatar"
                className="w-10 h-10 rounded-lg border border-border-subtle object-cover"
                src={userProfile?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=developer"}
              />
            </div>
            {/* Mobile Profile Avatar & Logout */}
            <div className="flex md:hidden items-center gap-2 pl-3 border-l border-border-subtle dark:border-border-subtle">
              <img
                alt="Profile Avatar"
                className="w-8 h-8 rounded-lg border border-border-subtle dark:border-border-subtle object-cover"
                src={userProfile?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=developer"}
              />
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-full text-on-surface-variant dark:text-surface-variant hover:text-error transition-colors cursor-pointer flex items-center justify-center"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-grow overflow-y-auto custom-scrollbar p-margin-mobile md:p-margin-desktop pb-24 md:pb-margin-desktop relative">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-border-subtle dark:border-border-subtle h-16 flex items-center justify-around px-4 pb-safe md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center transition-all duration-150 active:scale-95 ${
                isActive
                  ? "text-primary dark:text-primary-fixed-dim font-bold"
                  : "text-on-surface-variant dark:text-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {item.icon === "analytics" ? "rocket_launch" : item.icon}
              </span>
              <span className="font-label-caps text-[9px] uppercase tracking-wider mt-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
