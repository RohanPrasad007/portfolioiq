"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { useSession } from "next-auth/react";
import { useProfileStore } from "@/lib/profile-store";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDemo(!!window.localStorage.getItem("demo_token"));
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const token = session ? (session as any).accessToken : (typeof window !== "undefined" && window.localStorage.getItem("demo_token") || "");
      if (token) {
        await fetchProfile(token);
      }
    };
    loadProfile();
  }, [(session as any)?.accessToken, fetchProfile]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setEmail(session?.user?.email || "recruiter-demo@portfolioiq.com");
    }
  }, [profile, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      setMessage({
        type: "error",
        text: "Write operations are disabled in Recruiter Demo mode. Sign in with GitHub to update settings!",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      
      // Simulating a profile update call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setMessage({
        type: "success",
        text: "Settings updated successfully!",
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to update profile settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 font-body-base px-1 md:px-0">
      <div>
        <h1 className="font-display-lg text-2xl md:text-3xl font-bold text-on-surface dark:text-white mb-2">Account Settings</h1>
        <p className="text-on-surface-variant dark:text-surface-variant text-xs md:text-sm">
          Manage your profile settings and API configuration preferences.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 text-sm ${
            message.type === "success"
              ? "bg-secondary/10 border border-secondary/20 text-secondary dark:text-secondary-fixed-dim"
              : "bg-error/10 border border-error/20 text-error"
          }`}
        >
          <span className="material-symbols-outlined text-lg shrink-0">
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 glass-panel p-5 sm:p-6 md:p-8 rounded-xl">
        <h3 className="font-headline-md text-base md:text-lg text-on-surface dark:text-white font-semibold flex items-center gap-2 border-b border-black/10 dark:border-border-subtle pb-4">
          <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim shrink-0">account_circle</span>
          Profile Information
        </h3>

        {/* Username */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface dark:text-white uppercase tracking-wider text-[11px] opacity-75">
            GITHUB USERNAME
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={saving}
            className="w-full px-4 py-3 rounded-lg bg-white dark:bg-surface-dark border border-black/15 dark:border-border-subtle text-on-surface dark:text-white placeholder-on-surface-variant/50 dark:placeholder-surface-variant focus:outline-none focus:border-primary text-sm transition-all"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface dark:text-white uppercase tracking-wider text-[11px] opacity-75">
            EMAIL ADDRESS
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
            className="w-full px-4 py-3 rounded-lg bg-white dark:bg-surface-dark border border-black/15 dark:border-border-subtle text-on-surface dark:text-white placeholder-on-surface-variant/50 dark:placeholder-surface-variant focus:outline-none focus:border-primary text-sm transition-all"
          />
        </div>

        {/* Integration preferences */}
        <div className="space-y-4 pt-4">
          <h4 className="font-headline-md text-sm md:text-base text-on-surface dark:text-white font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary dark:text-secondary-fixed-dim shrink-0">settings_ethernet</span>
            Connected Integrations
          </h4>
          
          <div className="p-4 rounded-lg bg-surface-variant/5 border border-black/10 dark:border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl text-primary dark:text-primary-fixed-dim shrink-0">code</span>
              <div>
                <p className="text-on-surface dark:text-white text-sm font-medium leading-none">GitHub OAuth</p>
                <p className="text-on-surface-variant dark:text-surface-variant text-xs mt-1 leading-relaxed">Used to scan public code files and documentation.</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-secondary/15 text-secondary dark:text-secondary-fixed-dim uppercase tracking-wider shrink-0">
              Connected
            </span>
          </div>

          <div className="p-4 rounded-lg bg-surface-variant/5 border border-black/10 dark:border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl text-primary dark:text-primary-fixed-dim shrink-0">cloud_upload</span>
              <div>
                <p className="text-on-surface dark:text-white text-sm font-medium leading-none">Cloudinary Storage</p>
                <p className="text-on-surface-variant dark:text-surface-variant text-xs mt-1 leading-relaxed">Stores parsed candidate resume document PDF blobs.</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-secondary/15 text-secondary dark:text-secondary-fixed-dim uppercase tracking-wider shrink-0">
              Connected
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-primary text-on-primary font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-primary cursor-pointer disabled:opacity-50"
        >
          {saving ? "Updating Settings..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
