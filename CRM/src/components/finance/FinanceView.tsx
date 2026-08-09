"use client";

import { useCallback, useMemo, useState } from "react";
import { FilePlus2, Receipt, Send, Wallet, CheckCircle2, Coins, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import {
  acceptQuoteAndCreateInvoice,
  createInvoice,
  fetchInvoices,
  fetchPayments,
  fetchQuotes,
  recordPayment,
  updateInvoiceStatus,
  updateQuoteStatus,
} from "@/lib/data-access";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { toast } from "sonner";
import type { Invoice, Payment, Quote } from "@/types/database";

const INVOICE_BADGE: Record<Invoice["status"], "success" | "warning" | "info" | "muted" | "destructive"> = {
  paid: "success",
  sent: "info",
  overdue: "destructive",
  draft: "muted",
  cancelled: "muted",
};

const QUOTE_BADGE: Record<Quote["status"], "success" | "info" | "muted" | "destructive"> = {
  accepted: "success",
  sent: "info",
  draft: "muted",
  declined: "destructive",
};

const INVOICE_LABEL: Record<Invoice["status"], string> = {
  paid: "Pagada",
  sent: "Enviada",
  overdue: "Vencida",
  draft: "Borrador",
  cancelled: "Cancelada",
};

const QUOTE_LABEL: Record<Quote["status"], string> = {
  accepted: "Aceptado",
  sent: "Enviado",
  draft: "Borrador",
  declined: "Rechazado",
};

const PAYMENT_METHOD_LABEL: Record<Payment["method"], string> = {
  card: "Tarjeta",
  transfer: "Transferencia",
  cash: "Efectivo",
  link: "Link",
};

interface InvoiceItemRow {
  description: string;
  quantity: number;
  unit_price_eur: number;
}

/** Dashboard de facturación: KPIs + facturas/presupuestos/cobros con acciones. */
export function FinanceView({ orgId }: { orgId: string }) {
  const { data: invoices, loading, error, refresh } = useRealtimeCollection<Invoice>(
    useCallback((orgId) => fetchInvoices(orgId), []),
    orgId,
    { table: "invoices", filter: `organization_id=eq.${orgId}` }
  );
  const { data: quotes, refresh: refreshQuotes } = useRealtimeCollection<Quote>(
    useCallback((orgId) => fetchQuotes(orgId), []),
    orgId,
    { table: "quotes", filter: `organization_id=eq.${orgId}` }
  );
  const { data: payments, refresh: refreshPayments } = useRealtimeCollection<Payment>(
    useCallback((orgId) => fetchPayments(orgId), []),
    orgId,
    { table: "payments", filter: `organization_id=eq.${orgId}` }
  );

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [acceptingQuote, setAcceptingQuote] = useState<string | null>(null);

  const kpis = useMemo(() => {
    const totalInvoiced = invoices.reduce((acc, i) => acc + i.total_eur, 0);
    const totalPaid = invoices.filter((i) => i.status === "paid").reduce((acc, i) => acc + i.total_eur, 0);
    const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((acc, i) => acc + i.total_eur, 0);
    const collected = payments.reduce((acc, p) => acc + p.amount_eur, 0);
    return { totalInvoiced, totalPaid, outstanding, collected };
  }, [invoices, payments]);

  const handleMarkPaid = async (invoice: Invoice) => {
    setPayingInvoice(invoice.id);
    try {
      await recordPayment(orgId, {
        invoice_id: invoice.id,
        amount_eur: invoice.total_eur,
        method: "transfer",
        reference: "cobro manual",
      });
      toast.success("Factura marcada como pagada");
      refresh();
      refreshPayments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar el cobro");
    } finally {
      setPayingInvoice(null);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      await updateInvoiceStatus(orgId, invoice.id, "sent");
      toast.success("Factura enviada al cliente");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar");
    }
  };

  const handleSendQuote = async (quote: Quote) => {
    try {
      await updateQuoteStatus(orgId, quote.id, "sent");
      toast.success("Presupuesto enviado");
      refreshQuotes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar");
    }
  };

  const handleAcceptQuote = async (quote: Quote) => {
    setAcceptingQuote(quote.id);
    try {
      await acceptQuoteAndCreateInvoice(orgId, quote.id);
      toast.success("Presupuesto aceptado · factura creada");
      refreshQuotes();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al aceptar");
    } finally {
      setAcceptingQuote(null);
    }
  };

  if (loading) return <LoadingState label="Cargando facturación" />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[var(--tenant-primary)]" />
            <span className="text-xs text-muted-foreground">Total facturado</span>
          </div>
          <p className="mt-1 font-display text-xl font-bold text-foreground">{formatCurrency(kpis.totalInvoiced)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--tenant-primary)]" />
            <span className="text-xs text-muted-foreground">Cobrado</span>
          </div>
          <p className="mt-1 font-display text-xl font-bold text-foreground">{formatCurrency(kpis.totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-[var(--tenant-primary)]" />
            <span className="text-xs text-muted-foreground">Pendiente</span>
          </div>
          <p className="mt-1 font-display text-xl font-bold text-foreground">{formatCurrency(kpis.outstanding)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[var(--tenant-primary)]" />
            <span className="text-xs text-muted-foreground">Cobros registrados</span>
          </div>
          <p className="mt-1 font-display text-xl font-bold text-foreground">{formatCurrency(kpis.collected)}</p>
        </div>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="invoices">Facturas</TabsTrigger>
            <TabsTrigger value="quotes">Presupuestos</TabsTrigger>
            <TabsTrigger value="payments">Cobros</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={() => setInvoiceOpen(true)}>
            <FilePlus2 className="h-3.5 w-3.5" />
            Nueva factura
          </Button>
        </div>

        {/* Facturas */}
        <TabsContent value="invoices">
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2.5">Nº</th>
                    <th className="px-4 py-2.5">Cliente</th>
                    <th className="px-4 py-2.5">Emisión</th>
                    <th className="px-4 py-2.5">Vence</th>
                    <th className="px-4 py-2.5 text-right">Importe</th>
                    <th className="px-4 py-2.5">Estado</th>
                    <th className="px-4 py-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12">
                        <EmptyState icon={Receipt} title="Sin facturas" description="Crea tu primera factura para empezar a cobrar." />
                      </td>
                    </tr>
                  )}
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{inv.number}</td>
                      <td className="px-4 py-3 text-foreground">{inv.customer_name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateShort(inv.issue_date)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {inv.due_date ? formatDateShort(inv.due_date) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(inv.total_eur)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={INVOICE_BADGE[inv.status]}>{INVOICE_LABEL[inv.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.status === "draft" && (
                          <Button variant="ghost" size="sm" onClick={() => void handleSendInvoice(inv)}>
                            <Send className="h-3 w-3" /> Enviar
                          </Button>
                        )}
                        {(inv.status === "sent" || inv.status === "overdue") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={payingInvoice === inv.id}
                            onClick={() => void handleMarkPaid(inv)}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Cobrar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Presupuestos */}
        <TabsContent value="quotes">
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2.5">Nº</th>
                    <th className="px-4 py-2.5">Cliente</th>
                    <th className="px-4 py-2.5">Creado</th>
                    <th className="px-4 py-2.5 text-right">Importe</th>
                    <th className="px-4 py-2.5">Estado</th>
                    <th className="px-4 py-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12">
                        <EmptyState icon={FilePlus2} title="Sin presupuestos" description="Los presupuestos aceptados generan facturas." />
                      </td>
                    </tr>
                  )}
                  {quotes.map((q) => (
                    <tr key={q.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{q.number}</td>
                      <td className="px-4 py-3 text-foreground">{q.customer_name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateShort(q.created_at)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(q.total_eur)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={QUOTE_BADGE[q.status]}>{QUOTE_LABEL[q.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {q.status === "draft" && (
                          <Button variant="ghost" size="sm" onClick={() => void handleSendQuote(q)}>
                            <Send className="h-3 w-3" /> Enviar
                          </Button>
                        )}
                        {q.status === "sent" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={acceptingQuote === q.id}
                            onClick={() => void handleAcceptQuote(q)}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Aceptar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Cobros */}
        <TabsContent value="payments">
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2.5">Fecha</th>
                    <th className="px-4 py-2.5">Factura</th>
                    <th className="px-4 py-2.5">Método</th>
                    <th className="px-4 py-2.5">Referencia</th>
                    <th className="px-4 py-2.5 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12">
                        <EmptyState icon={Wallet} title="Sin cobros" description="Los pagos se registran al marcar una factura como pagada." />
                      </td>
                    </tr>
                  )}
                  {payments.map((p) => {
                    const invoice = invoices.find((i) => i.id === p.invoice_id);
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateShort(p.paid_at)}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{invoice?.number ?? p.invoice_id.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{PAYMENT_METHOD_LABEL[p.method]}</td>
                        <td className="px-4 py-3 text-mono text-[10px] text-muted-foreground">{p.reference ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(p.amount_eur)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <InvoiceDialog orgId={orgId} open={invoiceOpen} onOpenChange={setInvoiceOpen} onCreated={() => refresh()} />
    </div>
  );
}

/* ------------------------- Diálogo de nueva factura ------------------------- */

function InvoiceDialog({
  orgId,
  open,
  onOpenChange,
  onCreated,
}: {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [number, setNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [taxRate, setTaxRate] = useState(21);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItemRow[]>([
    { description: "", quantity: 1, unit_price_eur: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, i) => acc + i.quantity * (i.unit_price_eur || 0), 0);
    const tax = subtotal * (taxRate / 100);
    return { subtotal, tax, total: subtotal + tax };
  }, [items, taxRate]);

  const defaultNumber = () => `FC-${new Date().getFullYear()}-${String(100 + items.length)}`;

  const updateItem = (index: number, patch: Partial<InvoiceItemRow>) => {
    setItems(items.map((i, idx) => (idx === index ? { ...i, ...patch } : i)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.description.trim() && i.quantity > 0);
    if (!validItems.length) {
      toast.error("Añade al menos una línea con descripción");
      return;
    }
    setSaving(true);
    try {
      await createInvoice(orgId, {
        number: number.trim() || defaultNumber(),
        customer_name: customer.trim() || "Cliente",
        tax_rate: taxRate,
        due_date: dueDate || null,
        notes: notes || null,
        items: validItems,
      });
      toast.success("Factura creada");
      onOpenChange(false);
      onCreated();
      setItems([{ description: "", quantity: 1, unit_price_eur: 0 }]);
      setCustomer("");
      setNumber("");
      setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la factura");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva factura</DialogTitle>
          <DialogDescription>Emite una factura con sus líneas. El total se calcula automáticamente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inv-number">Número</Label>
              <Input id="inv-number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="FC-2026-101" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-customer">Cliente</Label>
              <Input id="inv-customer" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nombre del cliente" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="inv-tax">IVA (%)</Label>
              <Select value={String(taxRate)} onValueChange={(v) => setTaxRate(Number(v))}>
                <SelectTrigger id="inv-tax"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="21">21%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="4">4%</SelectItem>
                  <SelectItem value="0">0%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-due">Vencimiento</Label>
              <Input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-notes">Notas</Label>
              <Input id="inv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Líneas de la factura</Label>
              <Button type="button" variant="subtle" size="sm" onClick={() => setItems([...items, { description: "", quantity: 1, unit_price_eur: 0 }])}>
                <TrendingUp className="h-3 w-3" /> Añadir línea
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    placeholder="Descripción"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={item.quantity || ""}
                    onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                    placeholder="Cant."
                    className="w-20"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={item.unit_price_eur || ""}
                    onChange={(e) => updateItem(index, { unit_price_eur: Number(e.target.value) })}
                    placeholder="Precio €"
                    className="w-28"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="iconSm"
                    disabled={items.length === 1}
                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                    title="Quitar línea"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
            <div className="space-y-1 text-right">
              <p className="flex items-center justify-between gap-8 text-muted-foreground">
                <span>Base</span> <span className="font-medium text-foreground">{formatCurrency(totals.subtotal)}</span>
              </p>
              <p className="flex items-center justify-between gap-8 text-muted-foreground">
                <span>IVA ({taxRate}%)</span> <span className="font-medium text-foreground">{formatCurrency(totals.tax)}</span>
              </p>
              <p className="flex items-center justify-between gap-8 font-display text-lg font-bold text-foreground">
                <span>Total</span> <span>{formatCurrency(totals.total)}</span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Creando…" : "Crear factura"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
