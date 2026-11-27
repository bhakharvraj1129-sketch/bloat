"use client";
import { toast } from "sonner";
import { Check } from "lucide-react";

/** "Meal saved." with a tick, as a toast. The words are the plan's confirmation sentences, unchanged. */
export function savedToast(text: string) {
  toast(text, { icon: <Check size={18} strokeWidth={2.6} aria-hidden /> });
}
