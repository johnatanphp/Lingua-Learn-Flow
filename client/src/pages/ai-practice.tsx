import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useGenerateExercise } from "@/hooks/use-ai";
import { Sparkles, Send, Bot, User as UserIcon, RotateCcw, Mic } from "lucide-react";
import { GamifiedButton } from "@/components/gamified-button";
import { motion, AnimatePresence } from "framer-motion";

const TOPICS_ES = [
  "Pedir comida en un restaurante",
  "Registrarse en un hotel",
  "Comprar en una tienda",
  "Pedir indicaciones en la calle",
  "Conversación casual con un amigo",
  "Hablar sobre tu trabajo",
];

type Message = { role: "ai" | "user"; text: string };

export default function AiPractice() {
  const { mutate: generate, isPending } = useGenerateExercise();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Principiante");
  const [started, setStarted] = useState(false);
  const [chat, setChat] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setStarted(true);
    setChat([]);
    generate(
      { topic, level },
      {
        onSuccess: (data) => {
          setChat([{ role: "ai", text: data.scenario }]);
          setSuggestions(data.questions?.slice(0, 3) ?? []);
        },
        onError: () => {
          setChat([{ role: "ai", text: "Hola! Estoy listo para practicar contigo. ¿Empezamos?" }]);
        },
      }
    );
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setChat((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSuggestions([]);

    // Simulate AI follow-up response
    setTimeout(() => {
      const responses = [
        "¡Muy bien! Tu respuesta fue excelente. ¿Podemos continuar con la situación?",
        "Interesante respuesta. En español también podrías decir: \"" + text + "\" de otra manera.",
        "¡Perfecto! Sigamos practicando. ¿Qué harías a continuación en esta situación?",
        "Buena respuesta. Recuerda usar el subjuntivo en estos casos. ¿Lo intentamos otra vez?",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setChat((prev) => [...prev, { role: "ai", text: randomResponse }]);
    }, 900);
  };

  const handleReset = () => {
    setStarted(false);
    setChat([]);
    setSuggestions([]);
    setInput("");
    setTopic("");
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100dvh - 7rem)" }}>
        {/* Header */}
        <header className="mb-4 flex-shrink-0 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-secondary/10 p-2 rounded-xl text-secondary">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-black">Práctica con IA</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Genera escenarios de conversación y practica tu idioma con IA.
            </p>
          </div>
          {started && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl hover:bg-muted"
            >
              <RotateCcw className="w-4 h-4" />
              Nueva sesión
            </button>
          )}
        </header>

        {/* Setup Form */}
        {!started && (
          <div className="bg-card border-2 border-border rounded-3xl p-6 flex-1 flex flex-col justify-center">
            <form onSubmit={handleStart} className="max-w-md mx-auto w-full space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2">¿Qué quieres practicar?</label>
                <input
                  data-testid="input-topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ej: Pedir comida en un restaurante..."
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-secondary focus:ring-4 focus:ring-secondary/10 outline-none transition-all text-sm"
                  required
                />

                {/* Quick topic suggestions */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {TOPICS_ES.slice(0, 3).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className="text-xs bg-muted hover:bg-secondary/10 hover:text-secondary border border-border px-3 py-1.5 rounded-full font-medium transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Nivel de dificultad</label>
                <select
                  data-testid="select-level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-secondary outline-none transition-all text-sm"
                >
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>

              <GamifiedButton
                type="submit"
                variant="secondary"
                fullWidth
                size="lg"
                disabled={isPending}
                data-testid="btn-start-practice"
              >
                {isPending ? "Generando escenario..." : "🎭 Iniciar práctica"}
              </GamifiedButton>
            </form>
          </div>
        )}

        {/* Chat Interface */}
        {started && (
          <div className="flex-1 flex flex-col bg-card border-2 border-border rounded-3xl overflow-hidden min-h-0">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isPending && chat.length === 0 && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                    <div className="flex gap-1.5">
                      {[0, 0.2, 0.4].map((d) => (
                        <span key={d} className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {chat.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                      msg.role === "ai" ? "bg-secondary" : "bg-primary"
                    }`}>
                      {msg.role === "ai" ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                      msg.role === "ai"
                        ? "bg-muted rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Suggestion chips */}
              {suggestions.length > 0 && (
                <div className="pl-11 flex flex-wrap gap-2 pt-2">
                  <p className="w-full text-xs font-bold text-muted-foreground mb-1">Respuestas sugeridas:</p>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="text-xs bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 px-3 py-1.5 rounded-full font-medium transition-colors text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t-2 border-border bg-muted/30 flex-shrink-0">
              <div className="flex gap-2 items-center">
                <input
                  data-testid="input-message"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Escribe tu respuesta en español..."
                  className="flex-1 px-4 py-3 rounded-full bg-background border-2 border-border focus:border-primary outline-none text-sm transition-all"
                />
                <button
                  data-testid="btn-send"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
