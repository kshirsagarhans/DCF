import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { DCFScenario } from '../../../types/dcf';
import { calculateDCF } from '../../dcf/lib/fcf';

export const exportToPDF = async (scenario: DCFScenario, elementId: string = 'root'): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found for PDF export');

  // We capture the current view
  const canvas = await html2canvas(element, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.text(`Antigravity AVS - Valuation Report: ${scenario.companyName}`, 10, 10);
  pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
  
  pdf.save(`${scenario.ticker || 'Valuation'}_Report.pdf`);
};

export const exportToExcel = (scenario: DCFScenario): void => {
  const dcfResults = calculateDCF(scenario);
  
  const wb = XLSX.utils.book_new();

  // 1. Parameters Sheet
  const paramsData = [
    ['Company', scenario.companyName],
    ['Ticker', scenario.ticker],
    ['Sector', scenario.sector],
    ['Currency', scenario.currency],
    ['WACC (%)', scenario.parameters.discountRate],
    ['Terminal Growth Rate (%)', scenario.parameters.perpetuityRate],
    ['Corporate Tax Rate (%)', scenario.parameters.corporateTaxRate],
    [],
    ['Enterprise Value', dcfResults.enterpriseValue],
    ['Terminal Value (PV)', dcfResults.terminalValuePV],
    ['Projections (PV)', dcfResults.projectionsPV],
  ];
  const paramsSheet = XLSX.utils.aoa_to_sheet(paramsData);
  XLSX.utils.book_append_sheet(wb, paramsSheet, 'Summary & Parameters');

  // 2. FCF Build Sheet
  const fcfData = [
    ['Year', 'EBITDA', 'D&A', 'EBIT', 'NOPAT', 'CapEx', 'Change in NWC', 'FCF', 'Discount Factor', 'PV of FCF']
  ];
  dcfResults.fcfRows.forEach(row => {
    fcfData.push([
      row.year.toString(),
      row.ebitda.toString(),
      row.da.toString(),
      row.ebit.toString(),
      row.nopat.toString(),
      row.capex.toString(),
      row.deltaNWC.toString(),
      row.fcf.toString(),
      row.discountFactor.toString(),
      row.presentValue.toString()
    ]);
  });
  const fcfSheet = XLSX.utils.aoa_to_sheet(fcfData);
  XLSX.utils.book_append_sheet(wb, fcfSheet, 'DCF Model');

  // 3. Equity Bridge Sheet (if available)
  if (scenario.equityBridgeInputs) {
    const eq = scenario.equityBridgeInputs;
    const eqData = [
      ['Enterprise Value', dcfResults.enterpriseValue],
      ['Less: Net Debt', eq.netDebt],
      ['Less: Preferred Equity', eq.preferredEquity],
      ['Less: Minority Interest', eq.minorityInterest],
      ['Plus: Cash & Equivalents', eq.cashAndEquivalents],
      [],
      ['Diluted Shares Outstanding', eq.dilutedSharesOutstanding],
      ['Current Market Price', eq.currentMarketPrice]
    ];
    const eqSheet = XLSX.utils.aoa_to_sheet(eqData);
    XLSX.utils.book_append_sheet(wb, eqSheet, 'Equity Bridge');
  }

  XLSX.writeFile(wb, `${scenario.ticker || 'Valuation'}_Model.xlsx`);
};
