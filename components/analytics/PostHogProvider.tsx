"use client";

import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();

  const userId = user?.id;
  const email = user?.primaryEmailAddress?.emailAddress;
  const name = user?.fullName ?? user?.username ?? undefined;

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (isSignedIn && userId) {
      const properties: Record<string, string> = {};

      if (email) {
        properties.email = email;
      }

      if (name) {
        properties.name = name;
      }

      posthog.identify(userId, properties);
      return;
    }

    if (posthog._isIdentified()) {
      posthog.reset();
    }
  }, [email, isLoaded, isSignedIn, name, userId]);

  return children;
}
