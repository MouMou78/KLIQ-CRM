import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Wand2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AIEmailAssistantProps {
  contactId?: string;
  dealId?: string;
  accountId?: string;
  onApply: (subject: string, body: string) => void;
  currentSubject?: string;
  currentBody?: string;
}

export function AIEmailAssistant({
  contactId,
  dealId,
  accountId,
  onApply,
  currentSubject = "",
  currentBody = "",
}: AIEmailAssistantProps) {

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isImproveOpen, setIsImproveOpen] = useState(false);
  
  const [generateParams, setGenerateParams] = useState({
    purpose: "cold_outreach",
    tone: "professional",
    additionalContext: "",
  });

  const [improveParams, setImproveParams] = useState<{
    improvementType: "clarity" | "tone" | "length" | "cta" | "personalization";
    targetTone: string;
  }>({
    improvementType: "clarity" as const,
    targetTone: "professional",
  });

  const generateMutation = trpc.aiEmail.generate.useMutation({
    onSuccess: (data) => {
      onApply(data.subject, data.body);
      setIsGenerateOpen(false);
      toast.success("Email generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate email: ${error.message}`);
    },
  });

  const improveMutation = trpc.aiEmail.improve.useMutation({
    onSuccess: (data) => {
      onApply(data.subject, data.body);
      setIsImproveOpen(false);
      toast.success("Email improved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to improve email: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      contactId,
      dealId,
      accountId,
      ...generateParams,
    });
  };

  const handleImprove = () => {
    improveMutation.mutate({
      subject: currentSubject,
      body: currentBody,
      ...improveParams,
    });
  };

  return (
    <div className="flex gap-2">
      {/* Generate Email */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Email with AI</DialogTitle>
            <DialogDescription>
              AI will use contact information, deal context, and recent notes to craft a personalized email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="purpose">Email Purpose</Label>
              <Select
                value={generateParams.purpose}
                onValueChange={(value) => setGenerateParams({ ...generateParams, purpose: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="introduction">Introduction</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="meeting_request">Meeting Request</SelectItem>
                  <SelectItem value="thank_you">Thank You</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tone">Tone</Label>
              <Select
                value={generateParams.tone}
                onValueChange={(value) => setGenerateParams({ ...generateParams, tone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="context">Additional Context (Optional)</Label>
              <Textarea
                id="context"
                value={generateParams.additionalContext}
                onChange={(e) => setGenerateParams({ ...generateParams, additionalContext: e.target.value })}
                placeholder="e.g., Mention our recent product launch, reference their blog post..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Improve Email */}
      {currentBody && (
        <Dialog open={isImproveOpen} onOpenChange={setIsImproveOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Wand2 className="mr-2 h-4 w-4" />
              Improve with AI
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Improve Email with AI</DialogTitle>
              <DialogDescription>
                Select how you'd like to improve your email
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="improvementType">Improvement Type</Label>
                <Select
                  value={improveParams.improvementType}
                  onValueChange={(value: "clarity" | "tone" | "length" | "cta" | "personalization") => setImproveParams({ ...improveParams, improvementType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clarity">Make it Clearer</SelectItem>
                    <SelectItem value="tone">Adjust Tone</SelectItem>
                    <SelectItem value="length">Make it Shorter</SelectItem>
                    <SelectItem value="cta">Strengthen Call-to-Action</SelectItem>
                    <SelectItem value="personalization">Make it More Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {improveParams.improvementType === "tone" && (
                <div>
                  <Label htmlFor="targetTone">Target Tone</Label>
                  <Select
                    value={improveParams.targetTone}
                    onValueChange={(value) => setImproveParams({ ...improveParams, targetTone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImproveOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImprove} disabled={improveMutation.isPending}>
                {improveMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Improving...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Improve
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
