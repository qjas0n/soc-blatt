"use client";

import { useEffect, useRef } from 'react';

// Runs `callback` on a fixed interval for the lifetime of the component, without
// re-subscribing when the callback identity changes (so callers can pass an inline
// closure). Used to keep list/panel data in sync with the DB without a manual refresh.
export function useLivePolling(callback: () => void | Promise<void>, intervalMs: number) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const interval = setInterval(() => {
            callbackRef.current();
        }, intervalMs);
        return () => clearInterval(interval);
    }, [intervalMs]);
}
