import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';

export interface UploadFileParams {
  file: Buffer;
  fileName: string;
  contentType: string;
  folder: string;
  tenantId?: string;
}

export interface IFileUploadService {
  upload(params: UploadFileParams): Promise<{ url: string; key: string }>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

@Injectable()
export class FileUploadService implements IFileUploadService {
  constructor(private readonly logger: AppLoggerService) {}

  public async upload(params: UploadFileParams): Promise<{ url: string; key: string }> {
    const key = `${params.folder}/${Date.now()}_${params.fileName}`;
    this.logger.log(`File uploaded: ${key}`, 'FileUploadService');
    return { url: `https://storage.afrikimarket.com/${key}`, key };
  }

  public async delete(key: string): Promise<void> {
    this.logger.log(`File deleted: ${key}`, 'FileUploadService');
  }

  public async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return `https://storage.afrikimarket.com/${key}?expires=${expiresIn}`;
  }
}
