import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Filter, BookTemplate } from "lucide-react";

export type Condition = {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
  value: any;
};

export type ConditionGroup = {
  logic: 'AND' | 'OR';
  rules: Condition[];
};

interface ConditionBuilderProps {
  value: ConditionGroup;
  onChange: (value: ConditionGroup) => void;
}

const CONDITION_TEMPLATES = [
  {
    name: 'High-Value Qualified Leads',
    description: 'Contacts with high scores and significant deal values',
    conditions: {
      logic: 'AND' as const,
      rules: [
        { field: 'contact.score', operator: 'greater_than' as const, value: '80' },
        { field: 'deal.value', operator: 'greater_than' as const, value: '50000' },
      ],
    },
  },
  {
    name: 'Stalled Deals',
    description: 'Deals with no recent activity',
    conditions: {
      logic: 'AND' as const,
      rules: [
        { field: 'activity.count', operator: 'equals' as const, value: '0' },
        { field: 'deal.stage', operator: 'not_equals' as const, value: 'closed' },
      ],
    },
  },
  {
    name: 'Hot Prospects',
    description: 'Engaged contacts with email interactions',
    conditions: {
      logic: 'AND' as const,
      rules: [
        { field: 'email.opened', operator: 'equals' as const, value: 'true' },
        { field: 'email.replied', operator: 'equals' as const, value: 'true' },
        { field: 'contact.score', operator: 'greater_than' as const, value: '70' },
      ],
    },
  },
];

const FIELD_OPTIONS = [
  { value: 'deal.value', label: 'Deal Value' },
  { value: 'deal.stage', label: 'Deal Stage' },
  { value: 'deal.probability', label: 'Deal Probability' },
  { value: 'contact.score', label: 'Contact Score' },
  { value: 'contact.title', label: 'Contact Title' },
  { value: 'contact.company', label: 'Contact Company' },
  { value: 'activity.count', label: 'Activity Count' },
  { value: 'email.opened', label: 'Email Opened' },
  { value: 'email.replied', label: 'Email Replied' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

export function ConditionBuilder({ value, onChange }: ConditionBuilderProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  const applyTemplate = (template: typeof CONDITION_TEMPLATES[0]) => {
    onChange(template.conditions);
    setShowTemplates(false);
  };

  const addCondition = () => {
    onChange({
      ...value,
      rules: [
        ...value.rules,
        { field: 'deal.value', operator: 'equals', value: '' },
      ],
    });
  };

  const removeCondition = (index: number) => {
    onChange({
      ...value,
      rules: value.rules.filter((_, i) => i !== index),
    });
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    onChange({
      ...value,
      rules: value.rules.map((rule, i) =>
        i === index ? { ...rule, ...updates } : rule
      ),
    });
  };

  const toggleLogic = () => {
    onChange({
      ...value,
      logic: value.logic === 'AND' ? 'OR' : 'AND',
    });
  };

  const needsValue = (operator: string) => {
    return !['is_empty', 'is_not_empty'].includes(operator);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Conditions
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <BookTemplate className="h-3 w-3 mr-1" />
            Templates
          </Button>
          {value.rules.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleLogic}
            >
              Logic: {value.logic}
            </Button>
          )}
        </div>
      </div>

      {/* Condition Templates */}
      {showTemplates && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Apply Template</p>
              <div className="grid gap-2">
                {CONDITION_TEMPLATES.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    className="justify-start h-auto py-2 px-3"
                    onClick={() => applyTemplate(template)}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground">{template.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {value.rules.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conditions set. Rule will apply to all triggers.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={addCondition}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Condition
              </Button>
            </CardContent>
          </Card>
        ) : (
          value.rules.map((condition, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="grid gap-3">
                  {index > 0 && (
                    <div className="text-xs font-medium text-muted-foreground text-center">
                      {value.logic}
                    </div>
                  )}
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Field</Label>
                      <Select
                        value={condition.field}
                        onValueChange={(val) => updateCondition(index, { field: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Operator</Label>
                      <Select
                        value={condition.operator}
                        onValueChange={(val: any) => updateCondition(index, { operator: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATOR_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {needsValue(condition.operator) && (
                      <div className="space-y-1">
                        <Label className="text-xs">Value</Label>
                        <Input
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                          placeholder="Enter value"
                        />
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {value.rules.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCondition}
          className="w-full"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Condition
        </Button>
      )}
    </div>
  );
}
