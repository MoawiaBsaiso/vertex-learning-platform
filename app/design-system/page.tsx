import type { Metadata } from "next";
import { DesignSystemShowcase } from "@/components/design-system/DesignSystemShowcase";

export const metadata: Metadata = {
  title: "Vertex Design System",
  description:
    "Unified design tokens, typography, color system, components, and principles for Vertex.",
};

export default function DesignSystemPage() {
  return <DesignSystemShowcase />;
}
