import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitMerge, Check } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AccountMerge() {
  const [, setLocation] = useLocation();
  const [sourceAccountId, setSourceAccountId] = useState<string>("");
  const [targetAccountId, setTargetAccountId] = useState<string>("");
  const [selectedFields, setSelectedFields] = useState<Record<string, "source" | "target">>({});

  const { data: accounts = [] } = trpc.accounts.list.useQuery();
  const mergeMutation = trpc.accounts.merge.useMutation({
    onSuccess: () => {
      toast.success("Accounts merged successfully!");
      setLocation("/accounts");
    },
    onError: (error) => {
      toast.error(`Merge failed: ${error.message}`);
    },
  });

  const sourceAccount = accounts.find((a: any) => a.id === sourceAccountId);
  const targetAccount = accounts.find((a: any) => a.id === targetAccountId);

  const mergeableFields = [
    { key: "name", label: "Account Name" },
    { key: "domain", label: "Domain" },
    { key: "industry", label: "Industry" },
    { key: "headquarters", label: "Headquarters" },
    { key: "employeeCount", label: "Employee Count" },
    { key: "annualRevenue", label: "Annual Revenue" },
    { key: "description", label: "Description" },
  ];

  const handleFieldSelection = (field: string, choice: "source" | "target") => {
    setSelectedFields((prev) => ({ ...prev, [field]: choice }));
  };

  const handleMerge = () => {
    if (!sourceAccount || !targetAccount) return;

    // Build merged fields object
    const mergedFields: Record<string, any> = {};
    mergeableFields.forEach((field) => {
      const choice = selectedFields[field.key] || "target";
      const chosenAccount = choice === "source" ? sourceAccount : targetAccount;
      mergedFields[field.key] = (chosenAccount as any)[field.key];
    });

    mergeMutation.mutate({
      sourceAccountId,
      targetAccountId,
      mergedFields,
    });
  };

  const canMerge = sourceAccountId && targetAccountId && sourceAccountId !== targetAccountId;

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/accounts")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Accounts
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GitMerge className="h-8 w-8" />
          Merge Accounts
        </h1>
        <p className="text-muted-foreground mt-2">
          Select two accounts to merge. Choose which fields to keep from each account.
        </p>
      </div>

      {/* Account Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Accounts to Merge</CardTitle>
          <CardDescription>
            The source account will be merged into the target account and then deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Source Account (will be deleted)</label>
            <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account: any) => (
                  <SelectItem key={account.id} value={account.id} disabled={account.id === targetAccountId}>
                    {account.name} {account.domain && `(${account.domain})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Account (will be kept)</label>
            <Select value={targetAccountId} onValueChange={setTargetAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account: any) => (
                  <SelectItem key={account.id} value={account.id} disabled={account.id === sourceAccountId}>
                    {account.name} {account.domain && `(${account.domain})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Field Comparison */}
      {canMerge && sourceAccount && targetAccount && (
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
                const sourceValue = (sourceAccount as any)[field.key];
                const targetValue = (targetAccount as any)[field.key];
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
              <strong>{sourceAccount?.name}</strong> will be merged into{" "}
              <strong>{targetAccount?.name}</strong>
            </p>
            <p>All contacts, deals, and activity history from the source account will be transferred.</p>
            <p className="text-destructive font-medium">
              The source account will be permanently deleted after the merge.
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
            {mergeMutation.isPending ? "Merging..." : "Merge Accounts"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/accounts")}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
