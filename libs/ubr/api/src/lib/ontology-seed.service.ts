import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisteredEntityOrmEntity } from '@abms/ubr-infrastructure';
import { EntityRelationshipOrmEntity } from '@abms/ubr-infrastructure';
import { FieldMetadataOrmEntity } from '@abms/metadata-infrastructure';
import { FormMetadataOrmEntity } from '@abms/metadata-infrastructure';
import { EntityPermissionOrmEntity } from '@abms/metadata-infrastructure';

@Injectable()
export class OntologySeedService implements OnModuleInit {
  private readonly logger = new Logger(OntologySeedService.name);

  constructor(
    @InjectRepository(RegisteredEntityOrmEntity)
    private readonly entityRepo: Repository<RegisteredEntityOrmEntity>,
    @InjectRepository(EntityRelationshipOrmEntity)
    private readonly relationshipRepo: Repository<EntityRelationshipOrmEntity>,
    @InjectRepository(FieldMetadataOrmEntity)
    private readonly fieldRepo: Repository<FieldMetadataOrmEntity>,
    @InjectRepository(FormMetadataOrmEntity)
    private readonly formRepo: Repository<FormMetadataOrmEntity>,
    @InjectRepository(EntityPermissionOrmEntity)
    private readonly permissionRepo: Repository<EntityPermissionOrmEntity>,
  ) {}

  async onModuleInit() {
    await this.seedEntityTypes();
    await this.seedRelationships();
    await this.seedFieldMetadata();
    await this.seedFormMetadata();
    await this.seedPermissions();
  }

  private async seedEntityTypes() {
    const count = await this.entityRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding ABMS entity types...');

    const GLOBAL_TENANT = '00000000-0000-0000-0000-000000000000';

    const entities = [
      // Person entities
      { entityType: 'Person', entityCategory: 'PERSON', displayName: 'Person', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['core', 'person'] },
      { entityType: 'Employee', entityCategory: 'PERSON', displayName: 'Employee', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['hr', 'person'] },
      { entityType: 'Customer', entityCategory: 'PERSON', displayName: 'Customer', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['crm', 'person'] },
      { entityType: 'Patient', entityCategory: 'PERSON', displayName: 'Patient', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['healthcare', 'person'] },
      { entityType: 'Student', entityCategory: 'PERSON', displayName: 'Student', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['education', 'person'] },
      { entityType: 'Farmer', entityCategory: 'PERSON', displayName: 'Farmer', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['agriculture', 'person'] },
      { entityType: 'Citizen', entityCategory: 'PERSON', displayName: 'Citizen', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['government', 'person'] },

      // Organization entities
      { entityType: 'Organization', entityCategory: 'ORGANIZATION', displayName: 'Organization', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['core', 'organization'] },
      { entityType: 'Company', entityCategory: 'ORGANIZATION', displayName: 'Company', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['business', 'organization'] },
      { entityType: 'Department', entityCategory: 'ORGANIZATION', displayName: 'Department', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['hr', 'organization'] },
      { entityType: 'Branch', entityCategory: 'ORGANIZATION', displayName: 'Branch', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['business', 'organization'] },
      { entityType: 'Supplier', entityCategory: 'ORGANIZATION', displayName: 'Supplier', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['procurement', 'organization'] },
      { entityType: 'Vendor', entityCategory: 'ORGANIZATION', displayName: 'Vendor', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['marketplace', 'organization'] },
      { entityType: 'Bank', entityCategory: 'ORGANIZATION', displayName: 'Bank', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['finance', 'organization'] },
      { entityType: 'Hospital', entityCategory: 'ORGANIZATION', displayName: 'Hospital', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['healthcare', 'organization'] },
      { entityType: 'School', entityCategory: 'ORGANIZATION', displayName: 'School', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['education', 'organization'] },
      { entityType: 'Government', entityCategory: 'ORGANIZATION', displayName: 'Government', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['government', 'organization'] },

      // Product entities
      { entityType: 'Product', entityCategory: 'PRODUCT', displayName: 'Product', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['marketplace', 'product'] },
      { entityType: 'Service', entityCategory: 'SERVICE', displayName: 'Service', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['marketplace', 'service'] },
      { entityType: 'RawMaterial', entityCategory: 'PRODUCT', displayName: 'Raw Material', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['manufacturing', 'product'] },

      // Asset entities
      { entityType: 'Asset', entityCategory: 'ASSET', displayName: 'Asset', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['asset', 'core'] },
      { entityType: 'Vehicle', entityCategory: 'ASSET', displayName: 'Vehicle', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['fleet', 'asset'] },
      { entityType: 'Equipment', entityCategory: 'ASSET', displayName: 'Equipment', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['asset', 'core'] },
      { entityType: 'Building', entityCategory: 'ASSET', displayName: 'Building', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['asset', 'core'] },
      { entityType: 'Land', entityCategory: 'ASSET', displayName: 'Land', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['asset', 'core'] },

      // Financial entities
      { entityType: 'Account', entityCategory: 'FINANCIAL', displayName: 'Account', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['finance', 'core'] },
      { entityType: 'Transaction', entityCategory: 'TRANSACTION', displayName: 'Transaction', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['finance', 'core'] },
      { entityType: 'Budget', entityCategory: 'FINANCIAL', displayName: 'Budget', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['finance', 'planning'] },
      { entityType: 'Invoice', entityCategory: 'FINANCIAL', displayName: 'Invoice', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['finance', 'procurement'] },
      { entityType: 'Payment', entityCategory: 'FINANCIAL', displayName: 'Payment', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['finance', 'core'] },
      { entityType: 'Loan', entityCategory: 'FINANCIAL', displayName: 'Loan', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['finance', 'fintech'] },

      // Document entities
      { entityType: 'Document', entityCategory: 'DOCUMENT', displayName: 'Document', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['core', 'document'] },
      { entityType: 'Contract', entityCategory: 'DOCUMENT', displayName: 'Contract', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['procurement', 'document'] },
      { entityType: 'License', entityCategory: 'DOCUMENT', displayName: 'License', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['government', 'document'] },
      { entityType: 'Permit', entityCategory: 'DOCUMENT', displayName: 'Permit', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['government', 'document'] },

      // Location entities
      { entityType: 'Location', entityCategory: 'LOCATION', displayName: 'Location', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['core', 'location'] },
      { entityType: 'Warehouse', entityCategory: 'LOCATION', displayName: 'Warehouse', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['inventory', 'location'] },
      { entityType: 'Farm', entityCategory: 'LOCATION', displayName: 'Farm', tenantId: GLOBAL_TENANT, attributes: {}, tags: ['agriculture', 'location'] },
    ];

    for (const entity of entities) {
      await this.entityRepo.save(this.entityRepo.create(entity));
    }

    this.logger.log(`Seeded ${entities.length} entity types`);
  }

  private async seedRelationships() {
    const count = await this.relationshipRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding ABMS entity relationships...');

    const relationships = [
      // IS_A relationships
      { sourceEntityType: 'Employee', targetEntityType: 'Person', relationshipType: 'IS_A', label: 'Employee is a Person', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Customer', targetEntityType: 'Person', relationshipType: 'IS_A', label: 'Customer is a Person', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Patient', targetEntityType: 'Person', relationshipType: 'IS_A', label: 'Patient is a Person', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Student', targetEntityType: 'Person', relationshipType: 'IS_A', label: 'Student is a Person', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Farmer', targetEntityType: 'Person', relationshipType: 'IS_A', label: 'Farmer is a Person', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Citizen', targetEntityType: 'Person', relationshipType: 'IS_A', label: 'Citizen is a Person', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Company', targetEntityType: 'Organization', relationshipType: 'IS_A', label: 'Company is an Organization', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Supplier', targetEntityType: 'Organization', relationshipType: 'IS_A', label: 'Supplier is an Organization', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Vendor', targetEntityType: 'Organization', relationshipType: 'IS_A', label: 'Vendor is an Organization', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Bank', targetEntityType: 'Organization', relationshipType: 'IS_A', label: 'Bank is an Organization', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Hospital', targetEntityType: 'Organization', relationshipType: 'IS_A', label: 'Hospital is an Organization', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'School', targetEntityType: 'Organization', relationshipType: 'IS_A', label: 'School is an Organization', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Government', targetEntityType: 'Organization', relationshipType: 'IS_A', label: 'Government is an Organization', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Vehicle', targetEntityType: 'Asset', relationshipType: 'IS_A', label: 'Vehicle is an Asset', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Equipment', targetEntityType: 'Asset', relationshipType: 'IS_A', label: 'Equipment is an Asset', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Building', targetEntityType: 'Asset', relationshipType: 'IS_A', label: 'Building is an Asset', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Land', targetEntityType: 'Asset', relationshipType: 'IS_A', label: 'Land is an Asset', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Contract', targetEntityType: 'Document', relationshipType: 'IS_A', label: 'Contract is a Document', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'License', targetEntityType: 'Document', relationshipType: 'IS_A', label: 'License is a Document', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Permit', targetEntityType: 'Document', relationshipType: 'IS_A', label: 'Permit is a Document', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Warehouse', targetEntityType: 'Location', relationshipType: 'IS_A', label: 'Warehouse is a Location', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Farm', targetEntityType: 'Location', relationshipType: 'IS_A', label: 'Farm is a Location', cardinality: 'MANY_TO_ONE' },

      // HAS relationships
      { sourceEntityType: 'Company', targetEntityType: 'Department', relationshipType: 'HAS', label: 'Company has Departments', cardinality: 'ONE_TO_MANY' },
      { sourceEntityType: 'Company', targetEntityType: 'Branch', relationshipType: 'HAS', label: 'Company has Branches', cardinality: 'ONE_TO_MANY' },
      { sourceEntityType: 'Company', targetEntityType: 'Employee', relationshipType: 'HAS', label: 'Company has Employees', cardinality: 'ONE_TO_MANY' },
      { sourceEntityType: 'Company', targetEntityType: 'Asset', relationshipType: 'HAS', label: 'Company has Assets', cardinality: 'ONE_TO_MANY' },
      { sourceEntityType: 'Company', targetEntityType: 'Account', relationshipType: 'HAS', label: 'Company has Accounts', cardinality: 'ONE_TO_MANY' },
      { sourceEntityType: 'Department', targetEntityType: 'Employee', relationshipType: 'HAS', label: 'Department has Employees', cardinality: 'ONE_TO_MANY' },
      { sourceEntityType: 'Hospital', targetEntityType: 'Patient', relationshipType: 'HAS', label: 'Hospital has Patients', cardinality: 'ONE_TO_MANY' },
      { sourceEntityType: 'School', targetEntityType: 'Student', relationshipType: 'HAS', label: 'School has Students', cardinality: 'ONE_TO_MANY' },
      { sourceEntityType: 'Warehouse', targetEntityType: 'Product', relationshipType: 'HAS', label: 'Warehouse has Products', cardinality: 'ONE_TO_MANY' },
      { sourceEntityType: 'Farm', targetEntityType: 'RawMaterial', relationshipType: 'HAS', label: 'Farm has Raw Materials', cardinality: 'ONE_TO_MANY' },

      // USES relationships
      { sourceEntityType: 'Employee', targetEntityType: 'Asset', relationshipType: 'USES', label: 'Employee uses Assets', cardinality: 'MANY_TO_MANY' },
      { sourceEntityType: 'Company', targetEntityType: 'Supplier', relationshipType: 'USES', label: 'Company uses Suppliers', cardinality: 'MANY_TO_MANY' },

      // OWNS relationships
      { sourceEntityType: 'Company', targetEntityType: 'Vehicle', relationshipType: 'OWNS', label: 'Company owns Vehicles', cardinality: 'ONE_TO_MANY' },
      { sourceEntityType: 'Company', targetEntityType: 'Building', relationshipType: 'OWNS', label: 'Company owns Buildings', cardinality: 'ONE_TO_MANY' },
      { sourceEntityType: 'Company', targetEntityType: 'Land', relationshipType: 'OWNS', label: 'Company owns Land', cardinality: 'ONE_TO_MANY' },

      // MANAGES relationships
      { sourceEntityType: 'Employee', targetEntityType: 'Department', relationshipType: 'MANAGES', label: 'Employee manages Department', cardinality: 'ONE_TO_ONE' },
      { sourceEntityType: 'Employee', targetEntityType: 'Branch', relationshipType: 'MANAGES', label: 'Employee manages Branch', cardinality: 'ONE_TO_ONE' },

      // BELONGS_TO relationships
      { sourceEntityType: 'Employee', targetEntityType: 'Department', relationshipType: 'BELONGS_TO', label: 'Employee belongs to Department', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Employee', targetEntityType: 'Company', relationshipType: 'BELONGS_TO', label: 'Employee belongs to Company', cardinality: 'MANY_TO_ONE' },
      { sourceEntityType: 'Customer', targetEntityType: 'Company', relationshipType: 'BELONGS_TO', label: 'Customer belongs to Company', cardinality: 'MANY_TO_ONE' },

      // DEPENDS_ON relationships
      { sourceEntityType: 'Product', targetEntityType: 'RawMaterial', relationshipType: 'DEPENDS_ON', label: 'Product depends on Raw Materials', cardinality: 'MANY_TO_MANY' },
      { sourceEntityType: 'Transaction', targetEntityType: 'Account', relationshipType: 'DEPENDS_ON', label: 'Transaction depends on Account', cardinality: 'MANY_TO_ONE' },

      // TRIGGERS relationships
      { sourceEntityType: 'Invoice', targetEntityType: 'Payment', relationshipType: 'TRIGGERS', label: 'Invoice triggers Payment', cardinality: 'ONE_TO_ONE' },
      { sourceEntityType: 'PurchaseOrder', targetEntityType: 'GoodsReceipt', relationshipType: 'TRIGGERS', label: 'Purchase Order triggers Goods Receipt', cardinality: 'ONE_TO_ONE' },
    ];

    for (const rel of relationships) {
      await this.relationshipRepo.save(this.relationshipRepo.create(rel));
    }

    this.logger.log(`Seeded ${relationships.length} entity relationships`);
  }

  private async seedFieldMetadata() {
    const count = await this.fieldRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding ABMS field metadata...');

    const GLOBAL_TENANT = '00000000-0000-0000-0000-000000000000';

    const fields = [
      // Person fields
      { entityType: 'Person', fieldName: 'firstName', fieldType: 'TEXT', label: 'First Name', isRequired: true, tenantId: GLOBAL_TENANT, order: 1 },
      { entityType: 'Person', fieldName: 'lastName', fieldType: 'TEXT', label: 'Last Name', isRequired: true, tenantId: GLOBAL_TENANT, order: 2 },
      { entityType: 'Person', fieldName: 'email', fieldType: 'EMAIL', label: 'Email', tenantId: GLOBAL_TENANT, order: 3 },
      { entityType: 'Person', fieldName: 'phone', fieldType: 'PHONE', label: 'Phone', isRequired: true, tenantId: GLOBAL_TENANT, order: 4 },
      { entityType: 'Person', fieldName: 'dateOfBirth', fieldType: 'DATE', label: 'Date of Birth', tenantId: GLOBAL_TENANT, order: 5 },
      { entityType: 'Person', fieldName: 'gender', fieldType: 'ENUM', label: 'Gender', options: [{ label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }, { label: 'Other', value: 'OTHER' }], tenantId: GLOBAL_TENANT, order: 6 },
      { entityType: 'Person', fieldName: 'address', fieldType: 'ADDRESS', label: 'Address', tenantId: GLOBAL_TENANT, order: 7 },

      // Employee fields
      { entityType: 'Employee', fieldName: 'employeeId', fieldType: 'TEXT', label: 'Employee ID', isRequired: true, isUnique: true, tenantId: GLOBAL_TENANT, order: 1 },
      { entityType: 'Employee', fieldName: 'department', fieldType: 'REFERENCE', label: 'Department', tenantId: GLOBAL_TENANT, order: 2 },
      { entityType: 'Employee', fieldName: 'position', fieldType: 'TEXT', label: 'Position', tenantId: GLOBAL_TENANT, order: 3 },
      { entityType: 'Employee', fieldName: 'hireDate', fieldType: 'DATE', label: 'Hire Date', isRequired: true, tenantId: GLOBAL_TENANT, order: 4 },
      { entityType: 'Employee', fieldName: 'salary', fieldType: 'CURRENCY', label: 'Salary', tenantId: GLOBAL_TENANT, order: 5 },
      { entityType: 'Employee', fieldName: 'status', fieldType: 'ENUM', label: 'Status', options: [{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }, { label: 'Terminated', value: 'TERMINATED' }], tenantId: GLOBAL_TENANT, order: 6 },

      // Customer fields
      { entityType: 'Customer', fieldName: 'customerType', fieldType: 'ENUM', label: 'Customer Type', options: [{ label: 'Individual', value: 'INDIVIDUAL' }, { label: 'Business', value: 'BUSINESS' }], tenantId: GLOBAL_TENANT, order: 1 },
      { entityType: 'Customer', fieldName: 'creditLimit', fieldType: 'CURRENCY', label: 'Credit Limit', tenantId: GLOBAL_TENANT, order: 2 },
      { entityType: 'Customer', fieldName: 'paymentTerms', fieldType: 'ENUM', label: 'Payment Terms', options: [{ label: 'Cash', value: 'CASH' }, { label: 'Net 30', value: 'NET_30' }, { label: 'Net 60', value: 'NET_60' }], tenantId: GLOBAL_TENANT, order: 3 },

      // Product fields
      { entityType: 'Product', fieldName: 'name', fieldType: 'TEXT', label: 'Product Name', isRequired: true, tenantId: GLOBAL_TENANT, order: 1 },
      { entityType: 'Product', fieldName: 'sku', fieldType: 'TEXT', label: 'SKU', isRequired: true, isUnique: true, tenantId: GLOBAL_TENANT, order: 2 },
      { entityType: 'Product', fieldName: 'description', fieldType: 'RICH_TEXT', label: 'Description', tenantId: GLOBAL_TENANT, order: 3 },
      { entityType: 'Product', fieldName: 'price', fieldType: 'CURRENCY', label: 'Price', isRequired: true, tenantId: GLOBAL_TENANT, order: 4 },
      { entityType: 'Product', fieldName: 'cost', fieldType: 'CURRENCY', label: 'Cost', tenantId: GLOBAL_TENANT, order: 5 },
      { entityType: 'Product', fieldName: 'unit', fieldType: 'ENUM', label: 'Unit', options: [{ label: 'Each', value: 'EACH' }, { label: 'Kg', value: 'KG' }, { label: 'Liter', value: 'LITER' }, { label: 'Meter', value: 'METER' }], tenantId: GLOBAL_TENANT, order: 6 },
      { entityType: 'Product', fieldName: 'category', fieldType: 'REFERENCE', label: 'Category', tenantId: GLOBAL_TENANT, order: 7 },
      { entityType: 'Product', fieldName: 'reorderLevel', fieldType: 'NUMBER', label: 'Reorder Level', tenantId: GLOBAL_TENANT, order: 8 },

      // Organization fields
      { entityType: 'Organization', fieldName: 'name', fieldType: 'TEXT', label: 'Organization Name', isRequired: true, tenantId: GLOBAL_TENANT, order: 1 },
      { entityType: 'Organization', fieldName: 'registrationNumber', fieldType: 'TEXT', label: 'Registration Number', tenantId: GLOBAL_TENANT, order: 2 },
      { entityType: 'Organization', fieldName: 'taxId', fieldType: 'TEXT', label: 'Tax ID', tenantId: GLOBAL_TENANT, order: 3 },
      { entityType: 'Organization', fieldName: 'phone', fieldType: 'PHONE', label: 'Phone', tenantId: GLOBAL_TENANT, order: 4 },
      { entityType: 'Organization', fieldName: 'email', fieldType: 'EMAIL', label: 'Email', tenantId: GLOBAL_TENANT, order: 5 },
      { entityType: 'Organization', fieldName: 'website', fieldType: 'URL', label: 'Website', tenantId: GLOBAL_TENANT, order: 6 },
      { entityType: 'Organization', fieldName: 'address', fieldType: 'ADDRESS', label: 'Address', tenantId: GLOBAL_TENANT, order: 7 },

      // Account fields
      { entityType: 'Account', fieldName: 'accountNumber', fieldType: 'TEXT', label: 'Account Number', isRequired: true, isUnique: true, tenantId: GLOBAL_TENANT, order: 1 },
      { entityType: 'Account', fieldName: 'accountName', fieldType: 'TEXT', label: 'Account Name', isRequired: true, tenantId: GLOBAL_TENANT, order: 2 },
      { entityType: 'Account', fieldName: 'accountType', fieldType: 'ENUM', label: 'Account Type', options: [{ label: 'Asset', value: 'ASSET' }, { label: 'Liability', value: 'LIABILITY' }, { label: 'Equity', value: 'EQUITY' }, { label: 'Revenue', value: 'REVENUE' }, { label: 'Expense', value: 'EXPENSE' }], tenantId: GLOBAL_TENANT, order: 3 },
      { entityType: 'Account', fieldName: 'balance', fieldType: 'CURRENCY', label: 'Balance', tenantId: GLOBAL_TENANT, order: 4 },
      { entityType: 'Account', fieldName: 'currency', fieldType: 'TEXT', label: 'Currency', defaultValue: 'TZS', tenantId: GLOBAL_TENANT, order: 5 },
    ];

    for (const field of fields) {
      await this.fieldRepo.save(this.fieldRepo.create(field));
    }

    this.logger.log(`Seeded ${fields.length} field metadata definitions`);
  }

  private async seedFormMetadata() {
    const count = await this.formRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding ABMS form metadata...');

    const GLOBAL_TENANT = '00000000-0000-0000-0000-000000000000';

    const forms = [
      {
        entityType: 'Person',
        formName: 'create-person',
        label: 'Create Person',
        layout: 'GRID',
        columns: 2,
        sections: [
          { title: 'Personal Information', fields: ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender'] },
          { title: 'Address', fields: ['address'] },
        ],
        tenantId: GLOBAL_TENANT,
      },
      {
        entityType: 'Employee',
        formName: 'create-employee',
        label: 'Create Employee',
        layout: 'GRID',
        columns: 2,
        sections: [
          { title: 'Employee Information', fields: ['employeeId', 'firstName', 'lastName', 'email', 'phone'] },
          { title: 'Employment Details', fields: ['department', 'position', 'hireDate', 'salary', 'status'] },
        ],
        tenantId: GLOBAL_TENANT,
      },
      {
        entityType: 'Product',
        formName: 'create-product',
        label: 'Create Product',
        layout: 'GRID',
        columns: 2,
        sections: [
          { title: 'Product Information', fields: ['name', 'sku', 'description', 'category'] },
          { title: 'Pricing', fields: ['price', 'cost', 'unit'] },
          { title: 'Inventory', fields: ['reorderLevel'] },
        ],
        tenantId: GLOBAL_TENANT,
      },
      {
        entityType: 'Organization',
        formName: 'create-organization',
        label: 'Create Organization',
        layout: 'GRID',
        columns: 2,
        sections: [
          { title: 'Organization Information', fields: ['name', 'registrationNumber', 'taxId'] },
          { title: 'Contact Information', fields: ['phone', 'email', 'website', 'address'] },
        ],
        tenantId: GLOBAL_TENANT,
      },
      {
        entityType: 'Account',
        formName: 'create-account',
        label: 'Create Account',
        layout: 'GRID',
        columns: 2,
        sections: [
          { title: 'Account Information', fields: ['accountNumber', 'accountName', 'accountType', 'currency'] },
        ],
        tenantId: GLOBAL_TENANT,
      },
    ];

    for (const form of forms) {
      await this.formRepo.save(this.formRepo.create(form));
    }

    this.logger.log(`Seeded ${forms.length} form metadata definitions`);
  }

  private async seedPermissions() {
    const count = await this.permissionRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding ABMS entity permissions...');

    const GLOBAL_TENANT = '00000000-0000-0000-0000-000000000000';

    const permissions = [
      // Person permissions
      { entityType: 'Person', role: 'SUPER_ADMIN', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ALL', tenantId: GLOBAL_TENANT },
      { entityType: 'Person', role: 'ADMIN', actions: ['CREATE', 'READ', 'UPDATE'], scope: 'ALL', tenantId: GLOBAL_TENANT },
      { entityType: 'Person', role: 'MANAGER', actions: ['READ', 'UPDATE'], scope: 'DEPARTMENT', tenantId: GLOBAL_TENANT },
      { entityType: 'Person', role: 'USER', actions: ['READ'], scope: 'OWN', tenantId: GLOBAL_TENANT },

      // Employee permissions
      { entityType: 'Employee', role: 'SUPER_ADMIN', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ALL', tenantId: GLOBAL_TENANT },
      { entityType: 'Employee', role: 'HR_MANAGER', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ALL', tenantId: GLOBAL_TENANT },
      { entityType: 'Employee', role: 'MANAGER', actions: ['READ', 'UPDATE'], scope: 'DEPARTMENT', tenantId: GLOBAL_TENANT },
      { entityType: 'Employee', role: 'USER', actions: ['READ'], scope: 'OWN', tenantId: GLOBAL_TENANT },

      // Product permissions
      { entityType: 'Product', role: 'SUPER_ADMIN', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ALL', tenantId: GLOBAL_TENANT },
      { entityType: 'Product', role: 'ADMIN', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ALL', tenantId: GLOBAL_TENANT },
      { entityType: 'Product', role: 'MANAGER', actions: ['CREATE', 'READ', 'UPDATE'], scope: 'BRANCH', tenantId: GLOBAL_TENANT },
      { entityType: 'Product', role: 'USER', actions: ['READ'], scope: 'ALL', tenantId: GLOBAL_TENANT },

      // Account permissions
      { entityType: 'Account', role: 'SUPER_ADMIN', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ALL', tenantId: GLOBAL_TENANT },
      { entityType: 'Account', role: 'FINANCE_MANAGER', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ALL', tenantId: GLOBAL_TENANT },
      { entityType: 'Account', role: 'MANAGER', actions: ['READ'], scope: 'BRANCH', tenantId: GLOBAL_TENANT },
      { entityType: 'Account', role: 'USER', actions: ['READ'], scope: 'OWN', tenantId: GLOBAL_TENANT },

      // Organization permissions
      { entityType: 'Organization', role: 'SUPER_ADMIN', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ALL', tenantId: GLOBAL_TENANT },
      { entityType: 'Organization', role: 'ADMIN', actions: ['CREATE', 'READ', 'UPDATE'], scope: 'ALL', tenantId: GLOBAL_TENANT },
      { entityType: 'Organization', role: 'USER', actions: ['READ'], scope: 'OWN', tenantId: GLOBAL_TENANT },
    ];

    for (const permission of permissions) {
      await this.permissionRepo.save(this.permissionRepo.create(permission));
    }

    this.logger.log(`Seeded ${permissions.length} entity permission definitions`);
  }
}
