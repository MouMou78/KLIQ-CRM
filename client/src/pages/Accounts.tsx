import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search, Building2, Users, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Accounts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    domain: "",
    industry: "",
    headquarters: "",
  });

  const { data: accounts, isLoading } = trpc.accounts.list.useQuery();
  const createMutation = trpc.accounts.create.useMutation({
    onSuccess: () => {
      setIsCreateOpen(false);
      setNewAccount({ name: "", domain: "", industry: "", headquarters: "" });
      trpc.useUtils().accounts.list.invalidate();
    },
  });

  const filteredAccounts = accounts?.filter((account: any) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (!newAccount.name.trim()) return;
    createMutation.mutate(newAccount);
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your company accounts and organizations
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <Label htmlFor="domain">Website Domain</Label>
                <Input
                  id="domain"
                  value={newAccount.domain}
                  onChange={(e) => setNewAccount({ ...newAccount, domain: e.target.value })}
                  placeholder="example.com"
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={newAccount.industry}
                  onChange={(e) => setNewAccount({ ...newAccount, industry: e.target.value })}
                  placeholder="Technology"
                />
              </div>
              <div>
                <Label htmlFor="headquarters">Headquarters</Label>
                <Input
                  id="headquarters"
                  value={newAccount.headquarters}
                  onChange={(e) => setNewAccount({ ...newAccount, headquarters: e.target.value })}
                  placeholder="San Francisco, CA"
                />
              </div>
              <Button 
                onClick={handleCreate} 
                disabled={!newAccount.name.trim() || createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts by name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading accounts...</div>
      ) : filteredAccounts && filteredAccounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => (
            <Link key={account.id} href={`/accounts/${account.id}`}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{account.name}</h3>
                    {account.industry && (
                      <p className="text-sm text-muted-foreground mt-1">{account.industry}</p>
                    )}
                    <div className="flex flex-col gap-2 mt-4">
                      {(account as any).domain && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{(account as any).domain}</span>
                        </div>
                      )}
                      {(account as any).headquarters && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{(account as any).headquarters}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No accounts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Try adjusting your search" : "Get started by creating your first account"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Account
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
