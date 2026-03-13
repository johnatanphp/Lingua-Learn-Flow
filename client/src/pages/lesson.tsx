import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useLesson, useAddXp } from "@/hooks/use-learning";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Zap } from "lucide-react";
import { GamifiedButton } from "@/components/gamified-button";
import confetti from "canvas-confetti";

// Question bank based on lesson type
function getQuestions(lessonType: string, lessonTitle: string) {
  const banks: Record<string, { text: string; options: string[]; correct: number }[]> = {
    conversation: [
      { text: "¿Cómo se dice 'Good morning' en español?", options: ["Buenas noches", "Buenos días", "Buenas tardes"], correct: 1 },
      { text: "Selecciona la respuesta correcta para 'Hola, ¿cómo estás?'", options: ["Muy bien, ¿y tú?", "Me llamo Juan", "Hasta luego"], correct: 0 },
      { text: "¿Qué frase se usa para despedirse?", options: ["¡Buenos días!", "¿Cómo te llamas?", "¡Hasta pronto!"], correct: 2 },
      { text: "Traduce: 'Thank you very much'", options: ["Por favor", "Muchas gracias", "De nada"], correct: 1 },
    ],
    pronunciation: [
      { text: "¿Cuál de estas palabras tiene acento escrito?", options: ["casa", "árbol", "mesa"], correct: 1 },
      { text: "¿Cuántas sílabas tiene 'escuela'?", options: ["2", "3", "4"], correct: 1 },
      { text: "La letra 'ñ' suena como:", options: ["ny (como en 'canyon')", "n normal", "ng"], correct: 0 },
      { text: "¿Cuál es la pronunciación correcta de 'll'?", options: ["l doble", "y (como en 'yes')", "ll (como 'shall')" ], correct: 1 },
    ],
    reading: [
      { text: "'La manzana es roja.' ¿De qué color es la manzana?", options: ["Verde", "Amarilla", "Roja"], correct: 2 },
      { text: "¿Qué significa 'agua' en inglés?", options: ["Fire", "Water", "Earth"], correct: 1 },
      { text: "Completa: 'Me llamo Ana ___ tengo 10 años.'", options: ["o", "y", "pero"], correct: 1 },
      { text: "¿Cuál es el plural de 'niño'?", options: ["niños", "niñas", "niñoes"], correct: 0 },
    ],
  };

  return banks[lessonType] || banks.conversation;
}

export default function Lesson() {
  const [, params] = useRoute("/lesson/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");

  const { data: lesson, isLoading } = useLesson(id);
  const { mutate: addXp, isPending } = useAddXp();

  const [step, setStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const questions = lesson ? getQuestions(lesson.type, lesson.title) : [];
  const currentQ = questions[step];
  const progressPct = (step / (questions.length || 1)) * 100;
  const xpEarned = Math.round(10 + correctCount * 3);

  const handleCheck = () => {
    if (selectedAnswer === null) return;
    const correct = selectedAnswer === currentQ.correct;
    setIsCorrect(correct);
    if (correct) setCorrectCount((c) => c + 1);
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep((s) => s + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setIsComplete(true);
      confetti({ particleCount: 180, spread: 80, origin: { y: 0.55 }, colors: ["#7c3aed", "#eab308", "#22c55e"] });
      addXp(xpEarned);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-xl font-bold">Lección no encontrada</p>
        <GamifiedButton onClick={() => setLocation("/path")}>Volver al camino</GamifiedButton>
      </div>
    );
  }

  /* ── Completion Screen ── */
  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="text-center max-w-sm w-full space-y-6"
        >
          <div className="w-28 h-28 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto text-6xl shadow-2xl">
            🏆
          </div>
          <h1 className="text-4xl font-display font-black">¡Lección completa!</h1>
          <p className="text-muted-foreground text-base">
            Respondiste correctamente {correctCount} de {questions.length} preguntas.
          </p>

          <div className="bg-card border-2 border-border rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center text-base font-bold">
              <span>XP ganado</span>
              <span className="flex items-center gap-1.5 text-primary text-xl">
                <Zap className="w-5 h-5" />
                +{xpEarned} XP
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Respuestas correctas</span>
              <span className="font-bold text-success">{correctCount}/{questions.length}</span>
            </div>
          </div>

          <GamifiedButton
            fullWidth
            size="lg"
            onClick={() => setLocation("/path")}
            disabled={isPending}
            data-testid="btn-lesson-complete"
          >
            {isPending ? "Guardando..." : "Continuar →"}
          </GamifiedButton>
        </motion.div>
      </div>
    );
  }

  /* ── Lesson Screen ── */
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center px-4 md:px-8 gap-4 max-w-3xl mx-auto w-full">
        <button
          data-testid="btn-lesson-close"
          onClick={() => setLocation("/path")}
          className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative"
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 60 }}
          >
            <div className="absolute inset-0 bg-white/20 h-1/2 rounded-full" />
          </motion.div>
        </div>

        <span className="text-xs font-bold text-muted-foreground flex-shrink-0">
          {step + 1}/{questions.length}
        </span>
      </header>

      {/* Main Question */}
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 md:px-8 py-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          {lesson.title}
        </p>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-8 text-foreground leading-tight">
              {currentQ?.text}
            </h2>

            <div className="space-y-3">
              {currentQ?.options.map((opt, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrectOption = i === currentQ.correct;
                const revealed = isCorrect !== null;

                let style = "bg-card border-border hover:bg-muted hover:border-primary/40 cursor-pointer";
                if (revealed && isCorrectOption) style = "bg-success/10 border-success text-success cursor-default";
                else if (revealed && isSelected && !isCorrectOption) style = "bg-destructive/10 border-destructive text-destructive cursor-default";
                else if (!revealed && isSelected) style = "bg-primary/10 border-primary text-primary -translate-y-0.5 shadow-md border-b-4 cursor-pointer";

                return (
                  <button
                    key={i}
                    data-testid={`option-${i}`}
                    onClick={() => !revealed && setSelectedAnswer(i)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-semibold text-base transition-all duration-150 ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Action */}
      <div
        className={`border-t-2 px-4 py-5 transition-colors duration-300 ${
          isCorrect === true  ? "bg-success/10 border-success" :
          isCorrect === false ? "bg-destructive/10 border-destructive" :
          "bg-card border-border"
        }`}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="min-h-[36px]">
            {isCorrect === true && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-success font-bold text-lg">
                <div className="bg-success text-white p-1.5 rounded-full"><Check className="w-4 h-4" /></div>
                ¡Correcto!
              </motion.div>
            )}
            {isCorrect === false && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-destructive font-bold">
                <div className="bg-destructive text-white p-1.5 rounded-full"><X className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm">Respuesta correcta:</p>
                  <p>{currentQ?.options[currentQ?.correct]}</p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="shrink-0 min-w-[120px]">
            {isCorrect === null ? (
              <GamifiedButton
                fullWidth
                size="lg"
                disabled={selectedAnswer === null}
                onClick={handleCheck}
                data-testid="btn-check"
              >
                Comprobar
              </GamifiedButton>
            ) : (
              <GamifiedButton
                fullWidth
                size="lg"
                variant={isCorrect ? "success" : "destructive"}
                onClick={handleNext}
                data-testid="btn-next"
              >
                Continuar
              </GamifiedButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
