"use client";

import { useState } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { MarketingForm, FormField } from "@/types/database";
import { submitPublicForm } from "@/lib/data-access";
import { useSearchParams } from "next/navigation";

interface PublicFormWidgetProps {
  form: MarketingForm;
  orgId: string;
}

export function PublicFormWidget({ form, orgId }: PublicFormWidgetProps) {
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    form.config.fields.forEach((field) => {
      initial[field.key] = "";
    });
    return initial;
  });

  // Capturar UTM params de la URL
  const attribution = {
    utm_source: searchParams.get("utm_source"),
    utm_medium: searchParams.get("utm_medium"),
    utm_campaign: searchParams.get("utm_campaign"),
    utm_term: searchParams.get("utm_term"),
    utm_content: searchParams.get("utm_content"),
    landing_page: typeof window !== "undefined" ? window.location.href : null,
    referrer: typeof document !== "undefined" ? document.referrer : null,
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validar campos requeridos
    for (const field of form.config.fields) {
      if (field.required && !formData[field.key]?.trim()) {
        setError(`El campo "${field.label}" es obligatorio`);
        setSubmitting(false);
        return;
      }
    }

    try {
      await submitPublicForm({
        orgId,
        formId: form.id,
        formSlug: form.slug,
        payload: formData,
        attribution,
      });
      setStatus("success");
      if (form.config.redirect_url) {
        setTimeout(() => {
          window.location.href = form.config.redirect_url!;
        }, 2000);
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error al enviar el formulario");
    } finally {
      setSubmitting(false);
    }
  };

  const getFieldComponent = (field: FormField) => {
    const value = formData[field.key] ?? "";
    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      handleChange(field.key, e.target.value);

    switch (field.type) {
      case "email":
        return (
          <div className="space-y-1">
            <Label htmlFor={field.key}>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
            <Input
              id={field.key}
              type="email"
              value={value}
              onChange={onChange}
              required={field.required}
              placeholder={field.label}
              disabled={submitting || status === "success"}
            />
          </div>
        );
      case "phone":
        return (
          <div className="space-y-1">
            <Label htmlFor={field.key}>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
            <Input
              id={field.key}
              type="tel"
              value={value}
              onChange={onChange}
              required={field.required}
              placeholder={field.label}
              disabled={submitting || status === "success"}
            />
          </div>
        );
      case "textarea":
        return (
          <div className="space-y-1">
            <Label htmlFor={field.key}>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
            <Textarea
              id={field.key}
              value={value}
              onChange={onChange}
              required={field.required}
              placeholder={field.label}
              rows={4}
              disabled={submitting || status === "success"}
            />
          </div>
        );
      default:
        return (
          <div className="space-y-1">
            <Label htmlFor={field.key}>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
            <Input
              id={field.key}
              type="text"
              value={value}
              onChange={onChange}
              required={field.required}
              placeholder={field.label}
              disabled={submitting || status === "success"}
            />
          </div>
        );
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{form.config.success_message}</h3>
        {form.config.redirect_url && (
          <p className="text-sm text-muted-foreground">
            Redirigiendo en unos segundos…
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {status === "error" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {form.config.fields.map((field) => (
          <div key={field.key}>{getFieldComponent(field)}</div>
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={submitting} size="lg">
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando…
          </>
        ) : (
          form.config.button_text
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Al enviar, aceptas nuestra política de privacidad.
      </p>
    </form>
  );
}