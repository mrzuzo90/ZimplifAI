"use client";

import { useState, useCallback } from "react";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { fetchForms, saveForm, updateForm, removeForm, fetchFormSubmissions } from "@/lib/data-access";
import type { MarketingForm, FormField, FormSubmission, FormFieldType } from "@/types/database";
import { toast } from "sonner";

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Texto" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Teléfono" },
  { value: "textarea", label: "Área de texto" },
];

interface FormDialogProps {
  form?: MarketingForm | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: Omit<MarketingForm, "id" | "organization_id" | "created_at" | "updated_at">) => Promise<void>;
}

export function FormDialog({ form, open, onOpenChange, onSave }: FormDialogProps) {
  const isEditing = !!form;
  const [fields, setFields] = useState<FormField[]>(form?.config.fields ?? [
    { key: "first_name", label: "Nombre", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true },
  ]);
  const [name, setName] = useState(form?.name ?? "");
  const [slug, setSlug] = useState(form?.slug ?? "");
  const [description, setDescription] = useState(form?.description ?? "");
  const [buttonText, setButtonText] = useState(form?.config.button_text ?? "Enviar");
  const [successMessage, setSuccessMessage] = useState(form?.config.success_message ?? "¡Gracias! Te contactaremos pronto.");
  const [redirectUrl, setRedirectUrl] = useState(form?.config.redirect_url ?? "");
  const [isActive, setIsActive] = useState(form?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const addField = () => {
    setFields([...fields, { key: `field_${Date.now()}`, label: "", type: "text", required: false }]);
  };

  const updateField = (index: number, patch: Partial<FormField>) => {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name,
        slug,
        description: description || null,
        config: {
          fields,
          button_text: buttonText,
          success_message: successMessage,
          redirect_url: redirectUrl || null,
        },
        is_active: isActive,
      });
      toast.success(isEditing ? "Formulario actualizado" : "Formulario creado");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar formulario" : "Nuevo formulario"}</DialogTitle>
          <DialogDescription>
            Configura los campos y textos del formulario de captación.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL amigable)</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (interna)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uso interno para identificar el formulario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonText">Texto del botón</Label>
              <Input
                id="buttonText"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="successMessage">Mensaje de éxito</Label>
              <Textarea
                id="successMessage"
                value={successMessage}
                onChange={(e) => setSuccessMessage(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redirectUrl">URL de redirección (opcional)</Label>
              <Input
                id="redirectUrl"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://ejemplo.com/gracias"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="isActive" className="mb-0">
                Formulario activo
              </Label>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Campos del formulario</h4>
              <Button type="button" variant="ghost" size="sm" onClick={addField}>
                <Plus className="h-4 w-4 mr-1" /> Añadir campo
              </Button>
            </div>
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.key} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor={`field-label-${idx}`} className="text-xs">
                          Etiqueta
                        </Label>
                        <Input
                          id={`field-label-${idx}`}
                          value={field.label}
                          onChange={(e) => updateField(idx, { label: e.target.value })}
                          placeholder="Ej. Nombre, Email, Teléfono..."
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`field-type-${idx}`} className="text-xs">
                          Tipo
                        </Label>
                        <Select value={field.type} onValueChange={(v) => updateField(idx, { type: v as FormFieldType })}>
                          <SelectTrigger id={`field-type-${idx}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="flex items-center gap-1.5 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(idx, { required: e.target.checked })}
                        />
                        <span>Requerido</span>
                      </Label>
                      <span className="text-xs text-muted-foreground font-mono">{field.key}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeField(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No hay campos. Haz clic en &ldquo;Añadir campo&rdquo; para empezar.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface SubmissionsDialogProps {
  form: MarketingForm;
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmissionsDialog({ form, orgId, open, onOpenChange }: SubmissionsDialogProps) {
  const { data: submissions, loading } = useRealtimeCollection<FormSubmission>(
    useCallback((orgId) => fetchFormSubmissions(orgId, form.id), [form.id]),
    orgId,
    { table: "form_submissions" }
  );

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Envíos de «{form.name}»</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Envíos de «{form.name}»</DialogTitle>
          <DialogDescription>{submissions?.length ?? 0} envíos totales</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Fecha</th>
                <th className="pb-2 pr-4">Lead</th>
                <th className="pb-2 pr-4">Email / Teléfono</th>
                <th className="pb-2 pr-4">UTM Source</th>
                <th className="pb-2 pr-4">UTM Medium</th>
                <th className="pb-2 pr-4">UTM Campaign</th>
                <th className="pb-2 pr-4">Payload</th>
              </tr>
            </thead>
            <tbody>
              {submissions?.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {new Date(s.created_at).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2 pr-4">
                    {s.lead_id ? (
                      <span className="text-primary underline cursor-pointer">
                        Ver lead {s.lead_id.slice(0, 8)}…
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {s.payload.email ? (
                      <span>{String(s.payload.email)}</span>
                    ) : s.payload.phone ? (
                      <span>{String(s.payload.phone)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{s.utm_source ?? "—"}</td>
                  <td className="py-2 pr-4">{s.utm_medium ?? "—"}</td>
                  <td className="py-2 pr-4">{s.utm_campaign ?? "—"}</td>
                  <td className="py-2 pr-4 max-w-xs truncate">
                    <pre className="text-xs">{JSON.stringify(s.payload)}</pre>
                  </td>
                </tr>
              ))}
              {(!submissions || submissions.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No hay envíos aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MarketingFormsView({ orgId }: { orgId: string }) {
  const { data: forms, loading, refresh } = useRealtimeCollection<MarketingForm>(
    fetchForms,
    orgId,
    { table: "forms" }
  );
  const [dialogForm, setDialogForm] = useState<MarketingForm | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submissionsForm, setSubmissionsForm] = useState<MarketingForm | null>(null);

  const handleSave = async (input: Omit<MarketingForm, "id" | "organization_id" | "created_at" | "updated_at">) => {
    if (dialogForm) {
      await updateForm(orgId, dialogForm.id, input);
    } else {
      await saveForm(orgId, input);
    }
    refresh();
  };

  const handleDelete = async (form: MarketingForm) => {
    if (!confirm(`¿Eliminar el formulario «${form.name}»?`)) return;
    try {
      await removeForm(orgId, form.id);
      toast.success("Formulario eliminado");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Formularios de marketing</h2>
          <p className="text-muted-foreground">
            Crea formularios de captación para embebidos, páginas de aterrizaje o funnels.
          </p>
        </div>
        <Button onClick={() => { setDialogForm(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo formulario
        </Button>
      </div>

      <FormDialog
        form={dialogForm}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />

      <div className="rounded-lg border bg-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Formulario</th>
                <th className="pb-2 pr-4">Slug</th>
                <th className="pb-2 pr-4">Campos</th>
                <th className="pb-2 pr-4">Estado</th>
                <th className="pb-2 pr-4">Creado</th>
                <th className="pb-2 pr-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {forms?.map((form) => (
                <tr key={form.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{form.name}</div>
                    {form.description && (
                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                        {form.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm">
                    /f/{form.slug}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-secondary">
                      {form.config.fields.length} campos
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                        form.is_active
                          ? "bg-green-500/10 text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {form.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                    {new Date(form.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSubmissionsForm(form)}
                        title="Ver envíos"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setDialogForm(form); setDialogOpen(true); }}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(form)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!forms || forms.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-12 w-12 text-muted-foreground/50" />
                      <span>No hay formularios aún</span>
                      <Button
                        variant="ghost"
                        onClick={() => setDialogForm(null)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Crear el primero
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {submissionsForm && (
        <SubmissionsDialog
          form={submissionsForm}
          orgId={orgId}
          open={!!submissionsForm}
          onOpenChange={(open) => !open && setSubmissionsForm(null)}
        />
      )}
    </div>
  );
}