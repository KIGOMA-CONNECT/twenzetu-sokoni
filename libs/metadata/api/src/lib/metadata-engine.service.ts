import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityId } from '@afri-market/kernel';
import {
  FieldMetadata,
  FormMetadata,
  EntityPermission,
} from '@abms/metadata';
import { FieldMetadataOrmEntity } from '@abms/metadata-infrastructure';
import { FormMetadataOrmEntity } from '@abms/metadata-infrastructure';
import { EntityPermissionOrmEntity } from '@abms/metadata-infrastructure';

@Injectable()
export class MetadataEngineService {
  constructor(
    @InjectRepository(FieldMetadataOrmEntity)
    private readonly fieldRepo: Repository<FieldMetadataOrmEntity>,
    @InjectRepository(FormMetadataOrmEntity)
    private readonly formRepo: Repository<FormMetadataOrmEntity>,
    @InjectRepository(EntityPermissionOrmEntity)
    private readonly permissionRepo: Repository<EntityPermissionOrmEntity>,
  ) {}

  async defineField(dto: {
    entityType: string;
    fieldName: string;
    fieldType: string;
    label: string;
    tenantId: string;
    description?: string;
    isRequired?: boolean;
    isUnique?: boolean;
    isReadOnly?: boolean;
    isHidden?: boolean;
    defaultValue?: unknown;
    options?: Array<{ label: string; value: string | number }>;
    validation?: Array<{ constraint: string; parameters?: Record<string, unknown> }>;
    order?: number;
    group?: string;
  }): Promise<FieldMetadata> {
    const entity = this.fieldRepo.create({
      entityType: dto.entityType,
      fieldName: dto.fieldName,
      fieldType: dto.fieldType,
      label: dto.label,
      description: dto.description ?? null,
      isRequired: dto.isRequired ?? false,
      isUnique: dto.isUnique ?? false,
      isReadOnly: dto.isReadOnly ?? false,
      isHidden: dto.isHidden ?? false,
      defaultValue: dto.defaultValue ?? null,
      options: dto.options ?? [],
      validation: (dto.validation as any) ?? [],
      order: dto.order ?? 0,
      group: dto.group ?? null,
      tenantId: dto.tenantId,
    });

    const saved = await this.fieldRepo.save(entity);

    return FieldMetadata.reconstitute({
      id: EntityId.from(saved.id),
      entityType: saved.entityType,
      fieldName: saved.fieldName,
      fieldType: saved.fieldType as any,
      label: saved.label,
      description: saved.description ?? undefined,
      isRequired: saved.isRequired,
      isUnique: saved.isUnique,
      isReadOnly: saved.isReadOnly,
      isHidden: saved.isHidden,
      defaultValue: saved.defaultValue,
      options: saved.options ?? [],
      validation: (saved.validation as any) ?? [],
      order: saved.order,
      group: saved.group ?? undefined,
    });
  }

  async getFieldsByEntityType(entityType: string, tenantId: string): Promise<FieldMetadata[]> {
    const fields = await this.fieldRepo.find({ where: { entityType, tenantId } });
    return fields.map((f) =>
      FieldMetadata.reconstitute({
        id: EntityId.from(f.id),
        entityType: f.entityType,
        fieldName: f.fieldName,
        fieldType: f.fieldType as any,
        label: f.label,
        description: f.description ?? undefined,
        isRequired: f.isRequired,
        isUnique: f.isUnique,
        isReadOnly: f.isReadOnly,
        isHidden: f.isHidden,
        defaultValue: f.defaultValue,
        options: f.options ?? [],
        validation: (f.validation as any) ?? [],
        order: f.order,
        group: f.group ?? undefined,
      })
    );
  }

  async defineForm(dto: {
    entityType: string;
    formName: string;
    label: string;
    tenantId: string;
    description?: string;
    layout?: string;
    sections?: Array<{ title: string; fields: string[]; description?: string; isCollapsible?: boolean; isCollapsed?: boolean }>;
    columns?: number;
    submitLabel?: string;
    cancelLabel?: string;
  }): Promise<FormMetadata> {
    const entity = this.formRepo.create({
      entityType: dto.entityType,
      formName: dto.formName,
      label: dto.label,
      description: dto.description ?? null,
      layout: dto.layout ?? 'GRID',
      sections: dto.sections ?? [],
      columns: dto.columns ?? 1,
      submitLabel: dto.submitLabel ?? 'Save',
      cancelLabel: dto.cancelLabel ?? 'Cancel',
      tenantId: dto.tenantId,
    });

    const saved = await this.formRepo.save(entity);

    return FormMetadata.define({
      entityType: saved.entityType,
      formName: saved.formName,
      label: saved.label,
      description: saved.description ?? undefined,
      layout: saved.layout as any,
      sections: saved.sections as any,
      columns: saved.columns,
      submitLabel: saved.submitLabel,
      cancelLabel: saved.cancelLabel,
    });
  }

  async getFormsByEntityType(entityType: string, tenantId: string): Promise<FormMetadata[]> {
    const forms = await this.formRepo.find({ where: { entityType, tenantId } });
    return forms.map((f) =>
      FormMetadata.define({
        entityType: f.entityType,
        formName: f.formName,
        label: f.label,
        description: f.description ?? undefined,
        layout: f.layout as any,
        sections: f.sections as any,
        columns: f.columns,
        submitLabel: f.submitLabel,
        cancelLabel: f.cancelLabel,
      })
    );
  }

  async definePermission(dto: {
    entityType: string;
    role: string;
    actions: string[];
    tenantId: string;
    scope?: string;
    conditions?: Record<string, unknown>;
    fields?: { readable?: string[]; writable?: string[] };
  }): Promise<EntityPermission> {
    const entity = this.permissionRepo.create({
      entityType: dto.entityType,
      role: dto.role,
      actions: dto.actions,
      scope: dto.scope ?? 'ALL',
      conditions: dto.conditions ?? {},
      fields: dto.fields ?? undefined,
      tenantId: dto.tenantId,
    });

    const saved = await this.permissionRepo.save(entity) as EntityPermissionOrmEntity;

    return EntityPermission.define({
      entityType: saved.entityType,
      role: saved.role,
      actions: saved.actions as any,
      scope: saved.scope as any,
      conditions: saved.conditions,
      fields: saved.fields as any,
    });
  }

  async getPermissionsByEntityType(entityType: string, tenantId: string): Promise<EntityPermission[]> {
    const permissions = await this.permissionRepo.find({ where: { entityType, tenantId } });
    return permissions.map((p) =>
      EntityPermission.define({
        entityType: p.entityType,
        role: p.role,
        actions: p.actions as any,
        scope: p.scope as any,
        conditions: p.conditions,
        fields: p.fields,
      })
    );
  }

  async checkPermission(entityType: string, role: string, action: string, tenantId: string): Promise<boolean> {
    const permissions = await this.permissionRepo.find({ where: { entityType, tenantId } });
    const permission = permissions.find((p) => p.role === role);
    if (!permission) return false;
    return permission.actions.includes(action);
  }

  async generateFormConfig(entityType: string, formName: string, tenantId: string): Promise<{
    fields: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      readOnly: boolean;
      hidden: boolean;
      defaultValue?: unknown;
      options?: Array<{ label: string; value: string | number }>;
      validation?: Array<{ constraint: string; parameters?: Record<string, unknown> }>;
      group?: string;
    }>;
    layout: string;
    sections: Array<{ title: string; fields: string[] }>;
    columns: number;
    submitLabel: string;
    cancelLabel: string;
  }> {
    const fields = await this.getFieldsByEntityType(entityType, tenantId);
    const forms = await this.getFormsByEntityType(entityType, tenantId);
    const form = forms.find((f) => f.formName === formName);

    return {
      fields: fields
        .sort((a, b) => a.order - b.order)
        .map((f) => ({
          name: f.fieldName,
          type: f.fieldType,
          label: f.label,
          required: f.isRequired,
          readOnly: f.isReadOnly,
          hidden: f.isHidden,
          defaultValue: f.defaultValue,
          options: f.options.length > 0 ? f.options : undefined,
          validation: f.validation.length > 0 ? f.validation : undefined,
          group: f.group,
        })),
      layout: form?.layout ?? 'GRID',
      sections: (form?.sections as any) ?? [],
      columns: form?.columns ?? 1,
      submitLabel: form?.submitLabel ?? 'Save',
      cancelLabel: form?.cancelLabel ?? 'Cancel',
    };
  }
}
