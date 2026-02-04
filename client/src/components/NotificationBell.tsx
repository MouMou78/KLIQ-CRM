import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

export function NotificationBell() {
  const [previousCount, setPreviousCount] = useState(0);
  const [showNewIndicator, setShowNewIndicator] = useState(false);
  
  // Enable real-time polling every 10 seconds
  const { data: notifications } = trpc.notifications.getUnread.useQuery(undefined, {
    refetchInterval: 10000, // Poll every 10 seconds
    refetchIntervalInBackground: true, // Continue polling when tab is not focused
  });
  
  const utils = trpc.useUtils();
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnread.invalidate();
    },
  });
  
  // Show visual indicator when new notifications arrive
  useEffect(() => {
    const currentCount = notifications?.length || 0;
    if (currentCount > previousCount && previousCount > 0) {
      setShowNewIndicator(true);
      // Hide indicator after 3 seconds
      const timer = setTimeout(() => setShowNewIndicator(false), 3000);
      return () => clearTimeout(timer);
    }
    setPreviousCount(currentCount);
  }, [notifications?.length, previousCount]);

  type Notification = {
    id: string;
    tenantId: string;
    userId: string;
    type: "mention" | "reply" | "reaction";
    messageId: string | null;
    channelId: string | null;
    content: string | null;
    isRead: boolean;
    createdAt: Date;
  };

  const unreadCount = notifications?.length || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`h-5 w-5 ${showNewIndicator ? 'animate-pulse text-primary' : ''}`} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          {showNewIndicator && (
            <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full animate-ping" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                notifications?.forEach((notification) => {
                  markAsReadMutation.mutate({ id: notification.id });
                });
              }}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className="px-4 py-3 hover:bg-accent cursor-pointer"
                  onClick={() => markAsReadMutation.mutate({ id: notification.id })}
                >
                  <p className="text-sm font-medium capitalize">{notification.type}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.content || "New notification"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
