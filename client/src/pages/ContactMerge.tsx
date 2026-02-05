import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitMerge, Check } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function ContactMerge() {
  const [, setLocation] = useLocation();
  const [sourceContactId, setSourceContactId] = useState<string>("");
  const [targetContactId, setTargetContactId] = useState<string>("");
  const [selectedFields, setSelectedFields] = useState<Record<string, "source" | "target">>({});

  const { data: contacts = [] } = trpc.people.list.useQuery();
  const mergeMutation = trpc.people.merge.useMutation({
    onSuccess: () => {
      toast.success("Contacts merged successfully!");
      setLocation("/people");
    },
    onError: (error) => {
      toast.error(`Merge failed: ${error.message}`);
    },
  });

  const sourceContact = contacts.find((c: any) => c.id === sourceContactId);
  const targetContact = contacts.find((c: any) => c.id === targetContactId);

  const mergeableFields = [
    { key: "fullName", label: "Full Name" },
    { key: "primaryEmail", label: "Primary Email" },
    { key: "phone", label: "Phone" },
    { key: "companyName", label: "Company" },
    { key: "roleTitle", label: "Role/Title" },
    { key: "linkedinUrl", label: "LinkedIn URL" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "country", label: "Country" },
  ];

  const handleFieldSelection = (field: string, choice: "source" | "target") => {
    setSelectedFields((prev) => ({ ...prev, [field]: choice }));
  };

  const handleMerge = () => {
    if (!sourceContact || !targetContact) return;

    // Build merged fields object
    const mergedFields: Record<string, any> = {};
    mergeableFields.forEach((field) => {
      const choice = selectedFields[field.key] || "target";
      const chosenContact = choice === "source" ? sourceContact : targetContact;
      mergedFields[field.key] = (chosenContact as any)[field.key];
    });

    mergeMutation.mutate({
      sourceContactId,
      targetContactId,
      mergedFields,
    });
  };

  const canMerge = sourceContactId && targetContactId && sourceContactId !== targetContactId;

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/people")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contacts
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GitMerge className="h-8 w-8" />
          Merge Contacts
        </h1>
        <p className="text-muted-foreground mt-2">
          Select two contacts to merge. Choose which fields to keep from each contact.
        </p>
      </div>

      {/* Contact Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Contacts to Merge</CardTitle>
          <CardDescription>
            The source contact will be merged into the target contact and then deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Source Contact (will be deleted)</label>
            <Select value={sourceContactId} onValueChange={setSourceContactId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact: any) => (
                  <SelectItem key={contact.id} value={contact.id} disabled={contact.id === targetContactId}>
                    {contact.fullName} ({contact.primaryEmail})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Contact (will be kept)</label>
            <Select value={targetContactId} onValueChange={setTargetContactId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact: any) => (
                  <SelectItem key={contact.id} value={contact.id} disabled={contact.id === sourceContactId}>
                    {contact.fullName} ({contact.primaryEmail})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Field Comparison */}
      {canMerge && sourceContact && targetContact && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Choose Fields to Keep</CardTitle>
            <CardDescription>
              Select which value to use for each field. Click on a field to choose it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mergeableFields.map((field) => {
                const sourceValue = (sourceContact as any)[field.key];
                const targetValue = (targetContact as any)[field.key];
                const selected = selectedFields[field.key] || "target";

                return (
                  <div key={field.key} className="grid md:grid-cols-3 gap-4 items-center">
                    <div className="text-sm font-medium">{field.label}</div>
                    
                    <button
                      onClick={() => handleFieldSelection(field.key, "source")}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selected === "source"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{sourceValue || <span className="text-muted-foreground">Empty</span>}</span>
                        {selected === "source" && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </button>

                    <button
                      onClick={() => handleFieldSelection(field.key, "target")}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selected === "target"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{targetValue || <span className="text-muted-foreground">Empty</span>}</span>
                        {selected === "target" && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Merge Summary */}
      {canMerge && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Merge Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>{sourceContact?.fullName}</strong> will be merged into{" "}
              <strong>{targetContact?.fullName}</strong>
            </p>
            <p>All activity history, notes, threads, and deals from the source contact will be transferred.</p>
            <p className="text-destructive font-medium">
              The source contact will be permanently deleted after the merge.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {canMerge && (
        <div className="flex gap-4">
          <Button
            size="lg"
            onClick={handleMerge}
            disabled={mergeMutation.isPending}
          >
            {mergeMutation.isPending ? "Merging..." : "Merge Contacts"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/people")}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
