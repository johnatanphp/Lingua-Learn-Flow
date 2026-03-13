import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, GraduationCap, Users, Shield, UserCheck, Globe } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  available: boolean;
}

const SESSION_TYPES = [
  {
    role: "student",
    label: "Estudiante",
    description: "Aprende idiomas a tu ritmo con lecciones gamificadas.",
    icon: GraduationCap,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
  },
  {
    role: "teacher",
    label: "Profesor",
    description: "Crea clases en vivo y gestiona el progreso de tus alumnos.",
    icon: Users,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  {
    role: "admin",
    label: "Administrador",
    description: "Gestiona la plataforma, usuarios y contenido educativo.",
    icon: Shield,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
  },
  {
    role: "guest",
    label: "Invitado",
    description: "Explora la plataforma sin crear una cuenta.",
    icon: Globe,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<string>("student");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: providers = [] } = useQuery<Provider[]>({
    queryKey: ["/api/auth/providers"],
    retry: false,
  });

  const guestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/guest", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Error al crear sesión de invitado");
      return res.json();
    },
    onSuccess: () => {
      navigate("/");
      window.location.reload();
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear la sesión de invitado.", variant: "destructive" });
    },
  });

  const isGoogleAvailable = providers.find((p) => p.id === "google")?.available ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LinguaLearn</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Aprende idiomas de forma divertida y efectiva
          </p>
        </div>

        {/* Role selection */}
        <Card className="border-0 shadow-lg dark:bg-gray-900/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              ¿Cómo vas a usar la plataforma?
            </CardTitle>
            <CardDescription>Selecciona tu tipo de sesión</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {SESSION_TYPES.map(({ role, label, description, icon: Icon, color, border }) => (
                <button
                  key={role}
                  data-testid={`role-${role}`}
                  onClick={() => setSelectedRole(role)}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                    selectedRole === role
                      ? `${border} shadow-md ring-2 ring-offset-1 ring-current`
                      : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                  }`}
                >
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">{label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{description}</div>
                  {selectedRole === role && (
                    <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-green-500 text-white">
                      Seleccionado
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Auth providers */}
        <Card className="border-0 shadow-lg dark:bg-gray-900/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Iniciar sesión</CardTitle>
            <CardDescription>Elige cómo quieres acceder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Replit Login */}
            <Button
              data-testid="login-replit"
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl gap-3"
              onClick={() => {
                window.location.href = `/api/login?role=${selectedRole}`;
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.8a2.4 2.4 0 110 4.8 2.4 2.4 0 010-4.8zm5.4 6h-4.2l3.6 6H9.6L6 10.8H2.4l3.6 6H9l-1.8 3h9.6L15 16.8h3.6l3.6-6H18.6z" />
              </svg>
              Continuar con Replit
            </Button>

            {/* Google Login */}
            <Button
              data-testid="login-google"
              variant="outline"
              className="w-full h-12 font-semibold rounded-xl gap-3 border-2"
              disabled={!isGoogleAvailable}
              onClick={() => {
                if (isGoogleAvailable) window.location.href = `/api/auth/google`;
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {isGoogleAvailable ? "Continuar con Google" : "Google (configurar credenciales)"}
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-gray-400">o</span>
              <Separator className="flex-1" />
            </div>

            {/* Guest */}
            <Button
              data-testid="login-guest"
              variant="ghost"
              className="w-full h-11 font-medium rounded-xl gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white border border-dashed border-gray-200 dark:border-gray-700"
              onClick={() => guestMutation.mutate()}
              disabled={guestMutation.isPending}
            >
              <Globe className="w-4 h-4" />
              {guestMutation.isPending ? "Creando sesión..." : "Entrar como Invitado"}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600">
          Al iniciar sesión aceptas nuestros Términos de servicio y Política de privacidad
        </p>
      </div>
    </div>
  );
}
