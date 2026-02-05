import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Building, MessageSquare, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults, isLoading } = trpc.search.global.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  const handleSelect = (type: string, id: string) => {
    onOpenChange(false);
    setQuery("");
    
    switch (type) {
      case "person":
        setLocation(`/people/${id}`);
        break;
      case "account":
        setLocation(`/accounts/${id}`);
        break;
      case "thread":
        setLocation(`/threads/${id}`);
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Global Search</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b pb-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search contacts, accounts, threads..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {query.length < 2 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}

          {debouncedQuery.length >= 2 && !isLoading && !searchResults && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}

          {searchResults && (
            <div className="space-y-4">
              {searchResults.people && searchResults.people.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Contacts
                  </div>
                  <div className="space-y-1">
                    {searchResults.people.map((person: any) => (
                      <Button
                        key={person.id}
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto py-2"
                        onClick={() => handleSelect("person", person.id)}
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{person.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {person.email}
                            {person.companyName && ` • ${person.companyName}`}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.accounts && searchResults.accounts.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Accounts
                  </div>
                  <div className="space-y-1">
                    {searchResults.accounts.map((account: any) => (
                      <Button
                        key={account.id}
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto py-2"
                        onClick={() => handleSelect("account", account.id)}
                      >
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{account.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {account.domain}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.threads && searchResults.threads.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Threads
                  </div>
                  <div className="space-y-1">
                    {searchResults.threads.map((thread: any) => (
                      <Button
                        key={thread.id}
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto py-2"
                        onClick={() => handleSelect("thread", thread.id)}
                      >
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{thread.title || "Untitled Thread"}</div>
                          <div className="text-xs text-muted-foreground">
                            {thread.intent} • {thread.status}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t pt-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>Press ESC to close</span>
          <span>Use ↑↓ to navigate</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
