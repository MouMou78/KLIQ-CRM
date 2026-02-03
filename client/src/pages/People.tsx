import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { AddPersonDialog } from "@/components/AddPersonDialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function People() {
  const { data: people, isLoading } = trpc.people.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPeople = people?.filter((person) =>
    person.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.primaryEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">People</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            Manage your contacts and relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/people/import">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </Link>
          <AddPersonDialog />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>
            Search and view all people in your CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPeople && filteredPeople.length > 0 ? (
            <div className="space-y-2">
              {filteredPeople.map((person) => (
                <Link key={person.id} href={`/people/${person.id}`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors gap-2 md:gap-0">
                    <div className="flex-1 w-full md:w-auto">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-primary">
                            {person.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{person.fullName}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{person.primaryEmail}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-left md:text-right space-y-1 w-full md:w-auto pl-13 md:pl-0">
                      {person.companyName && (
                        <p className="text-sm font-medium">{person.companyName}</p>
                      )}
                      {person.roleTitle && (
                        <p className="text-sm text-muted-foreground">{person.roleTitle}</p>
                      )}
                      {person.location && (
                        <p className="text-xs text-muted-foreground">{person.location}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No people found matching your search" : "No people yet. Add your first contact!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
