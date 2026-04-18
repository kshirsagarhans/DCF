import { MonteCarloConfig, MonteCarloResults, DCFScenario } from '../../../types/dcf';
import { calculateDCF } from '../../dcf/lib/fcf';

// Normal distribution approximation using Box-Muller transform
function generateNormal(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * stdDev + mean;
}

self.onmessage = (e: MessageEvent<{ config: MonteCarloConfig; baseScenario: DCFScenario }>) => {
  const { config, baseScenario } = e.data;
  
  const evDistribution: number[] = [];
  let skipped = 0;
  
  for (let i = 0; i < config.trials; i++) {
    // Generate random variables
    let wacc = generateNormal(config.waccMean, config.waccStd);
    let growth = generateNormal(config.growthMean, config.growthStd);
    let ebitdaGrowth = generateNormal(config.ebitdaGrowthMean, config.ebitdaGrowthStd);
    
    // Constraint check
    if (wacc <= growth) {
      skipped++;
      i--; // Retry this trial
      continue;
    }
    
    // Apply ebitdaGrowth to all projected years
    const scenarioCopy: DCFScenario = JSON.parse(JSON.stringify(baseScenario));
    scenarioCopy.parameters.discountRate = wacc;
    scenarioCopy.parameters.perpetuityRate = growth;
    
    const projectedYears = scenarioCopy.forecastYears.filter(y => y > scenarioCopy.historicalCutoffYear);
    
    // Simplification for simulation: base year EBITDA and apply constant growth rate
    let lastEbitda = scenarioCopy.ebitdaData[scenarioCopy.historicalCutoffYear] || 0;
    projectedYears.forEach(year => {
      lastEbitda = lastEbitda * (1 + ebitdaGrowth / 100);
      scenarioCopy.ebitdaData[year] = lastEbitda;
      // We assume D&A, CapEx, NWC scale proportionally to EBITDA for the simulation
      // A more complex simulation would model revenue and margins
    });

    try {
      const results = calculateDCF(scenarioCopy);
      evDistribution.push(results.enterpriseValue);
    } catch (err) {
      skipped++;
      i--; // Retry
    }
    
    // Progress reporting
    if (i % 500 === 0 && i > 0) {
      self.postMessage({ type: 'progress', progress: (i / config.trials) * 100, skipped });
    }
  }
  
  // Calculate stats
  evDistribution.sort((a, b) => a - b);
  
  const getPercentile = (p: number) => {
    const idx = Math.floor(p * evDistribution.length);
    return evDistribution[idx];
  };
  
  const sum = evDistribution.reduce((a, b) => a + b, 0);
  const mean = sum / evDistribution.length;
  
  const variance = evDistribution.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / evDistribution.length;
  const std = Math.sqrt(variance);

  const results: MonteCarloResults = {
    evDistribution,
    p10: getPercentile(0.10),
    p25: getPercentile(0.25),
    p50: getPercentile(0.50),
    p75: getPercentile(0.75),
    p90: getPercentile(0.90),
    mean,
    std
  };
  
  self.postMessage({ type: 'complete', results, skipped });
};
