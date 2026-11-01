/** Micro-haptics: a short pulse on taps that commit something. No-op where unsupported (iOS Safari). */
export function tap(ms = 10) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // ignore
  }
}

/** Slightly longer pulse for confirmations (saved, marked as paid). */
export function success() {
  tap(18);
}
