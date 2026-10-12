import type { Metadata } from "next";
import { CinemaExperience } from "@/components/ui/CinemaExperience";

export const metadata: Metadata = { title: "Pick your seats" };

export default function BookPage() {
  return <CinemaExperience initialMode="select" />;
}
