# ABMS Domain Map

> Business boundaries that define what each platform owns.

## Bounded Contexts

```
ABMS Platform
│
├── Identity Context
│   ├── User
│   ├── Tenant
│   ├── Company
│   ├── Branch
│   ├── Role
│   ├── Permission
│   ├── Session
│   └── Authentication
│
├── Organization Context
│   ├── Organization
│   ├── Department
│   ├── Business Unit
│   ├── Job Position
│   ├── Cost Center
│   └── Company Structure
│
├── Finance Context
│   ├── Chart of Accounts
│   ├── Journal Entry
│   ├── Fiscal Period
│   ├── Account Balance
│   ├── Accounts Payable
│   ├── Accounts Receivable
│   ├── Cash & Bank
│   ├── Fixed Asset
│   ├── Budget
│   └── Financial Report
│
├── HR Context
│   ├── Employee
│   ├── Contract
│   ├── Attendance
│   ├── Leave
│   ├── Payroll
│   ├── Benefit
│   ├── Performance
│   ├── Training
│   └── Succession
│
├── CRM Context
│   ├── Lead
│   ├── Opportunity
│   ├── Contact
│   ├── Account
│   ├── Campaign
│   └── Customer Service
│
├── Procurement Context
│   ├── Purchase Requisition
│   ├── Purchase Order
│   ├── Supplier
│   ├── Contract
│   ├── Tender
│   ├── Goods Receipt
│   └── Invoice
│
├── Inventory Context
│   ├── Item Master
│   ├── Warehouse
│   ├── Stock Level
│   ├── Stock Movement
│   ├── Batch
│   ├── Serial Number
│   └── Stock Count
│
├── Supply Chain Context
│   ├── Demand Plan
│   ├── Supply Plan
│   ├── Shipment
│   ├── Route
│   ├── Carrier
│   └── Delivery
│
├── Manufacturing Context
│   ├── Production Order
│   ├── Bill of Materials
│   ├── Work Center
│   ├── Operation
│   └── Quality Record
│
├── Projects Context
│   ├── Project
│   ├── Task
│   ├── Milestone
│   ├── Resource
│   ├── Timesheet
│   └── Issue
│
├── Assets Context
│   ├── Asset
│   ├── Depreciation
│   ├── Maintenance Schedule
│   ├── Maintenance Work Order
│   └── Physical Verification
│
├── Quality Context
│   ├── Quality Plan
│   ├── Quality Inspection
│   ├── Non-Conformance
│   └── Corrective Action
│
├── Risk Context
│   ├── Risk Register
│   ├── Risk Assessment
│   ├── Incident
│   └── Business Continuity
│
├── Compliance Context
│   ├── Regulation
│   ├── Policy
│   ├── Audit Finding
│   ├── Compliance Check
│   └── Document
│
├── Marketplace Context
│   ├── Vendor
│   ├── Product
│   ├── Order
│   ├── Cart
│   ├── Payment
│   ├── Delivery
│   ├── Review
│   └── Category
│
├── Analytics Context
│   ├── Dashboard
│   ├── Report
│   ├── Metric
│   ├── Data Source
│   └── Visualization
│
├── AI Context
│   ├── Model
│   ├── Prediction
│   ├── Recommendation
│   ├── Automation
│   └── Training Data
│
└── Industry Contexts
    ├── Healthcare
    │   ├── Patient
    │   ├── Medical Record
    │   ├── Appointment
    │   ├── Prescription
    │   └── Lab Result
    │
    ├── Government
    │   ├── Citizen
    │   ├── Permit
    │   ├── License
    │   ├── Revenue
    │   └── Public Project
    │
    ├── Education
    │   ├── Student
    │   ├── Course
    │   ├── Enrollment
    │   ├── Examination
    │   └── Grade
    │
    └── Agriculture
        ├── Farm
        ├── Crop
        ├── Input
        ├── Harvest
        └── Market
```

## Domain Rules

1. **Aggregate per context.** Each bounded context has one aggregate root.
2. **Repository per aggregate.** Each aggregate has one repository.
3. **Factory when needed.** Complex creation uses factory pattern.
4. **Value Objects immutable.** Value objects cannot change after creation.
5. **Entities mutable via methods.** No public setters.
6. **Events published on state change.** Every state change publishes a domain event.
7. **No cross-context database access.** Contexts communicate via events or APIs.
8. **Business Constitution per context.** Invariants, policies, and rules are defined per bounded context.

## Event Map

```
Identity Context
  ├── UserCreated
  ├── UserActivated
  ├── UserDeactivated
  ├── TenantCreated
  └── TenantSuspended

Finance Context
  ├── JournalEntryPosted
  ├── PaymentProcessed
  ├── InvoiceCreated
  ├── BudgetExceeded
  └── FiscalPeriodClosed

HR Context
  ├── EmployeeHired
  ├── PayrollProcessed
  ├── LeaveRequested
  ├── LeaveApproved
  └── PerformanceReviewed

Procurement Context
  ├── PurchaseOrderCreated
  ├── GoodsReceived
  ├── InvoiceMatched
  └── SupplierEvaluated

Inventory Context
  ├── StockReceived
  ├── StockIssued
  ├── StockTransferred
  ├── LowStockAlert
  └── StockCountCompleted

Marketplace Context
  ├── OrderPlaced
  ├── OrderCompleted
  ├── PaymentReceived
  ├── DeliveryDispatched
  └── ReviewSubmitted
```
