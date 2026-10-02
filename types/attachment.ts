/** MIME type is stored as text; no binary data or upload flow is implied. */
export type AttachmentRelatedType =
  | "PROJECT"
  | "ENGINEERING_LOG"
  | "KNOWLEDGE"
  | "REVIEW"
  | "COURSE"
  | "ASSIGNMENT"
  | "EXPERIMENT";

export interface Attachment {
  id: string;
  url: string;
  type: string;
  relatedType: AttachmentRelatedType;
  relatedId: string;
}
