"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, ...props }, ref) => {
    const [error, setError] = React.useState(false);

    if (src && !error) {
      return (
        <div
          ref={ref}
          className={cn(
            "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full",
            className
          )}
          {...props}
        >
          <img
            src={src}
            alt={alt ?? ""}
            className="h-full w-full object-cover"
            onError={() => setError(true)}
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground",
          className
        )}
        {...props}
      >
        {fallback ? getInitials(fallback) : "?"}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
