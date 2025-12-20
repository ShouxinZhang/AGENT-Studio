"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    type CSSProperties,
    type ElementType,
    memo,
    useMemo,
} from "react";

export type TextShimmerProps = {
    children: string;
    as?: ElementType;
    className?: string;
    duration?: number;
    spread?: number;
};

const ShimmerComponent = ({
    children,
    as: Component = "p",
    className,
    duration = 2,
    spread = 2,
}: TextShimmerProps) => {
    const dynamicSpread = useMemo(
        () => (children?.length ?? 0) * spread,
        [children, spread]
    );

    return (
        <motion.div
            animate={{ backgroundPosition: "0% center" }}
            className={cn(
                "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
                "bg-[linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background,white),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
                className
            )}
            initial={{ backgroundPosition: "100% center" }}
            style={
                {
                    "--spread": `${dynamicSpread}px`,
                    backgroundImage:
                        "linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background,white),#0000_calc(50%+var(--spread))), linear-gradient(var(--color-muted-foreground,gray), var(--color-muted-foreground,gray))",
                } as CSSProperties
            }
            transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration,
                ease: "linear",
            }}
        >
            <Component>{children}</Component>
        </motion.div>
    );
};

export const Shimmer = memo(ShimmerComponent);
