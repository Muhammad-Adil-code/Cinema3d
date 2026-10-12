import type { Metadata } from "next";
import { CinemaExperience } from "@/components/ui/CinemaExperience";

export const metadata: Metadata = { title: "Walk the hall in 3D" };

export default function CinemaPage() {
  return <CinemaExperience initialMode="explore" />;
}
