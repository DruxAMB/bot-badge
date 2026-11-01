"use client";

import { Toaster as Sonner } from "sonner";

// Catalogue register: flat white slip, hairline ink border, square corners.
export default function Toaster() {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#ffffff",
          border: "1px solid #000000",
          borderRadius: 0,
          color: "#000000",
          fontFamily: "inherit",
          fontWeight: 300,
          boxShadow: "none",
        },
      }}
    />
  );
}
