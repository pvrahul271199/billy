"use client";

import { useEffect } from "react";
import { initPwa } from "@/lib/pwa";
import { startBackgroundSync } from "@/lib/sync-engine";

export function PwaInit() {
  useEffect(() => {
    initPwa();
    return startBackgroundSync();
  }, []);
  return null;
}
