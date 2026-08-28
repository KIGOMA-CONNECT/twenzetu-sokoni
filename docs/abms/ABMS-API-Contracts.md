# ABMS API Contracts — Foundation Platform

> Every capability must be accessible through APIs. No feature should exist only in the UI.

## Base URL

```
/api/v1
```

## Authentication

All endpoints require JWT Bearer token unless noted otherwise.

```
Authorization: Bearer <access_token>
```

## Response Envelope

Every API response follows this structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-08-26T12:00:00.000Z",
    "tenantId": "uuid"
  }
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'name' is required"
  },
  "meta": {
    "timestamp": "2026-08-26T12:00:00.000Z"
  }
}
```

---

## 1. Identity Platform

### POST /auth/register-tenant

Register a new tenant.

**Request:**
```json
{
  "name": "Acme Corp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Acme Corp",
    "status": "ACTIVE",
    "isDefault": false
  }
}
```

### POST /auth/register

Register a user within a tenant.

**Request:**
```json
{
  "tenantId": "uuid",
  "phoneNumber": "+255712345678",
  "fullName": "John Doe",
  "role": "ADMIN",
  "password": "SecurePass123!",
  "email": "john@acme.com"
}
```

### POST /auth/login

Login with phone + password.

**Request:**
```json
{
  "phoneNumber": "+255712345678",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": {
      "id": "uuid",
      "phoneNumber": "+255712345678",
      "fullName": "John Doe",
      "role": "ADMIN"
    }
  }
}
```

### GET /auth/me

Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "phoneNumber": "+255712345678",
    "fullName": "John Doe",
    "email": "john@acme.com",
    "role": "ADMIN",
    "tenantId": "uuid",
    "status": "ACTIVE"
  }
}
```

---

## 2. Universal Business Registry (UBR)

### POST /ontology/entities

Register a new entity in the registry.

**Request:**
```json
{
  "entityType": "Customer",
  "entityCategory": "PERSON",
  "displayName": "John Doe",
  "attributes": {
    "phone": "+255712345678",
    "email": "john@example.com"
  },
  "tags": ["vip", "regular"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "entityType": "Customer",
    "entityCategory": "PERSON",
    "displayName": "John Doe",
    "state": "ACTIVE",
    "attributes": { "phone": "+255712345678", "email": "john@example.com" },
    "tags": ["vip", "regular"],
    "version": 1,
    "createdAt": "2026-08-26T12:00:00.000Z"
  }
}
```

### GET /ontology/entities

List all entities for current tenant.

**Query Parameters:**
| Parameter | Type | Description |
|---|---|---|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "entityType": "Customer",
      "displayName": "John Doe",
      "state": "ACTIVE"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### GET /ontology/entities/search?query=john

Search entities by display name.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "entityType": "Customer",
      "displayName": "John Doe",
      "state": "ACTIVE"
    }
  ]
}
```

### GET /ontology/entities/type/:entityType

Get all entities of a specific type.

**Example:** `GET /ontology/entities/type/Customer`

### GET /ontology/entities/category/:category

Get all entities in a category.

**Example:** `GET /ontology/entities/category/PERSON`

### GET /ontology/entities/:id

Get a single entity by ID.

### PATCH /ontology/entities/:id

Update an entity.

**Request:**
```json
{
  "displayName": "John M. Doe",
  "attributes": { "phone": "+2557987654321" },
  "tags": ["vip", "premium"]
}
```

### DELETE /ontology/entities/:id

Soft-delete an entity.

### POST /ontology/relationships

Define a relationship between entity types.

**Request:**
```json
{
  "sourceEntityType": "Employee",
  "targetEntityType": "Company",
  "relationshipType": "BELONGS_TO",
  "label": "Employee belongs to Company",
  "cardinality": "MANY_TO_ONE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sourceEntityType": "Employee",
    "targetEntityType": "Company",
    "relationshipType": "BELONGS_TO",
    "label": "Employee belongs to Company",
    "cardinality": "MANY_TO_ONE",
    "state": "ACTIVE"
  }
}
```

### GET /ontology/relationships

List all active relationships.

### GET /ontology/relationships/type/:entityType

Get all relationships for an entity type.

### GET /ontology/hierarchy/:entityType

Get the full hierarchy for an entity type.

**Example:** `GET /ontology/hierarchy/Employee`

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "Employee",
    "parentOf": [],
    "childOf": ["Person"],
    "has": [],
    "uses": ["Asset"],
    "belongs_to": ["Department", "Company"],
    "manages": ["Department"]
  }
}
```

### GET /ontology/counts

Get entity counts by type for current tenant.

**Response:**
```json
{
  "success": true,
  "data": {
    "Customer": 150,
    "Employee": 45,
    "Product": 320
  }
}
```

---

## 3. Metadata Engine

### POST /metadata/fields

Define a field for an entity type.

**Request:**
```json
{
  "entityType": "Customer",
  "fieldName": "loyaltyTier",
  "fieldType": "ENUM",
  "label": "Loyalty Tier",
  "isRequired": false,
  "options": [
    { "label": "Bronze", "value": "BRONZE" },
    { "label": "Silver", "value": "SILVER" },
    { "label": "Gold", "value": "GOLD" }
  ],
  "order": 10,
  "group": "Membership"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "entityType": "Customer",
    "fieldName": "loyaltyTier",
    "fieldType": "ENUM",
    "label": "Loyalty Tier",
    "isRequired": false,
    "options": [
      { "label": "Bronze", "value": "BRONZE" },
      { "label": "Silver", "value": "SILVER" },
      { "label": "Gold", "value": "GOLD" }
    ],
    "order": 10,
    "group": "Membership"
  }
}
```

### GET /metadata/fields/:entityType

Get all field definitions for an entity type.

**Example:** `GET /metadata/fields/Customer`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "fieldName": "firstName",
      "fieldType": "TEXT",
      "label": "First Name",
      "isRequired": true,
      "order": 1
    },
    {
      "fieldName": "loyaltyTier",
      "fieldType": "ENUM",
      "label": "Loyalty Tier",
      "isRequired": false,
      "options": [...],
      "order": 10,
      "group": "Membership"
    }
  ]
}
```

### POST /metadata/forms

Define a form layout for an entity type.

**Request:**
```json
{
  "entityType": "Customer",
  "formName": "create-customer",
  "label": "Create Customer",
  "layout": "GRID",
  "columns": 2,
  "sections": [
    {
      "title": "Personal Information",
      "fields": ["firstName", "lastName", "email", "phone"]
    },
    {
      "title": "Membership",
      "fields": ["loyaltyTier"],
      "isCollapsible": true
    }
  ]
}
```

### GET /metadata/forms/:entityType

Get all form definitions for an entity type.

### POST /metadata/permissions

Define role-based permissions for an entity type.

**Request:**
```json
{
  "entityType": "Customer",
  "role": "SALES",
  "actions": ["CREATE", "READ", "UPDATE"],
  "scope": "ALL",
  "fields": {
    "readable": ["firstName", "lastName", "email", "phone", "loyaltyTier"],
    "writable": ["firstName", "lastName", "email", "phone", "loyaltyTier"]
  }
}
```

### GET /metadata/permissions/:entityType

Get all permission definitions for an entity type.

### GET /metadata/permissions/:entityType/check?role=SALES&action=READ

Check if a role has a specific action on an entity type.

**Response:**
```json
{
  "success": true,
  "data": {
    "hasPermission": true
  }
}
```

### POST /metadata/generate-form

Generate a dynamic form configuration.

**Request:**
```json
{
  "entityType": "Customer",
  "formName": "create-customer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fields": [
      {
        "name": "firstName",
        "type": "TEXT",
        "label": "First Name",
        "required": true,
        "readOnly": false,
        "hidden": false
      },
      {
        "name": "loyaltyTier",
        "type": "ENUM",
        "label": "Loyalty Tier",
        "required": false,
        "options": [
          { "label": "Bronze", "value": "BRONZE" },
          { "label": "Silver", "value": "SILVER" },
          { "label": "Gold", "value": "GOLD" }
        ]
      }
    ],
    "layout": "GRID",
    "sections": [
      { "title": "Personal Information", "fields": ["firstName", "lastName", "email", "phone"] },
      { "title": "Membership", "fields": ["loyaltyTier"] }
    ],
    "columns": 2,
    "submitLabel": "Save",
    "cancelLabel": "Cancel"
  }
}
```

---

## 4. Field Types Reference

| Type | Description | Example |
|---|---|---|
| TEXT | Plain text | "John Doe" |
| NUMBER | Integer | 42 |
| DECIMAL | Decimal number | 1250.50 |
| BOOLEAN | True/false | true |
| DATE | Date only | "2026-08-26" |
| DATETIME | Date and time | "2026-08-26T12:00:00Z" |
| TIME | Time only | "12:00:00" |
| EMAIL | Email address | "john@example.com" |
| PHONE | Phone number | "+255712345678" |
| URL | Web URL | "https://example.com" |
| UUID | UUID identifier | "uuid" |
| JSON | JSON object | { ... } |
| ENUM | Selection from options | "GOLD" |
| FILE | File upload | File reference |
| IMAGE | Image upload | Image reference |
| CURRENCY | Monetary amount | { amount: 1000, currency: "TZS" } |
| PERCENTAGE | Percentage | 15.5 |
| ADDRESS | Structured address | { street, city, country } |
| REFERENCE | Reference to another entity | "entity-uuid" |
| MULTI_SELECT | Multiple selections | ["tag1", "tag2"] |
| RICH_TEXT | Rich text content | HTML content |

---

## 5. Relationship Types

| Type | Description | Example |
|---|---|---|
| IS_A | Inheritance | Employee IS_A Person |
| HAS | Composition | Company HAS Department |
| USES | Association | Employee USES Asset |
| OWNS | Ownership | Company OWNS Vehicle |
| MANAGES | Management | Employee MANAGES Department |
| BELONGS_TO | Membership | Employee BELONGS_TO Company |
| DEPENDS_ON | Dependency | Product DEPENDS_ON RawMaterial |
| TRIGGERS | Causation | Invoice TRIGGERS Payment |
| CUSTOM | Custom relationship | User-defined |

---

## 6. Entity Categories

| Category | Description | Examples |
|---|---|---|
| PERSON | Human beings | Person, Employee, Customer, Patient, Student |
| ORGANIZATION | Organizations | Company, Department, Branch, Supplier, Vendor |
| PRODUCT | Physical goods | Product, RawMaterial, Component |
| SERVICE | Intangible offerings | Service, Subscription, License |
| ASSET | Owned resources | Vehicle, Equipment, Building, Land |
| DOCUMENT | Records | Contract, License, Permit, Invoice |
| TRANSACTION | Financial events | Transaction, Payment, Transfer |
| FINANCIAL | Financial objects | Account, Budget, Loan |
| LOCATION | Places | Warehouse, Farm, Office |
| CUSTOM | User-defined | Custom entity types |

---

## 7. Permission Actions

| Action | Description |
|---|---|
| CREATE | Create new records |
| READ | View records |
| UPDATE | Modify existing records |
| DELETE | Remove records |
| EXPORT | Export data |
| IMPORT | Import data |
| APPROVE | Approve workflows |
| REJECT | Reject workflows |
| MANAGE | Full management access |

## 8. Permission Scopes

| Scope | Description |
|---|---|
| ALL | Access to all records in tenant |
| OWN | Access to own records only |
| DEPARTMENT | Access to department records |
| BRANCH | Access to branch records |
| COMPANY | Access to company records |

---

> Every API endpoint must be documented here before implementation. This is the contract between frontend, mobile, USSD, and backend.
