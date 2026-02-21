import { useNavigate } from "react-router-dom";
import { SignUp } from "@clerk/clerk-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Register() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4">
              <span className="text-primary-foreground font-bold text-lg">O</span>
            </div>
            <CardTitle className="text-2xl font-display">Create Account</CardTitle>
            <CardDescription>Join the ONNIFY WORKS operations hub</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SignUp
              routing="hash"
              afterSignUpUrl="/"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none p-0 w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "border border-border",
                  formButtonPrimary: "bg-primary hover:bg-primary/90",
                  footerAction: "hidden",
                },
              }}
            />
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/login")}>
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
