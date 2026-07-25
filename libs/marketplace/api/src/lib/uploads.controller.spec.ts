import { Test, TestingModule } from '@nestjs/testing';
import { UploadsController } from './uploads.controller';
import { FileUploadService } from '@afri-market/integrations';
import { JwtPayload } from '@afri-market/identity-infrastructure';

describe('UploadsController', () => {
  let controller: UploadsController;
  let fileUploadService: jest.Mocked<FileUploadService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: FileUploadService,
          useValue: { upload: jest.fn().mockResolvedValue({ url: 'https://example.com/file.png' }) },
        },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    fileUploadService = module.get(FileUploadService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadKyc', () => {
    it('should throw BadRequestException when no file provided', async () => {
      await expect(
        controller.uploadKyc(undefined as Express.Multer.File | undefined, { tenantId: 't1' } as JwtPayload),
      ).rejects.toThrow('File is required');
    });

    it('should return upload result', async () => {
      const file = { buffer: Buffer.from('test'), originalname: 'doc.pdf', mimetype: 'application/pdf' } as Express.Multer.File;
      const result = await controller.uploadKyc(file, { tenantId: 't1' } as JwtPayload);
      expect(result).toEqual({ url: 'https://example.com/file.png' });
      expect(fileUploadService.upload).toHaveBeenCalledWith({
        file: file.buffer,
        fileName: 'doc.pdf',
        contentType: 'application/pdf',
        folder: 'kyc/t1',
      });
    });
  });

  describe('uploadVendorLogo', () => {
    it('should throw BadRequestException when no file provided', async () => {
      await expect(
        controller.uploadVendorLogo(undefined as Express.Multer.File | undefined, { tenantId: 't1' } as JwtPayload),
      ).rejects.toThrow('File is required');
    });

    it('should return upload result with correct folder', async () => {
      const file = { buffer: Buffer.from('test'), originalname: 'logo.png', mimetype: 'image/png' } as Express.Multer.File;
      const result = await controller.uploadVendorLogo(file, { tenantId: 't2' } as JwtPayload);
      expect(result).toEqual({ url: 'https://example.com/file.png' });
      expect(fileUploadService.upload).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'vendor-logos/t2' }),
      );
    });
  });

  describe('uploadProductImage', () => {
    it('should return upload result with correct folder', async () => {
      const file = { buffer: Buffer.from('test'), originalname: 'photo.jpg', mimetype: 'image/jpeg' } as Express.Multer.File;
      const result = await controller.uploadProductImage(file, { tenantId: 't3' } as JwtPayload);
      expect(result).toEqual({ url: 'https://example.com/file.png' });
      expect(fileUploadService.upload).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'products/t3' }),
      );
    });
  });

  describe('uploadAvatar', () => {
    it('should return upload result with correct folder', async () => {
      const file = { buffer: Buffer.from('test'), originalname: 'me.png', mimetype: 'image/png' } as Express.Multer.File;
      const result = await controller.uploadAvatar(file, { tenantId: 't4' } as JwtPayload);
      expect(result).toEqual({ url: 'https://example.com/file.png' });
      expect(fileUploadService.upload).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'avatars/t4' }),
      );
    });
  });
});
