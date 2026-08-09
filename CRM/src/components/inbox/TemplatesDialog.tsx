"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { fetchMessageTemplates, saveMessageTemplate, deleteMessageTemplate } from "@/lib/data-access";
import { CHANNEL_LABELS, MESSAGE_CHANNELS, type MessageChannel, type MessageTemplate } from "@/types/database";
import { es } from "@/lib/i18n/es";

interface Props {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Gestor de plantillas de respuesta rápida (listado + alta + borrado). */
export function TemplatesDialog({ orgId, open, onOpenChange }: Props) {
  const { data: templates, loading } = useRealtimeCollection(fetchMessageTemplates, open ? orgId : null, {
    table: "message_templates",
    filter: `organization_id=eq.${orgId}`,
  });

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [channel, setChannel] = useState<MessageChannel>("whatsapp");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setCategory("");
    setChannel("whatsapp");
    setBody("");
  };

  const save = async () => {
    if (!name.trim() || !body.trim()) {
      toast.error(es.inbox.saveError);
      return;
    }
    setSaving(true);
    try {
      await saveMessageTemplate(orgId, { name, category, channel, body });
      toast.success(es.inbox.saveSuccess);
      reset();
    } catch {
      toast.error(es.inbox.saveError);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteMessageTemplate(orgId, id);
    } catch {
      toast.error(es.inbox.saveError);
    }
  };

  const grouped = Array.from(
    templates.reduce((map, t) => {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
      return map;
    }, new Map<string, MessageTemplate[]>())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--tenant-primary)]" />
            {es.inbox.templates}
          </DialogTitle>
          <DialogDescription>{es.inbox.suggestHint}</DialogDescription>
        </DialogHeader>

        {/* Alta de plantilla */}
        <div className="space-y-3 rounded-lg border border-border bg-surface p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">{es.inbox.templateName}</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={es.inbox.templateNamePlaceholder} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">{es.inbox.templateCategory}</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={es.inbox.templateCategoryPlaceholder} className="h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">Canal</label>
            <Select value={channel} onValueChange={(v) => setChannel(v as MessageChannel)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CHANNEL_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">{es.inbox.templateBody}</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={es.inbox.templateBodyPlaceholder} className="min-h-20 resize-none text-xs" />
            <p className="text-mono text-[10px] text-muted-foreground">{es.inbox.variablesHint}</p>
          </div>
          <Button size="sm" className="h-8 text-xs" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {es.inbox.templateSave}
          </Button>
        </div>

        {/* Listado */}
        <ScrollArea className="max-h-72 min-h-0">
          {loading ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{es.common.loading}</p>
          ) : grouped.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{es.inbox.templatesEmpty}</p>
          ) : (
            <div className="space-y-4">
              {grouped.map(([cat, items]) => (
                <div key={cat}>
                  <p className="mb-1.5 px-1 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">{cat}</p>
                  <div className="space-y-1.5">
                    {items.map((t) => (
                      <div key={t.id} className="group flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-xs font-semibold text-foreground">{t.name}</p>
                            <span className="text-mono text-[10px] uppercase text-muted-foreground">{CHANNEL_LABELS[t.channel]}</span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.body}</p>
                        </div>
                        <Button
                          size="iconSm"
                          variant="ghost"
                          className="h-6 w-6 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                          onClick={() => void remove(t.id)}
                          aria-label={es.inbox.deleteTemplate}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
