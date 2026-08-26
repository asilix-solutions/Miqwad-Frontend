/**
 * @file notificationSound.ts
 *
 * Plays the notification chime. A single shared `HTMLAudioElement` is
 * reused across calls (module singleton, not React state) so the mute
 * preference — read fresh from storage on every call via
 * ../store/notificationsSlice's `muted` (passed in by the caller) — always
 * reflects the latest toggle without re-subscribing.
 *
 * Browsers block audio playback before a user gesture on the page; play()
 * is wrapped so a blocked/rejected autoplay never throws or surfaces as an
 * error, and a one-time pointer/key listener unlocks future playback.
 */

const SOUND_SRC = "/sounds/notification.wav";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

let sharedAudio: HTMLAudioElement | null = null;
let unlockListenersAttached = false;

function getAudio(): HTMLAudioElement | null {
  if (!isBrowser()) return null;
  if (!sharedAudio) {
    sharedAudio = new Audio(SOUND_SRC);
    sharedAudio.volume = 0.4;
  }
  if (!unlockListenersAttached) {
    unlockListenersAttached = true;
    const unlock = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  }
  return sharedAudio;
}

/** No-ops (and never throws) if `muted` is true or playback is blocked. */
export function playNotificationSound(muted: boolean): void {
  if (muted) return;
  const audio = getAudio();
  if (!audio) return;
  try {
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay blocked (no user gesture yet) — silently skip.
    });
  } catch {
    // Defensive: some browsers throw synchronously instead of rejecting.
  }
}
