import { getDb } from "./db";
import { documents, documentVersions, documentFolders } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { storagePut } from "./storage";

/**
 * Upload a document to S3 and save metadata
 */
export async function uploadDocument(data: {
  tenantId: string;
  name: string;
  description?: string;
  fileBuffer: Buffer;
  mimeType: string;
  linkedEntityType?: "contact" | "account" | "deal" | "task";
  linkedEntityId?: string;
  folderId?: string;
  uploadedById: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const documentId = randomUUID();
  const fileKey = `${data.tenantId}/documents/${documentId}/${data.name}`;

  // Upload to S3
  const { url: fileUrl } = await storagePut(fileKey, data.fileBuffer, data.mimeType);

  // Save document metadata
  await db.insert(documents).values({
    id: documentId,
    tenantId: data.tenantId,
    name: data.name,
    description: data.description || null,
    fileKey,
    fileUrl,
    mimeType: data.mimeType,
    fileSize: data.fileBuffer.length,
    version: 1,
    linkedEntityType: data.linkedEntityType || null,
    linkedEntityId: data.linkedEntityId || null,
    folderId: data.folderId || null,
    uploadedById: data.uploadedById,
  });

  // Create initial version record
  await db.insert(documentVersions).values({
    id: randomUUID(),
    documentId,
    version: 1,
    fileKey,
    fileUrl,
    fileSize: data.fileBuffer.length,
    uploadedById: data.uploadedById,
    changeNote: "Initial upload",
  });

  return { documentId, fileUrl };
}

/**
 * Upload a new version of an existing document
 */
export async function uploadDocumentVersion(
  documentId: string,
  fileBuffer: Buffer,
  uploadedById: string,
  changeNote?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current document
  const doc = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1)
    .then(rows => rows[0]);

  if (!doc) throw new Error("Document not found");

  const newVersion = doc.version + 1;
  const fileKey = `${doc.tenantId}/documents/${documentId}/v${newVersion}/${doc.name}`;

  // Upload new version to S3
  const { url: fileUrl } = await storagePut(fileKey, fileBuffer, doc.mimeType || "application/octet-stream");

  // Update document with new version
  await db
    .update(documents)
    .set({
      version: newVersion,
      fileKey,
      fileUrl,
      fileSize: fileBuffer.length,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId));

  // Create version record
  await db.insert(documentVersions).values({
    id: randomUUID(),
    documentId,
    version: newVersion,
    fileKey,
    fileUrl,
    fileSize: fileBuffer.length,
    uploadedById,
    changeNote: changeNote || `Version ${newVersion}`,
  });

  return { version: newVersion, fileUrl };
}

/**
 * Get documents for a tenant
 */
export async function getDocuments(
  tenantId: string,
  folderId?: string | null
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(documents.tenantId, tenantId)];

  if (folderId === null) {
    // Root folder (no parent)
    conditions.push(eq(documents.folderId, null as any));
  } else if (folderId) {
    conditions.push(eq(documents.folderId, folderId));
  }

  return db
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.updatedAt));
}

/**
 * Get documents linked to an entity
 */
export async function getEntityDocuments(
  tenantId: string,
  entityType: "contact" | "account" | "deal" | "task",
  entityId: string
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.tenantId, tenantId),
        eq(documents.linkedEntityType, entityType),
        eq(documents.linkedEntityId, entityId)
      )
    )
    .orderBy(desc(documents.updatedAt));
}

/**
 * Get document version history
 */
export async function getDocumentVersions(documentId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.version));
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete version history
  await db
    .delete(documentVersions)
    .where(eq(documentVersions.documentId, documentId));

  // Delete document
  await db
    .delete(documents)
    .where(eq(documents.id, documentId));

  // Note: In production, also delete files from S3
}

/**
 * Create a folder
 */
export async function createFolder(data: {
  tenantId: string;
  name: string;
  parentFolderId?: string;
  createdById: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const folderId = randomUUID();

  await db.insert(documentFolders).values({
    id: folderId,
    tenantId: data.tenantId,
    name: data.name,
    parentFolderId: data.parentFolderId || null,
    createdById: data.createdById,
  });

  return folderId;
}

/**
 * Get folders for a tenant
 */
export async function getFolders(tenantId: string, parentFolderId?: string | null) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(documentFolders.tenantId, tenantId)];

  if (parentFolderId === null) {
    // Root folders
    conditions.push(eq(documentFolders.parentFolderId, null as any));
  } else if (parentFolderId) {
    conditions.push(eq(documentFolders.parentFolderId, parentFolderId));
  }

  return db
    .select()
    .from(documentFolders)
    .where(and(...conditions))
    .orderBy(documentFolders.name);
}

/**
 * Delete a folder
 */
export async function deleteFolder(folderId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Move documents to root
  await db
    .update(documents)
    .set({ folderId: null })
    .where(eq(documents.folderId, folderId));

  // Delete folder
  await db
    .delete(documentFolders)
    .where(eq(documentFolders.id, folderId));
}
