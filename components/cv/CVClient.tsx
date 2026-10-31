"use client";

import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { cvEncryptedPayload } from "@/content/cvPayload";

interface CVData {
  personal: {
    name: string;
    headline: string;
    location: string;
    phone: string;
    email: string;
    github: string;
    profile: string;
  };
  experience: Array<{
    company: string;
    period: string;
    role: string;
    description: string;
  }>;
  projects: Array<{
    name: string;
    category: string;
    description: string;
    technologies: string[];
    badge?: string;
    link?: string;
    repo?: string;
    disclaimer?: string;
  }>;
  skillsCategories: Array<{
    category: string;
    items: string[];
  }>;
  allSkills: string[];
  education: Array<{
    degree: string;
    institution: string;
    status: string;
    detail?: string;
  }>;
}

function IconSvg({ children, size = 16, className = "" }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

const LockIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </IconSvg>
);

const UnlockIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </IconSvg>
);

const PrinterIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </IconSvg>
);

const ArrowLeftIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </IconSvg>
);

const MailIcon = ({ size = 15, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </IconSvg>
);

const PhoneIcon = ({ size = 15, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </IconSvg>
);

const MapPinIcon = ({ size = 15, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <circle cx="12" cy="10" r="3" />
  </IconSvg>
);

const ExternalLinkIcon = ({ size = 12, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </IconSvg>
);

const ShieldCheckIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </IconSvg>
);

const AlertCircleIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </IconSvg>
);

const BriefcaseIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <rect width="20" height="14" x="2" y="6" rx="2" />
  </IconSvg>
);

const Code2Icon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <path d="m18 16 4-4-4-4" />
    <path d="m6 8-4 4 4 4" />
    <path d="m14.5 4-5 16" />
  </IconSvg>
);

const GraduationCapIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </IconSvg>
);

const SparklesIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275z" />
  </IconSvg>
);

const CheckIcon = ({ size = 12, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <path d="M20 6 9 17l-5-5" />
  </IconSvg>
);

const CopyIcon = ({ size = 12, className = "" }: { size?: number; className?: string }) => (
  <IconSvg size={size} className={className}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </IconSvg>
);

export default function CVClient() {
  const [accessCode, setAccessCode] = useState("");
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (cvData) {
      document.title = "Currículum Vitae · " + cvData.personal.name;
    } else {
      document.title = "Acceso a documento privado · ZimplifAI";
    }
  }, [cvData]);

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const normalized = accessCode.replace(/[-\s]/g, "").toUpperCase();

      const saltBytes = Uint8Array.from(atob(cvEncryptedPayload.salt), (c) => c.charCodeAt(0));
      const ivBytes = Uint8Array.from(atob(cvEncryptedPayload.iv), (c) => c.charCodeAt(0));
      const ciphertextBytes = Uint8Array.from(atob(cvEncryptedPayload.ciphertext), (c) =>
        c.charCodeAt(0),
      );

      const baseKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(normalized),
        "PBKDF2",
        false,
        ["deriveKey"],
      );

      const aesKey = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: saltBytes,
          iterations: cvEncryptedPayload.iterations,
          hash: "SHA-256",
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"],
      );

      const decryptedBuf = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        aesKey,
        ciphertextBytes,
      );

      const decryptedStr = new TextDecoder().decode(decryptedBuf);
      const parsed = JSON.parse(decryptedStr) as CVData;

      // In-memory unlock only; wipe input code immediately
      setAccessCode("");
      setCvData(parsed);
    } catch {
      setError("El código introducido no es válido o no permite descifrar el documento.");
      setCvData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLock = () => {
    setCvData(null);
    setAccessCode("");
    setError(null);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="cv-wrapper min-h-screen bg-bg text-ink font-display">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm 15mm 12mm 15mm;
          }
          html, body {
            background: #ffffff !important;
            color: #1a1a1a !important;
            font-size: 11pt !important;
          }
          .cv-wrapper {
            background: #ffffff !important;
            color: #1a1a1a !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }
          .cv-no-print,
          header,
          nav,
          button {
            display: none !important;
          }
          .cv-paper {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .cv-print-section {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 14pt !important;
          }
          .cv-card-print {
            break-inside: avoid;
            page-break-inside: avoid;
            background: #fafafa !important;
            border: 1px solid #e0e0e0 !important;
            box-shadow: none !important;
            color: #1a1a1a !important;
          }
          .cv-tag-print {
            background: #f0f0f0 !important;
            border: 1px solid #d5d5d5 !important;
            color: #222222 !important;
          }
          a {
            color: inherit !important;
            text-decoration: none !important;
          }
        }
      `}</style>

      {cvData ? (
        <div className="cv-container pb-20">
          {/* Top Control Bar (Hidden on print) */}
          <div className="cv-no-print sticky top-0 z-30 backdrop-blur-md bg-bg/90 border-b border-line px-4 py-3 sm:px-8">
            <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt rounded p-1"
              >
                <ArrowLeftIcon size={14} />
                Volver a zimplifai.es
              </Link>
              <div className="flex items-center gap-2.5">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono text-volt bg-volt/10 border border-volt/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse" />
                  Descifrado en memoria
                </span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium bg-volt text-bg hover:opacity-90 active:scale-95 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-bg cursor-pointer font-display"
                  title="Guardar o imprimir como documento PDF"
                >
                  <PrinterIcon size={15} />
                  <span>Imprimir / Guardar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleLock}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-muted hover:text-ink bg-surface hover:bg-surface-2 border border-line transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt cursor-pointer"
                  title="Cerrar y borrar de la memoria"
                >
                  <LockIcon size={13} />
                  <span>Bloquear</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main CV Sheet */}
          <main className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 sm:pt-12">
            <article className="cv-paper rounded-2xl border border-line bg-surface/40 p-6 sm:p-10 shadow-2xl">
              {/* Header: Personal Info */}
              <header className="cv-print-section pb-8 border-b border-line">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-volt font-semibold flex items-center gap-2">
                      <SparklesIcon size={14} />
                      Currículum Vitae
                    </span>
                    <h1 className="mt-2 text-4xl sm:text-5xl md:text-6xl font-bold uppercase tracking-tight text-ink">
                      {cvData.personal.name}
                    </h1>
                    <p className="mt-2 text-lg sm:text-xl font-medium text-volt">
                      {cvData.personal.headline}
                    </p>
                  </div>
                </div>

                {/* Contact grid */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-line/60 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-ink">
                    <MapPinIcon size={15} className="text-volt shrink-0" />
                    <span>{cvData.personal.location}</span>
                  </div>

                  <div className="flex items-center gap-2 group">
                    <PhoneIcon size={15} className="text-volt shrink-0" />
                    <a
                      href={`tel:${cvData.personal.phone.replace(/\s+/g, "")}`}
                      className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt rounded"
                    >
                      {cvData.personal.phone}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(cvData.personal.phone, "phone")}
                      className="cv-no-print opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-ink transition-opacity"
                      title="Copiar teléfono"
                      aria-label="Copiar teléfono"
                    >
                      {copiedField === "phone" ? (
                        <CheckIcon size={12} className="text-volt" />
                      ) : (
                        <CopyIcon size={12} />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 group">
                    <MailIcon size={15} className="text-volt shrink-0" />
                    <a
                      href={`mailto:${cvData.personal.email}`}
                      className="hover:underline truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt rounded"
                    >
                      {cvData.personal.email}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(cvData.personal.email, "email")}
                      className="cv-no-print opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-ink transition-opacity"
                      title="Copiar email"
                      aria-label="Copiar email"
                    >
                      {copiedField === "email" ? (
                        <CheckIcon size={12} className="text-volt" />
                      ) : (
                        <CopyIcon size={12} />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <ExternalLinkIcon size={15} className="text-volt shrink-0" />
                    <a
                      href={cvData.personal.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt rounded"
                    >
                      github.com/mrzuzo90
                    </a>
                  </div>
                </div>
              </header>

              {/* Section 1: Perfil profesional */}
              <section className="cv-print-section py-8 border-b border-line">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">
                    01
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">
                    Perfil Profesional
                  </h2>
                </div>
                <div className="p-5 rounded-xl bg-surface/50 border border-line cv-card-print">
                  <p className="text-ink/90 text-sm sm:text-base leading-relaxed">
                    {cvData.personal.profile}
                  </p>
                </div>
              </section>

              {/* Section 2: Experiencia laboral */}
              <section className="cv-print-section py-8 border-b border-line">
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">
                    02
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
                    <BriefcaseIcon size={20} className="text-volt" />
                    Trayectoria Laboral
                  </h2>
                </div>
                <div className="space-y-6">
                  {cvData.experience.map((job, idx) => (
                    <div
                      key={idx}
                      className="cv-card-print p-5 rounded-xl border border-line bg-surface/30 hover:border-volt/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <h3 className="text-lg font-semibold text-ink">
                          {job.company}
                        </h3>
                        <span className="font-mono text-xs text-volt px-2.5 py-0.5 rounded bg-volt/10 border border-volt/20 w-fit">
                          {job.period}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-muted mb-3 font-mono">
                        {job.role}
                      </p>
                      <p className="text-sm text-ink/90 leading-relaxed">
                        {job.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 3: Proyectos destacados */}
              <section className="cv-print-section py-8 border-b border-line">
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">
                    03
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
                    <Code2Icon size={20} className="text-volt" />
                    Proyectos Seleccionados
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {cvData.projects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="cv-card-print p-5 rounded-xl border border-line bg-surface/30 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-ink">
                            {proj.name}
                          </h3>
                          {proj.badge && (
                            <span className="cv-tag-print font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-volt/10 text-volt border border-volt/30 shrink-0">
                              {proj.badge}
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-muted mb-3">
                          {proj.category}
                        </p>
                        <p className="text-xs sm:text-sm text-ink/90 leading-relaxed mb-4">
                          {proj.description}
                        </p>
                        {proj.disclaimer && (
                          <p className="text-[11px] font-mono text-muted mb-4 italic">
                            * {proj.disclaimer}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-line/50">
                          {proj.technologies.map((tech, tIdx) => (
                            <span
                              key={tIdx}
                              className="cv-tag-print font-mono text-[11px] px-2 py-0.5 rounded bg-surface-2 text-ink border border-line"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                        {(proj.link || proj.repo) && (
                          <div className="mt-3.5 pt-2 flex items-center gap-3 text-xs">
                            {proj.link && (
                              <a
                                href={proj.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-volt hover:underline"
                              >
                                <ExternalLinkIcon size={12} />
                                Demo en vivo
                              </a>
                            )}
                            {proj.repo && (
                              <a
                                href={proj.repo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-volt hover:underline"
                              >
                                <ExternalLinkIcon size={12} />
                                Repositorio GitHub
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 4: Competencias técnicas */}
              <section className="cv-print-section py-8 border-b border-line">
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">
                    04
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">
                    Competencias Técnicas
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cvData.skillsCategories.map((group, idx) => (
                    <div
                      key={idx}
                      className="cv-card-print p-4 rounded-xl border border-line bg-surface/30"
                    >
                      <h3 className="font-mono text-xs uppercase tracking-wider text-volt mb-2.5 font-semibold">
                        {group.category}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="cv-tag-print font-mono text-xs px-2 py-0.5 rounded bg-surface-2 text-ink border border-line"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 5: Formación */}
              <section className="cv-print-section py-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">
                    05
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
                    <GraduationCapIcon size={20} className="text-volt" />
                    Formación
                  </h2>
                </div>
                <div className="space-y-4">
                  {cvData.education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="cv-card-print p-5 rounded-xl border border-line bg-surface/30"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <h3 className="text-base font-semibold text-ink">
                          {edu.degree}
                        </h3>
                        <span className="font-mono text-xs text-volt px-2.5 py-0.5 rounded bg-volt/10 border border-volt/20 w-fit">
                          {edu.status}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-muted mb-2">
                        {edu.institution}
                      </p>
                      {edu.detail && (
                        <p className="text-xs sm:text-sm text-ink/80">{edu.detail}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Document footer note */}
              <footer className="pt-8 mt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted font-mono">
                <span>zimplifai.es · Documento privado cifrado</span>
                <span className="cv-no-print">Descifrado localmente mediante AES-256-GCM</span>
              </footer>
            </article>
          </main>
        </div>
      ) : (
        /* Locked Access Screen */
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8">
          {/* Header Link */}
          <header className="max-w-md mx-auto w-full pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt rounded p-1"
            >
              <ArrowLeftIcon size={14} />
              Volver a zimplifai.es
            </Link>
          </header>

          {/* Access Card */}
          <main className="max-w-md mx-auto w-full my-auto py-12">
            <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-volt/10 border border-volt/30 flex items-center justify-center mx-auto mb-6 text-volt">
                <LockIcon size={22} />
              </div>

              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase text-ink">
                  Documento Privado
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                  Este contenido está protegido mediante cifrado local AES-256-GCM. Introduce tu
                  código de acceso para descifrarlo en este navegador.
                </p>
              </div>

              <form
                onSubmit={handleUnlock}
                noValidate={false}
                aria-label="Formulario de acceso al documento privado"
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="cv-access-code"
                    className="block font-mono text-xs uppercase tracking-wider text-muted mb-2"
                  >
                    Código de acceso
                  </label>
                  <div className="relative">
                    <input
                      id="cv-access-code"
                      type="password"
                      autoComplete="current-password"
                      spellCheck="false"
                      required
                      autoFocus
                      disabled={isLoading}
                      value={accessCode}
                      onChange={(e) => {
                        setAccessCode(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="XXXXXX-XXXXXX-XXXXXX"
                      aria-required="true"
                      aria-invalid={error ? "true" : "false"}
                      aria-describedby={error ? "access-error-msg" : undefined}
                      className="w-full px-4 py-3 rounded-lg font-mono text-sm tracking-wider uppercase bg-surface-2 text-ink border border-line focus:outline-none focus:ring-2 focus:ring-volt focus:border-transparent transition-all placeholder:text-muted/50 placeholder:normal-case"
                    />
                  </div>
                </div>

                {error && (
                  <div
                    id="access-error-msg"
                    role="alert"
                    aria-live="polite"
                    className="flex items-start gap-2.5 p-3 rounded-lg text-xs sm:text-sm text-red-400 bg-red-950/30 border border-red-500/30"
                  >
                    <AlertCircleIcon size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !accessCode.trim()}
                  aria-busy={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-lg font-semibold text-sm bg-volt text-bg hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-bg font-display"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                      <span>Descifrando contenido...</span>
                    </>
                  ) : (
                    <>
                      <UnlockIcon size={16} />
                      <span>Descifrar documento</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-center gap-2 text-[11px] font-mono text-muted">
                <ShieldCheckIcon size={14} className="text-volt shrink-0" />
                <span>PBKDF2 SHA-256 (310.000 iteraciones) · Sin envío al servidor</span>
              </div>
            </div>
          </main>

          {/* Footer note */}
          <footer className="max-w-md mx-auto w-full pb-4 text-center">
            <p className="text-xs font-mono text-muted">
              zimplifai.es · Acceso seguro restringido
            </p>
          </footer>
        </div>
      )}
    </div>
  );
}
