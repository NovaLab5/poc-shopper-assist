import { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import sourDillmasLogo from '@/assets/sour-dillmas-logo.png';

interface LoginScreenProps {
  onLogin: (email: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with gradient */}
      <div className="gradient-header px-6 pt-12 pb-16 text-center">
        <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-4 border-white/30 shadow-xl">
          <img src={sourDillmasLogo} alt="Sweet Dill" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-xl font-bold text-white mb-1">Sweet Dill</h1>
        <p className="text-sm text-white/80">Your AI Shopping Assistant</p>
      </div>

      {/* Login Form */}
      <div className="flex-1 -mt-8 px-6">
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/30">
          <h2 className="text-lg font-semibold text-foreground text-center mb-6">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paul@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border/30 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border/30 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button type="button" className="text-xs text-primary hover:underline">
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={!email || !password}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Sign Up */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button className="text-primary font-medium hover:underline">
              Sign Up
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-[10px] text-muted-foreground">
          By signing in, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
