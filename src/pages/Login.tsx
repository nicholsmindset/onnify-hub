import { useNavigate } from "react-router-dom";
import { SignIn } from "@clerk/clerk-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Play } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { signInDemo, isSignedIn } = useAuth();

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
            <CardTitle className="text-2xl font-display">ONNIFY WORKS</CardTitle>
            <CardDescription>Sign in to your operations hub</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SignIn
              routing="hash"
              afterSignInUrl="/"
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            signInDemo();
            toast.success("Welcome to Demo Mode!");
            navigate("/");
          }}
        >
          <Play className="h-4 w-4 mr-2" />
          Explore Demo (No Login Required)
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/register")}>
            Register
          </Button>
        </div>
      </div>
    </div>
  );
}
