import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInvoices } from "@/hooks/use-platform";
import { FileText, Download, CheckCircle, Clock, XCircle, Building2 } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  paid:    { label: "Pagada",   color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
  pending: { label: "Pendiente", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  draft:   { label: "Borrador", color: "bg-slate-50 text-slate-600 border-slate-200", icon: FileText },
  cancelled: { label: "Cancelada", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
};

function printInvoice(inv: any) {
  const lineItems = typeof inv.lineItems === "string" ? JSON.parse(inv.lineItems) : (inv.lineItems || []);
  const w = window.open("", "_blank")!;
  w.document.write(`
    <html><head><title>Factura ${inv.invoiceNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #1a1a2e; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px; }
      .logo { font-size: 22px; font-weight: 900; color: #7c3aed; }
      .title { font-size: 28px; font-weight: 700; color: #7c3aed; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { background: #f3f0ff; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #7c3aed; }
      td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; }
      .total { font-size: 20px; font-weight: 700; color: #7c3aed; }
      .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
    </style>
    </head><body>
    <div class="header">
      <div><div class="logo">Academia Cometa</div><div style="font-size:12px;color:#6b7280;">academia-cometa.com</div></div>
      <div style="text-align:right"><div class="title">FACTURA</div><div style="font-size:14px;font-weight:600;">#${inv.invoiceNumber}</div><div style="font-size:12px;color:#6b7280;">${new Date(inv.issuedAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</div></div>
    </div>
    <table>
      <tr><th>Descripción</th><th>Cant.</th><th style="text-align:right">Importe</th></tr>
      ${lineItems.map((item: any) => `<tr><td>${item.description}</td><td>${item.qty}</td><td style="text-align:right">$${Math.abs(Number(item.amount)).toFixed(2)}</td></tr>`).join("")}
    </table>
    <div style="text-align:right;border-top:2px solid #e5e7eb;padding-top:16px">
      <div style="font-size:13px;color:#6b7280">Subtotal: $${Number(inv.subtotal).toFixed(2)}</div>
      ${Number(inv.discount) > 0 ? `<div style="font-size:13px;color:#6b7280">Descuento: -$${Number(inv.discount).toFixed(2)}</div>` : ""}
      ${Number(inv.tax) > 0 ? `<div style="font-size:13px;color:#6b7280">Impuestos: $${Number(inv.tax).toFixed(2)}</div>` : ""}
      <div class="total" style="margin-top:8px">TOTAL: $${Number(inv.total).toFixed(2)} ${inv.currency}</div>
    </div>
    <div class="footer">Academia Cometa · Gracias por tu confianza · ${inv.status === "paid" ? "PAGADA" : "PENDIENTE DE PAGO"}</div>
    </body></html>
  `);
  w.document.close();
  w.print();
}

export default function Invoices() {
  const { data: invoices = [], isLoading } = useInvoices();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black">Mis Facturas</h1>
            <p className="text-muted-foreground text-sm">Historial de pagos y documentos contables</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Academia Cometa</span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : invoices.length === 0 ? (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="font-semibold text-muted-foreground">No tienes facturas todavía</p>
              <p className="text-sm text-muted-foreground mt-1">Las facturas aparecerán aquí cuando te suscribas a un plan.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv: any) => {
              const statusConf = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
              const StatusIcon = statusConf.icon;
              return (
                <Card key={inv.id} data-testid={`card-invoice-${inv.id}`} className="rounded-2xl hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inv.issuedAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-xs border ${statusConf.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConf.label}
                      </Badge>
                      <span className="font-black text-lg">${Number(inv.total).toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">{inv.currency}</span>
                      <Button
                        data-testid={`button-download-invoice-${inv.id}`}
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                        onClick={() => printInvoice(inv)}
                        title="Imprimir / Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {invoices.length > 0 && (
          <Card className="rounded-2xl bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">Total pagado</p>
                <p className="text-xs text-muted-foreground">{invoices.filter((i: any) => i.status === "paid").length} facturas pagadas</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-primary">
                  ${invoices.filter((i: any) => i.status === "paid").reduce((sum: number, i: any) => sum + Number(i.total), 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">USD</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
