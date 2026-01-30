import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link as LinkIcon, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Integrations() {
  const { data: integrations, isLoading } = trpc.integrations.list.useQuery();
  const [amplemarketKey, setAmplemarketKey] = useState("");
  
  const connectAmplemarket = trpc.integrations.connectAmplemarket.useMutation({
    onSuccess: () => {
      toast.success("Amplemarket connected successfully");
      setAmplemarketKey("");
    },
    onError: () => {
      toast.error("Failed to connect Amplemarket");
    },
  });

  const handleConnectAmplemarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amplemarketKey.trim()) return;
    
    await connectAmplemarket.mutateAsync({ apiKey: amplemarketKey });
  };

  const googleIntegration = integrations?.find((i) => i.provider === "google");
  const amplemarketIntegration = integrations?.find((i) => i.provider === "amplemarket");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect external services to sync data automatically
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Google Workspace</CardTitle>
                  <CardDescription>Gmail and Calendar sync</CardDescription>
                </div>
                {googleIntegration?.status === "connected" ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="w-3 h-3" />
                    Disconnected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Automatically sync emails and calendar events from your Google Workspace account.
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Features:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Gmail email tracking</li>
                    <li>Calendar meeting sync</li>
                    <li>Automatic moment creation</li>
                  </ul>
                </div>

                <Button className="w-full" variant="outline" disabled>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Connect Google (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Amplemarket</CardTitle>
                  <CardDescription>Sales engagement platform</CardDescription>
                </div>
                {amplemarketIntegration?.status === "connected" ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="w-3 h-3" />
                    Disconnected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Track outbound sequences, email replies, and call activity from Amplemarket.
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Features:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Sequence tracking</li>
                    <li>Email reply detection</li>
                    <li>Call logging</li>
                    <li>Webhook support</li>
                  </ul>
                </div>

                {amplemarketIntegration?.status !== "connected" && (
                  <form onSubmit={handleConnectAmplemarket} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Enter your Amplemarket API key"
                        value={amplemarketKey}
                        onChange={(e) => setAmplemarketKey(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!amplemarketKey.trim() || connectAmplemarket.isPending}
                    >
                      {connectAmplemarket.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Connect Amplemarket
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {amplemarketIntegration?.status === "connected" && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Amplemarket is connected and syncing data.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
