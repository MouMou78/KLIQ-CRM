import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Zap, Plus, Settings, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function Automation() {
  const { data: rules, isLoading, refetch } = trpc.automation.list.useQuery();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleMutation = trpc.automation.toggle.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Automation rule updated");
      setTogglingId(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to update rule: ${error.message}`);
      setTogglingId(null);
    },
  });

  const handleToggle = (ruleId: string, currentStatus: string) => {
    setTogglingId(ruleId);
    toggleMutation.mutate({
      ruleId,
      status: currentStatus === "active" ? "paused" : "active",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const defaultRules = [
    {
      id: "auto-qualify",
      name: "Auto-qualify engaged leads",
      description: "Automatically move leads to 'Qualified' stage after they open 3+ emails and reply",
      triggerType: "email_engagement",
      actionType: "move_stage",
      status: "active",
      isDefault: true,
    },
    {
      id: "meeting-booked",
      name: "Meeting booked notification",
      description: "Send notification when a contact books a meeting",
      triggerType: "meeting_held",
      actionType: "send_notification",
      status: "active",
      isDefault: true,
    },
    {
      id: "no-reply-followup",
      name: "No reply follow-up",
      description: "Create follow-up task if no reply after 5 days",
      triggerType: "no_reply_after_days",
      actionType: "create_task",
      status: "active",
      isDefault: true,
    },
  ];

  const allRules = [...defaultRules, ...(rules || [])];

  return (
    <div className="space-y-6 p-4 md:p-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline Automation</h1>
          <p className="text-muted-foreground mt-2">
            Automate deal progression and notifications based on engagement signals
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      <div className="grid gap-4">
        {allRules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <CardDescription className="mt-1">{rule.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={rule.status === "active" ? "default" : "secondary"}>
                    {rule.status}
                  </Badge>
                  <Switch
                    checked={rule.status === "active"}
                    onCheckedChange={() => handleToggle(rule.id, rule.status)}
                    disabled={togglingId === rule.id || rule.isDefault}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Trigger:</span>
                  <Badge variant="outline" className="capitalize">
                    {rule.triggerType.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Action:</span>
                  <Badge variant="outline" className="capitalize">
                    {rule.actionType.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {allRules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No automation rules configured yet</p>
            <Button className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create First Rule
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">How Automation Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <p className="font-medium mb-1">Trigger Types:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Email Engagement:</strong> Fires when contact opens or replies to emails</li>
              <li><strong>Meeting Held:</strong> Fires when a meeting is completed</li>
              <li><strong>No Reply:</strong> Fires after X days without a reply</li>
              <li><strong>Stage Entered:</strong> Fires when deal enters a specific stage</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Action Types:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Move Stage:</strong> Automatically progress deal to next stage</li>
              <li><strong>Send Notification:</strong> Alert team members</li>
              <li><strong>Create Task:</strong> Generate follow-up action</li>
              <li><strong>Update Field:</strong> Change deal or contact properties</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
