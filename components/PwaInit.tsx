"use client";

import { useEffect } from "react";
import { initPwa } from "@/lib/pwa";

export function PwaInit() {
  useEffect(() => {
    initPwa();
  }, []);
  return null;
}
