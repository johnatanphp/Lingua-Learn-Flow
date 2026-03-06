import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useLesson, useAddXp } from "@/hooks/use-learning";
import { motion } from "framer-motion";
import { X, Check, Heart, Volume2 } from "lucide-react";
import { GamifiedButton } from "@/components/gamified-button";
import confetti from "canvas-confetti";

export default function Lesson() {
  const [, params] = useRoute("/lesson/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");
  
  const { data: lesson, isLoading } = useLesson(id);
  const { mutate: addXp, isPending } = useAddXp();

  const [step, setStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Mocking questions since schema just has `content` text field
  const questions = [
    { text: "Translate: 'The apple is red'", options: ["La manzana es roja", "El gato es azul", "El perro es grande"], correct: 0 },
    { text: "Select the correct meaning of 'Hola'", options: ["Goodbye", "Hello", "Please"], correct: 1 },
    { text: "Which word means 'Water'?", options: ["Pan", "Leche", "Agua"], correct: 2 },
  ];

  const currentQ = questions[step];

  const handleCheck = () => {
    if (selectedAnswer === currentQ.correct) {
      setIsCorrect(true);
      // Play a happy sound here normally
    } else {
      setIsCorrect(false);
      // Play a sad sound here normally
    }
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(s => s + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      // Complete lesson
      setIsComplete(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#eab308', '#22c55e']
      });
      // Add XP (e.g. 15 XP per lesson)
      addXp(15);
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-12 w-12 border-b-4 border-primary rounded-full" /></div>;
  if (!lesson) return <div className="h-screen flex items-center justify-center">Lesson not found</div>;

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-8 max-w-md w-full"
        >
          <div className="w-32 h-32 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-accent">
            <Heart className="w-16 h-16 fill-current" />
          </div>
          <h1 className="text-4xl font-display font-black text-foreground">Lesson Complete!</h1>
          <div className="bg-card border-2 border-border p-6 rounded-3xl font-bold text-xl flex justify-between items-center">
            <span>XP Earned:</span>
            <span className="text-primary">+15 XP</span>
          </div>
          
          <GamifiedButton 
            fullWidth 
            size="lg" 
            onClick={() => setLocation("/path")}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Continue"}
          </GamifiedButton>
        </motion.div>
      </div>
    );
  }

  const progress = ((step) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="h-20 flex items-center px-4 md:px-8 gap-6 max-w-4xl mx-auto w-full">
        <button onClick={() => setLocation("/path")} className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden relative">
          <motion.div 
            className="absolute top-0 bottom-0 left-0 bg-success rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50 }}
          >
            <div className="absolute inset-0 bg-white/20 h-1/3"></div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 md:p-8">
        <h2 className="text-3xl font-display font-bold mb-8 text-foreground">
          {currentQ.text}
        </h2>
        
        <div className="space-y-4">
          {currentQ.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => isCorrect === null && setSelectedAnswer(i)}
              className={`
                w-full text-left p-6 rounded-2xl border-2 font-bold text-lg transition-all duration-200
                ${isCorrect !== null && i === currentQ.correct ? "bg-success/10 border-success text-success" : ""}
                ${isCorrect === false && selectedAnswer === i ? "bg-destructive/10 border-destructive text-destructive" : ""}
                ${selectedAnswer === i && isCorrect === null ? "bg-primary/10 border-primary text-primary shadow-sm -translate-y-1 border-b-4" : ""}
                ${selectedAnswer !== i && isCorrect === null ? "bg-card border-border hover:bg-muted hover:border-border/80" : ""}
              `}
            >
              {opt}
            </button>
          ))}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className={`
        border-t-2 p-6 transition-colors duration-300
        ${isCorrect === true ? "bg-success/10 border-success" : ""}
        ${isCorrect === false ? "bg-destructive/10 border-destructive" : ""}
        ${isCorrect === null ? "bg-card border-border" : ""}
      `}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            {isCorrect === true && (
              <div className="flex items-center gap-3 text-success font-bold text-xl">
                <div className="bg-success text-white p-2 rounded-full"><Check className="w-6 h-6" /></div>
                Excellent!
              </div>
            )}
            {isCorrect === false && (
              <div className="flex items-center gap-3 text-destructive font-bold text-xl">
                <div className="bg-destructive text-white p-2 rounded-full"><X className="w-6 h-6" /></div>
                Correct answer: {currentQ.options[currentQ.correct]}
              </div>
            )}
          </div>

          <div className="min-w-[150px]">
            {isCorrect === null ? (
              <GamifiedButton 
                fullWidth 
                size="lg" 
                disabled={selectedAnswer === null}
                onClick={handleCheck}
              >
                Check
              </GamifiedButton>
            ) : (
              <GamifiedButton 
                fullWidth 
                size="lg" 
                variant={isCorrect ? "success" : "destructive"}
                onClick={handleNext}
              >
                Continue
              </GamifiedButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
