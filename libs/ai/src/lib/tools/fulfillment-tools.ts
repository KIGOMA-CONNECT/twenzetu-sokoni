import { registerAiTool } from './ai-tools.registry';

export function registerFulfillmentTools(): void {
  registerAiTool('findFulfillmentOptions', {
    schema: {
      name: 'findFulfillmentOptions',
      description: 'Find fulfillment options (delivery/boda/usafiri) for a product/service and location',
      usage: 'Use when user wants item delivered by boda/usafiri or wants transport/fulfillment options',
      parameters: {
        productId: { type: 'string', required: false, description: 'Product ID' },
        serviceId: { type: 'string', required: false, description: 'Service ID' },
        vendorId: { type: 'string', required: false, description: 'Vendor/shop ID' },
        lat: { type: 'number', required: false, description: 'Dropoff latitude' },
        lng: { type: 'number', required: false, description: 'Dropoff longitude' },
        pickupLat: { type: 'number', required: false, description: 'Pickup latitude' },
        pickupLng: { type: 'number', required: false, description: 'Pickup longitude' },
        weightKg: { type: 'number', required: false, description: 'Estimated weight in kg' },
      },
    },
    handler: (args) => {
      const productId = args.productId as string | undefined;
      const serviceId = args.serviceId as string | undefined;
      const vendorId = args.vendorId as string | undefined;
      const lat = args.lat as number | undefined;
      const lng = args.lng as number | undefined;
      const pickupLat = args.pickupLat as number | undefined;
      const pickupLng = args.pickupLng as number | undefined;
      const weightKg = args.weightKg as number | undefined;

      const hasLocation = lat !== undefined && lng !== undefined;
      const hasPickup = pickupLat !== undefined && pickupLng !== undefined;

      const distanceKm =
        hasLocation && hasPickup
          ? Math.hypot((lat! - pickupLat!) * 111, (lng! - pickupLng!) * 111).toFixed(2)
          : undefined;

      return {
        productId,
        serviceId,
        vendorId,
        dropoff: hasLocation ? { lat, lng } : undefined,
        pickup: hasPickup ? { lat: pickupLat, lng: pickupLng } : undefined,
        distanceKm: distanceKm ? Number(distanceKm) : undefined,
        fulfillment: {
          delivery: true,
          boda: true,
          usafiri: true,
          providers: [
            { type: 'boda', label: 'Boda', etaMin: 10, feeEstimate: 2500, notes: 'Motorbike — small items' },
            { type: 'courier', label: 'Courier', etaMin: 20, feeEstimate: 3500, notes: 'Secure delivery' },
            { type: 'van', label: 'Van/Usafiri', etaMin: 40, feeEstimate: 6000, notes: 'Larger items' },
          ],
          coverage: true,
          weightSupported: weightKg ? (weightKg <= 15 ? 'light' : weightKg <= 50 ? 'medium' : 'heavy') : 'light',
        },
        insufficientData:
          !vendorId && !productId && !serviceId && !hasLocation
            ? ['vendorId/productId/serviceId and location needed for precise options']
            : [],
      };
    },
  });

  registerAiTool('suggestTransportForRequest', {
    schema: {
      name: 'suggestTransportForRequest',
      description: 'Suggest best transport (boda/usafiri) for a request',
      usage: 'Use when user asks for "boda" or "usafiri" to fulfill product/service',
      parameters: {
        intent: { type: 'string', required: false, description: 'e.g. "deliver product", "move item"' },
        pickupLat: { type: 'number', required: false },
        pickupLng: { type: 'number', required: false },
        dropoffLat: { type: 'number', required: false },
        dropoffLng: { type: 'number', required: false },
        weightKg: { type: 'number', required: false },
        vendorId: { type: 'string', required: false },
      },
    },
    handler: (args) => {
      const intent = String(args.intent || '');
      const pickupLat = args.pickupLat as number | undefined;
      const pickupLng = args.pickupLng as number | undefined;
      const dropoffLat = args.dropoffLat as number | undefined;
      const dropoffLng = args.dropoffLng as number | undefined;
      const weightKg = args.weightKg as number | undefined;
      const vendorId = args.vendorId as string | undefined;

      const hasLoc = pickupLat !== undefined && pickupLng !== undefined && dropoffLat !== undefined && dropoffLng !== undefined;
      const distanceKm = hasLoc ? Number(Math.hypot((dropoffLat! - pickupLat!) * 111, (dropoffLng! - pickupLng!) * 111).toFixed(2)) : undefined;

      let best: 'boda' | 'courier' | 'van' = 'boda';
      if (weightKg && weightKg > 15) best = weightKg > 50 ? 'van' : 'courier';

      const fees: Record<string, number> = { boda: 2500, courier: 3500, van: 6000 };
      const etas: Record<string, number> = { boda: 10, courier: 20, van: 40 };

      return {
        intent,
        vendorId,
        pickup: hasLoc ? { lat: pickupLat, lng: pickupLng } : undefined,
        dropoff: hasLoc ? { lat: dropoffLat, lng: dropoffLng } : undefined,
        distanceKm,
        bestFit: best,
        recommendation: {
          type: best,
          label: best === 'van' ? 'Van/Usafiri' : best === 'courier' ? 'Courier' : 'Boda',
          etaMin: etas[best],
          feeEstimate: fees[best],
          reason: weightKg ? `Fits ~${weightKg}kg` : 'Light item (default)',
        },
        allOptions: [
          { type: 'boda', label: 'Boda', etaMin: 10, feeEstimate: 2500 },
          { type: 'courier', label: 'Courier', etaMin: 20, feeEstimate: 3500 },
          { type: 'van', label: 'Van/Usafiri', etaMin: 40, feeEstimate: 6000 },
        ],
      };
    },
  });
}
