import fs from 'fs';
import path from 'path';

const filesToClean = [
  'src/actions/import.ts',
  'src/actions/forecast.ts',
  'src/actions/invoices.ts',
  'src/actions/reports.ts',
  'src/actions/history.ts',
  'src/actions/automation.ts',
  'src/actions/reports-extended.ts',
  'src/actions/queue.ts'
];

let replacedCount = 0;

for (const relPath of filesToClean) {
  const absPath = path.resolve(relPath);
  if (!fs.existsSync(absPath)) continue;
  
  const content = fs.readFileSync(absPath, 'utf8');
  
  // Replace session user cast
  let newContent = content.replaceAll(/\(session\?\.user\s+as\s+any\)\?\.tenantId/g, 'session?.user?.tenantId');
  
  // Replace generic trailing `} as any` (could be risky if it's on a custom return type, but here it's likely just objects)
  newContent = newContent.replaceAll(/\}\s+as\s+any/g, '}');
  
  // Replace `(prisma.X.Y as any)`
  newContent = newContent.replaceAll(/\(prisma\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s+as\s+any\)/g, 'prisma.$1.$2');
  
  // generic ` as any` inside map or specific ones like `((customer as any).invoices as any[])`
  newContent = newContent.replaceAll(/\(\(customer\s+as\s+any\)\.invoices\s+as\s+any\[\]\)/g, '(customer as any).invoices');
  newContent = newContent.replaceAll(/\(customer\s+as\s+any\)\.invoices/g, '(customer as any).invoices'); // wait this is dumb
  
  // actually let's just replace ` as any` blind generic IF it's safe.
  // We have specific casts from the grep output:
  // "updatedAmount: (inv as any).updatedAmount || inv.amount," -> "updatedAmount: (inv as any).updatedAmount || inv.amount," Wait, inv.updatedAmount is valid in DB now.
  newContent = newContent.replaceAll(/\(inv\s+as\s+any\)\.updatedAmount/g, 'inv.updatedAmount');
  newContent = newContent.replaceAll(/status:\s+inv\.status\s+as\s+any/g, 'status: inv.status');
  newContent = newContent.replaceAll(/select:\s+\{\s*id:\s*true,\s*status:\s*true,\s*amount:\s*true,\s*updatedAt:\s*true\s*\}\s*as\s+any/g, 'select: { id: true, status: true, amount: true, updatedAt: true }');
  newContent = newContent.replaceAll(/const invoiceList:\s*any\[\]\s*=\s*\(c\s*as\s*any\)\.invoices\s*\|\|\s*\[\];/g, 'const invoiceList = c.invoices || [];');
  newContent = newContent.replaceAll(/const lastComm\s*=\s*\(c\s*as\s*any\)\.communications\?\.\[0\]\?\.sentAt\s*\?\?\s*null;/g, 'const lastComm = c.communications?.[0]?.sentAt ?? null;');
  newContent = newContent.replaceAll(/const lastNote\s*=\s*\(c\s*as\s*any\)\.customerNotes\?\.\[0\]\?\.createdAt\s*\?\?\s*null;/g, 'const lastNote = c.customerNotes?.[0]?.createdAt ?? null;');
  
  newContent = newContent.replaceAll(/select:\s+\{\s*id:\s*true,\s*invoiceNumber:\s*true,\s*amount:\s*true,\s*dueDate:\s*true,\s*status:\s*true\s*\}\s*as\s+any,/g, 'select: { id: true, invoiceNumber: true, amount: true, dueDate: true, status: true },');
  newContent = newContent.replaceAll(/const invoiceIds\s*=\s*\(\(customer\s+as\s+any\)\.invoices\s+as\s+any\[\]\)\.map\(\(i:\s+any\)\s*=>\s*i\.id\);/g, 'const invoiceIds = (customer.invoices || []).map(i => i.id);');
  newContent = newContent.replaceAll(/invoices:\s*\(customer\s+as\s+any\)\.invoices,/g, 'invoices: customer.invoices,');
  

  if (content !== newContent) {
    fs.writeFileSync(absPath, newContent);
    // count how many literal `as any` blocks were removed roughly
    const difference = (content.match(/as any/g) || []).length - (newContent.match(/as any/g) || []).length;
    replacedCount += difference;
    console.log(`Cleaned ${relPath} (-${difference} casts)`);
  }
}

console.log("TOTAL REMOVED:", replacedCount);
