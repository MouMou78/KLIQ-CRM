import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AccountImport() {
  const [, setLocation] = useLocation();
  const [csvContent, setCsvContent] = useState("");
  const [parseResult, setParseResult] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<any>(null);
  const [step, setStep] = useState<"upload" | "map" | "review" | "complete">("upload");

  const parseMutation = trpc.accounts.parseCSV.useMutation();
  const importMutation = trpc.accounts.importAccounts.useMutation();

  const availableFields = [
    { key: "name", label: "Account Name", required: true },
    { key: "domain", label: "Domain" },
    { key: "industry", label: "Industry" },
    { key: "headquarters", label: "Headquarters" },
    { key: "employeeCount", label: "Employee Count" },
    { key: "annualRevenue", label: "Annual Revenue" },
    { key: "description", label: "Description" },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);

      try {
        const result = await parseMutation.mutateAsync({ content });
        setParseResult(result);
        setStep("map");

        // Auto-map common fields
        const autoMapping: Record<string, string> = {};
        result.headers.forEach((header: string) => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('name') || lowerHeader.includes('account')) {
            autoMapping[header] = 'name';
          } else if (lowerHeader.includes('domain') || lowerHeader.includes('website')) {
            autoMapping[header] = 'domain';
          } else if (lowerHeader.includes('industry')) {
            autoMapping[header] = 'industry';
          } else if (lowerHeader.includes('headquarters') || lowerHeader.includes('location')) {
            autoMapping[header] = 'headquarters';
          } else if (lowerHeader.includes('employee')) {
            autoMapping[header] = 'employeeCount';
          } else if (lowerHeader.includes('revenue')) {
            autoMapping[header] = 'annualRevenue';
          } else if (lowerHeader.includes('description') || lowerHeader.includes('about')) {
            autoMapping[header] = 'description';
          }
        });
        setMapping(autoMapping);
      } catch (error: any) {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    try {
      const result = await importMutation.mutateAsync({
        content: csvContent,
        mapping,
        skipDuplicates: true,
      });
      setImportResult(result);
      setStep("complete");
      toast.success(`Successfully imported ${result.imported} accounts!`);
    } catch (error: any) {
      toast.error(`Error importing accounts: ${error.message}`);
    }
  };

  const hasRequiredMapping = mapping && Object.values(mapping).includes('name');

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/accounts")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Accounts
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Upload className="h-8 w-8" />
          Import Accounts
        </h1>
        <p className="text-muted-foreground mt-2">
          Import multiple accounts from a CSV file
        </p>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a CSV file containing your account data
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </span>
              </Button>
            </label>
            <p className="text-sm text-muted-foreground mt-4">
              CSV file should include columns like: Name, Domain, Industry, Headquarters
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Map Fields */}
      {step === "map" && parseResult && (
        <Card>
          <CardHeader>
            <CardTitle>Map CSV Columns to Account Fields</CardTitle>
            <CardDescription>
              Match your CSV columns to the corresponding account fields. Name is required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {parseResult.headers.map((header: string) => (
                <div key={header} className="grid md:grid-cols-2 gap-4 items-center">
                  <div className="text-sm font-medium">{header}</div>
                  <Select
                    value={mapping[header] || ""}
                    onValueChange={(value) => setMapping({ ...mapping, [header]: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Skip this column</SelectItem>
                      {availableFields.map((field) => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label} {field.required && "(Required)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-4">
              <Button onClick={() => setStep("review")} disabled={!hasRequiredMapping}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Review Import
              </Button>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Cancel
              </Button>
            </div>

            {!hasRequiredMapping && (
              <p className="text-sm text-destructive mt-4">
                Please map at least the Account Name field to continue.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === "review" && parseResult && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Import</CardTitle>
              <CardDescription>
                Verify the data before importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Total rows:</strong> {parseResult.rowCount}</p>
                <p><strong>Mapped fields:</strong> {Object.keys(mapping).filter(k => mapping[k]).length}</p>
                <p className="text-muted-foreground">
                  Duplicate accounts (same name) will be skipped automatically.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Sample Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {parseResult.preview?.slice(0, 3).map((row: any, idx: number) => (
                  <div key={idx} className="p-3 bg-background rounded border">
                    {Object.entries(mapping).filter(([_, field]) => field).map(([csvCol, field]) => (
                      <div key={csvCol}>
                        <strong>{availableFields.find(f => f.key === field)?.label}:</strong> {row[csvCol]}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button size="lg" onClick={handleImport} disabled={importMutation.isPending}>
              {importMutation.isPending ? "Importing..." : "Import Accounts"}
            </Button>
            <Button size="lg" variant="outline" onClick={() => setStep("map")}>
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && importResult && (
        <Card className="border-primary/20">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-semibold mb-2">Import Complete!</h2>
            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p><strong className="text-foreground">{importResult.imported}</strong> accounts imported successfully</p>
              {importResult.skipped > 0 && (
                <p><strong className="text-foreground">{importResult.skipped}</strong> duplicates skipped</p>
              )}
            </div>
            <Button onClick={() => setLocation("/accounts")}>
              View Accounts
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
