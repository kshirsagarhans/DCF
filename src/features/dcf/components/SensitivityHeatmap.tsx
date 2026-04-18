import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SensitivityGrid } from '../../../types/dcf';
import { formatCurrency } from '../../../shared/utils/format';

interface SensitivityHeatmapProps {
  grid: SensitivityGrid;
  baseWacc: number;
  baseGrowth: number;
  currency: string;
  onCellClick: (wacc: number, growth: number) => void;
  showSharePrice?: boolean;
}

export const SensitivityHeatmap: React.FC<SensitivityHeatmapProps> = ({
  grid,
  baseWacc,
  baseGrowth,
  currency,
  onCellClick,
  showSharePrice = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || grid.waccValues.length === 0 || grid.growthValues.length === 0) return;
    
    // Clear previous
    d3.select(containerRef.current).selectAll('*').remove();

    const dataMatrix = showSharePrice && grid.sharePriceGrid ? grid.sharePriceGrid : grid.evGrid;

    // Find min and max for color scale
    let minVal = Infinity;
    let maxVal = -Infinity;
    dataMatrix.forEach(row => {
      row.forEach(val => {
        if (!isNaN(val)) {
          if (val < minVal) minVal = val;
          if (val > maxVal) maxVal = val;
        }
      });
    });

    const margin = { top: 40, right: 20, bottom: 20, left: 60 };
    const width = containerRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Build X scales and axis (Growth)
    const x = d3.scaleBand()
      .range([0, width])
      .domain(grid.growthValues.map(String))
      .padding(0.05);
    
    svg.append('g')
      .attr('transform', `translate(0,-20)`)
      .call(d3.axisTop(x).tickSize(0))
      .select('.domain').remove();
    
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .text('Terminal Growth Rate % →');

    // Build Y scales and axis (WACC)
    const y = d3.scaleBand()
      .range([0, height])
      .domain(grid.waccValues.map(String))
      .padding(0.05);

    svg.append('g')
      .call(d3.axisLeft(y).tickSize(0))
      .select('.domain').remove();

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .text('WACC % →');

    // Color scale
    const myColor = d3.scaleLinear<string>()
      .range(['#ff5c3a', '#f5a623', '#00c896'])
      .domain([minVal, (minVal + maxVal) / 2, maxVal]);

    // Draw cells
    for (let i = 0; i < grid.waccValues.length; i++) {
      for (let j = 0; j < grid.growthValues.length; j++) {
        const wacc = grid.waccValues[i];
        const growth = grid.growthValues[j];
        const val = dataMatrix[i][j];
        
        const isBase = Math.abs(wacc - baseWacc) < 0.01 && Math.abs(growth - baseGrowth) < 0.01;

        const cell = svg.append('g')
          .attr('transform', `translate(${x(String(growth))}, ${y(String(wacc))})`);

        cell.append('rect')
          .attr('width', x.bandwidth())
          .attr('height', y.bandwidth())
          .attr('rx', 4)
          .attr('ry', 4)
          .style('fill', isNaN(val) ? 'var(--bg-surface-3)' : myColor(val))
          .style('stroke', isBase ? 'var(--text-primary)' : 'none')
          .style('stroke-width', isBase ? 2 : 0)
          .style('cursor', 'pointer')
          .on('mouseover', function() {
            d3.select(this).style('opacity', 0.8);
          })
          .on('mouseout', function() {
            d3.select(this).style('opacity', 1);
          })
          .on('click', () => {
            if (!isNaN(val)) {
              onCellClick(wacc, growth);
            }
          });

        cell.append('text')
          .attr('x', x.bandwidth() / 2)
          .attr('y', y.bandwidth() / 2)
          .attr('dy', '.35em')
          .attr('text-anchor', 'middle')
          .style('fill', 'var(--bg-base)')
          .style('font-size', '13px')
          .style('font-weight', '500')
          .style('font-family', 'JetBrains Mono')
          .style('pointer-events', 'none')
          .text(isNaN(val) ? 'N/A' : formatCurrency(val, currency, true));
      }
    }
  }, [grid, baseWacc, baseGrowth, currency, showSharePrice, onCellClick]);

  return <div ref={containerRef} className="w-full h-[400px]"></div>;
};
