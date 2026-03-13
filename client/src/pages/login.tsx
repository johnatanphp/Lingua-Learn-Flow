import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BookOpen, Eye, EyeOff, GraduationCap, Users, Shield, Globe,
  Loader2, AlertCircle
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().optional(),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const SESSION_TYPES = [
  { role: "student", label: "Estudiante", desc: "Aprende a tu ritmo", icon: GraduationCap, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  { role: "teacher", label: "Profesor", desc: "Gestiona tus clases", icon: Users, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  { role: "admin", label: "Admin", desc: "Administra la plataforma", icon: Shield, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
];

export default function Login() {
  const [, navigate] = useLocation();
  const { login, isLoggingIn, register, isRegistering, loginAsGuest, isCreatingGuest } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedRole, setSelectedRole] = useState("student");
  const [error, setError] = useState<string | null>(null);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const onLogin = async (data: LoginForm) => {
    setError(null);
    try {
      await login(data);
      navigate("/");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setError(null);
    try {
      await register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: selectedRole,
      });
      navigate("/");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const onGuest = async () => {
    setError(null);
    try {
      await loginAsGuest();
      navigate("/");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const isGoogleAvailable = !!(import.meta.env.VITE_GOOGLE_AUTH === "true");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500 shadow-lg mb-3">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">LinguaLearn</h1>
          <p className="text-gray-500 text-sm mt-1">Aprende idiomas · Crece cada día</p>
        </div>

        {/* Main card with tabs */}
        <Card className="shadow-xl border-0">
          <Tabs defaultValue="login" onValueChange={() => setError(null)}>
            <CardHeader className="pb-0">
              <TabsList className="w-full grid grid-cols-2 mb-2">
                <TabsTrigger value="login" data-testid="tab-login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Crear cuenta</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* ─── LOGIN TAB ─────────────────────── */}
              <TabsContent value="login" className="space-y-4 mt-0">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      data-testid="input-email"
                      type="email"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      {...loginForm.register("email")}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        data-testid="input-password"
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="pr-10"
                        {...loginForm.register("password")}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPass(!showPass)}
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    data-testid="button-login"
                    type="submit"
                    className="w-full h-11 bg-green-600 hover:bg-green-700 font-semibold"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Entrar
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs text-muted-foreground"><span className="bg-background px-2">o continúa con</span></div>
                </div>

                <div className="space-y-2">
                  {isGoogleAvailable && (
                    <Button
                      data-testid="button-google"
                      variant="outline"
                      className="w-full h-11 font-medium gap-2.5"
                      onClick={() => (window.location.href = "/api/auth/google")}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continuar con Google
                    </Button>
                  )}
                  <Button
                    data-testid="button-guest"
                    variant="outline"
                    className="w-full h-11 font-medium gap-2 text-muted-foreground border-dashed"
                    onClick={onGuest}
                    disabled={isCreatingGuest}
                  >
                    {isCreatingGuest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    Entrar como invitado
                  </Button>
                </div>
              </TabsContent>

              {/* ─── REGISTER TAB ──────────────────── */}
              <TabsContent value="register" className="space-y-4 mt-0">

                {/* Role selector */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">¿Cómo usarás la plataforma?</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {SESSION_TYPES.map(({ role, label, desc, icon: Icon, color, bg }) => (
                      <button
                        key={role}
                        type="button"
                        data-testid={`role-${role}`}
                        onClick={() => setSelectedRole(role)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          selectedRole === role ? `${bg} border-current` : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${selectedRole === role ? color : "text-gray-400"}`} />
                        <div className={`text-xs font-semibold ${selectedRole === role ? color : "text-gray-600"}`}>{label}</div>
                        <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="reg-first">Nombre *</Label>
                      <Input
                        id="reg-first"
                        data-testid="input-firstname"
                        placeholder="Ana"
                        autoComplete="given-name"
                        {...registerForm.register("firstName")}
                      />
                      {registerForm.formState.errors.firstName && (
                        <p className="text-xs text-destructive">{registerForm.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reg-last">Apellido</Label>
                      <Input
                        id="reg-last"
                        data-testid="input-lastname"
                        placeholder="García"
                        autoComplete="family-name"
                        {...registerForm.register("lastName")}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reg-email">Email *</Label>
                    <Input
                      id="reg-email"
                      data-testid="input-reg-email"
                      type="email"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      {...registerForm.register("email")}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reg-password">Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        data-testid="input-reg-password"
                        type={showPass ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        autoComplete="new-password"
                        className="pr-10"
                        {...registerForm.register("password")}
                      />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reg-confirm">Confirmar contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="reg-confirm"
                        data-testid="input-confirm-password"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repite la contraseña"
                        autoComplete="new-password"
                        className="pr-10"
                        {...registerForm.register("confirmPassword")}
                      />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button
                    data-testid="button-register"
                    type="submit"
                    className="w-full h-11 bg-green-600 hover:bg-green-700 font-semibold mt-1"
                    disabled={isRegistering}
                  >
                    {isRegistering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Crear cuenta gratis
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-gray-400">
          Al usar LinguaLearn aceptas nuestros{" "}
          <span className="underline cursor-pointer">Términos</span> y{" "}
          <span className="underline cursor-pointer">Privacidad</span>
        </p>
      </div>
    </div>
  );
}
