import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Store, Search, Download, Check, Play, Zap, Filter, Star, TrendingUp, User, Edit, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";

export default function TemplatesMarketplace() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [customization, setCustomization] = useState<{
    name: string;
    priority: number;
  }>({ name: "", priority: 5 });
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: "" });
  const [saveForm, setSaveForm] = useState({
    name: "",
    description: "",
    category: "lead_nurturing" as const,
    isPublic: false,
  });

  const { data: templates, isLoading } = trpc.automation.getTemplates.useQuery();
  const { data: installedRules } = trpc.automation.getRules.useQuery();
  const { data: myTemplates, refetch: refetchMyTemplates } = trpc.automation.getMyTemplates.useQuery();
  const { data: publicUserTemplates } = trpc.automation.getPublicTemplates.useQuery();
  
  const installMutation = trpc.automation.installTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template installed successfully");
      setIsPreviewOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to install template: ${error.message}`);
    },
  });

  const submitReviewMutation = trpc.automation.submitReview.useMutation({
    onSuccess: () => {
      toast.success("Review submitted successfully");
      setIsReviewOpen(false);
      setReviewForm({ rating: 5, review: "" });
    },
    onError: (error: any) => {
      toast.error(`Failed to submit review: ${error.message}`);
    },
  });

  const deleteTemplateMutation = trpc.automation.deleteMyTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      refetchMyTemplates();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const categories = [
    { value: "all", label: "All Templates" },
    { value: "lead_nurturing", label: "Lead Nurturing" },
    { value: "deal_management", label: "Deal Management" },
    { value: "task_automation", label: "Task Automation" },
    { value: "notifications", label: "Notifications" },
  ];

  const filteredTemplates = templates?.filter((template: any) => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const isTemplateInstalled = (templateId: string) => {
    return installedRules?.some((rule: any) => 
      rule.name.includes(templates?.find((t: any) => t.id === templateId)?.name)
    );
  };

  const handlePreview = (template: any) => {
    setSelectedTemplate(template);
    setCustomization({ name: template.name, priority: template.priority });
    setIsPreviewOpen(true);
  };

  const handleInstall = () => {
    if (!selectedTemplate) return;
    installMutation.mutate({
      templateId: selectedTemplate.id,
      name: customization.name,
      priority: customization.priority,
    });
  };

  const handleSubmitReview = () => {
    if (!selectedTemplate) return;
    submitReviewMutation.mutate({
      templateId: selectedTemplate.id,
      rating: reviewForm.rating,
      review: reviewForm.review,
    });
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate({ id });
    }
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      email_opened: "Email Opened",
      email_replied: "Email Replied",
      no_reply_after_days: "No Reply After Days",
      meeting_held: "Meeting Held",
      stage_entered: "Stage Changed",
      deal_value_threshold: "Deal Value Threshold",
      scheduled: "Scheduled (Time-based)",
    };
    return labels[triggerType] || triggerType;
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      move_stage: "Move to Stage",
      send_notification: "Send Notification",
      create_task: "Create Task",
      enroll_sequence: "Enroll in Sequence",
      update_field: "Update Field",
    };
    return labels[actionType] || actionType;
  };

  const TemplateCard = ({ template, showActions = false, isUserTemplate = false }: any) => {
    const installed = !isUserTemplate && isTemplateInstalled(template.id);
    const { data: rating } = trpc.automation.getRating.useQuery(
      { templateId: template.id },
      { enabled: !isUserTemplate }
    );
    const { data: analytics } = trpc.automation.getAnalytics.useQuery(
      { templateId: template.id },
      { enabled: !isUserTemplate }
    );

    return (
      <Card className={installed ? "border-primary/50 bg-primary/5" : ""}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {installed && (
                  <Badge variant="secondary" className="gap-1">
                    <Check className="h-3 w-3" />
                    Installed
                  </Badge>
                )}
                {isUserTemplate && template.isPublic && (
                  <Badge variant="secondary" className="gap-1">
                    <Globe className="h-3 w-3" />
                    Public
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">
                  {getCategoryLabel(template.category)}
                </Badge>
                {!isUserTemplate && rating && rating.reviewCount > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{rating.avgRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({rating.reviewCount})</span>
                  </div>
                )}
              </div>
              <CardDescription className="mt-2">{template.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Play className="h-4 w-4 text-primary" />
              <span className="font-medium">When:</span>
              <span className="text-muted-foreground">{getTriggerLabel(template.triggerType)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">Then:</span>
              <span className="text-muted-foreground">{getActionLabel(template.actionType)}</span>
            </div>
            {!isUserTemplate && analytics && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  {analytics.installCount} installs
                </div>
                {analytics.installCount > 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {Math.round((analytics.successCount / (analytics.successCount + analytics.failureCount)) * 100)}% success
                  </div>
                )}
              </div>
            )}
            {template.tags && (
              <div className="flex flex-wrap gap-1 pt-2">
                {template.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {showActions && isUserTemplate ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePreview(template)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePreview(template)}
                  >
                    Preview
                  </Button>
                  {!installed && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePreview(template)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Install
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8" />
            Automation Templates
          </h1>
          <p className="text-muted-foreground mt-2">
            Browse and install pre-configured automation workflows for common CRM scenarios
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="my-templates">My Templates</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates?.map((template: any) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>

          {filteredTemplates?.length === 0 && (
            <Card className="p-12 text-center">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No templates found</p>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Templates you've created from your automation rules
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myTemplates?.map((template: any) => (
              <TemplateCard key={template.id} template={template} showActions isUserTemplate />
            ))}
          </div>

          {myTemplates?.length === 0 && (
            <Card className="p-12 text-center">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No custom templates yet</p>
              <p className="text-muted-foreground">
                Create a template from any automation rule in Workflow Automation
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          <p className="text-muted-foreground">
            Templates shared by the community
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publicUserTemplates?.map((template: any) => (
              <TemplateCard key={template.id} template={template} isUserTemplate />
            ))}
          </div>

          {publicUserTemplates?.length === 0 && (
            <Card className="p-12 text-center">
              <Globe className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No community templates yet</p>
              <p className="text-muted-foreground">
                Be the first to share a template with the community
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4">{selectedTemplate.description}</p>
                <div className="flex gap-2 mb-4">
                  <Badge variant="outline">{getCategoryLabel(selectedTemplate.category)}</Badge>
                  {selectedTemplate.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" />
                  <span className="font-medium">Trigger:</span>
                  <span>{getTriggerLabel(selectedTemplate.triggerType)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-medium">Action:</span>
                  <span>{getActionLabel(selectedTemplate.actionType)}</span>
                </div>
                {selectedTemplate.conditions?.rules?.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="font-medium mb-2">Conditions ({selectedTemplate.conditions.logic}):</p>
                    <ul className="text-sm space-y-1">
                      {selectedTemplate.conditions.rules.map((rule: any, idx: number) => (
                        <li key={idx} className="text-muted-foreground">
                          {rule.field} {rule.operator} {rule.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    value={customization.name}
                    onChange={(e) => setCustomization({ ...customization, name: e.target.value })}
                    placeholder="Enter custom name"
                  />
                </div>
                <div>
                  <Label>Priority (1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={customization.priority}
                    onChange={(e) => setCustomization({ ...customization, priority: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewOpen(true)}>
              <Star className="h-4 w-4 mr-2" />
              Write Review
            </Button>
            <Button onClick={handleInstall} disabled={installMutation.isPending}>
              {installMutation.isPending ? "Installing..." : "Install Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${
                      star <= reviewForm.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Review (optional)</Label>
              <Textarea
                value={reviewForm.review}
                onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                placeholder="Share your experience with this template..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={submitReviewMutation.isPending}>
              {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
