import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useRoute } from "wouter";

export default function PublicLeadCapture() {
  const [, params] = useRoute("/public/e/:slug");
  const slug = params?.slug || "";
  
  // For now, we'll need to get tenant ID somehow - in real app this would be from domain or URL
  const [tenantId] = useState("demo-tenant");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: event, isLoading } = trpc.events.getPublic.useQuery(
    { slug, tenantId },
    { enabled: !!slug }
  );

  const submitLead = trpc.events.submitLead.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) return;
    
    await submitLead.mutateAsync({
      slug,
      tenantId,
      formData,
    });
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Event not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Thank You!</h2>
              <p className="text-muted-foreground mt-2">
                Your information has been saved. We'll be in touch soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{event.name}</CardTitle>
          <CardDescription>Please fill out the form below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {event.formSchema?.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    required={field.required}
                    value={formData[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    rows={4}
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type}
                    required={field.required}
                    value={formData[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}

            <Button type="submit" className="w-full" disabled={submitLead.isPending}>
              {submitLead.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
