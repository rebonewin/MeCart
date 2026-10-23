"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallWindow = Window & {
  __mecartInstallPrompt?: BeforeInstallPromptEvent;
};

export function usePwaInstall() {
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const installWindow = window as InstallWindow;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const timer = window.setTimeout(() => {
      setInstalled(standalone);
      if (installWindow.__mecartInstallPrompt) setAvailable(true);
    }, 0);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      installWindow.__mecartInstallPrompt = event as BeforeInstallPromptEvent;
      setAvailable(true);
    };
    const onInstalled = () => {
      installWindow.__mecartInstallPrompt = undefined;
      setAvailable(false);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const installWindow = window as InstallWindow;
    const prompt = installWindow.__mecartInstallPrompt;
    if (!prompt) return null;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    installWindow.__mecartInstallPrompt = undefined;
    setAvailable(false);
    if (choice.outcome === "accepted") setInstalled(true);
    return choice.outcome;
  }, []);

  return { available, installed, promptInstall };
}
