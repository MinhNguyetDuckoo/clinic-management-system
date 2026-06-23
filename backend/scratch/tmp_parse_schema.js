const fs = require('fs');
const path = require('path');
const files = fs.readdirSync(path.join(__dirname, 'database', '02_tables')).filter(f => f.endsWith('.sql')).sort();
for (const fn of files) {
  const text = fs.readFileSync(path.join(__dirname, 'database', '02_tables', fn), 'utf8');
  const re = /CREATE TABLE\s+([A-Za-z0-9_]+)\s*\(([^]*?)\)\s*GO/gi;
  let m;
  let printedFile = false;
  while ((m = re.exec(text)) !== null) {
    if (!printedFile) {
      console.log('FILE:', fn);
      printedFile = true;
    }
    const table = m[1];
    const body = m[2];
    console.log('  TABLE:', table);
    const fks = [...body.matchAll(/FOREIGN KEY \(([A-Za-z0-9_,\s]+)\)\s*REFERENCES\s+([A-Za-z0-9_]+)\s*\(([A-Za-z0-9_,\s]+)\)/gi)];
    for (const fk of fks) {
      console.log('    FK:', fk[1].trim(), '->', fk[2] + '(' + fk[3].trim() + ')');
    }
  }
  if (printedFile) console.log();
}
