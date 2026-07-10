"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SwitchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onChange, ...props }, ref) => {
    return (
      <label
        className={cn(
          "relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors",
          checked ? "bg-accent" : "bg-muted",
          className
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
          ref={ref}
          {...props}
        />
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-[2px]"
          )}
        />
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
