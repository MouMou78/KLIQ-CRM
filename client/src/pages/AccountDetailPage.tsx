import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Building2, Globe, MapPin, Users, ArrowLeft, Mail, Phone, Briefcase } from "lucide-react";
import { Link, useParams } from "wouter";

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const accountId = params.id!;

  const { data: account, isLoading } = trpc.accounts.get.useQuery({ id: accountId });
  const { data: contacts } = trpc.people.list.useQuery();

  // Filter contacts by accountId
  const linkedContacts = contacts?.filter((c: any) => c.accountId === accountId) || [];

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Account not found</h2>
          <Link href="/accounts">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Accounts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/accounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{account.name}</h1>
            {account.industry && (
              <p className="text-muted-foreground mt-1">{account.industry}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {account.domain && (
                <div className="flex items-start gap-3">
                  <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a 
                      href={`https://${account.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline"
                    >
                      {account.domain}
                    </a>
                  </div>
                </div>
              )}
              {account.headquarters && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Headquarters</p>
                    <p className="text-sm font-medium">{account.headquarters}</p>
                  </div>
                </div>
              )}
              {account.employees && (
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Employees</p>
                    <p className="text-sm font-medium">{account.employees}</p>
                  </div>
                </div>
              )}
              {account.revenue && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-sm font-medium">{account.revenue}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Linked Contacts */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contacts ({linkedContacts.length})
            </h2>
            {linkedContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No contacts linked to this account yet
              </p>
            ) : (
              <div className="space-y-3">
                {linkedContacts.map((contact: any) => (
                  <Link key={contact.id} href={`/people/${contact.id}`}>
                    <Card className="p-4 hover:bg-accent cursor-pointer transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          {contact.title && (
                            <p className="text-sm text-muted-foreground">{contact.title}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {contact.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="hidden md:inline">{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span className="hidden md:inline">{contact.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Quick Stats */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{linkedContacts.length}</p>
              </div>
              {account.lifecycleStage && (
                <div>
                  <p className="text-sm text-muted-foreground">Lifecycle Stage</p>
                  <p className="text-sm font-medium">{account.lifecycleStage}</p>
                </div>
              )}
              {account.fitScore !== null && account.fitScore !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Fit Score</p>
                  <p className="text-2xl font-bold">{account.fitScore}</p>
                </div>
              )}
            </div>
          </Card>

          {account.technologies && (account.technologies as string[]).length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Technologies</h3>
              <div className="flex flex-wrap gap-2">
                {(account.technologies as string[]).map((tech, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
