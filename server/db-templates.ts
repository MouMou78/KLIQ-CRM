import { getDb } from "./db";
import { emailTemplates } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export type TemplateBlock = {
  type: "text" | "image" | "button" | "divider" | "spacer";
  content?: string;
  styles?: Record<string, any>;
  url?: string;
  alt?: string;
};

export async function createTemplate(data: {
  tenantId: string;
  name: string;
  description?: string;
  subject: string;
  content: TemplateBlock[];
  variables?: string[];
  category?: string;
  createdById: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.insert(emailTemplates).values({
    id,
    ...data,
  });

  return id;
}

export async function getTemplatesByTenant(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.tenantId, tenantId))
    .orderBy(desc(emailTemplates.createdAt));
}

export async function getTemplateById(id: string) {
  const db = await getDb();
  if (!db) return null;

  const templates = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, id))
    .limit(1);

  return templates[0] || null;
}

export async function updateTemplate(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    subject: string;
    content: TemplateBlock[];
    variables: string[];
    category: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(emailTemplates)
    .set(data)
    .where(eq(emailTemplates.id, id));

  return true;
}

export async function deleteTemplate(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(emailTemplates)
    .where(eq(emailTemplates.id, id));

  return true;
}

export async function duplicateTemplate(id: string, tenantId: string, createdById: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const original = await getTemplateById(id);
  if (!original) throw new Error("Template not found");

  const newId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.insert(emailTemplates).values({
    ...original,
    id: newId,
    name: `${original.name} (Copy)`,
    tenantId,
    createdById,
  });

  return newId;
}

/**
 * Render template with variables
 */
export function renderTemplate(
  template: { subject: string; content: TemplateBlock[] },
  variables: Record<string, string>
): { subject: string; html: string } {
  // Replace variables in subject
  let subject = template.subject;
  Object.entries(variables).forEach(([key, value]) => {
    subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  // Render blocks to HTML
  const html = template.content.map(block => {
    switch (block.type) {
      case "text":
        let text = block.content || "";
        Object.entries(variables).forEach(([key, value]) => {
          text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        return `<div style="${blockStylesToCSS(block.styles)}">${text}</div>`;
      
      case "image":
        return `<img src="${block.url}" alt="${block.alt || ''}" style="${blockStylesToCSS(block.styles)}" />`;
      
      case "button":
        return `<a href="${block.url}" style="display: inline-block; ${blockStylesToCSS(block.styles)}">${block.content}</a>`;
      
      case "divider":
        return `<hr style="${blockStylesToCSS(block.styles || { borderTop: '1px solid #ddd', margin: '20px 0' })}" />`;
      
      case "spacer":
        return `<div style="height: ${block.styles?.height || '20px'}"></div>`;
      
      default:
        return "";
    }
  }).join('\n');

  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
        ${html}
      </body>
      </html>
    `,
  };
}

function blockStylesToCSS(styles?: Record<string, any>): string {
  if (!styles) return "";
  return Object.entries(styles)
    .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
    .join('; ');
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
