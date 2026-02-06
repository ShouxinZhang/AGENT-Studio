"use client";

import { useEffect, useState, type RefObject } from "react";

type Size = { width: number; height: number };

export function useElementSize<T extends HTMLElement>(ref: RefObject<T | null>): Size {
    const [size, setSize] = useState<Size>({ width: 0, height: 0 });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const update = () => {
            setSize({
                width: el.clientWidth,
                height: el.clientHeight,
            });
        };

        update();

        const observer = new ResizeObserver(() => update());
        observer.observe(el);

        return () => observer.disconnect();
    }, [ref]);

    return size;
}
