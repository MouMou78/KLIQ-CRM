import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Phone, Building, Briefcase, Plus } from "lucide-react";
import { Link } from "wouter";

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
            
            {person.phone && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <Phone className="w-4 h-4" />
                  Phone
                </div>
                <p className="text-sm text-muted-foreground">{person.phone}</p>
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
