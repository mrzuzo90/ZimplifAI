"use client";

import { useCallback, useMemo, useState } from "react";
import { MessageSquarePlus, Send, Star, StarHalf, Reply, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { createReviewRequest, fetchReviewRequests, fetchReviews, sendReviewRequest, updateReview } from "@/lib/data-access";
import { formatDateShort, formatRelative } from "@/lib/format";
import { toast } from "sonner";
import type { Review, ReviewRequest } from "@/types/database";

const REVIEW_SOURCE_LABEL: Record<Review["source"], string> = {
  google: "Google",
  whatsapp: "WhatsApp",
  web: "Web",
};

const REQUEST_STATUS_LABEL: Record<ReviewRequest["status"], string> = {
  pending: "Pendiente",
  sent: "Enviada",
  responded: "Respondida",
};

/** Rating por estrellas (soporta medios con ½). */
function Stars({ value, size = "md" }: { value: number; size?: "md" | "sm" }) {
  const cls = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = value >= i + 1;
        const half = !filled && value >= i + 0.5;
        return (
          <span key={i} className={cls}>
            {half ? <StarHalf className="h-full w-full fill-current" /> : filled ? <Star className="h-full w-full fill-current" /> : <Star className="h-full w-full opacity-30" />}
          </span>
        );
      })}
    </div>
  );
}

/** Panel de reputación: media de valoración, reseñas y peticiones de reseña. */
export function ReputationView({ orgId }: { orgId: string }) {
  const { data: reviews, loading, error, refresh } = useRealtimeCollection<Review>(
    useCallback((orgId) => fetchReviews(orgId), []),
    orgId,
    { table: "reviews", filter: `organization_id=eq.${orgId}` }
  );
  const { data: requests, refresh: refreshRequests } = useRealtimeCollection<ReviewRequest>(
    useCallback((orgId) => fetchReviewRequests(orgId), []),
    orgId,
    { table: "review_requests", filter: `organization_id=eq.${orgId}` }
  );

  const [requestOpen, setRequestOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  const summary = useMemo(() => {
    if (!reviews.length) return null;
    const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    const distribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: reviews.filter((r) => r.rating === stars).length,
    }));
    return { avg, count: reviews.length, distribution };
  }, [reviews]);

  // Muestra publicadas + pendientes (las nuevas quedan a la vista hasta su revisión);
  // las archivadas se ocultan. Evita que una reseña recién creada desaparezca.
  const visible = useMemo(() => reviews.filter((r) => r.status !== "archived"), [reviews]);

  const handleReply = async (review: Review) => {
    setSendingReply(review.id);
    try {
      await updateReview(orgId, review.id, { reply_text: replyText, status: review.status });
      toast.success("Respuesta publicada");
      setReplyingTo(null);
      setReplyText("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al responder");
    } finally {
      setSendingReply(null);
    }
  };

  const handleSendRequest = async (request: ReviewRequest) => {
    try {
      await sendReviewRequest(orgId, request.id);
      toast.success("Recordatorio de reseña enviado");
      refreshRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar");
    }
  };

  if (loading) return <LoadingState label="Cargando reputación" />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-muted-foreground">Valoración media</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="font-display text-4xl font-bold text-foreground">{summary ? summary.avg.toFixed(1) : "—"}</span>
            <Stars value={summary?.avg ?? 0} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{summary?.count ?? 0} reseñas recopiladas</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-muted-foreground">Distribución</p>
          <div className="mt-3 space-y-1.5">
            {summary?.distribution.map((d) => (
              <div key={d.stars} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-muted-foreground">{d.stars}★</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[var(--tenant-primary)]"
                    style={{ width: summary.count ? `${(d.count / summary.count) * 100}%` : "0%" }}
                  />
                </div>
                <span className="w-6 text-right text-muted-foreground">{d.count}</span>
              </div>
            ))}
            {!summary && <p className="text-xs text-muted-foreground">Aún sin reseñas.</p>}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-muted-foreground">Peticiones de reseña</p>
          <p className="mt-2 font-display text-4xl font-bold text-foreground">{requests.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {requests.filter((r) => r.status === "responded").length} respondidas
          </p>
        </div>
      </div>

      <Tabs defaultValue="reviews" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="reviews">Reseñas</TabsTrigger>
            <TabsTrigger value="requests">Peticiones ({requests.length})</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={() => setRequestOpen(true)}>
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Pedir reseña
          </Button>
        </div>

        <TabsContent value="reviews" className="mt-4">
          <div className="space-y-3">
            {visible.length === 0 && (
              <EmptyState icon={Star} title="Sin reseñas" description="Pide reseñas a tus clientes para empezar a construir tu reputación." />
            )}
            {visible.map((review) => (
              <div key={review.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-display text-sm font-bold text-foreground">
                      {review.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{review.customer_name}</span>
                        <Badge variant="muted">{REVIEW_SOURCE_LABEL[review.source]}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDateShort(review.created_at)}</span>
                      </div>
                      <div className="mt-1"><Stars value={review.rating} size="sm" /></div>
                    </div>
                  </div>
                  {review.status === "pending" && <Badge variant="warning">Pendiente</Badge>}
                </div>
                {review.content && <p className="mt-3 text-sm text-foreground">{review.content}</p>}

                {review.reply_text ? (
                  <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Reply className="h-3 w-3" /> Tu respuesta
                    </p>
                    <p className="text-foreground">{review.reply_text}</p>
                  </div>
                ) : replyingTo === review.id ? (
                  <div className="mt-3 space-y-2">
                    <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Escribe tu respuesta…" />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>Cancelar</Button>
                      <Button size="sm" disabled={!replyText.trim() || sendingReply === review.id} onClick={() => void handleReply(review)}>
                        {sendingReply === review.id ? "Enviando…" : "Responder"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(review.id)}>
                      <Reply className="h-3 w-3" /> Responder
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2.5">Cliente</th>
                    <th className="px-4 py-2.5">Teléfono</th>
                    <th className="px-4 py-2.5">Canal</th>
                    <th className="px-4 py-2.5">Enviada</th>
                    <th className="px-4 py-2.5">Estado</th>
                    <th className="px-4 py-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12">
                        <EmptyState icon={MessageSquarePlus} title="Sin peticiones" description="Pide reseñas por WhatsApp o email a tus clientes." />
                      </td>
                    </tr>
                  )}
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{req.contact_name}</td>
                      <td className="px-4 py-3 text-mono text-[10px] text-muted-foreground">{req.contact_id ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{req.channel === "whatsapp" ? "WhatsApp" : "Email"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelative(req.created_at)}</td>
                      <td className="px-4 py-3"><Badge variant="muted">{REQUEST_STATUS_LABEL[req.status]}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        {req.status === "pending" && (
                          <Button variant="ghost" size="sm" onClick={() => void handleSendRequest(req)}>
                            <Send className="h-3 w-3" /> Enviar
                          </Button>
                        )}
                        {req.status === "sent" && (
                          <Button variant="ghost" size="sm" onClick={() => void handleSendRequest(req)}>
                            <Send className="h-3 w-3" /> Reenviar
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
      </Tabs>

      <RequestDialog orgId={orgId} open={requestOpen} onOpenChange={setRequestOpen} onCreated={() => refreshRequests()} />
    </div>
  );
}

/* ------------------------- Diálogo de pedir reseña ------------------------- */

function RequestDialog({
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
  const [customer, setCustomer] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !target.trim()) {
      toast.error("Completa el nombre del cliente y el contacto");
      return;
    }
    setSaving(true);
    try {
      await createReviewRequest(orgId, { contact_name: customer.trim(), channel, contact_id: target.trim() || null });
      toast.success("Petición de reseña creada");
      onOpenChange(false);
      onCreated();
      setCustomer("");
      setTarget("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la petición");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pedir reseña</DialogTitle>
          <DialogDescription>Envía una petición de reseña a un cliente por WhatsApp o email.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="req-customer">Cliente</Label>
            <Input id="req-customer" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nombre del cliente" required />
          </div>
          <div className="space-y-2">
            <Label>Canal</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["whatsapp", "email"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    channel === c
                      ? "border-[var(--tenant-primary)] bg-[var(--tenant-primary)]/10 text-foreground"
                      : "border-border bg-surface text-muted-foreground hover:border-border-strong"
                  )}
                >
                  {c === "whatsapp" ? "WhatsApp" : "Email"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="req-target">{channel === "whatsapp" ? "Teléfono" : "Email del cliente"}</Label>
            <Input
              id="req-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={channel === "whatsapp" ? "+34 600 000 000" : "cliente@correo.com"}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              <Quote className="h-3.5 w-3.5" />
              {saving ? "Creando…" : "Crear y enviar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
