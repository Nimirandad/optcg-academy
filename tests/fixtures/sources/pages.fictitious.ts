/**
 * Páginas **ficticias** que imitan solo la estructura que leen los extractores. Los números
 * `OP99-…` no corresponden a cartas reales y el texto no procede de ninguna fuente.
 */
const page = (main: string) => `<html><body><header>x</header><main class="mainCol">${main}</main></body></html>`;
const link = (card: string) => `<li>・<a href="https://en.onepiece-cardgame.com/cardlist/?freewords=${card}">${card} Ficticia</a></li>`;
const list = (...cards: string[]) => `<ul>${cards.map(link).join('')}</ul>`;

export const restrictionPage = ({
  banned = ['OP99-001'],
  restricted = '<p>There are currently no cards in this category.</p>',
  pairs = [['OP99-002', 'OP99-003']],
  extra = '',
  notice = 'aviso-ficticio.html',
  mention = 'OP99-001',
} = {}) =>
  page(`<p>Card A:<br>${mention}</p>${extra}
<h3>Cards with Active Restrictions</h3>
<h4>Banned Cards</h4>${list(...banned)}
<h4>Restricted Cards</h4>${restricted}
<h4>Banned Pair Cards</h4>${pairs.map((pair) => list(...pair)).join('')}
<div data-type="component-opcg-buttons"><a class="commonBtn" href="https://en.onepiece-cardgame.com/news/${notice}">x</a></div>`);

export const blocksPage = ({ extra = '', x = ['OP99-010', 'OP99-011'], four = ['OP99-020'] } = {}) =>
  page(`<h3>Cards Generally Permitted in Standard Regulation</h3>${list(...x)}
<h3>Cards Eligible for Use Under Block Number ④</h3>
<p>From April 1, 2026, to March 31, 2029: legal from April 1, 2026, to March 31, 2029.</p>${list(...four)}
<h3>Updated Block Number and cards that have been reprinted</h3>${list('OP99-030')}${extra}
<div class="pageFooterCol"><h3>Relacionado OP99-099</h3></div>`);

export const rotationPage = (last = '⑤') =>
  page(`<h5>STANDARD REGULATION</h5>
<p>For example, in tournaments from April 2026 to March 2027, cards ② to ${last} will be allowed.<br>
In tournaments from April 2027 to March 2028, cards ③ to ⑥ will be allowed.</p>
<h5>EXTRA REGULATION</h5>
<p>In tournaments from April 2026 to March 2027, cards ① to ⑤ will be allowed.</p>`);

export const faqPage = (...files: string[]) =>
  page(`<a href="/pdf/qa_ficticio_reglas.pdf?1">x</a><section id="faqPdf">${files
    .map((file) => `<a href="/pdf/${file}">x</a>`)
    .join('')}</section>`);

export const rulesPage = ({ book = '20260101', notice = 'aviso-ficticio.php' } = {}) =>
  page(`<a href="/pdf/rule_comprehensive.pdf?${book}">x</a><ul>
<li class="swiper-slide"> <a href="/pdf/hoja.pdf">x</a></li>
<li class="swiper-slide"> <a href="/topics/${notice}">x</a></li></ul>`);

export const errataPage = ({ date = 'January 2, 2026', body = 'texto ficticio' } = {}) =>
  page(`<span class="pageTitDate">${date}</span>
<h5 class="smallTitRed">January 2, 2026<br>OP99-040 Ficticia</h5><p>${body}</p>`);

const card = ({ id = 'OP99-050', number = 'OP99-050', block = '3', effect = 'ficticio' }) =>
  `<dl class="modalCol" id="${id}"><dt><div class="infoCol"><span>${number}</span> | <span>C</span> | <span>CHARACTER</span></div>
<div class="cardName">Ficticia</div></dt><dd><div class="cost"><h3>Cost</h3>2</div><div class="color"><h3>Color</h3>Red</div>
<div class="block"><h3>Block<br>icon</h3>${block}</div><div class="text"><h3>Effect</h3>${effect}</div>
<div class="getInfo"><h3>Card Set(s)</h3>-FICTICIO- [OP-99]<div></div></div></dd></dl>`;

export const seriesPage = (series: string[], ...cards: Parameters<typeof card>[0][]) =>
  `<html><select name="series" id="series"><option value>x</option>${series
    .map((id) => `<option value="${id}" >x</option>`)
    .join('')}</select>${cards.map(card).join('')}</html>`;

export const productsPage = (...items: { path: string; title: string; date?: string }[]) =>
  page(`<ul>${items
    .map(
      ({ path, title, date }) =>
        `<li class="linkListColBox" data-cat="x"><a href="https://en.onepiece-cardgame.com/products/${path}"><h4 class="linkListColTitle">${title}</h4>${
          date ? `<time class="newsDate" datetime="${date}">x</time>` : ''
        }</a></li>`,
    )
    .join('')}</ul>`);
