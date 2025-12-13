import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-2">Page introuvable</p>
        <p className="text-muted-foreground mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Button asChild className="btn-primary">
          <Link to="/dashboard">
            <Home className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
