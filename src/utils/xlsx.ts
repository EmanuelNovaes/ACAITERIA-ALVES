type Sheet = { name: string; rows: unknown[][] };
const enc = new TextEncoder();
const xml = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const col = (n: number) => { let s = ''; while (n) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
function sheetXml(rows: unknown[][], withLogo = false) {
  const data = rows.map((row, ri) => `<row r="${ri + 1}">${row.map((cell, ci) => {
    const ref = `${col(ci + 1)}${ri + 1}`;
    if (typeof cell === 'number' && Number.isFinite(cell)) return `<c r="${ref}"><v>${cell}</v></c>`;
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(cell)}</t></is></c>`;
  }).join('')}</row>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetData>${data}</sheetData>${withLogo?'<drawing r:id="rId1"/>':''}</worksheet>`;
}
const crc32 = (bytes: Uint8Array) => { let c = -1; for (const b of bytes) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return (c ^ -1) >>> 0; };
function zip(files: Array<{ name: string; content: string | Uint8Array }>) {
  const local: Uint8Array[] = []; const central: Uint8Array[] = []; let offset = 0;
  const put16 = (v: DataView, p: number, n: number) => v.setUint16(p, n, true);
  const put32 = (v: DataView, p: number, n: number) => v.setUint32(p, n, true);
  for (const file of files) {
    const name = enc.encode(file.name); const data = typeof file.content === 'string' ? enc.encode(file.content) : file.content; const crc = crc32(data);
    const lh = new Uint8Array(30 + name.length); const ld = new DataView(lh.buffer);
    put32(ld,0,0x04034b50); put16(ld,4,20); put16(ld,6,0x0800); put16(ld,8,0); put16(ld,12,33); put32(ld,14,crc); put32(ld,18,data.length); put32(ld,22,data.length); put16(ld,26,name.length); lh.set(name,30); local.push(lh,data);
    const ch = new Uint8Array(46 + name.length); const cd = new DataView(ch.buffer);
    put32(cd,0,0x02014b50); put16(cd,4,20); put16(cd,6,20); put16(cd,8,0x0800); put16(cd,10,0); put16(cd,14,33); put32(cd,16,crc); put32(cd,20,data.length); put32(cd,24,data.length); put16(cd,28,name.length); put32(cd,42,offset); ch.set(name,46); central.push(ch); offset += lh.length + data.length;
  }
  const centralBytes = central.reduce((n, a) => n + a.length, 0); const end = new Uint8Array(22); const ev = new DataView(end.buffer);
  put32(ev,0,0x06054b50); put16(ev,8,files.length); put16(ev,10,files.length); put32(ev,12,centralBytes); put32(ev,16,offset);
  const parts = [...local, ...central, end].map(bytes => { const copy = new Uint8Array(bytes.length); copy.set(bytes); return copy.buffer as ArrayBuffer; });
  return new Blob(parts, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
export async function downloadXlsx(sheets: Sheet[], filename: string) {
  const escaped = sheets.map(s => xml(s.name.slice(0,31)));
  let logo: Uint8Array | null = null;
  try { const response = await fetch('/logo.png'); if(response.ok) logo = new Uint8Array(await response.arrayBuffer()); } catch { /* Workbook remains valid without the optional image. */ }
  const files = [
    { name: '[Content_Types].xml', content: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${logo?'<Default Extension="png" ContentType="image/png"/>':''}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}${logo?'<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>':''}</Types>` },
    { name: '_rels/.rels', content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', content: `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((_,i)=>`<sheet name="${escaped[i]}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>` },
    ...sheets.map((s,i) => ({ name: `xl/worksheets/sheet${i+1}.xml`, content: sheetXml(s.rows, Boolean(logo)&&i===0) })),
    ...(logo ? [
      { name:'xl/worksheets/_rels/sheet1.xml.rels', content:'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>' },
      { name:'xl/drawings/drawing1.xml', content:'<?xml version="1.0" encoding="UTF-8"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:twoCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>3</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>5</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="1" name="Logo Açaiteria Alves"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="3000000" cy="1500000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>' },
      { name:'xl/drawings/_rels/drawing1.xml.rels', content:'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/logo.png"/></Relationships>' },
      { name:'xl/media/logo.png', content:logo }
    ] : [])
  ];
  const url = URL.createObjectURL(zip(files)); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
