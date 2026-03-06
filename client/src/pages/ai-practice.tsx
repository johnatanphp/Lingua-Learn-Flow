import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGenerateExercise } from "@/hooks/use-ai";
import { Sparkles, Send, Bot, User as UserIcon } from "lucide-react";
import { GamifiedButton } from "@/components/gamified-button";

export default function AiPractice() {
  const { mutate: generate, isPending, data: exercise } = useGenerateExercise();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Beginner");
  
  // Simulate chat interface state
  const [chat, setChat] = useState<{role: 'ai'|'user', text: string}[]>([]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    
    generate({ topic, level }, {
      onSuccess: (data) => {
        setChat([{ role: 'ai', text: data.scenario }]);
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-100px)]">
        <header className="mb-6 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-secondary/10 p-2 rounded-xl text-secondary">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">AI Conversation</h1>
          </div>
          <p className="text-muted-foreground">Generate dynamic roleplay scenarios to practice writing and reading.</p>
        </header>

        {!exercise ? (
          <div className="bg-card border-2 border-border p-6 md:p-8 rounded-3xl flex-1 flex flex-col justify-center">
            <form onSubmit={handleGenerate} className="max-w-md mx-auto w-full space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">What do you want to practice?</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Ordering coffee, Checking into a hotel..."
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-secondary focus:ring-4 focus:ring-secondary/10 outline-none transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Difficulty Level</label>
                <select 
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-secondary outline-none transition-all"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              <GamifiedButton 
                type="submit" 
                variant="secondary" 
                fullWidth 
                size="lg"
                disabled={isPending}
              >
                {isPending ? "Generating..." : "Start Roleplay"}
              </GamifiedButton>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-card border-2 border-border rounded-3xl overflow-hidden">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chat.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-secondary text-white' : 'bg-primary text-white'}`}>
                    {msg.role === 'ai' ? <Bot className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                  </div>
                  <div className={`p-4 rounded-2xl max-w-[80%] ${msg.role === 'ai' ? 'bg-muted rounded-tl-none' : 'bg-primary text-primary-foreground rounded-tr-none'}`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {exercise.questions && exercise.questions.length > 0 && chat.length === 1 && (
                <div className="ml-14 max-w-[80%] bg-accent/10 border-2 border-accent/20 p-4 rounded-2xl">
                  <p className="text-sm font-bold text-accent-foreground mb-2">Suggested replies to practice:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/80">
                    {exercise.questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t-2 border-border bg-muted/30">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Type your response... (Mock UI)"
                  className="w-full px-6 py-4 rounded-full bg-background border-2 border-border pr-16 focus:border-primary outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      setChat([...chat, { role: 'user', text: e.currentTarget.value }]);
                      e.currentTarget.value = '';
                      // Mocking an AI response
                      setTimeout(() => {
                        setChat(prev => [...prev, { role: 'ai', text: "¡Muy bien! (Mock response for UI purposes)"}]);
                      }, 1000);
                    }
                  }}
                />
                <button className="absolute right-2 top-2 bottom-2 bg-primary text-primary-foreground rounded-full w-12 flex items-center justify-center hover:bg-primary/90 transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
