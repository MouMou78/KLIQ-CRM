import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function ConflictReview() {
  const { data: conflicts, isLoading, refetch } = trpc.integrations.getConflicts.useQuery();
  const resolveConflict = trpc.integrations.resolveConflict.useMutation({
    onSuccess: () => {
      toast.success("Conflict resolved");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to resolve conflict: ${error.message}`);
    },
  });

  const handleResolve = (conflictId: string, choice: "crm" | "amplemarket" | "merge") => {
    resolveConflict.mutate({ conflictId, choice });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conflict Review</h1>
        <p className="text-muted-foreground mt-2">
          Resolve data conflicts between CRM and Amplemarket
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !conflicts || conflicts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium">No conflicts to review</p>
              <p className="text-sm mt-2">All data is synchronized</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {conflicts.map((conflict: any) => (
            <Card key={conflict.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {conflict.recordType === "person" ? "Contact" : "Account"} Conflict
                      <Badge variant="secondary">{conflict.field}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {conflict.recordType === "person"
                        ? `${conflict.crmData.name} (${conflict.crmData.email})`
                        : conflict.crmData.name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CRM Data */}
                  <Card className="border-2 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                          CRM Data
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(conflict.crmData).map(([key, value]: [string, any]) => (
                        <div key={key} className="text-sm">
                          <span className="text-muted-foreground capitalize">{key}:</span>
                          <p className="font-medium">{value || "—"}</p>
                        </div>
                      ))}
                      <Button
                        className="w-full mt-4"
                        variant="outline"
                        onClick={() => handleResolve(conflict.id, "crm")}
                        disabled={resolveConflict.isPending}
                      >
                        Keep CRM Data
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-8 h-8 text-muted-foreground" />
                  </div>

                  {/* Amplemarket Data */}
                  <Card className="border-2 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                          Amplemarket Data
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(conflict.amplemarketData).map(([key, value]: [string, any]) => (
                        <div key={key} className="text-sm">
                          <span className="text-muted-foreground capitalize">{key}:</span>
                          <p className="font-medium">{value || "—"}</p>
                        </div>
                      ))}
                      <Button
                        className="w-full mt-4"
                        onClick={() => handleResolve(conflict.id, "amplemarket")}
                        disabled={resolveConflict.isPending}
                      >
                        Keep Amplemarket Data
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-4 flex justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => handleResolve(conflict.id, "merge")}
                    disabled={resolveConflict.isPending}
                  >
                    {resolveConflict.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Merge Both (Keep Latest)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
