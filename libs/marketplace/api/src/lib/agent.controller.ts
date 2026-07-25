import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { RegisterAgentDto } from './dto/register-agent.dto';
import { RegisterAgentUseCase, GetMyAgentProfileUseCase } from '@afri-market/marketplace-application';

@ApiTags('Agents')
@Controller('agents')
@ApiBearerAuth()
export class AgentController {
  constructor(
    private readonly registerAgent: RegisterAgentUseCase,
    private readonly getMyAgentProfile: GetMyAgentProfileUseCase,
  ) {}

  @Post('register')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Register as an agent' })
  @ApiBody({ type: RegisterAgentDto })
  @ApiResponse({ status: 201, description: 'Agent registered' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async registerAgentEndpoint(@Body() dto: RegisterAgentDto, @CurrentUser() user: JwtPayload) {
    return this.registerAgent.execute(user.tenantId, {
      userId: user.sub,
      agentType: dto.agentType,
      coverageArea: dto.coverageArea,
      commissionRate: dto.commissionRate,
    });
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user agent profile' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async myAgentProfileEndpoint(@CurrentUser() user: JwtPayload) {
    return this.getMyAgentProfile.execute(user.sub);
  }

  @Get('earnings')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List current user agent earnings' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async myEarningsEndpoint(@CurrentUser() user: JwtPayload) {
    return this.getMyAgentProfile.getEarnings(user.sub);
  }
}
