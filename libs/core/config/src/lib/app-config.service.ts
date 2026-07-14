import { Injectable, Optional } from '@nestjs/common';
import { AppEnv, NodeEnv, parseEnv } from './env.schema';

export interface AppConfig {
  readonly nodeEnv: NodeEnv;
  readonly port: number;
  readonly isProduction: boolean;
}

export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly name: string;
  readonly ssl: boolean;
  readonly poolMax: number;
  readonly ownerUser: string;
  readonly ownerPassword: string;
  readonly runtimeUser: string;
  readonly runtimePassword: string;
}

export interface LoggingConfig {
  readonly level: string;
  readonly pretty: boolean;
}

export interface AuthConfig {
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
}

@Injectable()
export class AppConfigService {
  private readonly env: AppEnv;

  public constructor(@Optional() source: NodeJS.ProcessEnv = process.env) {
    this.env = parseEnv(source);
  }

  public get app(): AppConfig {
    return {
      nodeEnv: this.env.NODE_ENV,
      port: this.env.PORT,
      isProduction: this.env.NODE_ENV === 'production',
    };
  }

  public get database(): DatabaseConfig {
    return {
      host: this.env.DB_HOST,
      port: this.env.DB_PORT,
      name: this.env.DB_NAME,
      ssl: this.env.DB_SSL,
      poolMax: this.env.DB_POOL_MAX,
      ownerUser: this.env.DB_OWNER_USER,
      ownerPassword: this.env.DB_OWNER_PASSWORD,
      runtimeUser: this.env.DB_RUNTIME_USER,
      runtimePassword: this.env.DB_RUNTIME_PASSWORD,
    };
  }

  public get logging(): LoggingConfig {
    return {
      level: this.env.LOG_LEVEL,
      pretty: this.env.LOG_PRETTY,
    };
  }

  public get auth(): AuthConfig {
    return {
      jwtSecret: this.env.JWT_SECRET,
      jwtExpiresIn: this.env.JWT_EXPIRES_IN,
    };
  }
}
