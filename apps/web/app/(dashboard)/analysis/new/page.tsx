"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";

export default function NewAnalysisPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [targetJobTitle, setTargetJobTitle] = useState("");
  const [targetJobDescription, setTargetJobDescription] = useState("");
  const [includeGithub, setIncludeGithub] = useState(true);
  
  const [isDemo, setIsDemo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDemo(!!window.localStorage.getItem("demo_token"));
    }
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Only PDF files are supported");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Only PDF files are supported");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload your resume PDF");
      return;
    }
    if (!targetJobTitle.trim()) {
      setError("Target job title is required");
      return;
    }

    if (isDemo) {
      setError("Write operations are disabled in Recruiter Demo mode. Connect GitHub to upload files!");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetJobTitle", targetJobTitle);
      formData.append("targetJobDescription", targetJobDescription);
      formData.append("includeGithub", String(includeGithub));

      const res = await apiClient.post("/api/analysis/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data && res.data.success) {
        const { insightId } = res.data.data;
        router.push(`/analysis/${insightId}/progress`);
      } else {
        setError(res.data.error || "Failed to start analysis job");
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.response?.data?.error || err.message || "An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 font-body-base px-1 md:px-0">
      <div>
        <h1 className="font-display-lg text-2xl md:text-3xl font-bold text-on-surface dark:text-white mb-2">Configure Analysis</h1>
        <p className="text-on-surface-variant dark:text-surface-variant text-xs md:text-sm">
          Select parameters to optimize your alignment audit.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error flex items-start gap-3 text-sm">
          <span className="material-symbols-outlined text-lg shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 glass-panel p-5 sm:p-6 md:p-8 rounded-xl">
        {/* Dropzone Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface dark:text-white uppercase tracking-wider text-[11px] opacity-75">
            RESUME PDF (MAX 5MB)
          </label>
          
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden ${
              dragActive 
                ? "border-primary bg-primary/5" 
                : "border-black/10 dark:border-border-subtle hover:border-primary/50"
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:text-primary-fixed-dim">
              <span className="material-symbols-outlined text-2xl">
                {file ? "verified" : "upload_file"}
              </span>
            </div>

            {file ? (
              <div className="space-y-1 z-10">
                <p className="text-on-surface dark:text-white font-medium text-sm break-all">{file.name}</p>
                <p className="text-on-surface-variant dark:text-surface-variant text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
              </div>
            ) : (
              <div className="space-y-1 z-10 px-2">
                <p className="text-on-surface dark:text-white font-medium text-sm">
                  Drag and drop your resume PDF here, or click to browse
                </p>
                <p className="text-on-surface-variant dark:text-surface-variant text-xs">Only PDF files are supported.</p>
              </div>
            )}
          </div>
        </div>

        {/* Target Job Title */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface dark:text-white uppercase tracking-wider text-[11px] opacity-75">
            TARGET JOB TITLE
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Senior Frontend Engineer @ Stripe"
            value={targetJobTitle}
            onChange={(e) => setTargetJobTitle(e.target.value)}
            disabled={uploading}
            className="w-full px-4 py-3 rounded-lg bg-white dark:bg-surface-dark border border-black/15 dark:border-border-subtle text-on-surface dark:text-white placeholder-on-surface-variant/50 dark:placeholder-surface-variant focus:outline-none focus:border-primary text-sm transition-all"
          />
        </div>

        {/* Target Job Description */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface dark:text-white uppercase tracking-wider text-[11px] opacity-75">
            TARGET JOB DESCRIPTION (RECOMMENDED)
          </label>
          <textarea
            placeholder="Paste the target job description here for keyword parsing and match rate audits..."
            value={targetJobDescription}
            onChange={(e) => setTargetJobDescription(e.target.value)}
            disabled={uploading}
            rows={6}
            className="w-full px-4 py-3 rounded-lg bg-white dark:bg-surface-dark border border-black/15 dark:border-border-subtle text-on-surface dark:text-white placeholder-on-surface-variant/50 dark:placeholder-surface-variant focus:outline-none focus:border-primary text-sm transition-all resize-none custom-scrollbar"
          />
        </div>

        {/* Include GitHub */}
        <div className="flex items-start gap-3 p-4 bg-surface-variant/10 dark:bg-surface-variant/5 rounded-lg border border-black/10 dark:border-border-subtle">
          <input
            type="checkbox"
            id="includeGithub"
            checked={includeGithub}
            onChange={(e) => setIncludeGithub(e.target.checked)}
            disabled={uploading}
            className="w-4 h-4 rounded text-primary bg-white dark:bg-surface-dark border-black/20 dark:border-border-subtle focus:ring-0 focus:ring-offset-0 cursor-pointer mt-0.5 shrink-0"
          />
          <label htmlFor="includeGithub" className="flex flex-col cursor-pointer select-none">
            <span className="text-on-surface dark:text-white text-sm font-medium">Audit GitHub Repositories</span>
            <span className="text-on-surface-variant dark:text-surface-variant text-xs leading-relaxed">Fetch top 5 active repositories for documentation and complex syntax metrics scans.</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full py-4 bg-primary text-on-primary font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Starting Analysis...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">science</span>
              Launch AI Analysis
            </>
          )}
        </button>
      </form>
    </div>
  );
}
