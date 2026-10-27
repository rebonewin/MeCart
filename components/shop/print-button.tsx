"use client";

import { Button } from "@/components/ui/button";
export function PrintButton() {
  return <Button onClick={() => window.print()} className="rounded-md bg-indigo-600 px-4 py-2 text-white">Print / Download PDF</Button>;
}
