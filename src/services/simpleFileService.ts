export interface SimpleUploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  status: 'processing' | 'completed' | 'error';
  uploadedAt: Date;
}

export class SimpleFileService {
  private files: Map<string, SimpleUploadedFile> = new Map();

  async processFile(file: File): Promise<SimpleUploadedFile> {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const uploadedFile: SimpleUploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      content: '',
      status: 'processing',
      uploadedAt: new Date()
    };

    this.files.set(fileId, uploadedFile);

    try {
      // Extract content based on file type
      let content = '';
      
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        content = await this.readTextFile(file);
        console.log('📄 Text file processed:', file.name, 'Content length:', content.length);
      } else if (file.type === 'application/pdf') {
        // For PDFs, provide a more detailed placeholder that encourages better responses
        content = `PDF Document: ${file.name}
File Size: ${(file.size / 1024).toFixed(1)} KB
Uploaded: ${new Date().toLocaleString()}

Note: This is a PDF document uploaded by the user. While full PDF text extraction is not available in this demo, please provide analysis based on the user's specific query about this document. If the query asks about document content, images, charts, or specific sections, acknowledge that you would need the extracted text to provide detailed analysis, but offer relevant insights about the topic the user is asking about.

For demonstration purposes, assume this PDF contains relevant information related to the user's query.`;
        console.log('📄 PDF file processed:', file.name);
      } else {
        content = `Document: ${file.name}
File Type: ${file.type}
File Size: ${(file.size / 1024).toFixed(1)} KB
Uploaded: ${new Date().toLocaleString()}

This document was uploaded by the user for analysis. Please provide insights based on the user's query while acknowledging the document type and any limitations in processing this specific file format.`;
        console.log('📄 Other file processed:', file.name, 'Type:', file.type);
      }

      // Update with content
      uploadedFile.content = content;
      uploadedFile.status = 'completed';
      this.files.set(fileId, uploadedFile);

      return uploadedFile;
    } catch (error) {
      uploadedFile.status = 'error';
      this.files.set(fileId, uploadedFile);
      throw new Error(`Failed to process file: ${error}`);
    }
  }

  private readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  getFiles(): SimpleUploadedFile[] {
    return Array.from(this.files.values()).sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }

  getFileContent(fileId: string): string | null {
    const file = this.files.get(fileId);
    return file?.content || null;
  }

  deleteFile(fileId: string): boolean {
    return this.files.delete(fileId);
  }

  clearAllFiles(): void {
    this.files.clear();
  }

  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'text/plain',
      'text/csv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size must be less than ${maxSize / (1024 * 1024)}MB`
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload TXT, CSV, PDF, DOC, or DOCX files.'
      };
    }

    return { isValid: true };
  }
}

export const simpleFileService = new SimpleFileService();