import { supabase } from '@/integrations/supabase/client';
import { databaseService } from './databaseService';

export interface UploadedFile {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  content_text: string | null;
  status: 'processing' | 'completed' | 'error';
  created_at: string;
  user_id: string;
}

export class FileUploadService {
  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private allowedTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv'
  ];

  async uploadFile(file: File): Promise<UploadedFile | null> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const userId = databaseService.getCurrentUserId();
      if (!userId) {
        throw new Error('User must be logged in to upload files');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `documents/${userId}/${fileName}`;

      // Upload to Supabase Storage
      console.log('Uploading file to storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Save to database
      console.log('Saving file metadata to database...');
      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          filename: file.name,
          file_path: filePath,
          file_size: file.size,
          status: 'processing'
        })
        .select('*')
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Clean up uploaded file
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Process file content in background
      this.processFileContent(dbData.id, file, filePath);

      return dbData;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  private validateFile(file: File): { isValid: boolean; error?: string } {
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `File size must be less than ${this.maxFileSize / (1024 * 1024)}MB`
      };
    }

    if (!this.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload PDF, TXT, DOC, DOCX, or CSV files.'
      };
    }

    return { isValid: true };
  }

  private async processFileContent(documentId: string, file: File, filePath: string): Promise<void> {
    try {
      let contentText = '';

      if (file.type === 'text/plain' || file.type === 'text/csv') {
        // Process text files
        contentText = await this.readTextFile(file);
      } else if (file.type === 'application/pdf') {
        // For PDF files, we'll use a placeholder for now
        // In production, you'd use a library like pdf-parse or pdf2pic
        contentText = `PDF Document: ${file.name}\nContent extraction pending...`;
      } else {
        // For other document types
        contentText = `Document: ${file.name}\nContent type: ${file.type}\nContent extraction pending...`;
      }

      // Update document with extracted content
      const { error } = await supabase
        .from('documents')
        .update({
          content_text: contentText,
          status: 'completed'
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error updating document content:', error);
        await supabase
          .from('documents')
          .update({ status: 'error' })
          .eq('id', documentId);
      } else {
        console.log('Document content processed successfully');
      }
    } catch (error) {
      console.error('Error processing file content:', error);
      await supabase
        .from('documents')
        .update({ status: 'error' })
        .eq('id', documentId);
    }
  }

  private async readTextFile(file: File): Promise<string> {
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

  async getUserFiles(): Promise<UploadedFile[]> {
    const userId = databaseService.getCurrentUserId();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user files:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user files:', error);
      return [];
    }
  }

  async deleteFile(documentId: string): Promise<boolean> {
    const userId = databaseService.getCurrentUserId();
    if (!userId) return false;

    try {
      // Get file info first
      const { data: fileData, error: fetchError } = await supabase
        .from('documents')
        .select('file_path, user_id')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !fileData) {
        console.error('File not found or access denied');
        return false;
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([fileData.file_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);

      if (dbError) {
        console.error('Error deleting from database:', dbError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async getFileContent(documentId: string): Promise<string | null> {
    const userId = databaseService.getCurrentUserId();
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('content_text')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        console.error('Error fetching file content:', error);
        return null;
      }

      return data.content_text;
    } catch (error) {
      console.error('Error fetching file content:', error);
      return null;
    }
  }

  getFileUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
}

export const fileUploadService = new FileUploadService();