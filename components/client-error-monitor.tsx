"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/client-telemetry";

export function ClientErrorMonitor() {
  useEffect(() => {
    const onError = () => reportClientError("unhandled_error");
    const onRejection = () => reportClientError("unhandled_rejection");
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
