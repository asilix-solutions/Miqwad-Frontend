import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Generic countdown timer used by the OTP page.
 * Returns the remaining seconds and a reset() function.
 *
 * The interval is started inside `useEffect` without calling
 * `setState` synchronously (React 19 lint guard), by relying on
 * the initial `useState(initialSeconds)` value.
 */
export function useResendTimer(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    stop();
    intervalRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          stop();
          return 0;
        }
        return s - 1;
      });
    }, 1_000);
  }, [stop]);

  useEffect(() => {
    startInterval();
    return stop;
  }, [startInterval, stop]);

  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    startInterval();
  }, [initialSeconds, startInterval]);

  return { seconds, reset, isFinished: seconds === 0 };
}
