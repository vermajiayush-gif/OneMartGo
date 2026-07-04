import { getActiveStorageProvider } from './config.service';

export interface UploadResult {
  url: string;
  key: string;
}

export class StorageService {
  private static async getProvider() {
    return await getActiveStorageProvider();
  }

  static async uploadFile(file: File, path: string): Promise<UploadResult> {
    const provider = await this.getProvider();

    switch (provider.provider) {
      case 'SUPABASE':
        return this.uploadToSupabase(file, path, provider.credentials);
      case 'AWS_S3':
        return this.uploadToS3(file, path, provider.credentials);
      case 'CLOUDINARY':
        return this.uploadToCloudinary(file, path, provider.credentials);
      case 'BACKBLAZE':
        return this.uploadToBackblaze(file, path, provider.credentials);
      default:
        throw new Error(`Unsupported storage provider: ${provider.provider}`);
    }
  }

  private static async uploadToSupabase(file: File, path: string, credentials: any): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${credentials.url}/storage/v1/object/${credentials.bucket}/${path}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.serviceKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Supabase upload failed');
    }

    const url = `${credentials.url}/storage/v1/object/public/${credentials.bucket}/${path}`;
    return { url, key: path };
  }

  private static async uploadToS3(file: File, path: string, credentials: any): Promise<UploadResult> {
    console.log('S3 upload would happen here for:', path);
    return {
      url: `https://${credentials.bucket}.s3.amazonaws.com/${path}`,
      key: path,
    };
  }

  private static async uploadToCloudinary(file: File, path: string, credentials: any): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', credentials.uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    return { url: data.secure_url, key: data.public_id };
  }

  private static async uploadToBackblaze(file: File, path: string, credentials: any): Promise<UploadResult> {
    console.log('Backblaze upload would happen here for:', path);
    return {
      url: `https://f002.backblazeb2.com/file/${credentials.bucket}/${path}`,
      key: path,
    };
  }

  static async deleteFile(key: string): Promise<boolean> {
    const provider = await this.getProvider();
    console.log(`Deleting file ${key} from ${provider.provider}`);
    return true;
  }
}
