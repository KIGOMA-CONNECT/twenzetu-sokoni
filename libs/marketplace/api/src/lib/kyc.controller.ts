import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, Roles, RolesGuard } from '@afri-market/identity-infrastructure';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { SubmitKycUseCase, GetMyKycStatusUseCase, ListPendingKycUseCase } from '@afri-market/marketplace-application';

@ApiTags('KYC')
@Controller('kyc')
@ApiBearerAuth()
export class KycController {
  constructor(
    private readonly submitKyc: SubmitKycUseCase,
    private readonly getMyKycStatus: GetMyKycStatusUseCase,
    private readonly listPendingKyc: ListPendingKycUseCase,
  ) {}

  @Post('submit')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit KYC verification documents' })
  @ApiBody({ type: SubmitKycDto })
  @ApiResponse({ status: 201, description: 'KYC submitted' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async submitKycEndpoint(@Body() dto: SubmitKycDto, @CurrentUser() user: JwtPayload) {
    return this.submitKyc.execute(user.tenantId, {
      partnerId: user.sub,
      partnerType: dto.partnerType,
      phoneNumber: user.phoneNumber,
      nidaNumber: dto.nidaNumber,
      tinNumber: dto.tinNumber,
      licenseNumber: dto.licenseNumber,
    });
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user KYC status' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getMyKycStatusEndpoint(@CurrentUser() user: JwtPayload) {
    const data = await this.getMyKycStatus.execute(user.tenantId, user.sub);
    return { data, message: 'My KYC status' };
  }

  @Get('pending')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List pending KYC submissions (admin only)' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  public async findPendingEndpoint(@CurrentUser() user: JwtPayload) {
    return this.listPendingKyc.execute(user.tenantId);
  }
}
