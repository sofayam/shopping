export const PRINT_FONTS = {
  elegant: {
    googleFont: 'Pinyon Script',
    importWeights: 'Pinyon+Script',
    fontFamily: "'Pinyon Script', cursive",
    label: 'Pinyon Script',
    basePt: 17,
    typeHeadingTransform: 'capitalize',
    typeHeadingExtra: 'text-shadow: 0.4px 0 0 currentColor, -0.4px 0 0 currentColor, 0 0.4px 0 currentColor;',
    itemIndent: '1.4em',
  },
  sans: {
    googleFont: 'Jost',
    importWeights: 'Jost:wght@300;400;600',
    fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif",
    label: 'Jost',
    basePt: 14,
  },
  courier: {
    googleFont: 'Courier Prime',
    importWeights: 'Courier+Prime:wght@400;700',
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    label: 'Courier Prime',
    basePt: 14,
  },
};

// em ratios relative to the base (item) font size
const EM = {
  item:        1,
  typeHeading: 0.72,
  shopHeading: 1.07,
  title:       1.43,
  date:        0.75,
};

function sectionWeight(typeGroup, shopHeading) {
  const [type, items] = typeGroup;
  const visibleItems = items.filter(n => n !== type).length;
  return (shopHeading ? 1.8 : 0) + 1.2 + visibleItems;
}

function splitSections(shopsWithGroups, isSingleShop) {
  const chunks = [];
  if (isSingleShop) {
    shopsWithGroups[0].typeGroups.forEach(tg => {
      chunks.push({ shopHeading: null, typeGroup: tg });
    });
  } else {
    shopsWithGroups.forEach(shop => {
      shop.typeGroups.forEach((tg, i) => {
        chunks.push({ shopHeading: i === 0 ? shop.shopName : null, typeGroup: tg });
      });
    });
  }

  const totalWeight = chunks.reduce((s, c) => s + sectionWeight(c.typeGroup, c.shopHeading), 0);
  if (totalWeight < 6) return [chunks, []];

  const half = totalWeight / 2;
  let acc = 0;
  let splitAt = chunks.length;
  for (let i = 0; i < chunks.length; i++) {
    acc += sectionWeight(chunks[i].typeGroup, chunks[i].shopHeading);
    if (acc >= half) { splitAt = i + 1; break; }
  }
  return [chunks.slice(0, splitAt), chunks.slice(splitAt)];
}

function renderChunks(chunks, typeHeadingTransform) {
  return chunks.map(({ shopHeading, typeGroup }) => {
    const [type, items] = typeGroup;
    const visibleItems = items.filter(n => n !== type);
    return `
      ${shopHeading ? `<div class="shop-heading">${shopHeading}</div>` : ''}
      <div class="section">
        <div class="type-heading">${type}</div>
        ${visibleItems.map(n => `<div class="item">${n}</div>`).join('')}
      </div>`;
  }).join('');
}

export function printPurchaseList(purchaseList, fontKey) {
  const font = PRINT_FONTS[fontKey] || PRINT_FONTS.sans;
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const isSingleShop = purchaseList.allocated.length === 1;

  const shopsWithGroups = purchaseList.allocated.map(shopData => {
    const byType = new Map();
    shopData.items.forEach(item => {
      if (!byType.has(item.item_type)) byType.set(item.item_type, []);
      byType.get(item.item_type).push(item.name);
    });
    return { shopName: shopData.shopName, typeGroups: Array.from(byType.entries()) };
  });

  const [col1, col2] = splitSections(shopsWithGroups, isSingleShop);
  const twoColumns = col2.length > 0;
  const typeHeadingTransform = font.typeHeadingTransform || 'uppercase';

  const contentHtml = twoColumns
    ? `<div class="columns">
         <div class="col">${renderChunks(col1, typeHeadingTransform)}</div>
         <div class="col">${renderChunks(col2, typeHeadingTransform)}</div>
       </div>`
    : `<div class="col single-col">${renderChunks(col1, typeHeadingTransform)}</div>`;

  const header = isSingleShop
    ? `<div class="header single">
         <span class="shop-title">${shopsWithGroups[0].shopName}</span>
         <span class="date">${today}</span>
       </div>`
    : `<div class="header multi">
         <span class="date">${today}</span>
       </div>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Shopping List</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${font.importWeights}&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 0; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* html fills the full A4 page and hosts the fold-line pseudo-elements */
    html {
      position: relative;
      margin: 0; padding: 0;
      width: 210mm; height: 297mm;
      overflow: hidden;
    }
    html::before {
      content: '';
      position: absolute;
      top: 0; left: 105mm;
      width: 0; height: 297mm;
      border-left: 1px dashed #bbb;
    }
    html::after {
      content: '';
      position: absolute;
      left: 0; top: 148.5mm;
      width: 210mm; height: 0;
      border-top: 1px dashed #bbb;
    }

    /* body contains only the content quadrant — cannot cause second page */
    body {
      margin: 0; padding: 0;
      width: 105mm; height: 148.5mm;
      overflow: hidden;
      background: white;
    }

    /* ── Print area ── */
    #print-area {
      width: 105mm;
      height: 148.5mm;
      padding: 7mm 8mm 6mm 8mm;
      overflow: hidden;
      font-family: ${font.fontFamily};
      font-size: ${font.basePt}pt;
      color: #000;
    }

    /* ── Header ── */
    .header.single {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.3em;
      margin-bottom: 0.2em;
    }
    .shop-title {
      font-size: ${EM.title}em;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .header.multi {
      text-align: right;
      margin-bottom: 0.2em;
    }
    .date {
      font-size: ${EM.date}em;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .rule {
      border: none;
      border-top: 0.4pt solid #000;
      margin-bottom: 0.3em;
    }

    /* ── Two-column layout ── */
    .columns {
      display: flex;
      gap: 5mm;
      align-items: flex-start;
    }
    .col { flex: 1; min-width: 0; }
    .single-col { width: 100%; }

    /* ── Shop headings ── */
    .shop-heading {
      font-size: ${EM.shopHeading}em;
      font-weight: 700;
      margin-bottom: 0.1em;
      margin-top: 0.4em;
      padding-bottom: 0.06em;
      border-bottom: 0.3pt solid #000;
    }
    .shop-heading:first-child { margin-top: 0; }

    /* ── Type sections ── */
    .section { margin-bottom: 0.35em; }
    .type-heading {
      font-size: ${EM.typeHeading}em;
      font-weight: 600;
      text-transform: ${typeHeadingTransform};
      letter-spacing: 0.06em;
      margin-bottom: 0.06em;
      margin-top: 0.1em;
      ${font.typeHeadingExtra || ''}
    }

    /* ── Items ── */
    .item {
      font-size: ${EM.item}em;
      line-height: 1.4;
      padding-left: ${font.itemIndent || '0.2em'};
    }
  </style>
</head>
<body>
  <div id="print-area">
    ${header}
    <hr class="rule">
    ${contentHtml}
  </div>
  <script>
    (function () {
      var MIN_PT = 7;
      var STEP   = 0.5;
      var area   = document.getElementById('print-area');
      var basePt = ${font.basePt};

      function fit() {
        while (basePt > MIN_PT) {
          area.style.fontSize = basePt + 'pt';
          if (area.scrollHeight <= area.clientHeight) break;
          basePt -= STEP;
        }
      }

      function tryPrint() {
        if (document.fonts) {
          document.fonts.ready.then(function () {
            fit();
            window.addEventListener('afterprint', function () { window.close(); });
            setTimeout(function () { window.print(); }, 80);
          });
        } else {
          setTimeout(function () { fit(); window.addEventListener('afterprint', function () { window.close(); }); setTimeout(function () { window.print(); }, 80); }, 600);
        }
      }

      if (document.readyState === 'complete') tryPrint();
      else window.onload = tryPrint;
    })();
  </script>
</body>
</html>`;

  const pw = window.open('', '_blank', 'width=600,height=850');
  if (!pw) {
    alert('Please allow pop-ups to print the shopping list.');
    return;
  }
  pw.document.write(html);
  pw.document.close();
}
