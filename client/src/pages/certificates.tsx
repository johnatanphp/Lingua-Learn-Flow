import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCertificates } from "@/hooks/use-platform";
import { Award, Download, ExternalLink, ShieldCheck, Search } from "lucide-react";
import { useState } from "react";

function printCertificate(cert: any, userName: string) {
  const w = window.open("", "_blank")!;
  const date = new Date(cert.issuedAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
  w.document.write(`
    <html><head><title>Certificado ${cert.certificateCode}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;900&family=Outfit:wght@400;700;900&display=swap');
      body { font-family: 'DM Sans', sans-serif; margin: 0; background: linear-gradient(135deg, #f0e6ff 0%, #e0f0ff 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
      .cert { background: white; width: 800px; min-height: 560px; margin: 40px auto; border-radius: 24px; padding: 60px; text-align: center; box-shadow: 0 20px 60px rgba(124,58,237,0.15); border: 3px solid #7c3aed; position: relative; overflow: hidden; }
      .cert::before { content:''; position:absolute; top:-40px; left:-40px; width:180px; height:180px; border-radius:50%; background:linear-gradient(135deg,#7c3aed22,#7c3aed11); }
      .cert::after { content:''; position:absolute; bottom:-40px; right:-40px; width:180px; height:180px; border-radius:50%; background:linear-gradient(135deg,#7c3aed11,#7c3aed22); }
      .logo { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 900; color: #7c3aed; letter-spacing: -0.5px; margin-bottom: 8px; }
      .seal { width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #a855f7); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
      h1 { font-family: 'Outfit', sans-serif; font-size: 40px; font-weight: 900; color: #7c3aed; margin: 0 0 8px; }
      .subtitle { color: #6b7280; font-size: 15px; margin-bottom: 30px; }
      .name { font-size: 32px; font-weight: 900; color: #1a1a2e; border-bottom: 3px solid #7c3aed; display: inline-block; padding: 0 40px 8px; margin-bottom: 16px; }
      .course { font-size: 18px; color: #374151; margin-bottom: 30px; }
      .issued { font-size: 13px; color: #6b7280; margin-bottom: 6px; }
      .code { font-family: monospace; font-size: 12px; background: #f3f0ff; color: #7c3aed; padding: 6px 16px; border-radius: 100px; display: inline-block; }
      .issuer { font-size: 14px; font-weight: 700; color: #374151; margin-top: 30px; }
    </style></head>
    <body><div class="cert">
      <div class="logo">Academia Cometa</div>
      <div class="seal" style="font-size:30px;">🎓</div>
      <h1>Certificado</h1>
      <div class="subtitle">de Finalización</div>
      <div style="font-size:14px;color:#6b7280;margin-bottom:12px;">Se otorga a:</div>
      <div class="name">${userName}</div>
      <div class="course">Por completar exitosamente: <strong>${cert.title}</strong></div>
      <div class="issued">Emitido el ${date}</div>
      <div class="code">${cert.certificateCode}</div>
      <div class="issuer">— ${cert.issuerName} —</div>
    </div></body></html>
  `);
  w.document.close();
  w.print();
}

export default function Certificates() {
  const { data: certs = [], isLoading } = useCertificates();
  const [search, setSearch] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const filtered = certs.filter((c: any) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.certificateCode.toLowerCase().includes(search.toLowerCase())
  );

  async function handleVerify() {
    const res = await fetch(`/api/certificates/verify/${verifyCode.trim()}`);
    const data = await res.json();
    setVerifyResult(data);
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-black">Mis Certificados</h1>
            <p className="text-muted-foreground text-sm">Certificados emitidos por Academia Cometa</p>
          </div>
          <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-sm">
            <Award className="w-3.5 h-3.5 mr-1.5" />
            {certs.length} {certs.length === 1 ? "certificado" : "certificados"}
          </Badge>
        </div>

        {/* Verify */}
        <Card className="rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <p className="font-semibold text-sm">Verificar un certificado</p>
            </div>
            <div className="flex gap-2">
              <Input
                data-testid="input-verify-code"
                placeholder="Ej: CERT-ABC123..."
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value)}
                className="font-mono text-sm rounded-xl"
              />
              <Button data-testid="button-verify" onClick={handleVerify} className="rounded-xl shrink-0">Verificar</Button>
            </div>
            {verifyResult && (
              <div className={`mt-3 p-3 rounded-xl text-sm font-semibold ${verifyResult.valid ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {verifyResult.valid ? `✓ Certificado válido: ${verifyResult.certificate?.title}` : "✗ Certificado no encontrado o inválido"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-search-certs"
            placeholder="Buscar certificados..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-2xl"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2].map(i => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Award className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="font-semibold text-muted-foreground">
                {certs.length === 0 ? "Aún no tienes certificados" : "No se encontraron certificados"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {certs.length === 0 ? "Completa cursos y clases para obtener certificados." : "Prueba con otro término de búsqueda."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((cert: any) => (
              <Card
                key={cert.id}
                data-testid={`card-cert-${cert.id}`}
                className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">{cert.title}</h3>
                      <p className="text-xs text-muted-foreground">{cert.issuerName}</p>
                    </div>
                  </div>
                  {cert.description && (
                    <p className="text-sm text-muted-foreground">{cert.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div>
                      <p className="font-mono text-xs text-primary font-bold">{cert.certificateCode}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(cert.issuedAt).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        data-testid={`button-download-cert-${cert.id}`}
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => printCertificate(cert, "Estudiante")}
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
