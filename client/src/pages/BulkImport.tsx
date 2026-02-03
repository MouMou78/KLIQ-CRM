import { useState } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ParsedContact {
  fullName: string;
  firstName?: string;
  lastName?: string;
  primaryEmail: string;
  companyName?: string;
  roleTitle?: string;
  phone?: string;
  linkedinUrl?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

export default function BulkImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedContact[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);


  const importMutation = trpc.people.bulkImport.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Successfully imported ${data.success} contacts. ${data.duplicates} duplicates skipped, ${data.failed} failed.`);
      setImporting(false);
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
      setImporting(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    try {
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();

      if (fileExtension === "csv") {
        // Parse CSV
        Papa.parse(selectedFile, {
          header: true,
          complete: (results) => {
            const contacts = mapToContacts(results.data as any[]);
            setParsedData(contacts);
          },
          error: (error) => {
          toast.error(`Parse error: ${error.message}`);
          },
        });
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        // Parse Excel
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet);
        const contacts = mapToContacts(data as any[]);
        setParsedData(contacts);
      } else {
        toast.error("Please upload a CSV or Excel file");
      }
    } catch (error) {
      toast.error("Failed to parse file");
    }
  };

  const mapToContacts = (data: any[]): ParsedContact[] => {
    return data
      .filter((row) => row.email || row.Email || row.primaryEmail || row["Primary Email"])
      .map((row) => {
        // Try to map common column names
        const email = row.email || row.Email || row.primaryEmail || row["Primary Email"] || "";
        const fullName = row.name || row.Name || row.fullName || row["Full Name"] || "";
        const firstName = row.firstName || row["First Name"] || row.first_name || "";
        const lastName = row.lastName || row["Last Name"] || row.last_name || "";
        const company = row.company || row.Company || row.companyName || row["Company Name"] || "";
        const title = row.title || row.Title || row.roleTitle || row["Job Title"] || "";
        const phone = row.phone || row.Phone || row.phoneNumber || row["Phone Number"] || "";
        const linkedin = row.linkedin || row.LinkedIn || row.linkedinUrl || row["LinkedIn URL"] || "";
        const city = row.city || row.City || "";
        const state = row.state || row.State || "";
        const country = row.country || row.Country || "";

        return {
          fullName: fullName || `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
          primaryEmail: email,
          companyName: company,
          roleTitle: title,
          phone,
          linkedinUrl: linkedin,
          city,
          state,
          country,
        };
      });
  };

  const handleImport = () => {
    if (parsedData.length === 0) {
      toast.error("Please upload a file first");
      return;
    }

    setImporting(true);
    importMutation.mutate({ contacts: parsedData });
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setResult(null);
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bulk Import Contacts</h1>
        <p className="text-muted-foreground">
          Import multiple contacts from CSV or Excel files
        </p>
      </div>

      <Card className="p-6">
        {!file && (
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Upload Contact File</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports CSV and Excel (.xlsx, .xls) files
            </p>
            <label htmlFor="file-upload">
              <Button asChild>
                <span>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Choose File
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {file && parsedData.length > 0 && !result && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {parsedData.length} contacts ready to import
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-muted rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
              <h4 className="font-medium mb-2">Preview (first 5 rows)</h4>
              <div className="space-y-2">
                {parsedData.slice(0, 5).map((contact, idx) => (
                  <div key={idx} className="text-sm bg-background p-2 rounded">
                    <div className="font-medium">{contact.fullName}</div>
                    <div className="text-muted-foreground">{contact.primaryEmail}</div>
                    {contact.companyName && (
                      <div className="text-xs text-muted-foreground">
                        {contact.companyName} • {contact.roleTitle}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Import Notes
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                    <li>Duplicate emails will be skipped</li>
                    <li>Invalid or missing emails will be skipped</li>
                    <li>All contacts will be added to your CRM</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={importing} className="flex-1">
                {importing ? "Importing..." : `Import ${parsedData.length} Contacts`}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold">Import Complete</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {result.success}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Imported</div>
              </Card>
              <Card className="p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {result.duplicates}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Duplicates</div>
              </Card>
              <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {result.failed}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
              </Card>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Errors</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-200">
                  {result.errors.slice(0, 10).map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li>... and {result.errors.length - 10} more errors</li>
                  )}
                </ul>
              </div>
            )}

            <Button onClick={handleReset} className="w-full">
              Import Another File
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6 mt-6">
        <h3 className="font-semibold mb-3">Supported Column Names</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium mb-1">Required:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>email, Email, primaryEmail, Primary Email</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Optional:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>name, Name, fullName, Full Name</li>
              <li>firstName, First Name, first_name</li>
              <li>lastName, Last Name, last_name</li>
              <li>company, Company, companyName, Company Name</li>
              <li>title, Title, roleTitle, Job Title</li>
              <li>phone, Phone, phoneNumber, Phone Number</li>
              <li>linkedin, LinkedIn, linkedinUrl, LinkedIn URL</li>
              <li>city, City, state, State, country, Country</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
