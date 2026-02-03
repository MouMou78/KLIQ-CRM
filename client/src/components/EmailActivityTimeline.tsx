import { Mail, MailOpen, Reply, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EmailActivity {
  id: string;
  type: "email_sent" | "email_received" | "reply_received";
  timestamp: Date;
  metadata?: {
    subject?: string;
    opened?: boolean;
    openedAt?: Date;
    repliedAt?: Date;
  };
}

interface EmailActivityTimelineProps {
  activities: EmailActivity[];
}

export function EmailActivityTimeline({ activities }: EmailActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Activity</CardTitle>
          <CardDescription>Track email engagement over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No email activity yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort activities by timestamp descending
  const sortedActivities = [...activities].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const getActivityIcon = (type: EmailActivity["type"]) => {
    switch (type) {
      case "email_sent":
        return <Mail className="w-4 h-4" />;
      case "email_received":
        return <MailOpen className="w-4 h-4" />;
      case "reply_received":
        return <Reply className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getActivityLabel = (type: EmailActivity["type"]) => {
    switch (type) {
      case "email_sent":
        return "Email Sent";
      case "email_received":
        return "Email Received";
      case "reply_received":
        return "Reply Received";
      default:
        return "Email Activity";
    }
  };

  const getActivityColor = (type: EmailActivity["type"]) => {
    switch (type) {
      case "email_sent":
        return "bg-blue-500";
      case "email_received":
        return "bg-green-500";
      case "reply_received":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Activity</CardTitle>
        <CardDescription>
          Track email engagement over time ({activities.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline items */}
          <div className="space-y-6">
            {sortedActivities.map((activity, index) => (
              <div key={activity.id} className="relative pl-10">
                {/* Timeline dot */}
                <div
                  className={`absolute left-2.5 w-3 h-3 rounded-full ${getActivityColor(
                    activity.type
                  )} ring-4 ring-background`}
                />

                {/* Activity content */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1.5 rounded-md ${getActivityColor(activity.type)} bg-opacity-10`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <span className="font-medium text-sm">
                        {getActivityLabel(activity.type)}
                      </span>
                    </div>

                    {activity.metadata?.subject && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {activity.metadata.subject}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {activity.metadata?.opened && (
                        <Badge variant="secondary" className="text-xs">
                          <MailOpen className="w-3 h-3 mr-1" />
                          Opened
                          {activity.metadata.openedAt &&
                            ` ${formatTimestamp(activity.metadata.openedAt)}`}
                        </Badge>
                      )}
                      {activity.metadata?.repliedAt && (
                        <Badge variant="secondary" className="text-xs">
                          <Reply className="w-3 h-3 mr-1" />
                          Replied {formatTimestamp(activity.metadata.repliedAt)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
