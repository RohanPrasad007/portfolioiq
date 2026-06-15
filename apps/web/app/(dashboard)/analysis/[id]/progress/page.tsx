"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useJobProgress } from "@/hooks/useJobProgress";

export default function AnalysisProgressPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { status, progress, currentStage, logs, error } = useJobProgress(id);

  useEffect(() => {
    if (status === "completed") {
      router.push(`/analysis/${id}/results`);
    }
  }, [status, id, router]);

  const getStageIcon = (stageName: string, itemProgress: number) => {
    if (status === "failed") return "error";
    if (progress >= itemProgress) return "check_circle";
    if (currentStage === stageName) return "sync";
    return "radio_button_unchecked";
  };

  const getStageColor = (stageName: string, itemProgress: number) => {
    if (status === "failed" && currentStage === stageName) return "text-error";
    if (progress >= itemProgress) return "text-secondary dark:text-secondary-fixed-dim";
    if (currentStage === stageName) return "text-primary dark:text-primary-fixed-dim animate-spin";
    return "text-on-surface-variant/40 dark:text-surface-variant/40";
  };

  const stages = [
    { name: "Initializing", minProgress: 10, label: "Parsing Resume PDF" },
    { name: "GitHub Audit", minProgress: 30, label: "Auditing GitHub Repos" },
    { name: "Structuring Context", minProgress: 50, label: "Synthesizing Profiles" },
    { name: "AI Alignment Analysis", minProgress: 70, label: "Orchestrating Gemini Insights" },
    { name: "Validating Insights", minProgress: 85, label: "Formatting Results Schema" },
    { name: "Saving Results", minProgress: 95, label: "Finalizing Records" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-gutter font-body-base px-1 md:px-0">
      <div>
        <h1 className="font-display-lg text-2xl md:text-3xl font-bold text-on-surface dark:text-white mb-2">Analyzing Profile</h1>
        <p className="text-on-surface-variant dark:text-surface-variant text-xs md:text-sm">
          Please wait while our career heuristics scanner validates your alignment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Stage List Progress */}
        <div className="col-span-12 md:col-span-5 glass-panel p-5 sm:p-6 rounded-xl space-y-6 flex flex-col justify-center">
          <div className="space-y-1">
            <span className="text-[11px] font-label-caps text-on-surface-variant dark:text-surface-variant font-bold">CURRENT TASK STATE</span>
            <h3 className="font-headline-md text-lg md:text-xl text-on-surface dark:text-white font-semibold">{currentStage}</h3>
          </div>

          {/* Core progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-primary dark:text-primary-fixed-dim">
              <span>Overall Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full bg-surface-variant/20 dark:bg-surface-variant/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${status === "failed" ? "bg-error" : "bg-primary"}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-black/10 dark:border-border-subtle">
            {stages.map((stage) => (
              <div key={stage.name} className="flex items-center gap-3 text-sm">
                <span className={`material-symbols-outlined text-lg ${getStageColor(stage.name, stage.minProgress)}`}>
                  {getStageIcon(stage.name, stage.minProgress)}
                </span>
                <span className={currentStage === stage.name ? "text-on-surface dark:text-white font-medium animate-pulse" : "text-on-surface-variant dark:text-surface-variant"}>
                  {stage.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Console logs */}
        <div className="col-span-12 md:col-span-7 flex flex-col h-[320px] md:h-[400px] glass-panel bg-[#05070a]/90 rounded-xl overflow-hidden border border-white/10 shadow-inner">
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-[#08090a]/80">
            <span className="font-code-sm text-xs text-primary-fixed-dim flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim animate-pulse"></span>
              Execution Terminal Shell
            </span>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-error/25"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim/25"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-primary/25"></span>
            </div>
          </div>
          <div className="grow p-5 font-code-sm text-[11px] md:text-xs text-[#00ff66] overflow-y-auto space-y-2.5 custom-scrollbar bg-[#020406]">
            {logs.map((log, index) => (
              <div key={index} className="leading-relaxed whitespace-pre-wrap font-mono">
                {log}
              </div>
            ))}
            {status === "failed" && error && (
              <div className="text-error font-semibold font-mono leading-relaxed whitespace-pre-wrap">
                [SYSTEM ERROR] {error}
              </div>
            )}
            {status !== "completed" && status !== "failed" && (
              <div className="animate-pulse flex items-center gap-1 font-mono">
                <span>$ scanning pipelines</span>
                <span className="inline-block w-2 h-4 bg-[#00ff66]"></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {status === "failed" && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-error text-white font-semibold rounded-lg hover:bg-error/95 transition-primary cursor-pointer active:scale-[0.98]"
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
