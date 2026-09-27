"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function useMockState<T>(key: string, fallback: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(readStored(key, fallback));
    setHydrated(true);
  }, [key, fallback]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // UI remains usable when browser storage is unavailable.
    }
  }, [hydrated, key, value]);

  return [value, setValue, hydrated];
}
