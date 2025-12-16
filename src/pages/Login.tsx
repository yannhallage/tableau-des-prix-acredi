import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, User } from 'lucide-react';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const success = await signup(email, password, name);
        if (success) {
          toast.success('Compte créé avec succès');
          navigate('/dashboard');
        } else {
          toast.error('Erreur lors de la création du compte');
        }
      } else {
        const success = await login(email, password);
        if (success) {
          toast.success('Connexion réussie');
          navigate('/dashboard');
        } else {
          toast.error('Email ou mot de passe incorrect');
        }
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <span className="text-xl font-bold text-accent-foreground">A</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-primary-foreground">Acredi Group</h1>
              <p className="text-sm text-primary-foreground/70">Pricing Engine</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-primary-foreground leading-tight">
              Optimisez vos tarifs,<br />
              Maximisez vos marges
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              L'outil stratégique pour calculer et gérer vos prix de manière intelligente.
            </p>
          </div>

          <p className="text-sm text-primary-foreground/60">
            © 2024 Acredi Group. Tous droits réservés.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-40 w-48 h-48 bg-primary-foreground/5 rounded-full blur-2xl" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <span className="text-xl font-bold text-primary-foreground">A</span>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              {isSignUp ? 'Créer un compte' : 'Bienvenue'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isSignUp ? 'Remplissez les informations ci-dessous' : 'Connectez-vous à votre compte'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">
                  Nom complet
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Votre nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Adresse email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@acredi.ci"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isSignUp ? 'Création...' : 'Connexion...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isSignUp ? 'Créer le compte' : 'Se connecter'}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
