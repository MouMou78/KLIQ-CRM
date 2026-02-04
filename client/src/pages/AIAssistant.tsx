import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

const QUICK_ACTIONS = [
  "Show my top 5 contacts",
  "What's my sales pipeline status?",
  "Recent engagement activity",
  "Contacts needing follow-up",
  "This week's completed actions",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "I can help you analyze your CRM data, find contacts, and track engagement. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const chatMutation = trpc.assistant.chat.useMutation();

  const handleSend = async (message?: string) => {
    const messageToSend = message || input.trim();
    if (!messageToSend || isLoading) return;

    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: messageToSend }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const result = await chatMutation.mutateAsync({
        messages: newMessages,
      });
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: result.response
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    handleSend(action);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Assistant</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Ask questions about your CRM data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl py-4 space-y-4">
          {/* Quick Actions - Only show at start */}
          {messages.length === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Quick asks:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors px-3 py-1.5"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 ${
                message.role === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              }`}>
                {message.role === "assistant" ? (
                  <Streamdown>{message.content}</Streamdown>
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                )}
              </Card>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <Card className="max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 bg-muted">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl py-3 sm:py-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your CRM data..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={() => handleSend()} 
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 hidden sm:block">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
