"use client";

import { useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/lib/i18n";
import { readPlannerStorage, writePlannerStorage } from "@/lib/planner-storage";
import type { PlannerItem } from "@/lib/planner-validation";
import PlannerWorkspace from "./PlannerWorkspace";

type PlannerDict = Dictionary["planner"];

type LoadPhase =
  | { kind: "loading" }
  | { kind: "corrupt" }
  | { kind: "ready"; storageAvailable: boolean; items: PlannerItem[] };

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notify() {
  for (const listener of listeners) listener();
}

const loadingPhase: LoadPhase = { kind: "loading" };
let cachedLoad: LoadPhase = loadingPhase;

function getClientLoad(): LoadPhase {
  if (cachedLoad !== loadingPhase) return cachedLoad;
  const result = readPlannerStorage();
  cachedLoad =
    result.kind === "corrupt"
      ? { kind: "corrupt" }
      : result.kind === "unavailable"
        ? { kind: "ready", storageAvailable: false, items: [] }
        : {
            kind: "ready",
            storageAvailable: true,
            items: result.kind === "loaded" ? result.items : [],
          };
  return cachedLoad;
}

function getServerLoad(): LoadPhase {
  return loadingPhase;
}

const bannerErrorClassName =
  "rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300";

function CorruptStorageScreen({
  dict,
  onCleared,
}: {
  dict: PlannerDict;
  onCleared: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [clearFailed, setClearFailed] = useState(false);

  function handleClear() {
    const result = writePlannerStorage([]);
    if (result.kind !== "saved") {
      setClearFailed(true);
      return;
    }
    onCleared();
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <p role="alert" className={bannerErrorClassName}>
        {dict.corrupt}
      </p>
      {clearFailed && (
        <p role="alert" className={bannerErrorClassName}>
          {dict.clearFailed}
        </p>
      )}
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-zinc-900 dark:text-zinc-50">
            {dict.corruptClearConfirm}
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800"
          >
            {dict.confirmClear}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
          >
            {dict.cancel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full border border-red-300 px-5 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          {dict.corruptClear}
        </button>
      )}
    </div>
  );
}

export default function InterviewPlanner({ dict }: { dict: PlannerDict }) {
  const load = useSyncExternalStore(subscribe, getClientLoad, getServerLoad);

  function handleCleared() {
    cachedLoad = { kind: "ready", storageAvailable: true, items: [] };
    notify();
  }

  function handlePersisted(persistedItems: PlannerItem[]) {
    cachedLoad = { kind: "ready", storageAvailable: true, items: persistedItems };
    notify();
  }

  if (load.kind === "loading") {
    return <p className="text-zinc-600 dark:text-zinc-400">{dict.loading}</p>;
  }
  if (load.kind === "corrupt") {
    return <CorruptStorageScreen dict={dict} onCleared={handleCleared} />;
  }
  return (
    <PlannerWorkspace
      dict={dict}
      initialItems={load.items}
      storageAvailable={load.storageAvailable}
      onPersisted={handlePersisted}
    />
  );
}
