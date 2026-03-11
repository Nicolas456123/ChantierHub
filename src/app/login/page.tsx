"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"code" | "pseudo">("code");
  const [code, setCode] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === "code") {
      if (!code.trim()) {
        setError("Veuillez entrer le code d'accès");
        return;
      }
      setStep("pseudo");
      setError("");
      return;
    }

    if (!pseudo.trim()) {
      setError("Veuillez entrer votre nom / pseudo");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, pseudo: pseudo.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur de connexion");
        if (res.status === 401) {
          setStep("code");
          setCode("");
        }
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erreur de connexion au serveur");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
            <HardHat className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">ChantierHub</CardTitle>
          <CardDescription>
            {step === "code"
              ? "Entrez le code d'accès du projet"
              : "Choisissez votre nom / pseudo"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === "code" ? (
              <div className="space-y-2">
                <Label htmlFor="code">Code d&apos;accès</Label>
                <Input
                  id="code"
                  type="password"
                  placeholder="Entrez le code..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="pseudo">Votre nom / pseudo</Label>
                <Input
                  id="pseudo"
                  type="text"
                  placeholder="Ex: Jean, Marie, Chef de chantier..."
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Ce nom sera associé à toutes vos actions sur le projet.
                  Choisissez un nom unique pour vous identifier.
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-2">
              {step === "pseudo" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setStep("code"); setError(""); }}
                  className="flex-1"
                >
                  Retour
                </Button>
              )}
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Connexion..." : step === "code" ? "Suivant" : "Entrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
