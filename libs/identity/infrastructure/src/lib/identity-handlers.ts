import { CreateUserHandler } from './handlers/create-user.handler';
import { LoginHandler } from './handlers/login.handler';
import { RegisterTenantHandler } from './handlers/register-tenant.handler';

export const IDENTITY_COMMAND_HANDLERS = [RegisterTenantHandler, LoginHandler, CreateUserHandler];

// No queries yet in this sprint — typed as an empty tuple (not unknown[]) so
// spreading it into a NestJS `providers` array doesn't widen the whole array's
// inferred element type to `unknown`.
export const IDENTITY_QUERY_HANDLERS: [] = [];
