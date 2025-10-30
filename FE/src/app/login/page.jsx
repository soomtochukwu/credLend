"use client";

import { Suspense } from "react";
import LoginContent from "./logout";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
