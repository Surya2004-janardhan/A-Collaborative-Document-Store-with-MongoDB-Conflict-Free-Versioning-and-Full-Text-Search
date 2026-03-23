import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthor {
  id: string | null;
  name: string;
  email: string | null;
}

export interface IRevision {
  version: number;
  updatedAt: Date;
  authorId: string;
  contentDiff: string;
}

export interface IDocument extends Document {
  slug: string;
  title: string;
  content: string;
  version: number;
  tags: string[];
  metadata: {
    author: IAuthor | string; // Mixed type for migration testing
    createdAt: Date;
    updatedAt: Date;
    wordCount: number;
  };
  revision_history: IRevision[];
}

const RevisionSchema = new Schema<IRevision>({
  version: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
  authorId: { type: String, required: true },
  contentDiff: { type: String, required: true },
}, { _id: false });

const DocumentSchema = new Schema<IDocument>({
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  version: { type: Number, default: 1 },
  tags: [{ type: String }],
  metadata: {
    author: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    wordCount: { type: Number, default: 0 },
  },
  revision_history: {
    type: [RevisionSchema],
    default: [],
  },
});

// Full-Text Search Index
DocumentSchema.index({ title: 'text', content: 'text' });

export default mongoose.model<IDocument>('Document', DocumentSchema);
 Riverside
