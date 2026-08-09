import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicFormContext } from "@/lib/data-access";
import { PublicFormWidget } from "@/components/marketing/PublicFormWidget";

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await fetchPublicFormContext(slug);
  if (!ctx) return { title: "Formulario no encontrado" };
  return {
    title: ctx.form.name,
    description: ctx.form.description ?? `Formulario de ${ctx.org.name}`,
  };
}

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await fetchPublicFormContext(slug);

  if (!ctx) {
    notFound();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">{ctx.form.name}</h1>
          {ctx.form.description && (
            <p className="mt-2 text-muted-foreground">{ctx.form.description}</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <PublicFormWidget form={ctx.form} orgId={ctx.org.id} />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by ZimplifAI
        </p>
      </div>
    </div>
  );
}