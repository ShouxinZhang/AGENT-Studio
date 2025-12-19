import * as React from "react"
import type { ChangeEvent } from "react"
import { cn } from "@/lib/utils"

// A simple native slider effectively styled
interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'max' | 'min' | 'step'> {
    value: number[]
    min: number
    max: number
    step: number
    onValueChange?: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value, min, max, step, onValueChange, ...props }, ref) => {
        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            onValueChange?.([parseFloat(e.target.value)])
        }

        return (
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value[0]}
                onChange={handleChange}
                className={cn(
                    "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Slider.displayName = "Slider"

export { Slider }
