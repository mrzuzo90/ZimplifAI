"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { clearAccessUnlocked } from "@/lib/uf0894/auth";
import {
  ORIGINAL_QUESTIONS,
  EXTRA_QUESTIONS,
  EXERCISES,
  type UF0894Question,
} from "@/lib/uf0894/data";

type TabView = "home" | "game" | "study" | "lab" | "export";
type QuestionKind = "all" | "original" | "extra";
type CalcPhase = "setup" | "play" | "end";

interface EnrichedQuestion extends UF0894Question {
  kind: "original" | "extra";
}

const ALL_QUESTIONS: EnrichedQuestion[] = [
  ...ORIGINAL_QUESTIONS.map((q) => ({ ...q, kind: "original" as const })),
  ...EXTRA_QUESTIONS.map((q) => ({ ...q, kind: "extra" as const })),
];

const LOCAL_STORAGE_KEY = "zimplifai_uf0894_progress_v1";

interface SavedProgress {
  score: number;
  correct: number;
  totalAnswered: number;
  bestStreak: number;
  soundEnabled: boolean;
}

interface UF0894AppProps {
  onLock?: () => void;
}

export default function UF0894App({ onLock }: UF0894AppProps = {}) {
  const [currentTab, setCurrentTab] = useState<TabView>("home");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Progreso global del usuario (guardado en cliente solo tras desbloqueo)
  const [userScore, setUserScore] = useState(0);
  const [userCorrect, setUserCorrect] = useState(0);
  const [userTotal, setUserTotal] = useState(0);
  const [userBestStreak, setUserBestStreak] = useState(0);

  // ─────────────────────────────────────────────
  // Modo Juego
  // ─────────────────────────────────────────────
  const [gamePhase, setGamePhase] = useState<CalcPhase>("setup");
  const [gameLength, setGameLength] = useState<number>(10);
  const [gameTopic, setGameTopic] = useState<string>("all");
  const [gameQuestions, setGameQuestions] = useState<EnrichedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gameStreak, setGameStreak] = useState(0);
  const [sessionBestStreak, setSessionBestStreak] = useState(0);
  const [gameCorrectCount, setGameCorrectCount] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(20);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ─────────────────────────────────────────────
  // Modo Estudio
  // ─────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [studyTopic, setStudyTopic] = useState("all");
  const [studyKind, setStudyKind] = useState<QuestionKind>("all");
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});
  const [expandAllAnswers, setExpandAllAnswers] = useState(false);

  // ─────────────────────────────────────────────
  // Modo Laboratorio / Calculadora
  // ─────────────────────────────────────────────
  const [calcType, setCalcType] = useState<"mono" | "tri">("mono");
  const [calcP, setCalcP] = useState<number>(10);
  const [calcU, setCalcU] = useState<number>(230);
  const [calcCos, setCalcCos] = useState<number>(0.9);
  const [calcResult, setCalcResult] = useState<string>("I = 48.3 A");
  const [revealedExercises, setRevealedExercises] = useState<Record<string, boolean>>({});

  // ─────────────────────────────────────────────
  // Modo Copiar Examen
  // ─────────────────────────────────────────────
  const [examIncludeExtras, setExamIncludeExtras] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string>("");

  // Carga inicial de progreso guardado tras desbloqueo
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedProgress;
        if (typeof parsed.score === "number") setUserScore(parsed.score);
        if (typeof parsed.correct === "number") setUserCorrect(parsed.correct);
        if (typeof parsed.totalAnswered === "number") setUserTotal(parsed.totalAnswered);
        if (typeof parsed.bestStreak === "number") setUserBestStreak(parsed.bestStreak);
        if (typeof parsed.soundEnabled === "boolean") setSoundEnabled(parsed.soundEnabled);
      }
    } catch {
      // Ignorar fallos de parsing de storage
    }
  }, []);

  // Guardado de progreso
  const saveProgress = (
    newScore: number,
    newCorrect: number,
    newTotal: number,
    newBestStreak: number
  ) => {
    setUserScore(newScore);
    setUserCorrect(newCorrect);
    setUserTotal(newTotal);
    setUserBestStreak(newBestStreak);
    try {
      const data: SavedProgress = {
        score: newScore,
        correct: newCorrect,
        totalAnswered: newTotal,
        bestStreak: newBestStreak,
        soundEnabled,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage no disponible
    }
  };

  // Sonido con Web Audio API sintetizado
  const playChime = (ok: boolean) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(ok ? 660 : 220, ctx.currentTime);
      if (ok) {
        osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.13);
      }
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.23);
      osc.onended = () => ctx.close();
    } catch {
      // Audio no soportado o bloqueado por política de autoplay
    }
  };

  // Efecto confetti
  const triggerConfetti = (count: number = 32) => {
    if (typeof window === "undefined") return;
    const colors = ["#ceff00", "#45e5ff", "#ffffff", "#fbbf24", "#a855f7"];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "pointer-events-none fixed top-[-20px] z-[999] h-3 w-2 rounded-xs";
      el.style.left = `${Math.random() * 100}vw`;
      el.style.backgroundColor = colors[i % colors.length];
      el.style.animation = `fall ${1.4 + Math.random() * 0.8}s linear forwards`;
      el.style.animationDelay = `${Math.random() * 0.3}s`;
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2400);
    }
  };

  // Navegación entre pestañas
  const handleGoTab = (tab: TabView) => {
    setCurrentTab(tab);
    if (tab === "game") {
      setGamePhase("setup");
      if (timerRef.current) clearInterval(timerRef.current);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Lista única de temáticas
  const allTopics = useMemo(() => {
    return Array.from(new Set(ALL_QUESTIONS.map((q) => q.t))).sort();
  }, []);

  // ─────────────────────────────────────────────
  // Lógica del Desafío / Juego
  // ─────────────────────────────────────────────
  const startQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Filtrar preguntas con opciones válidas y respuesta verificable
    const pool = ALL_QUESTIONS.filter(
      (q) =>
        q.o.length >= 2 &&
        q.a !== null &&
        (gameTopic === "all" || q.t === gameTopic)
    );

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = gameLength === 0 ? shuffled : shuffled.slice(0, gameLength);

    setGameQuestions(selected);
    setCurrentIndex(0);
    setGameScore(0);
    setGameStreak(0);
    setSessionBestStreak(0);
    setGameCorrectCount(0);
    setIsAnswered(false);
    setSelectedOption(null);
    setFeedbackText("");
    setGamePhase("play");
    setupQuestion(0, selected);
  };

  const setupQuestion = (index: number, questions: EnrichedQuestion[]) => {
    if (index >= questions.length) {
      finishQuiz(gameScore, gameCorrectCount, sessionBestStreak, questions.length);
      return;
    }

    setIsAnswered(false);
    setSelectedOption(null);
    setFeedbackText("");
    setTimerSeconds(20);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout(index, questions);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = (index: number, questions: EnrichedQuestion[]) => {
    setIsAnswered(true);
    setGameStreak(0);
    const currentQ = questions[index];
    const correctLetter = currentQ.a !== null ? String.fromCharCode(65 + currentQ.a) : "";
    const correctText = currentQ.a !== null ? currentQ.o[currentQ.a] : "";
    setFeedbackText(`⏱ Tiempo agotado. La opción correcta era: ${correctLetter}. ${correctText}`);
    playChime(false);
  };

  const handleAnswerChoice = (choiceIndex: number) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsAnswered(true);
    setSelectedOption(choiceIndex);

    const currentQ = gameQuestions[currentIndex];
    const isCorrect = choiceIndex === currentQ.a;

    if (isCorrect) {
      const newStreak = gameStreak + 1;
      setGameStreak(newStreak);
      setSessionBestStreak((prev) => Math.max(prev, newStreak));
      const gained = 500 + timerSeconds * 20 + Math.min(newStreak, 10) * 50;
      setGameScore((prev) => prev + gained);
      setGameCorrectCount((prev) => prev + 1);
      setFeedbackText(`¡Correcto! ${currentQ.x}`);
      triggerConfetti(18);
      playChime(true);
    } else {
      setGameStreak(0);
      const correctLetter = currentQ.a !== null ? String.fromCharCode(65 + currentQ.a) : "";
      const correctText = currentQ.a !== null ? currentQ.o[currentQ.a] : "";
      setFeedbackText(`Incorrecto. La solución es ${correctLetter}. ${correctText}. ${currentQ.x}`);
      playChime(false);
    }
  };

  const handleNextQuestion = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= gameQuestions.length) {
      finishQuiz(gameScore, gameCorrectCount, sessionBestStreak, gameQuestions.length);
    } else {
      setCurrentIndex(nextIdx);
      setupQuestion(nextIdx, gameQuestions);
    }
  };

  const finishQuiz = (
    finalScore: number,
    finalCorrect: number,
    finalBestStreak: number,
    totalQs: number
  ) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGamePhase("end");
    triggerConfetti(48);
    playChime(true);

    const updatedScore = userScore + finalScore;
    const updatedCorrect = userCorrect + finalCorrect;
    const updatedTotal = userTotal + totalQs;
    const updatedBestStreak = Math.max(userBestStreak, finalBestStreak);
    saveProgress(updatedScore, updatedCorrect, updatedTotal, updatedBestStreak);
  };

  const handleLeaveGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGamePhase("setup");
  };

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ─────────────────────────────────────────────
  // Filtrado de preguntas para Estudio
  // ─────────────────────────────────────────────
  const filteredStudyQuestions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return ALL_QUESTIONS.filter((q) => {
      if (studyKind !== "all" && q.kind !== studyKind) return false;
      if (studyTopic !== "all" && q.t !== studyTopic) return false;
      if (!search) return true;
      const combined = `${q.q} ${q.t} ${q.x} ${q.o.join(" ")}`.toLowerCase();
      return combined.includes(search);
    });
  }, [searchTerm, studyTopic, studyKind]);

  const toggleCardReveal = (id: string) => {
    setRevealedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleExpandAll = () => {
    const nextState = !expandAllAnswers;
    setExpandAllAnswers(nextState);
    const updated: Record<string, boolean> = {};
    filteredStudyQuestions.forEach((q) => {
      updated[`q_${q.n}`] = nextState;
    });
    setRevealedCards(updated);
  };

  // ─────────────────────────────────────────────
  // Laboratorio de cálculo
  // ─────────────────────────────────────────────
  const computeCurrent = (type: "mono" | "tri", pKw: number, uV: number, cosPhi: number) => {
    const pWatts = pKw * 1000;
    if (pWatts <= 0 || uV <= 0 || cosPhi <= 0 || cosPhi > 1) {
      return "Parámetros no válidos (cos φ debe estar entre 0 y 1)";
    }
    const current = type === "tri" ? pWatts / (Math.sqrt(3) * uV * cosPhi) : pWatts / (uV * cosPhi);
    return `I = ${current.toFixed(1)} A`;
  };

  const handleCalculateI = () => {
    const res = computeCurrent(calcType, calcP, calcU, calcCos);
    setCalcResult(res);
  };

  const toggleExerciseReveal = (id: string) => {
    setRevealedExercises((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ─────────────────────────────────────────────
  // Copiar examen
  // ─────────────────────────────────────────────
  const formattedExamText = useMemo(() => {
    const questionsToExport = examIncludeExtras
      ? ALL_QUESTIONS.map((q) => ({ ...q, isExtra: q.kind === "extra" }))
      : ORIGINAL_QUESTIONS.map((q) => ({ ...q, isExtra: false }));

    return questionsToExport
      .map((q) => {
        const prefix = q.isExtra ? `EXTRA ${q.n}. ` : `${q.n}. `;
        const figureNote = q.needsFigure
          ? " [Nota: enunciado asociado a esquema técnico del documento original.]"
          : "";
        const optionsText = q.o.length
          ? "\n" + q.o.map((opt, i) => `   ${String.fromCharCode(65 + i)}) ${opt}`).join("\n")
          : "";
        return `${prefix}${q.q}${figureNote}${optionsText}`;
      })
      .join("\n\n");
  }, [examIncludeExtras]);

  const handleCopyExamText = async () => {
    try {
      await navigator.clipboard.writeText(formattedExamText);
      setCopyFeedback("✓ Cuestionario copiado al portapapeles con éxito.");
      setTimeout(() => setCopyFeedback(""), 4000);
    } catch {
      setCopyFeedback("Selecciona el texto inferior y pulsa Ctrl/Cmd+C para copiar.");
      setTimeout(() => setCopyFeedback(""), 4000);
    }
  };

  // Cierre de sesión local en navegador
  const handleLogout = () => {
    clearAccessUnlocked();
    if (onLock) {
      onLock();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen text-ink pb-20">
      {/* Estilos para animación de confetti */}
      <style jsx global>{`
        @keyframes fall {
          to {
            transform: translateY(105vh) rotate(720deg);
            opacity: 0.2;
          }
        }
      `}</style>

      {/* Barra de cabecera dedicada */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleGoTab("home")}
              className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-85 cursor-pointer"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-volt font-mono text-sm font-black text-bg shadow-[0_0_16px_rgba(206,255,0,0.3)]">
                BT
              </span>
              <div>
                <b className="font-display text-sm tracking-tight text-ink sm:text-base">
                  REDES BT · UF0894
                </b>
                <span className="block font-mono text-[10px] text-muted">
                  Certificado ELEE0109 · ZimplifAI
                </span>
              </div>
            </button>
          </div>

          {/* Selector de módulos / Pestañas de navegación */}
          <nav className="hidden md:flex items-center gap-1 rounded-2xl border border-line bg-surface p-1 text-xs font-medium">
            <button
              onClick={() => handleGoTab("home")}
              className={`rounded-xl px-3.5 py-1.5 transition-colors cursor-pointer ${
                currentTab === "home"
                  ? "bg-volt text-bg font-bold shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              Inicio
            </button>
            <button
              onClick={() => handleGoTab("game")}
              className={`rounded-xl px-3.5 py-1.5 transition-colors cursor-pointer ${
                currentTab === "game"
                  ? "bg-volt text-bg font-bold shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              🎮 Desafío
            </button>
            <button
              onClick={() => handleGoTab("study")}
              className={`rounded-xl px-3.5 py-1.5 transition-colors cursor-pointer ${
                currentTab === "study"
                  ? "bg-volt text-bg font-bold shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              📚 Estudio (63)
            </button>
            <button
              onClick={() => handleGoTab("lab")}
              className={`rounded-xl px-3.5 py-1.5 transition-colors cursor-pointer ${
                currentTab === "lab"
                  ? "bg-volt text-bg font-bold shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              🧮 Laboratorio
            </button>
            <button
              onClick={() => handleGoTab("export")}
              className={`rounded-xl px-3.5 py-1.5 transition-colors cursor-pointer ${
                currentTab === "export"
                  ? "bg-volt text-bg font-bold shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              📝 Examen
            </button>
          </nav>

          {/* Botones auxiliares de cabecera */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              aria-label="Silenciar o activar sonidos"
              className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-xs text-muted hover:text-ink hover:border-line-strong transition-colors cursor-pointer"
              title={soundEnabled ? "Sonido activado" : "Sonido silenciado"}
            >
              {soundEnabled ? "🔔" : "🔕"}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-mono text-muted hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
              title="Cerrar sesión protegida"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Bloquear</span>
            </button>
          </div>
        </div>

        {/* Barra móvil de pestañas */}
        <div className="flex md:hidden border-t border-line overflow-x-auto px-4 py-2 gap-1.5 text-xs font-medium">
          <button
            onClick={() => handleGoTab("home")}
            className={`shrink-0 rounded-lg px-3 py-1.5 ${
              currentTab === "home" ? "bg-volt text-bg font-bold" : "text-muted bg-surface"
            }`}
          >
            Inicio
          </button>
          <button
            onClick={() => handleGoTab("game")}
            className={`shrink-0 rounded-lg px-3 py-1.5 ${
              currentTab === "game" ? "bg-volt text-bg font-bold" : "text-muted bg-surface"
            }`}
          >
            🎮 Desafío
          </button>
          <button
            onClick={() => handleGoTab("study")}
            className={`shrink-0 rounded-lg px-3 py-1.5 ${
              currentTab === "study" ? "bg-volt text-bg font-bold" : "text-muted bg-surface"
            }`}
          >
            📚 Repaso
          </button>
          <button
            onClick={() => handleGoTab("lab")}
            className={`shrink-0 rounded-lg px-3 py-1.5 ${
              currentTab === "lab" ? "bg-volt text-bg font-bold" : "text-muted bg-surface"
            }`}
          >
            🧮 Laboratorio
          </button>
          <button
            onClick={() => handleGoTab("export")}
            className={`shrink-0 rounded-lg px-3 py-1.5 ${
              currentTab === "export" ? "bg-volt text-bg font-bold" : "text-muted bg-surface"
            }`}
          >
            📝 Examen
          </button>
        </div>
      </header>

      {/* Contenedor principal de la experiencia */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
        {/* ─────────────────────────────────────────────
            VISTA 1: HOME (Dashboard)
            ───────────────────────────────────────────── */}
        {currentTab === "home" && (
          <section className="space-y-12">
            <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-8 items-center pt-4 sm:pt-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/10 px-3.5 py-1 text-xs font-mono font-bold text-volt">
                  <span>CERTIFICADO ELEE0109</span>
                  <span>·</span>
                  <span>UNIDAD FORMATIVA 0894</span>
                </div>
                <h1 className="mt-4 font-display text-4xl sm:text-6xl font-bold tracking-tight text-ink leading-[1.1]">
                  Domina las redes subterráneas
                </h1>
                <p className="mt-5 text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
                  Monta, repasa y calcula. Espacio de trabajo interactivo basado en el temario
                  oficial de montaje y mantenimiento de redes subterráneas de baja tensión.
                </p>
                <div className="mt-7 flex flex-wrap gap-2.5 font-mono text-xs text-muted">
                  <span className="rounded-xl border border-line bg-surface px-3.5 py-2 text-ink">
                    ⚡ 63 preguntas originales
                  </span>
                  <span className="rounded-xl border border-line bg-surface px-3.5 py-2 text-ink">
                    🧮 14 casos de cálculo
                  </span>
                  <span className="rounded-xl border border-line bg-surface px-3.5 py-2 text-ink">
                    🎯 20 preguntas extra
                  </span>
                </div>
              </div>

              {/* Tarjeta de Progreso */}
              <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-7 sm:p-8 backdrop-blur-xl">
                <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-volt/15 blur-3xl" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
                  Tu progreso de sesión
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-black text-ink">{userScore}</span>
                  <span className="font-mono text-sm text-volt font-bold">pts acumulados</span>
                </div>

                <div className="mt-6">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2 border border-line">
                    <div
                      className="h-full bg-gradient-to-r from-plasma to-volt transition-all duration-500"
                      style={{
                        width: `${userTotal > 0 ? Math.min(100, Math.round((userCorrect / userTotal) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2.5 flex justify-between font-mono text-xs text-muted">
                    <span>Aciertos en juego</span>
                    <span className="text-ink font-semibold">
                      {userCorrect} / {userTotal} {userTotal > 0 ? `(${Math.round((userCorrect / userTotal) * 100)}%)` : ""}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleGoTab("game")}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-volt py-3.5 px-6 font-display text-sm font-bold text-bg transition-transform hover:scale-[1.02] cursor-pointer shadow-[0_0_20px_rgba(206,255,0,0.25)]"
                >
                  <span>▶ Empezar partida</span>
                </button>
              </div>
            </div>

            {/* Accesos rápidos a los 4 modos */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => handleGoTab("game")}
                className="group rounded-2xl border border-line bg-surface p-6 text-left transition-all hover:border-volt/50 hover:bg-surface-2 cursor-pointer"
              >
                <span className="text-3xl">🎮</span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink group-hover:text-volt transition-colors">
                  Modo juego
                </h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Reto contrarreloj con racha, multiplicadores y evaluación instantánea.
                </p>
              </button>

              <button
                onClick={() => handleGoTab("study")}
                className="group rounded-2xl border border-line bg-surface p-6 text-left transition-all hover:border-plasma/50 hover:bg-surface-2 cursor-pointer"
              >
                <span className="text-3xl">📚</span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink group-hover:text-plasma transition-colors">
                  Estudio y repaso
                </h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Banco completo de 63 preguntas originales con soluciones y notas explicativas.
                </p>
              </button>

              <button
                onClick={() => handleGoTab("lab")}
                className="group rounded-2xl border border-line bg-surface p-6 text-left transition-all hover:border-volt/50 hover:bg-surface-2 cursor-pointer"
              >
                <span className="text-3xl">🧮</span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink group-hover:text-volt transition-colors">
                  Laboratorio
                </h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  14 ejercicios prácticos resueltos paso a paso y calculadora de intensidad.
                </p>
              </button>

              <button
                onClick={() => handleGoTab("export")}
                className="group rounded-2xl border border-line bg-surface p-6 text-left transition-all hover:border-plasma/50 hover:bg-surface-2 cursor-pointer"
              >
                <span className="text-3xl">📝</span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink group-hover:text-plasma transition-colors">
                  Copiar examen
                </h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Preguntas limpias para evaluaciones o impresión sin respuestas marcadas.
                </p>
              </button>
            </div>

            {/* Banner de ruta pedagógica */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-line bg-gradient-to-r from-surface to-surface-2 p-6 sm:p-8">
              <div>
                <b className="font-display text-lg font-bold text-ink">Ruta recomendada de formación</b>
                <p className="mt-1 text-sm text-muted">
                  Revisa los conceptos clave en el banco de estudio, resuelve los ejercicios de caída de
                  tensión en el laboratorio y ponte a prueba en el modo contrarreloj.
                </p>
              </div>
              <button
                onClick={() => handleGoTab("study")}
                className="shrink-0 rounded-xl bg-plasma px-5 py-3 font-display text-sm font-bold text-bg hover:opacity-90 transition-opacity cursor-pointer"
              >
                Ir al banco de estudio →
              </button>
            </div>
          </section>
        )}

        {/* ─────────────────────────────────────────────
            VISTA 2: DESAFÍO / MODO JUEGO
            ───────────────────────────────────────────── */}
        {currentTab === "game" && (
          <section className="max-w-3xl mx-auto">
            {gamePhase === "setup" && (
              <div className="rounded-3xl border border-line bg-surface p-7 sm:p-10 shadow-2xl">
                <button
                  onClick={() => handleGoTab("home")}
                  className="font-mono text-xs text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  ← Volver al menú
                </button>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/10 px-3 py-1 font-mono text-xs font-bold text-volt">
                  DESAFÍO CONTRARRELOJ
                </div>
                <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-ink">
                  ¿Cuánto sabes de redes BT?
                </h2>
                <p className="mt-3 text-sm text-muted leading-relaxed">
                  Preguntas tipo test verificadas en el temario técnico. Tienes 20 segundos por
                  pregunta: la rapidez suma puntos extra a tu racha de aciertos.
                </p>

                <div className="mt-8 grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-line bg-surface-2 p-4">
                    <label className="block font-mono text-xs text-muted uppercase">
                      Número de preguntas
                    </label>
                    <select
                      value={gameLength}
                      onChange={(e) => setGameLength(Number(e.target.value))}
                      className="mt-2 w-full rounded-xl border border-line bg-surface p-3 font-mono text-sm text-ink focus:border-volt focus:outline-none"
                    >
                      <option value={10}>10 preguntas rápidas</option>
                      <option value={20}>20 preguntas (estándar)</option>
                      <option value={0}>Todas las disponibles ({ALL_QUESTIONS.filter((q) => q.a !== null).length})</option>
                    </select>
                  </div>

                  <div className="rounded-2xl border border-line bg-surface-2 p-4">
                    <label className="block font-mono text-xs text-muted uppercase">
                      Temática
                    </label>
                    <select
                      value={gameTopic}
                      onChange={(e) => setGameTopic(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-line bg-surface p-3 font-mono text-sm text-ink focus:border-volt focus:outline-none"
                    >
                      <option value="all">Todas las temáticas</option>
                      {allTopics.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={startQuiz}
                  className="mt-6 w-full rounded-2xl bg-volt py-4 font-display text-base font-bold text-bg transition-transform hover:scale-[1.01] cursor-pointer shadow-[0_0_20px_rgba(206,255,0,0.3)]"
                >
                  Comenzar partida
                </button>
              </div>
            )}

            {gamePhase === "play" && gameQuestions.length > 0 && (
              <div className="space-y-6">
                {/* Cabecera del juego */}
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <button
                    onClick={handleLeaveGame}
                    className="font-mono text-xs text-muted hover:text-ink cursor-pointer"
                  >
                    ← Salir de la partida
                  </button>
                  <div className="flex items-center gap-3 font-mono text-xs font-bold">
                    <span className="rounded-xl border border-volt/30 bg-volt/10 px-3 py-1.5 text-volt">
                      🔥 Racha {gameStreak}
                    </span>
                    <span className="rounded-xl border border-plasma/30 bg-plasma/10 px-3 py-1.5 text-plasma">
                      ⭐ {gameScore} pts
                    </span>
                  </div>
                </div>

                {/* Marcadores de tiempo y avance */}
                <div>
                  <div className="flex justify-between font-mono text-xs text-muted">
                    <span>
                      Pregunta {currentIndex + 1} de {gameQuestions.length}
                    </span>
                    <span className={timerSeconds <= 5 ? "font-bold text-rose-400 animate-pulse" : "text-ink"}>
                      ⏱ {timerSeconds} s
                    </span>
                  </div>

                  {/* Barra de tiempo de pregunta */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface border border-line">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        timerSeconds <= 5 ? "bg-rose-500" : "bg-gradient-to-r from-plasma to-volt"
                      }`}
                      style={{ width: `${(timerSeconds / 20) * 100}%` }}
                    />
                  </div>

                  {/* Progreso del cuestionario */}
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full bg-volt/60 transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / gameQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Tarjeta de pregunta */}
                <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-plasma">
                    {gameQuestions[currentIndex].kind === "extra"
                      ? `EXTRA ${gameQuestions[currentIndex].n}`
                      : `ORIGINAL ${gameQuestions[currentIndex].n}`}{" "}
                    · {gameQuestions[currentIndex].t}
                  </span>
                  <h3 className="mt-3 font-display text-xl sm:text-2xl font-bold text-ink leading-snug">
                    {gameQuestions[currentIndex].q}
                  </h3>

                  {/* Opciones */}
                  <div className="mt-6 space-y-3">
                    {gameQuestions[currentIndex].o.map((opt, i) => {
                      const isCorrect = i === gameQuestions[currentIndex].a;
                      const isSelected = selectedOption === i;

                      let btnStyle = "border-line bg-surface-2 text-ink hover:border-volt/50";
                      if (isAnswered) {
                        if (isCorrect) {
                          btnStyle = "border-emerald-500/80 bg-emerald-500/20 text-emerald-200 font-bold";
                        } else if (isSelected) {
                          btnStyle = "border-rose-500/80 bg-rose-500/20 text-rose-200 font-bold";
                        } else {
                          btnStyle = "border-line/40 bg-surface/40 text-muted opacity-50";
                        }
                      }

                      return (
                        <button
                          key={i}
                          disabled={isAnswered}
                          onClick={() => handleAnswerChoice(i)}
                          className={`flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all ${btnStyle} cursor-pointer disabled:cursor-default`}
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface border border-line font-mono text-xs font-bold text-muted">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-sm font-medium leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Retroalimentación */}
                  {feedbackText && (
                    <div className="mt-6 rounded-2xl border border-line bg-surface-2 p-4 text-sm leading-relaxed text-ink">
                      <p>{feedbackText}</p>
                    </div>
                  )}

                  {/* Botón siguiente pregunta */}
                  {isAnswered && (
                    <button
                      onClick={handleNextQuestion}
                      className="mt-6 w-full rounded-2xl bg-volt py-3.5 font-display text-sm font-bold text-bg transition-transform hover:scale-[1.01] cursor-pointer"
                    >
                      {currentIndex + 1 >= gameQuestions.length ? "Ver resultados finales →" : "Siguiente pregunta →"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {gamePhase === "end" && (
              <div className="rounded-3xl border border-line bg-surface p-8 sm:p-12 text-center shadow-2xl">
                <div className="text-5xl">🏆</div>
                <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-ink">
                  ¡Partida completada!
                </h2>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-line bg-surface-2 p-4">
                    <span className="font-mono text-xs text-muted">Puntos</span>
                    <div className="mt-1 font-display text-2xl sm:text-3xl font-bold text-volt">
                      {gameScore}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-line bg-surface-2 p-4">
                    <span className="font-mono text-xs text-muted">Aciertos</span>
                    <div className="mt-1 font-display text-2xl sm:text-3xl font-bold text-ink">
                      {gameCorrectCount} / {gameQuestions.length}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-line bg-surface-2 p-4">
                    <span className="font-mono text-xs text-muted">Mejor racha</span>
                    <div className="mt-1 font-display text-2xl sm:text-3xl font-bold text-plasma">
                      {sessionBestStreak}
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-sm text-muted max-w-md mx-auto">
                  {gameCorrectCount === gameQuestions.length
                    ? "¡Puntuación perfecta! Dominas la normativa y los criterios técnicos de redes subterráneas."
                    : gameCorrectCount >= gameQuestions.length * 0.7
                    ? "¡Muy buen resultado! Revisa los conceptos que te han hecho dudar en el banco de estudio."
                    : "Un buen repaso a las preguntas con explicación te ayudará a afianzar los conceptos clave."}
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={startQuiz}
                    className="rounded-2xl bg-volt px-6 py-3 font-display text-sm font-bold text-bg transition-transform hover:scale-[1.02] cursor-pointer"
                  >
                    Jugar otra vez
                  </button>
                  <button
                    onClick={() => handleGoTab("study")}
                    className="rounded-2xl border border-line bg-surface-2 px-6 py-3 font-display text-sm font-semibold text-ink hover:border-line-strong transition-colors cursor-pointer"
                  >
                    Revisar banco de preguntas
                  </button>
                  <button
                    onClick={() => handleGoTab("home")}
                    className="rounded-2xl border border-line bg-surface px-6 py-3 font-display text-sm font-semibold text-muted hover:text-ink transition-colors cursor-pointer"
                  >
                    Volver al menú
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ─────────────────────────────────────────────
            VISTA 3: BANCO DE ESTUDIO Y REPASO
            ───────────────────────────────────────────── */}
        {currentTab === "study" && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line pb-6">
              <div>
                <button
                  onClick={() => handleGoTab("home")}
                  className="font-mono text-xs text-muted hover:text-ink cursor-pointer"
                >
                  ← Menú principal
                </button>
                <div className="mt-3 inline-flex items-center gap-2 font-mono text-xs font-bold text-plasma">
                  BANCO DE PREGUNTAS Y SOLUCIONARIO
                </div>
                <h2 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-ink">
                  Estudio y autoevaluación
                </h2>
                <p className="mt-1 text-sm text-muted">
                  63 preguntas del documento original y 20 preguntas extra con justificación técnica y
                  número de página.
                </p>
              </div>

              <button
                onClick={() => handleGoTab("export")}
                className="shrink-0 rounded-2xl bg-volt px-4 py-2.5 font-display text-xs font-bold text-bg hover:opacity-90 cursor-pointer"
              >
                Copiar formato examen →
              </button>
            </div>

            {/* Barra de filtros y búsqueda */}
            <div className="grid sm:grid-cols-[1fr_220px_180px] gap-3">
              <input
                type="text"
                placeholder="Buscar por concepto, zanja, ITC, neutro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:border-volt focus:outline-none"
              />

              <select
                value={studyTopic}
                onChange={(e) => setStudyTopic(e.target.value)}
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink focus:border-volt focus:outline-none font-mono text-xs"
              >
                <option value="all">Todas las temáticas</option>
                {allTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>

              <select
                value={studyKind}
                onChange={(e) => setStudyKind(e.target.value as QuestionKind)}
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink focus:border-volt focus:outline-none font-mono text-xs"
              >
                <option value="all">Originales y extras</option>
                <option value="original">Solo originales (63)</option>
                <option value="extra">Solo extras (20)</option>
              </select>
            </div>

            {/* Barra de conteo y expandir todo */}
            <div className="flex items-center justify-between font-mono text-xs text-muted pt-2">
              <span>
                {filteredStudyQuestions.length} pregunta
                {filteredStudyQuestions.length === 1 ? "" : "s"} encontradas
              </span>
              <button
                onClick={handleToggleExpandAll}
                className="text-volt hover:underline cursor-pointer"
              >
                {expandAllAnswers ? "Ocultar todas las respuestas" : "Mostrar todas las respuestas"}
              </button>
            </div>

            {/* Parrilla de tarjetas de preguntas */}
            <div className="grid lg:grid-cols-2 gap-4">
              {filteredStudyQuestions.map((q) => {
                const cardKey = `q_${q.n}`;
                const isRevealed = revealedCards[cardKey] ?? expandAllAnswers;

                return (
                  <article
                    key={cardKey}
                    className="flex flex-col justify-between rounded-3xl border border-line bg-surface p-6 transition-colors hover:border-line-strong"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
                        <span
                          className={`font-mono text-xs font-bold ${
                            q.kind === "extra" ? "text-plasma" : "text-volt"
                          }`}
                        >
                          {q.kind === "extra" ? `EXTRA ${q.n}` : `ORIGINAL ${q.n}`} · {q.t}
                        </span>
                        <span className="font-mono text-[11px] text-muted">pág. {q.p}</span>
                      </div>

                      <h3 className="mt-3 font-display text-base font-bold text-ink leading-snug">
                        {q.q}
                      </h3>

                      {q.o.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {q.o.map((opt, j) => (
                            <div
                              key={j}
                              className="flex items-start gap-2.5 rounded-xl border border-line/60 bg-surface-2 p-2.5 text-xs text-ink/90 leading-relaxed"
                            >
                              <span className="font-mono font-bold text-muted">
                                {String.fromCharCode(65 + j)}.
                              </span>
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-line">
                      <button
                        onClick={() => toggleCardReveal(cardKey)}
                        className="rounded-xl border border-volt/30 bg-volt/10 px-3.5 py-2 font-mono text-xs font-bold text-volt hover:bg-volt/20 transition-colors cursor-pointer"
                      >
                        {isRevealed ? "Ocultar respuesta" : "Ver respuesta y explicación"}
                      </button>

                      {isRevealed && (
                        <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs leading-relaxed text-emerald-200">
                          <b className="block text-emerald-300 font-bold mb-1">
                            {q.a === null
                              ? "Estado / Sin clave única en documento"
                              : `Solución: ${String.fromCharCode(65 + q.a)}. ${q.o[q.a]}`}
                          </b>
                          <p className="text-ink/80 mt-1">{q.x}</p>
                          <p className="mt-2 font-mono text-[10px] text-plasma">
                            Fuente: UF0894, pág. {q.p}.{" "}
                            {q.needsFigure ? "Ejercicio gráfico del PDF original." : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}

              {filteredStudyQuestions.length === 0 && (
                <div className="lg:col-span-2 rounded-3xl border border-line bg-surface p-12 text-center text-muted">
                  No se encontraron preguntas con los filtros seleccionados. Prueba a modificar el texto de búsqueda.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─────────────────────────────────────────────
            VISTA 4: LABORATORIO DE EJERCICIOS Y CÁLCULO
            ───────────────────────────────────────────── */}
        {currentTab === "lab" && (
          <section className="space-y-6">
            <div className="border-b border-line pb-6">
              <button
                onClick={() => handleGoTab("home")}
                className="font-mono text-xs text-muted hover:text-ink cursor-pointer"
              >
                ← Menú principal
              </button>
              <div className="mt-3 inline-flex items-center gap-2 font-mono text-xs font-bold text-volt">
                APLICA EL CÁLCULO TÉCNICO
              </div>
              <h2 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-ink">
                Laboratorio de ejercicios
              </h2>
              <p className="mt-1 text-sm text-muted max-w-3xl">
                14 casos prácticos resueltos del certificado UF0894: cálculo de intensidad, sección por
                caída de tensión monofásica y trifásica, y verificación de intensidad admisible.
              </p>
            </div>

            <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
              {/* Lista de 14 ejercicios */}
              <div className="space-y-4">
                {EXERCISES.map((ex) => {
                  const exKey = `ex_${ex.id}`;
                  const isRevealed = revealedExercises[exKey] ?? false;

                  return (
                    <article
                      key={exKey}
                      className="rounded-3xl border border-line bg-surface p-6 transition-colors hover:border-line-strong"
                    >
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <div>
                          <span className="font-mono text-xs font-bold text-volt">
                            {ex.id} · {ex.topic}
                          </span>
                          <h3 className="mt-1 font-display text-lg font-bold text-ink">
                            {ex.title}
                          </h3>
                        </div>
                        <span className="font-mono text-xs text-muted">pág. {ex.page}</span>
                      </div>

                      <div className="mt-3 rounded-2xl border border-line/60 bg-surface-2 p-3.5 font-mono text-xs text-ink/90">
                        {ex.data}
                      </div>

                      <div className="mt-4">
                        <button
                          onClick={() => toggleExerciseReveal(exKey)}
                          className="rounded-xl border border-plasma/30 bg-plasma/10 px-3.5 py-2 font-mono text-xs font-bold text-plasma hover:bg-plasma/20 transition-colors cursor-pointer"
                        >
                          {isRevealed ? "Ocultar resolución" : "Ver resolución paso a paso"}
                        </button>

                        {isRevealed && (
                          <div className="mt-4 rounded-2xl border border-line bg-surface-2 p-4 text-xs space-y-3">
                            <ol className="list-decimal pl-5 space-y-2 text-ink/90 leading-relaxed">
                              {ex.steps.map((step, sIdx) => (
                                <li key={sIdx}>{step}</li>
                              ))}
                            </ol>
                            <div className="rounded-xl border border-volt/30 bg-volt/10 p-3 font-mono font-bold text-volt">
                              Resultado del documento: {ex.answer}
                            </div>
                            <span className="block font-mono text-[10px] text-muted">
                              Fuente: Documento oficial UF0894, página {ex.page}.
                            </span>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Calculadora rápida lateral */}
              <aside className="rounded-3xl border border-line bg-surface p-6 sticky top-20 shadow-xl space-y-5">
                <div className="border-b border-line pb-4">
                  <span className="font-mono text-xs font-bold text-volt uppercase tracking-wider">
                    Calculadora rápida
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold text-ink">
                    Intensidad de línea
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Calcula la corriente a partir de la potencia activa P, tensión U y cos φ.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setCalcType("mono");
                      setCalcResult(computeCurrent("mono", calcP, calcU, calcCos));
                    }}
                    className={`rounded-xl py-2 font-mono text-xs font-bold transition-colors cursor-pointer ${
                      calcType === "mono"
                        ? "bg-volt text-bg shadow-sm"
                        : "border border-line bg-surface-2 text-muted hover:text-ink"
                    }`}
                  >
                    Monofásica (230 V)
                  </button>
                  <button
                    onClick={() => {
                      setCalcType("tri");
                      setCalcResult(computeCurrent("tri", calcP, calcU, calcCos));
                    }}
                    className={`rounded-xl py-2 font-mono text-xs font-bold transition-colors cursor-pointer ${
                      calcType === "tri"
                        ? "bg-volt text-bg shadow-sm"
                        : "border border-line bg-surface-2 text-muted hover:text-ink"
                    }`}
                  >
                    Trifásica (400 V)
                  </button>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-muted">Potencia P (kW)</label>
                    <input
                      type="number"
                      value={calcP}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCalcP(val);
                        setCalcResult(computeCurrent(calcType, val, calcU, calcCos));
                      }}
                      className="mt-1 w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink focus:border-volt focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-muted">Tensión U (V)</label>
                    <input
                      type="number"
                      value={calcU}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCalcU(val);
                        setCalcResult(computeCurrent(calcType, calcP, val, calcCos));
                      }}
                      className="mt-1 w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink focus:border-volt focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-muted">Factor de potencia (cos φ)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      max="1.0"
                      value={calcCos}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCalcCos(val);
                        setCalcResult(computeCurrent(calcType, calcP, calcU, val));
                      }}
                      className="mt-1 w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink focus:border-volt focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCalculateI}
                  className="w-full rounded-2xl bg-plasma py-3 font-display text-xs font-bold text-bg transition-opacity hover:opacity-90 cursor-pointer"
                >
                  Recalcular intensidad
                </button>

                <div className="rounded-2xl border border-volt/30 bg-volt/10 p-4 text-center font-mono text-lg font-bold text-volt">
                  {calcResult}
                </div>

                <div className="rounded-xl border border-line bg-surface-2 p-3 font-mono text-[11px] text-muted space-y-1">
                  <div>• Monofásica: I = P / (U · cos φ)</div>
                  <div>• Trifásica: I = P / (√3 · U · cos φ)</div>
                </div>
              </aside>
            </div>
          </section>
        )}

        {/* ─────────────────────────────────────────────
            VISTA 5: MATERIAL PARA EXAMEN / EXPORTACIÓN
            ───────────────────────────────────────────── */}
        {currentTab === "export" && (
          <section className="space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-line pb-6">
              <button
                onClick={() => handleGoTab("home")}
                className="font-mono text-xs text-muted hover:text-ink cursor-pointer"
              >
                ← Menú principal
              </button>
              <div className="mt-3 inline-flex items-center gap-2 font-mono text-xs font-bold text-plasma">
                MATERIAL DOCENTE PARA EVALUACIÓN
              </div>
              <h2 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-ink">
                Copia para cuestionario de examen
              </h2>
              <p className="mt-1 text-sm text-muted">
                Enunciados y opciones listos para copiar y pegar en herramientas docentes, Moodle o papel,
                sin respuestas ni explicaciones reveladas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setExamIncludeExtras(false)}
                className={`rounded-2xl px-5 py-3 font-display text-xs font-bold transition-colors cursor-pointer ${
                  !examIncludeExtras
                    ? "bg-volt text-bg shadow-sm"
                    : "border border-line bg-surface text-muted hover:text-ink"
                }`}
              >
                Solo preguntas originales (63)
              </button>
              <button
                onClick={() => setExamIncludeExtras(true)}
                className={`rounded-2xl px-5 py-3 font-display text-xs font-bold transition-colors cursor-pointer ${
                  examIncludeExtras
                    ? "bg-volt text-bg shadow-sm"
                    : "border border-line bg-surface text-muted hover:text-ink"
                }`}
              >
                Originales + preguntas extra (83)
              </button>
              <button
                onClick={handleCopyExamText}
                className="rounded-2xl bg-plasma px-5 py-3 font-display text-xs font-bold text-bg hover:opacity-90 transition-opacity cursor-pointer"
              >
                Copiar al portapapeles
              </button>
              {copyFeedback && (
                <span className="font-mono text-xs text-volt animate-fade-in">
                  {copyFeedback}
                </span>
              )}
            </div>

            <textarea
              readOnly
              value={formattedExamText}
              className="w-full min-h-[500px] rounded-3xl border border-line bg-surface p-6 font-mono text-xs leading-relaxed text-ink focus:outline-none"
            />

            <div className="rounded-2xl border border-line bg-surface-2 p-4 font-mono text-xs text-muted">
              Incluye la numeración oficial y las opciones ordenadas por letras A, B, C, D con anotación
              en preguntas dependientes de esquemas gráficos originales.
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
