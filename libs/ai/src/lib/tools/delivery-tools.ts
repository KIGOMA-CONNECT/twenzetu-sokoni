import { registerAiTool } from './ai-tools.registry';

export function registerDeliveryTools(): void {
  registerAiTool('estimateEta', {
    schema: {
      name: 'estimateEta',
      description: 'Estimate delivery ETA from distance',
      usage: 'Use for ETA from km',
      parameters: {
        distanceKm: { type: 'number', required: true, description: 'Distance in KM' },
        avgSpeedKmh: { type: 'number', required: false, description: 'Avg speed km/h, default 30' },
      },
    },
    handler: (args) => {
      const dist = args.distanceKm as number;
      const speed = (args.avgSpeedKmh as number) ?? 30;
      const hours = dist / speed;
      const minutes = Math.round(hours * 60);
      return { distanceKm: dist, avgSpeedKmh: speed, etaMinutes: minutes };
    },
  });

  registerAiTool('suggestDriver', {
    schema: {
      name: 'suggestDriver',
      description: 'Suggest driver for order from available drivers',
      usage: 'Use when assigning driver',
      parameters: { orderId: { type: 'string', required: true } },
    },
    handler: (args) => {
      return { orderId: args.orderId, suggestion: 'Assign least-loaded online driver' };
    },
  });
}
