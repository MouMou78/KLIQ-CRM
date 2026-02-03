import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Loader2, Database, Trash2, CheckCircle, AlertCircle } from "lucide-react";

export default function Demo() {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const generateMutation = trpc.demo.generate.useMutation();
  const clearMutation = trpc.demo.clear.useMutation();
  
  const handleGenerate = async () => {
    setStatus(null);
    try {
      const result = await generateMutation.mutateAsync();
      setStatus({
        type: "success",
        message: `Demo data generated successfully! Created ${result.peopleCount} contacts, ${result.threadsCount} deals, and ${result.momentsCount} moments.`,
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error.message || "Failed to generate demo data",
      });
    }
  };
  
  const handleClear = async () => {
    setStatus(null);
    try {
      const result = await clearMutation.mutateAsync();
      setStatus({
        type: "success",
        message: result.message || `Demo data cleared! Deleted ${result.peopleDeleted} contacts and ${result.threadsDeleted} deals.`,
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error.message || "Failed to clear demo data",
      });
    }
  };
  
  const isLoading = generateMutation.isPending || clearMutation.isPending;
  
  return (
    <div className="container py-4 md:py-8 px-4">
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Demo Environment</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
          Generate sample data to explore the CRM features without affecting your production data.
        </p>
      </div>
      
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Generate Demo Data
            </CardTitle>
            <CardDescription>
              Create realistic sample data including contacts, deals, moments, and next actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium">What will be created:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>25 contacts with realistic names and company information</li>
                <li>15 deals across different funnel stages</li>
                <li>45+ moments (emails, calls, meetings, notes)</li>
                <li>Next actions for active deals</li>
              </ul>
            </div>
            
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Generate Demo Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Clear Demo Data
            </CardTitle>
            <CardDescription>
              Remove all demo-tagged data from your CRM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium">What will be removed:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>All contacts with "demo" source tag</li>
                <li>All deals associated with demo contacts</li>
                <li>All moments and next actions for demo deals</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Your production data will not be affected
              </p>
            </div>
            
            <Button
              onClick={handleClear}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              {clearMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Demo Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {status && (
        <Alert className="mt-6" variant={status.type === "error" ? "destructive" : "default"}>
          {status.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Demo Mode Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Demo data is tagged with "demo-data" for easy identification</p>
          <p>• Use the People page to view generated contacts</p>
          <p>• Check the Funnel page to see deals across different stages</p>
          <p>• Try the AI Assistant to query demo data</p>
          <p>• Analytics will reflect demo activity once generated</p>
        </CardContent>
      </Card>
    </div>
  );
}
