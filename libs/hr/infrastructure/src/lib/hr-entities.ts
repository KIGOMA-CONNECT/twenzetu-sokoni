import { EmployeeDocumentOrmEntity } from './entities/employee-document-orm.entity';
import { EmployeeOrmEntity } from './entities/employee-orm.entity';
import { EmploymentHistoryOrmEntity } from './entities/employment-history-orm.entity';
import { PositionOrmEntity } from './entities/position-orm.entity';

export const HR_ENTITIES = [
  PositionOrmEntity,
  EmployeeOrmEntity,
  EmploymentHistoryOrmEntity,
  EmployeeDocumentOrmEntity,
];
