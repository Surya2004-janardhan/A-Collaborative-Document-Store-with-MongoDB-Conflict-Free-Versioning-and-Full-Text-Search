import { Request, Response } from 'express';
import Document from '../models/Document';

// 3.2 POST /api/documents
export const createDocument = async (req: Request, res: Response) => {
  try {
    const { title, content, tags, authorName, authorEmail } = req.body;
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now().toString().slice(-4);

    const newDoc = new Document({
      slug,
      title,
      content,
      tags,
      version: 1,
      metadata: {
        author: {
          id: `user-${Math.floor(Math.random() * 1000)}`,
          name: authorName,
          email: authorEmail || null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: content.split(/\s+/).length,
      },
      revision_history: [{
        version: 1,
        updatedAt: new Date(),
        authorId: 'system',
        contentDiff: 'Created document',
      }],
    });

    await newDoc.save();
    return res.status(201).json(newDoc);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// 3.2 GET /api/documents/:slug
export const getDocumentBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const document = await Document.findOne({ slug });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // [PHASE 4 Placeholder: Lazy migration logic will go here]
    return res.status(200).json(document);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// 3.2 DELETE /api/documents/:slug
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await Document.findOneAndDelete({ slug });
    
    if (!result) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    return res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// 3.3 PUT /api/documents/:slug (OCC)
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { title, content, version: expectedVersion } = req.body;
    const newVersion = expectedVersion + 1;

    // Atomic update using OCC pattern
    const updatedDoc = await Document.findOneAndUpdate(
      { slug, version: expectedVersion },
      {
        $set: { 
          title, 
          content, 
          'metadata.updatedAt': new Date(),
          'metadata.wordCount': content.split(/\s+/).length,
        },
        $inc: { version: 1 },
        $push: {
          revision_history: {
            $each: [{
              version: newVersion,
              updatedAt: new Date(),
              authorId: 'current-user', // Mock user
              contentDiff: 'User update',
            }],
            $slice: -20, // Capped array: keep last 20
          },
        },
      },
      { new: true } // Return the updated document
    );

    if (updatedDoc) {
      return res.status(200).json(updatedDoc);
    }

    // Conflict detection: if update failed, it's either 404 or 409
    const latestDoc = await Document.findOne({ slug });
    if (!latestDoc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Version mismatch
    return res.status(409).json(latestDoc);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
