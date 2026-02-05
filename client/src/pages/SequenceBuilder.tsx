import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Clock, GitBranch, Trash2, GripVertical, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { AIEmailAssistant } from "@/components/AIEmailAssistant";

interface SequenceStep {
  id: string;
  type: "email" | "wait" | "condition";
  subject?: string;
  body?: string;
  waitDays?: number;
  condition?: {
    type: "opened" | "replied" | "clicked";
    thenStepId?: string;
    elseStepId?: string;
  };
}

export default function SequenceBuilder() {
  const [, setLocation] = useLocation();
  const [sequenceName, setSequenceName] = useState("");
  const [sequenceDescription, setSequenceDescription] = useState("");
  const [steps, setSteps] = useState<SequenceStep[]>([
    {
      id: "step-1",
      type: "email",
      subject: "",
      body: "",
    },
  ]);

  const addStep = (type: "email" | "wait" | "condition") => {
    const newStep: SequenceStep = {
      id: `step-${Date.now()}`,
      type,
      ...(type === "email" && { subject: "", body: "" }),
      ...(type === "wait" && { waitDays: 2 }),
      ...(type === "condition" && {
        condition: { type: "opened" },
      }),
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
  };

  const updateStep = (stepId: string, updates: Partial<SequenceStep>) => {
    setSteps(steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)));
  };

  const handleSave = () => {
    if (!sequenceName.trim()) {
      toast.error("Please enter a sequence name");
      return;
    }
    if (steps.length === 0) {
      toast.error("Please add at least one step");
      return;
    }
    toast.success("Sequence saved successfully!");
    setTimeout(() => setLocation("/sequences"), 1000);
  };

  return (
    <div className="space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create Email Sequence</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            Build multi-step campaigns with conditional logic
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setLocation("/sequences")} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 sm:flex-none">
            <Save className="w-4 h-4 mr-2" />
            Save Sequence
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sequence Details</CardTitle>
          <CardDescription>Give your sequence a name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Sequence Name</Label>
            <Input
              id="name"
              placeholder="e.g., Outbound Sales Sequence"
              value={sequenceName}
              onChange={(e) => setSequenceName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this sequence..."
              value={sequenceDescription}
              onChange={(e) => setSequenceDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Sequence Steps</CardTitle>
              <CardDescription>Add and configure email steps, delays, and conditions</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={() => addStep("email")} className="flex-1 sm:flex-none">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm" onClick={() => addStep("wait")} className="flex-1 sm:flex-none">
                <Clock className="w-4 h-4 mr-2" />
                Wait
              </Button>
              <Button variant="outline" size="sm" onClick={() => addStep("condition")} className="flex-1 sm:flex-none">
                <GitBranch className="w-4 h-4 mr-2" />
                Condition
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <Card key={step.id} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                    <Badge variant="outline">Step {index + 1}</Badge>
                    <Badge>
                      {step.type === "email" && <Mail className="w-3 h-3 mr-1" />}
                      {step.type === "wait" && <Clock className="w-3 h-3 mr-1" />}
                      {step.type === "condition" && <GitBranch className="w-3 h-3 mr-1" />}
                      {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(step.id)}
                    disabled={steps.length === 1}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {step.type === "email" && (
                  <>
                    <div className="space-y-2">
                      <Label>Email Subject</Label>
                      <Input
                        placeholder="Enter email subject..."
                        value={step.subject || ""}
                        onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Email Body</Label>
                        <AIEmailAssistant
                          currentSubject={step.subject || ""}
                          currentBody={step.body || ""}
                          onApply={(newSubject: string, newBody: string) => {
                            updateStep(step.id, { subject: newSubject, body: newBody });
                          }}
                        />
                      </div>
                      <Textarea
                        placeholder="Write your email content..."
                        value={step.body || ""}
                        onChange={(e) => updateStep(step.id, { body: e.target.value })}
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use variables: {"{"}first_name{"}"}, {"{"}company_name{"}"}, {"{"}role_title{"}"}
                      </p>
                    </div>
                  </>
                )}

                {step.type === "wait" && (
                  <div className="space-y-2">
                    <Label>Wait Duration</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={step.waitDays || 2}
                        onChange={(e) => updateStep(step.id, { waitDays: parseInt(e.target.value) })}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>
                  </div>
                )}

                {step.type === "condition" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Condition Type</Label>
                      <Select
                        value={step.condition?.type || "opened"}
                        onValueChange={(value: "opened" | "replied" | "clicked") =>
                          updateStep(step.id, {
                            condition: { ...step.condition, type: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="opened">Email Opened</SelectItem>
                          <SelectItem value="replied">Email Replied</SelectItem>
                          <SelectItem value="clicked">Link Clicked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <Label className="text-green-600">If Yes</Label>
                        <p className="text-xs text-muted-foreground">Continue to next step</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-orange-600">If No</Label>
                        <p className="text-xs text-muted-foreground">Wait and retry or end sequence</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {steps.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No steps added yet</p>
              <Button onClick={() => addStep("email")}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Step
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
