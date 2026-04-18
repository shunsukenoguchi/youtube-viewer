"use client";

import { WatchLimitBanner } from "./WatchLimitBanner";
import { WatchLimitProvider } from "./WatchLimitProvider";

export function WatchLimitShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <WatchLimitProvider>
      <WatchLimitBanner />
      {children}
    </WatchLimitProvider>
  );
}
