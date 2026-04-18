import { DCFScenario, SensitivityGrid } from '../../../types/dcf';
import { calculateDCF } from './fcf';
import { calculateEquityBridge } from './equityBridge';

export function buildSensitivityGrid(
  baseScenario: DCFScenario,
  waccRange: [number, number, number],  // [min, max, step]
  growthRange: [number, number, number],
  includeSharePrice: boolean
): SensitivityGrid {
  const [waccMin, waccMax, waccStep] = waccRange;
  const [growthMin, growthMax, growthStep] = growthRange;

  const waccValues: number[] = [];
  for (let w = waccMin; w <= waccMax; w += waccStep) {
    waccValues.push(Number(w.toFixed(2))); // avoid float precision issues
  }

  const growthValues: number[] = [];
  for (let g = growthMin; g <= growthMax; g += growthStep) {
    growthValues.push(Number(g.toFixed(2)));
  }

  // Ensure grid size matches requested ranges, default 7x7 usually.
  const evGrid: number[][] = [];
  const sharePriceGrid: number[][] | undefined = includeSharePrice ? [] : undefined;

  for (let i = 0; i < waccValues.length; i++) {
    const wacc = waccValues[i];
    const evRow: number[] = [];
    const sharePriceRow: number[] = [];

    for (let j = 0; j < growthValues.length; j++) {
      const g = growthValues[j];

      // Deep copy base parameters and override wacc and growth
      const scenarioCopy: DCFScenario = {
        ...baseScenario,
        parameters: {
          ...baseScenario.parameters,
          discountRate: wacc,
          perpetuityRate: g
        }
      };

      try {
        const dcfResults = calculateDCF(scenarioCopy);
        evRow.push(dcfResults.enterpriseValue);

        if (includeSharePrice && baseScenario.equityBridgeInputs) {
          const bridge = calculateEquityBridge(dcfResults.enterpriseValue, baseScenario.equityBridgeInputs);
          sharePriceRow.push(bridge.intrinsicSharePrice);
        }
      } catch (error) {
        // Validation might fail (e.g. Gordon Growth constraint wacc <= g)
        evRow.push(NaN);
        if (includeSharePrice) {
          sharePriceRow.push(NaN);
        }
      }
    }
    evGrid.push(evRow);
    if (includeSharePrice && sharePriceGrid) {
      sharePriceGrid.push(sharePriceRow);
    }
  }

  return {
    waccValues,
    growthValues,
    evGrid,
    sharePriceGrid
  };
}
