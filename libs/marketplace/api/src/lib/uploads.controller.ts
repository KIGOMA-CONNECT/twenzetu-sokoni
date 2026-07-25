import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { FileUploadService } from '@afri-market/integrations';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const imageFilter = (_req: Express.Request, file: MulterFile, cb: (error: Error | null, acceptFile: boolean) => void) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const docFilter = (_req: Express.Request, file: MulterFile, cb: (error: Error | null, acceptFile: boolean) => void) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, or PNG files are allowed'), false);
  }
};

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('uploads')
export class UploadsController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('kyc')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: docFilter }))
  @ApiOperation({ summary: 'Upload KYC document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  @ApiResponse({ status: 201, description: 'File uploaded' })
  @ApiResponse({ status: 400, description: 'No file or invalid type' })
  async uploadKyc(@UploadedFile() file: MulterFile, @CurrentUser() user: JwtPayload) {
    if (!file) throw new BadRequestException('File is required');
    return this.fileUploadService.upload({ file: file.buffer, fileName: file.originalname, contentType: file.mimetype, folder: `kyc/${user.tenantId}` });
  }

  @Post('vendor-logo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter }))
  @ApiOperation({ summary: 'Upload vendor logo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  async uploadVendorLogo(@UploadedFile() file: MulterFile, @CurrentUser() user: JwtPayload) {
    if (!file) throw new BadRequestException('File is required');
    return this.fileUploadService.upload({ file: file.buffer, fileName: file.originalname, contentType: file.mimetype, folder: `vendor-logos/${user.tenantId}` });
  }

  @Post('product-image')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter }))
  @ApiOperation({ summary: 'Upload product image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  async uploadProductImage(@UploadedFile() file: MulterFile, @CurrentUser() user: JwtPayload) {
    if (!file) throw new BadRequestException('File is required');
    return this.fileUploadService.upload({ file: file.buffer, fileName: file.originalname, contentType: file.mimetype, folder: `products/${user.tenantId}` });
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: imageFilter }))
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  async uploadAvatar(@UploadedFile() file: MulterFile, @CurrentUser() user: JwtPayload) {
    if (!file) throw new BadRequestException('File is required');
    return this.fileUploadService.upload({ file: file.buffer, fileName: file.originalname, contentType: file.mimetype, folder: `avatars/${user.tenantId}` });
  }
}
