import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/chatStore";
import { openaiService } from "@/services/openai.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, X, Send, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function ChatBot() {
  const { isOpen, messages, isLoading, currentContext, toggleChat, addMessage, setLoading, closeChat } = useChatStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check if OpenAI is configured
  const isConfigured = openaiService.isConfigured();

  // Handle send message
  const handleSend = async () => {
    if (!input.trim()) return;
    if (!isConfigured) {
      toast.error("L'API OpenAI n'est pas configurée");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    addMessage("user", userMessage);
    setLoading(true);

    try {
      const response = await openaiService.generateCRMResponse(userMessage, currentContext);
      addMessage("assistant", response);
    } catch (error) {
      toast.error("Erreur lors de la communication avec l'IA");
      addMessage("assistant", "Désolé, je n'ai pas pu traiter votre demande. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick actions
  const quickActions = [
    { label: "Voir mon CA", query: "Quel est mon chiffre d'affaires ?" },
    { label: "Factures impayées", query: "Montre-moi les factures impayées" },
    { label: "Créer un devis", query: "Je veux créer un devis" },
    { label: "Aide", query: "Comment puis-tu m'aider ?" },
  ];

  if (!isOpen) {
    return (
      <Button
        onClick={toggleChat}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[400px] h-[600px] shadow-2xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-primary text-primary-foreground">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Craftly AI
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeChat}
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="font-medium">Bonjour ! Je suis Craftly AI</p>
                <p className="text-sm mt-2">Comment puis-je vous aider aujourd'hui ?</p>
              </div>

              {/* Quick actions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Actions rapides :</p>
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-sm h-auto py-2"
                    onClick={() => {
                      setInput(action.query);
                      setTimeout(() => handleSend(), 100);
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>

              {!isConfigured && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <p className="font-medium text-yellow-800">⚠️ Configuration requise</p>
                  <p className="text-yellow-700 mt-1">
                    Ajoutez votre clé API OpenAI dans les variables d'environnement :
                  </p>
                  <code className="text-xs bg-yellow-100 px-2 py-1 rounded mt-2 block">
                    VITE_OPENAI_API_KEY=sk-...
                  </code>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {format(message.timestamp, "HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Posez votre question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || !isConfigured}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !isConfigured}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {isConfigured && (
            <p className="text-xs text-muted-foreground mt-2">
              ⌘ Enter pour envoyer
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
