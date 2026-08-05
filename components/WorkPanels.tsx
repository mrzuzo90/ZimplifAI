"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface Panel {
  discipline: string;
  accent: string;
  before: string[];
  after: string[];
}

const PANELS: Panel[] = [
  {
    discipline: "Código",
    accent: "#b9ff2a",
    before: [
      "Papeleos y emails sin fin",
      "Copy-paste entre herramientas",
      "Procesos que nadie revisa",
    ],
    after: [
      "Agentes que procesan facturas",
      "Flujos automatizados de punta a punta",
      "Código desplegado y probado",
    ],
  },
  {
    discipline: "IA",
    accent: "#45e5ff",
    before: [
      "Revisión manual de datos",
      "Suposiciones sin validar",
      "Horas perdidas en clasificación",
    ],
    after: [
      "Modelos que clasifican y predicen",
      "Datos limpios, decisiones informadas",
      "Entrenamiento continuo, mejora real",
    ],
  },
  {
    discipline: "Máquinas",
    accent: "#e8e6e1",
    before: [
      "Cableado a ciegas",
      "Pruebas caras en planta",
      "Paradas imprevistas y pérdidas",
    ],
    after: [
      "PLC programado y simulado antes de arrancar",
      "SCADA en tiempo real",
      "Mantenimiento predictivo, cero sorpresas",
    ],
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

function Panel({ panel, index }: { panel: Panel; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });

  return (
    <motion.div
      ref={ref}
      className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 md:p-7"
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.65, delay: index * 0.12, ease: EASE }}
    >
      <span
        className="font-mono text-xs uppercase tracking-[0.18em]"
        style={{ color: panel.accent }}
      >
        {panel.discipline}
      </span>

      {/* Antes */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted/50">
          Antes
        </span>
        {panel.before.map((t) => (
          <span
            key={t}
            className="text-sm leading-relaxed text-muted/40 line-through decoration-muted/20"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Separador */}
      <div className="h-px w-full bg-line" />

      {/* Después */}
      <div className="flex flex-col gap-1.5">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.16em]"
          style={{ color: panel.accent }}
        >
          Después
        </span>
        {panel.after.map((t) => (
          <span key={t} className="text-sm leading-relaxed text-ink">
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function WorkPanels() {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-3">
      {PANELS.map((panel, i) => (
        <Panel key={panel.discipline} panel={panel} index={i} />
      ))}
    </div>
  );
}
