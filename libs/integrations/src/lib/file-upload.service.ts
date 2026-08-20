import { Injectable, BadRequestException } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';
import { mkdirSync, writeFileSync, existsSync, statSync, unlinkSync } from 'fs';
import { join, resolve, extname, normalize } from 'path';
import { randomUUID } from 'crypto';

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

const MAX_FILE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class FileUploadService implements IFileUploadService {
  private readonly storageDir: string;

  constructor(private readonly logger: AppLoggerService) {
    this.storageDir = process.env['UPLOAD_DIR'] || join(process.cwd(), 'uploads');
    try {
      mkdirSync(this.storageDir, { recursive: true });
    } catch (error) {
      this.logger.warn(
        `Could not create storage dir ${this.storageDir}: ${error instanceof Error ? error.message : String(error)}`,
        'FileUploadService',
      );
    }
    this.logger.log(`Local file storage initialised at ${this.storageDir}`, 'FileUploadService');
  }

  public async upload(params: UploadFileParams): Promise<{ url: string; key: string }> {
    if (!params.file || params.file.length === 0) {
      throw new BadRequestException('File is empty');
    }
    if (params.file.length > MAX_FILE_BYTES) {
      throw new BadRequestException('File exceeds the 10MB limit');
    }

    const safeFolder = this.sanitizeFolder(params.folder);
    const ext = this.safeExtension(params.fileName);
    const key = `${safeFolder}/${randomUUID()}${ext}`;
    const fullPath = this.absolutePath(key);

    try {
      mkdirSync(resolve(this.storageDir, safeFolder), { recursive: true });
      writeFileSync(fullPath, params.file);
    } catch (error) {
      this.logger.error(
        `Failed to persist file ${key}: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        'FileUploadService',
      );
      throw new BadRequestException('Could not persist uploaded file');
    }

    this.logger.log(`File persisted: ${key} (${params.file.length} bytes)`, 'FileUploadService');
    return { url: this.publicUrl(key), key };
  }

  public async delete(key: string): Promise<void> {
    const fullPath = this.absolutePath(key);
    try {
      if (existsSync(fullPath)) unlinkSync(fullPath);
    } catch (error) {
      this.logger.warn(
        `Failed to delete ${key}: ${error instanceof Error ? error.message : String(error)}`,
        'FileUploadService',
      );
    }
  }

  public async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return `${this.publicUrl(key)}?expires=${expiresIn}`;
  }

  public publicUrl(key: string): string {
    const base = process.env['PUBLIC_BASE_URL'] || '';
    if (base) return `${base.replace(/\/$/, '')}/api/uploads/${key}`;
    return `/api/uploads/${key}`;
  }

  /** Resolve a stored key to a safe absolute path inside the storage root. */
  public resolvePath(key: string): string {
    return this.absolutePath(key);
  }

  public pathExists(key: string): boolean {
    try {
      return existsSync(this.absolutePath(key)) && statSync(this.absolutePath(key)).isFile();
    } catch {
      return false;
    }
  }

  private absolutePath(key: string): string {
    const safeKey = normalize(key).replace(/^([a-zA-Z]:)?[\\/]+/, '').replace(/\.\./g, '');
    const fullPath = resolve(this.storageDir, safeKey);
    if (!fullPath.startsWith(resolve(this.storageDir))) {
      throw new BadRequestException('Invalid storage key');
    }
    return fullPath;
  }

  private sanitizeFolder(folder: string): string {
    const safe = folder.replace(/[^a-zA-Z0-9_/-]/g, '').replace(/^\/+|\/+$/g, '').replace(/\.\./g, '');
    return safe || 'general';
  }

  private safeExtension(fileName: string): string {
    const ext = extname(fileName || '').toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.svg'];
    return allowed.includes(ext) ? ext : '.bin';
  }
}