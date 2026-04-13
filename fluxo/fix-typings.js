/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

const historyPaths = ['./src/actions/history.ts'];
historyPaths.forEach(p => {
  let text = fs.readFileSync(p, 'utf8');
  text = text.replace(/balanceDue: number;/g, 'updatedAmount: number;\n  paidAmount?: number | null;');
  text = text.replace(/balanceDue:\s*true/g, 'updatedAmount: true, paidAmount: true');
  fs.writeFileSync(p, text);
});

const exportUtils = './src/lib/export-utils.ts';
if (fs.existsSync(exportUtils)) {
  let text = fs.readFileSync(exportUtils, 'utf8');
  text = text.replace(/balanceDue: number;/g, 'updatedAmount: number;');
  text = text.replace(/inv\.balanceDue/g, 'inv.updatedAmount');
  fs.writeFileSync(exportUtils, text);
}

const reportsPath = './src/components/reports/OverdueReportClient.tsx';
if (fs.existsSync(reportsPath)) {
  let text = fs.readFileSync(reportsPath, 'utf8');
  text = text.replace(/balanceDue/g, 'updatedAmount');
  fs.writeFileSync(reportsPath, text);
}

const forecastPath = './src/actions/forecast.ts';
if (fs.existsSync(forecastPath)) {
  let text = fs.readFileSync(forecastPath, 'utf8');
  text = text.replace(/balanceDue: number/g, 'updatedAmount: number');
  fs.writeFileSync(forecastPath, text);
}

console.log('Fixed interfaces part 2!');
