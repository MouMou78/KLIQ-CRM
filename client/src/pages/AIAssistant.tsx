import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Plus, Trash2, Menu, X, Mic, MicOff, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

const QUICK_ACTIONS = [
  "Show my top 5 contacts",
  "What's my sales pipeline status?",
  "Recent engagement activity",
  "Contacts needing follow-up",
  "This week's completed actions",
];

const DEFAULT_MESSAGES = [
  {
    role: "assistant" as const,
    content: "I can help you analyze your CRM data, find contacts, and track engagement. What would you like to know?"
  }
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>(DEFAULT_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const { data: conversations = [], refetch: refetchConversations } = trpc.assistant.getConversations.useQuery();
  const chatMutation = trpc.assistant.chat.useMutation();
  const createConversationMutation = trpc.assistant.createConversation.useMutation();
  const deleteConversationMutation = trpc.assistant.deleteConversation.useMutation();

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
        conversationId: currentConversationId || undefined,
      });
      
      const updatedMessages = [...newMessages, {
        role: "assistant" as const,
        content: result.response
      }];
      setMessages(updatedMessages);

      // Auto-save new conversation after first exchange
      if (!currentConversationId && updatedMessages.length > 2) {
        const title = messageToSend.slice(0, 50) + (messageToSend.length > 50 ? "..." : "");
        const { id } = await createConversationMutation.mutateAsync({
          title,
          messages: updatedMessages,
        });
        setCurrentConversationId(id);
        refetchConversations();
      }
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

  const handleNewConversation = () => {
    setMessages(DEFAULT_MESSAGES);
    setCurrentConversationId(null);
    setSidebarOpen(false);
  };

  const handleLoadConversation = (conversation: any) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      await deleteConversationMutation.mutateAsync({ id });
      if (currentConversationId === id) {
        handleNewConversation();
      }
      refetchConversations();
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleExport = (format: 'txt' | 'pdf') => {
    if (messages.length <= 1) {
      alert('No conversation to export');
      return;
    }

    const title = currentConversationId 
      ? conversations.find(c => c.id === currentConversationId)?.title || 'AI Conversation'
      : 'AI Conversation';
    const timestamp = new Date().toLocaleString();

    if (format === 'txt') {
      let content = `${title}\n`;
      content += `Exported: ${timestamp}\n`;
      content += '='.repeat(50) + '\n\n';

      messages.forEach((msg, idx) => {
        if (idx > 0 || msg.role !== 'assistant') {
          content += `${msg.role.toUpperCase()}:\n${msg.content}\n\n`;
        }
      });

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // For PDF, create a simple HTML page and print it
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to export PDF');
        return;
      }

      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .meta { color: #666; font-size: 14px; margin-bottom: 30px; }
            .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
            .user { background: #e3f2fd; text-align: right; }
            .assistant { background: #f5f5f5; }
            .role { font-weight: bold; margin-bottom: 8px; text-transform: uppercase; font-size: 12px; }
            .content { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">Exported: ${timestamp}</div>
      `;

      messages.forEach((msg, idx) => {
        if (idx > 0 || msg.role !== 'assistant') {
          htmlContent += `
            <div class="message ${msg.role}">
              <div class="role">${msg.role}</div>
              <div class="content">${msg.content}</div>
            </div>
          `;
        }
      });

      htmlContent += `
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "block" : "hidden"} lg:block w-full lg:w-64 border-r bg-muted/30 flex flex-col absolute lg:relative z-10 h-full`}>
        <div className="p-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Conversations</h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="h-8 w-8 p-0 lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conv: any) => (
              <div
                key={conv.id}
                className={`group flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${
                  currentConversationId === conv.id ? "bg-accent" : ""
                }`}
                onClick={() => handleLoadConversation(conv)}
              >
                <span className="text-sm truncate flex-1">{conv.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No saved conversations yet
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden h-8 w-8 p-0"
              >
                <Menu className="h-4 w-4" />
              </Button>
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
            {messages.length > 1 && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('txt')}
                  className="h-8 gap-2"
                >
                  <Download className="h-3 w-3" />
                  <span className="hidden sm:inline">TXT</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  className="h-8 gap-2"
                >
                  <Download className="h-3 w-3" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
              </div>
            )}
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
                onClick={handleVoiceInput}
                disabled={isLoading}
                size="icon"
                variant={isRecording ? "default" : "outline"}
                className={isRecording ? "animate-pulse" : ""}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
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
    </div>
  );
}
