import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Copy, Trash2, Eye } from "lucide-react";

type TemplateBlock = {
  type: "text" | "image" | "button" | "divider" | "spacer";
  content?: string;
  styles?: Record<string, any>;
  url?: string;
  alt?: string;
};

export function EmailTemplates() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  const { data: templates, isLoading, refetch } = trpc.emailTemplates.list.useQuery();

  const createMutation = trpc.emailTemplates.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
      setFormData({
        name: "",
        description: "",
        subject: "",
        content: [{ type: "text", content: "" }],
        category: "",
      });
    },
  });

  const deleteMutation = trpc.emailTemplates.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const duplicateMutation = trpc.emailTemplates.duplicate.useMutation({
    onSuccess: () => refetch(),
  });

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    subject: string;
    content: TemplateBlock[];
    category: string;
  }>({
    name: "",
    description: "",
    subject: "",
    content: [{ type: "text", content: "" }],
    category: "",
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const addBlock = (type: TemplateBlock["type"]) => {
    setFormData({
      ...formData,
      content: [...formData.content, { type, content: "" }],
    });
  };

  const updateBlock = (index: number, updates: Partial<TemplateBlock>) => {
    const newContent = [...formData.content];
    newContent[index] = { ...newContent[index]!, ...updates };
    setFormData({ ...formData, content: newContent });
  };

  const removeBlock = (index: number) => {
    setFormData({
      ...formData,
      content: formData.content.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage reusable email templates
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Welcome Email"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Sent to new customers"
                />
              </div>

              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Welcome to {{company_name}}"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Onboarding"
                />
              </div>

              <div>
                <Label>Content Blocks</Label>
                <div className="space-y-3 mt-2">
                  {formData.content.map((block, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <Select
                          value={block.type}
                          onValueChange={(value: any) => updateBlock(index, { type: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="button">Button</SelectItem>
                            <SelectItem value="divider">Divider</SelectItem>
                            <SelectItem value="spacer">Spacer</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex-1">
                          {block.type === "text" && (
                            <Textarea
                              value={block.content || ""}
                              onChange={(e) => updateBlock(index, { content: e.target.value })}
                              placeholder="Enter text content (use {{variable}} for personalization)"
                              rows={3}
                            />
                          )}
                          {block.type === "image" && (
                            <div className="space-y-2">
                              <Input
                                value={block.url || ""}
                                onChange={(e) => updateBlock(index, { url: e.target.value })}
                                placeholder="Image URL"
                              />
                              <Input
                                value={block.alt || ""}
                                onChange={(e) => updateBlock(index, { alt: e.target.value })}
                                placeholder="Alt text"
                              />
                            </div>
                          )}
                          {block.type === "button" && (
                            <div className="space-y-2">
                              <Input
                                value={block.content || ""}
                                onChange={(e) => updateBlock(index, { content: e.target.value })}
                                placeholder="Button text"
                              />
                              <Input
                                value={block.url || ""}
                                onChange={(e) => updateBlock(index, { url: e.target.value })}
                                placeholder="Button URL"
                              />
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBlock(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => addBlock("text")}>
                    + Text
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock("image")}>
                    + Image
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock("button")}>
                    + Button
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock("divider")}>
                    + Divider
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock("spacer")}>
                    + Spacer
                  </Button>
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full">
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates?.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <p className="text-muted-foreground">No templates yet</p>
          </Card>
        ) : (
          templates?.map((template: any) => (
            <Card key={template.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  )}
                </div>
                {template.category && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {template.category}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Subject: {template.subject}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => duplicateMutation.mutate({ id: template.id })}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate({ id: template.id })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <p className="text-sm mt-1">{previewTemplate?.subject}</p>
            </div>
            <div>
              <Label>Content Blocks</Label>
              <div className="space-y-2 mt-2">
                {previewTemplate?.content?.map((block: any, index: number) => (
                  <div key={index} className="p-3 border rounded">
                    <span className="text-xs font-semibold uppercase">{block.type}</span>
                    {block.content && <p className="text-sm mt-1">{block.content}</p>}
                    {block.url && <p className="text-xs text-muted-foreground mt-1">URL: {block.url}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
