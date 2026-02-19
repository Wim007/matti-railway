import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user has completed onboarding
    const profile = localStorage.getItem("matti_user_profile");
    
    if (!profile) {
      // No profile found, redirect to welcome
      setLocation("/");
    }
    
    // Always set isChecking to false after check
    setIsChecking(false);
  }, [setLocation]);

  // Show nothing while checking (prevents flash of content)
  if (isChecking) {
    return null;
  }

  return <>{children}</>;
}
