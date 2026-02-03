import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Phone, Building, Briefcase, Plus, MapPin, ExternalLink, TrendingUp, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { EmailActivityTimeline } from "@/components/EmailActivityTimeline";

interface PersonDetailProps {
  personId: string;
}

export default function PersonDetail({ personId }: PersonDetailProps) {
  const { data, isLoading } = trpc.people.get.useQuery({ id: personId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12">Person not found</div>;
  }

  const { person, threads } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-medium text-primary">
              {person.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{person.fullName}</h1>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              {person.companyName && (
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  <span>{person.companyName}</span>
                </div>
              )}
              {person.roleTitle && (
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{person.roleTitle}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Thread
        </Button>
      </div>

      {/* Email Activity Timeline */}
      <EmailActivityTimeline 
        activities={threads.flatMap(thread => 
          thread.moments?.filter(m => 
            m.type === 'email_sent' || m.type === 'email_received' || m.type === 'reply_received'
          ).map(m => ({
            id: m.id,
            type: m.type as 'email_sent' | 'email_received' | 'reply_received',
            timestamp: new Date(m.timestamp),
            metadata: m.metadata as any
          })) || []
        )}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <Mail className="w-4 h-4" />
                Email
              </div>
              <p className="text-sm text-muted-foreground">{person.primaryEmail}</p>
            </div>
            
            {(person.phone || person.mobileNumber || person.workNumber || person.sourcedNumber) && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Phone className="w-4 h-4" />
                  Phone Numbers
                </div>
                <div className="space-y-1">
                  {person.phone && (
                    <p className="text-sm text-muted-foreground">Primary: {person.phone}</p>
                  )}
                  {person.mobileNumber && (
                    <p className="text-sm text-muted-foreground">Mobile: {person.mobileNumber}</p>
                  )}
                  {person.workNumber && (
                    <p className="text-sm text-muted-foreground">Work: {person.workNumber}</p>
                  )}
                  {person.sourcedNumber && (
                    <p className="text-sm text-muted-foreground">Sourced: {person.sourcedNumber}</p>
                  )}
                </div>
              </div>
            )}

            {person.location && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
                <p className="text-sm text-muted-foreground">{person.location}</p>
              </div>
            )}

            {person.linkedinUrl && (
              <div>
                <a
                  href={person.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  LinkedIn Profile
                </a>
              </div>
            )}

            {person.enrichmentSource === "amplemarket" && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <TrendingUp className="w-4 h-4" />
                  Engagement Metrics
                </div>
                <div className="space-y-2">
                  {person.status && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline">{person.status}</Badge>
                    </div>
                  )}
                  {person.numberOfOpens !== null && person.numberOfOpens !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Email Opens</span>
                      <span className="font-medium">{person.numberOfOpens}</span>
                    </div>
                  )}
                  {person.replied && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Replied</span>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                  {person.meetingBooked && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Meeting Booked</span>
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  {person.sequenceName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sequence</span>
                      <span className="font-medium text-xs">{person.sequenceName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {person.tags && person.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {person.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Threads</CardTitle>
            <CardDescription>Conversation history with this person</CardDescription>
          </CardHeader>
          <CardContent>
            {threads && threads.length > 0 ? (
              <div className="space-y-3">
                {threads.map((thread) => (
                  <Link key={thread.id} href={`/threads/${thread.id}`}>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                      <div>
                        <p className="font-medium">{thread.title || `Thread from ${thread.source}`}</p>
                        <p className="text-sm text-muted-foreground">
                          Intent: {thread.intent} • Status: {thread.status}
                        </p>
                      </div>
                      <Badge variant={thread.status === "active" ? "default" : "secondary"}>
                        {thread.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No threads yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
