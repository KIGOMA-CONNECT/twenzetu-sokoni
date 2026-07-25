export type DisputeStatus = 'OPEN' | 'AI_REVIEWING' | 'AUTO_REFUNDED' | 'ESCALATED_TO_HUMAN' | 'RESOLVED' | 'CLOSED';

export type DisputeSeverity = 'LOW' | 'HIGH';

export type DisputeReason =
  | 'FOOD_COLD'
  | 'FOOD_MISSING'
  | 'FOOD_WRONG'
  | 'PRODUCT_DAMAGED'
  | 'PRODUCT_NOT_AS_DESCRIBED'
  | 'LAUNDRY_STAINED'
  | 'LAUNDRY_MISSING'
  | 'DELIVERY_LATE'
  | 'ITEM_NOT_RECEIVED'
  | 'QUALITY_POOR'
  | 'OTHER';

export type DisputeResolutionType = 'FULL_REFUND' | 'PARTIAL_REFUND' | 'RE_DELIVERY' | 'RE_WASH' | 'REJECTED';
