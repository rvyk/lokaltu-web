"use client";

import {
  AuthenticateWithRedirectCallback,
  useAuth,
} from "@clerk/nextjs";
import EnterPassword from "./enter-password";
import SetPassword from "./set-password";
import SignIn from "./sign-in";
import SignUp from "./sign-up";
import VerifyEmail from "./verify-email";
import VerifySecondFactor from "./verify-second-factor";
import Welcome from "./welcome";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthClientProps {
  step: string;
}

export default function AuthClient({ step }: AuthClientProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // If client side detects we are already logged in, redirect home.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    if (step === "verify-second-factor") return;

    router.replace("/");
  }, [isLoaded, isSignedIn, step, router]);

  switch (step) {
    case "sign-up":
      return <SignUp />;
    case "sign-in":
      return <SignIn />;
    case "verify-email":
      return <VerifyEmail />;
    case "set-password":
      return <SetPassword />;
    case "welcome":
      return <Welcome />;
    case "enter-password":
      return <EnterPassword />;
    case "verify-second-factor":
      return <VerifySecondFactor />;
    case "sso-callback":
      return <AuthenticateWithRedirectCallback />;
    default:
      return <SignUp />;
  }
}
