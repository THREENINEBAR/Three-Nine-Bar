import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wine } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const login = useLogin();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Error", description: "Username and password are required", variant: "destructive" });
      return;
    }

    login.mutate(
      { data: { username, password } },
      {
        onSuccess: (data) => {
          setUser(data.user);
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          setLocation("/");
        },
        onError: (error: any) => {
          toast({ 
            title: "Login Failed", 
            description: error?.error || "Invalid credentials", 
            variant: "destructive" 
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full mb-4 border border-primary/20">
            <Wine className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-widest text-primary mb-1 text-center">THREE NINE</h1>
          <p className="text-sm text-muted-foreground tracking-[0.2em] uppercase">Inventory Control</p>
        </div>

        <div className="bg-card border border-border p-8 rounded-lg shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-muted-foreground uppercase text-xs tracking-wider">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background border-border focus-visible:ring-primary h-12"
                placeholder="Enter your username"
                disabled={login.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground uppercase text-xs tracking-wider">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-border focus-visible:ring-primary h-12"
                placeholder="Enter your password"
                disabled={login.isPending}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold tracking-wider uppercase transition-all"
              disabled={login.isPending}
            >
              {login.isPending ? "Authenticating..." : "Access System"}
            </Button>
          </form>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/50">Authorized Personnel Only</p>
        </div>
      </div>
    </div>
  );
}
