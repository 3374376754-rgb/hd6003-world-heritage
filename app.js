(() => {
  'use strict';

  const D = window.WHL;
  if (!D) {
    console.error('WHL data not found');
    return;
  }

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const fmt = (n) => Number(n).toLocaleString('en-US');
  const pct = (n, d) => ((n / d) * 100).toFixed(1) + '%';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const chartRegions = D.regions.filter((r) => r !== 'Multi-region');
  const chartN = chartRegions.reduce((sum, r) => sum + D.regionCounts[r], 0);
  const regionShort = {
    'Africa': 'Africa',
    'Arab States': 'Arab States',
    'Asia and the Pacific': 'Asia-Pacific',
    'Europe and North America': 'Europe &amp; N. America',
    'Latin America and the Caribbean': 'Latin America',
    'Multi-region': 'Multi-region'
  };
  const regionColor = {
    'Africa': '#c8a45c',
    'Arab States': '#c97b63',
    'Asia and the Pacific': '#7fa99b',
    'Europe and North America': '#8fa6c2',
    'Latin America and the Caribbean': '#b7a6c9',
    'Multi-region': '#8f9b95'
  };
  const categoryColor = {
    'Cultural': '#c8a45c',
    'Natural': '#7fa99b',
    'Mixed': '#c97b63'
  };
  const categoryFill = {
    'Cultural': 'rgba(200,164,92,.86)',
    'Natural': 'rgba(127,169,155,.86)',
    'Mixed': 'rgba(201,123,99,.86)'
  };
  const VENN = {
    sets: [
      { label: 'Cultural', total: 869, color: '#c8a45c' },
      { label: 'Europe & N. America', total: 528, color: '#8fa6c2' },
      { label: 'Inscribed before 2000', total: 628, color: '#7fa99b' }
    ],
    counts: { a: 207, b: 28, c: 101, ab: 183, ac: 210, bc: 48, abc: 269, outside: 75 }
  };
  const DECADE = {
    decades: ['1970s', '1980s', '1990s', '2000s', '2010s'],
    colors: ['#8f9b95', '#c8a45c', '#7fa99b', '#8fa6c2', '#c97b63'],
    counts: {
      'Africa': [7, 30, 13, 28, 18],
      'Arab States': [9, 34, 8, 14, 21],
      'Asia and the Pacific': [5, 47, 72, 61, 81],
      'Europe and North America': [32, 115, 170, 123, 88],
      'Latin America and the Caribbean': [4, 36, 46, 35, 21]
    }
  };

  const cellsByRegion = {};
  const cellsByCategory = {};
  D.cells.forEach((c) => {
    if (!chartRegions.includes(c.region)) return;
    if (!cellsByRegion[c.region]) cellsByRegion[c.region] = {};
    if (!cellsByCategory[c.category]) cellsByCategory[c.category] = {};
    cellsByRegion[c.region][c.category] = c;
    cellsByCategory[c.category][c.region] = c;
  });

  /* ---------- nav / progress ---------- */
  const nav = $('#nav');
  const progress = $('#progress');
  const navLinks = $$('#navLinks a');
  const sectionIds = ['question', 'data', 'method', 'sieve', 'mosaic', 'decade', 'findings', 'reflection'];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

  function onScroll() {
    const top = window.scrollY || window.pageYOffset || 0;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (height > 0 ? (top / height) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('scrolled', top > 18);
    updateNav(top);
    updateCue();
  }

  function updateNav() {
    let active = sections[0];
    const marker = 120;
    sections.forEach((s) => {
      const r = s.getBoundingClientRect();
      if (r.top <= marker && r.bottom > marker) active = s;
    });
    navLinks.forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + active.id);
    });
  }

  /* ---------- presenter cue ---------- */
  const cueSections = $$('main section[data-cue]');
  const cueTime = $('#cueTime');
  const cueText = $('#cueText');
  const cueToggle = $('#cueToggle');
  const cueClose = $('#cueClose');
  const presenterBar = $('#presenterBar');

  function updateCue() {
    if (!cueTime || !cueText) return;
    let current = null;
    const marker = window.innerHeight * 0.42;
    cueSections.forEach((s) => {
      const rect = s.getBoundingClientRect();
      if (rect.top <= marker && rect.bottom > marker) current = s;
    });
    if (current) {
      cueTime.textContent = current.dataset.cueTime || 'CUE';
      cueText.textContent = current.dataset.cue || '';
    } else if (window.scrollY < 200) {
      cueTime.textContent = '0:00–0:30';
      cueText.textContent = '网页：开场。标题出现后停 1 秒再开口；不要读标题，先给钩子。';
    }
  }

  function setPresenter(on) {
    document.body.classList.toggle('presenter-on', on);
    if (cueToggle) cueToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (presenterBar) presenterBar.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (on) {
      updateCue();
      toast('Presenter cue on');
    }
  }
  if (cueToggle) cueToggle.addEventListener('click', () => setPresenter(!document.body.classList.contains('presenter-on')));
  if (cueClose) cueClose.addEventListener('click', () => setPresenter(false));

  /* ---------- reveal / counters ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCount(el) {
    if (el.dataset.done === '1') return;
    el.dataset.done = '1';
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const isYear = target >= 1900 && target <= 2100;
    const display = (value) => isYear ? String(value) : fmt(value);
    if (reduceMotion) { el.textContent = display(target); return; }
    const start = performance.now();
    const duration = 1200;
    function frame(now) {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = display(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = display(target);
    }
    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        $$('[data-count]', entry.target).forEach(animateCount);
        revealObs.unobserve(entry.target);
        setTimeout(onScroll, 80);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach((el) => revealObs.observe(el));
  } else {
    $$('.reveal').forEach((el) => {
      el.classList.add('in');
      $$('[data-count]', el).forEach(animateCount);
    });
  }

  /* ---------- share ---------- */
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2200);
  }

  async function share() {
    const data = {
      title: 'The Shape of World Heritage',
      text: 'What 1,121 UNESCO World Heritage sites reveal about region, category, and time.',
      url: window.location.href
    };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch (e) { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(data.url);
      toast('Link copied to clipboard');
    } catch (e) {
      window.prompt('Copy this link:', data.url);
    }
  }
  ['#shareBtn', '#shareBtn2'].forEach((sel) => {
    const btn = $(sel);
    if (btn) btn.addEventListener('click', share);
  });

  /* ---------- tooltip ---------- */
  const tooltip = $('#tooltip');
  function showTip(html, target, event) {
    if (!tooltip) return;
    tooltip.innerHTML = html;
    tooltip.classList.add('show');
    const pad = 12;
    let x = event && typeof event.clientX === 'number' ? event.clientX + 14 : 0;
    let y = event && typeof event.clientY === 'number' ? event.clientY + 14 : 0;
    if (!event || !event.clientX) {
      const r = target.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top - 8;
    }
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    x = clamp(x, pad, window.innerWidth - tw - pad);
    y = clamp(y, pad, window.innerHeight - th - pad);
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }
  function hideTip() {
    if (tooltip) tooltip.classList.remove('show');
  }
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-tip]');
    if (t) showTip(t.dataset.tip, t, e);
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest('[data-tip]')) hideTip();
  });
  document.addEventListener('focusin', (e) => {
    const t = e.target.closest('[data-tip]');
    if (t) showTip(t.dataset.tip, t);
  });
  document.addEventListener('focusout', (e) => {
    if (e.target.closest('[data-tip]')) hideTip();
  });
  window.addEventListener('scroll', hideTip, { passive: true });

  /* ---------- data section ---------- */
  function renderData() {
    const bars = $('#regionBars');
    if (bars) {
      const max = Math.max(...D.regions.map((r) => D.regionCounts[r]));
      bars.innerHTML = D.regions.map((r) => {
        const count = D.regionCounts[r];
        const width = (count / max) * 100;
        const label = regionShort[r] || r;
        return `<div class="region-row" title="${label}: ${fmt(count)} records (${pct(count, D.meta.n)})">
          <span class="rlabel">${label}</span>
          <span class="rbar"><span class="rfill" data-w="${width.toFixed(2)}"></span></span>
          <span class="rvalue">${fmt(count)}</span>
        </div>`;
      }).join('');
      requestAnimationFrame(() => {
        $$('.rfill', bars).forEach((el) => { el.style.width = el.dataset.w + '%'; });
      });
    }

    const split = $('#categorySplit');
    const labels = $('#categoryLabels');
    if (split && labels) {
      split.innerHTML = D.categories.map((c) => {
        const width = (D.categoryCounts[c] / D.meta.n) * 100;
        return `<span class="split-seg" data-w="${width.toFixed(2)}" style="background:${categoryColor[c]}" title="${c}: ${fmt(D.categoryCounts[c])} (${pct(D.categoryCounts[c], D.meta.n)})"></span>`;
      }).join('');
      labels.innerHTML = D.categories.map((c) => `<span class="legend-item"><span class="dot" style="background:${categoryColor[c]}"></span>${c} · ${pct(D.categoryCounts[c], D.meta.n)}</span>`).join('');
      requestAnimationFrame(() => {
        $$('.split-seg', split).forEach((el) => { el.style.width = el.dataset.w + '%'; });
      });
    }
  }

  /* ---------- sieve ---------- */
  function residualColor(resid) {
    const t = clamp(Math.abs(resid) / 5, 0, 1);
    const alpha = 0.12 + t * 0.78;
    return resid >= 0
      ? `rgba(200,164,92,${alpha.toFixed(3)})`
      : `rgba(143,166,194,${alpha.toFixed(3)})`;
  }

  function renderSieve() {
    const plot = $('#sievePlot');
    const y = $('#sieveY');
    const x = $('#sieveX');
    const insight = $('#sieveInsight');
    const small = $('#sieveSmall');
    if (!plot || !y || !x) return;

    const rowTotals = D.categories.map((cat) => chartRegions.reduce((sum, r) => sum + (cellsByCategory[cat]?.[r]?.count || 0), 0));
    const colTotals = chartRegions.map((r) => D.regionCounts[r]);

    plot.style.gridTemplateColumns = colTotals.map((v) => Math.max(v, 1) + 'fr').join(' ');
    plot.style.gridTemplateRows = rowTotals.map((v) => Math.max(v, 1) + 'fr').join(' ');
    y.style.gridTemplateRows = rowTotals.map((v) => Math.max(v, 1) + 'fr').join(' ');
    x.style.gridTemplateColumns = colTotals.map((v) => Math.max(v, 1) + 'fr').join(' ');
    y.innerHTML = D.categories.map((c) => `<div class="sieve-ylabel">${c}</div>`).join('');
    x.innerHTML = chartRegions.map((r) => `<div class="sieve-xlabel">${regionShort[r] || r}</div>`).join('');

    let html = '';
    D.categories.forEach((cat) => {
      chartRegions.forEach((reg) => {
        const c = cellsByCategory[cat]?.[reg] || { count: 0, inDanger: 0 };
        const rowTotal = rowTotals[D.categories.indexOf(cat)];
        const colTotal = D.regionCounts[reg];
        const exp = rowTotal * colTotal / chartN;
        const resid = exp > 0 ? (c.count - exp) / Math.sqrt(exp) : 0;
        const direction = resid >= 0 ? 'over-represented' : 'under-represented';
        const tip = `<strong>${cat} × ${regionShort[reg] || reg}</strong><span class="tnum">${fmt(c.count)} observed · ${exp.toFixed(1)} expected</span><span>${direction} · residual ${resid >= 0 ? '+' : ''}${resid.toFixed(2)}</span><span>${fmt(c.inDanger)} in danger · ${fmt(c.count - c.inDanger)} not in danger</span>`;
        html += `<button class="sieve-cell" type="button" style="background:${residualColor(resid)}" data-tip="${tip.replace(/"/g, '&quot;')}" aria-label="${cat}, ${regionShort[reg] || reg}: ${c.count} observed, ${exp.toFixed(1)} expected, ${direction}"></button>`;
      });
    });
    plot.innerHTML = html;

    const africaNatural = cellsByCategory['Natural']?.['Africa'];
    const europeNatural = cellsByCategory['Natural']?.['Europe and North America'];
    const africaExp = africaNatural ? (rowTotals[1] * D.regionCounts['Africa'] / chartN) : 0;
    const europeExp = europeNatural ? (rowTotals[1] * D.regionCounts['Europe and North America'] / chartN) : 0;
    if (insight) {
      insight.innerHTML = `<strong>Natural sites in Africa</strong> are the strongest over-representation: ${africaNatural ? africaNatural.count : 0} observed vs ${africaExp.toFixed(1)} expected. <strong>Natural sites in Europe and North America</strong> go the other way: ${europeNatural ? europeNatural.count : 0} vs ${europeExp.toFixed(1)} expected.`;
    }
    if (small) {
      small.textContent = 'Read the colour, then check the count. A strong colour in a small cell is a weak claim.';
    }
  }

  /* ---------- mosaic ---------- */
  const mosaicState = { filter: 'all' };
  function mosaicCount(cell, filter) {
    if (!cell) return 0;
    if (filter === 'inDanger') return cell.inDanger;
    if (filter === 'notInDanger') return cell.notInDanger;
    return cell.count;
  }
  function renderMosaic() {
    const chart = $('#mosaicChart');
    const note = $('#mosaicNote');
    const insight = $('#mosaicInsight');
    if (!chart) return;
    let totalAll = 0;
    chart.innerHTML = chartRegions.map((reg) => {
      const cats = D.categories.map((cat) => ({ cat, cell: cellsByRegion[reg]?.[cat] }));
      const counts = cats.map((o) => mosaicCount(o.cell, mosaicState.filter));
      const total = counts.reduce((a, b) => a + b, 0);
      totalAll += total;
      const segments = cats.map((o, i) => {
        if (!o.cell || counts[i] === 0) return '';
        const h = total ? (counts[i] / total) * 100 : 0;
        const tip = `<strong>${o.cat} · ${regionShort[reg] || reg}</strong><span class="tnum">${fmt(counts[i])} records in this view</span><span>${pct(counts[i], total)} of the region total</span><span>${fmt(o.cell.inDanger)} in danger · ${fmt(o.cell.notInDanger)} not in danger</span>`;
        return `<button class="mosaic-seg" type="button" style="height:${h.toFixed(2)}%;background:${categoryFill[o.cat]}" data-tip="${tip.replace(/"/g, '&quot;')}" aria-label="${o.cat} in ${regionShort[reg] || reg}: ${counts[i]} records"></button>`;
      }).join('');
      return `<div class="mosaic-col" title="${regionShort[reg] || reg}: ${fmt(total)} records in this view">
        <div class="mosaic-label">${regionShort[reg] || reg}</div>
        <div class="mosaic-stack">${segments || '<span style="display:block;height:100%;background:rgba(255,255,255,.03)"></span>'}</div>
        <div class="mosaic-total">${fmt(total)}</div>
      </div>`;
    }).join('');

    if (note) {
      const label = mosaicState.filter === 'all' ? 'All records' : mosaicState.filter === 'inDanger' ? 'In danger' : 'Not in danger';
      note.textContent = `${label} · ${fmt(totalAll)} records in five regions. Hover a segment for counts.`;
    }
    setTimeout(onScroll, 40);
    if (insight) {
      const cultural = D.categoryCounts['Cultural'];
      const europe = cellsByRegion['Europe and North America'] || {};
      const africa = cellsByRegion['Africa'] || {};
      const europeCultural = europe['Cultural']?.count || 0;
      const europeTotal = D.regionCounts['Europe and North America'];
      const africaNatural = africa['Natural']?.count || 0;
      const africaTotal = D.regionCounts['Africa'];
      insight.innerHTML = `<strong>Cultural sites are ${pct(cultural, D.meta.n)} of all records.</strong> In Europe and North America, ${pct(europeCultural, europeTotal)} of records are Cultural. In Africa, ${pct(africaNatural, africaTotal)} are Natural.`;
    }
  }

  /* ---------- decade mosaic ---------- */
  function renderDecade() {
    const chart = $('#decadeChart');
    const insight = $('#decadeInsight');
    if (!chart) return;

    chart.innerHTML = chartRegions.map((reg) => {
      const vals = DECADE.counts[reg] || [];
      const total = vals.reduce((a, b) => a + b, 0);
      const segments = DECADE.decades.map((decade, i) => {
        const count = vals[i] || 0;
        if (!count) return '';
        const share = total ? (count / total) * 100 : 0;
        const tip = `<strong>${regionShort[reg] || reg} · ${decade}</strong><span class="tnum">${fmt(count)} records</span><span>${share.toFixed(1)}% of the region</span>`;
        return `<button class="mosaic-seg" type="button" style="height:${share.toFixed(2)}%;background:${DECADE.colors[i]}" data-tip="${tip.replace(/"/g, '&quot;')}" aria-label="${regionShort[reg] || reg}, ${decade}: ${count} records"></button>`;
      }).join('');
      return `<div class="mosaic-col" title="${regionShort[reg] || reg}: ${fmt(total)} records">
        <div class="mosaic-label">${regionShort[reg] || reg}</div>
        <div class="mosaic-stack">${segments}</div>
        <div class="mosaic-total">${fmt(total)}</div>
      </div>`;
    }).join('');

    if (insight) {
      insight.innerHTML = `<strong>The decade mix is not the same everywhere.</strong> Africa and Arab States peak in the 1980s (31.2% and 39.5%); Asia and the Pacific peaks in the 2010s (30.5%); Europe and North America and Latin America peak in the 1990s (32.2% and 32.4%).`;
    }
    setTimeout(onScroll, 40);
  }

  /* ---------- venn ---------- */
  function renderVenn() {
    const svg = $('#vennSvg');
    const insight = $('#vennInsight');
    if (!svg) return;

    const circles = [
      { cx: 300, cy: 230, r: 170, color: '#c8a45c', label: 'Cultural', lx: 185, ly: 48 },
      { cx: 460, cy: 230, r: 170, color: '#8fa6c2', label: 'Europe & N. America', lx: 570, ly: 48 },
      { cx: 380, cy: 370, r: 170, color: '#7fa99b', label: 'Inscribed before 2000', lx: 380, ly: 618 }
    ];

    let out = '';
    circles.forEach((c) => {
      out += `<circle class="venn-circle" cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="${c.color}" stroke="${c.color}"/>`;
      out += `<text class="venn-set-label" x="${c.lx}" y="${c.ly}" fill="${c.color}" text-anchor="middle">${c.label}</text>`;
    });

    const items = [
      { x: 220, y: 200, count: VENN.counts.a, label: 'Cultural only', tip: 'Cultural only' },
      { x: 540, y: 200, count: VENN.counts.b, label: 'Europe only', tip: 'Europe & N. America only' },
      { x: 380, y: 500, count: VENN.counts.c, label: 'Pre-2000 only', tip: 'Inscribed before 2000 only' },
      { x: 380, y: 180, count: VENN.counts.ab, label: 'Cultural + Europe', tip: 'Cultural + Europe & N. America' },
      { x: 300, y: 330, count: VENN.counts.ac, label: 'Cultural + pre-2000', tip: 'Cultural + inscribed before 2000' },
      { x: 460, y: 330, count: VENN.counts.bc, label: 'Europe + pre-2000', tip: 'Europe & N. America + inscribed before 2000' },
      { x: 380, y: 285, count: VENN.counts.abc, label: 'All three', tip: 'All three sets' }
    ];

    items.forEach((it) => {
      const tip = `<strong>${it.tip}</strong><span class="tnum">${it.count} records</span>`;
      out += `<g class="venn-group" tabindex="0" role="button" aria-label="${it.tip}: ${it.count} records" data-tip="${tip.replace(/"/g, '&quot;')}">`;
      out += `<circle class="venn-halo" cx="${it.x}" cy="${it.y}" r="36"/>`;
      out += `<text class="venn-count" x="${it.x}" y="${it.y - 4}">${it.count}</text>`;
      out += `<text class="venn-count-sub" x="${it.x}" y="${it.y + 19}">${it.label}</text>`;
      out += `</g>`;
    });

    out += `<text class="venn-outside" x="380" y="590">${VENN.counts.outside} records outside all three</text>`;
    svg.innerHTML = out;
    svg.setAttribute('aria-label', 'Venn diagram of Cultural sites, sites in Europe and North America, and sites inscribed before 2000');

    if (insight) {
      insight.innerHTML = `<strong>${VENN.counts.abc} records sit in the centre:</strong> Cultural, European, and inscribed before 2000. Another ${VENN.counts.ac} are Cultural and pre-2000 outside Europe; ${VENN.counts.ab} are Cultural and European but later.`;
    }
    setTimeout(onScroll, 40);
  }

  /* ---------- violin ---------- */
  const violinState = { mode: 'region' };
  function kde(values, x, bw) {
    const n = values.length;
    if (!n) return 0;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const z = (x - values[i]) / bw;
      sum += Math.exp(-0.5 * z * z);
    }
    return sum / (n * bw * Math.sqrt(2 * Math.PI));
  }

  function renderViolin() {
    const svg = $('#violinSvg');
    const note = $('#violinNote');
    const insight = $('#violinInsight');
    if (!svg) return;
    const groups = violinState.mode === 'region' ? chartRegions : D.categories;
    const datesMap = violinState.mode === 'region' ? D.dates.region : D.dates.category;
    const statsMap = violinState.mode === 'region' ? D.stats.region : D.stats.category;
    const colors = violinState.mode === 'region' ? regionColor : categoryColor;

    const W = 900, H = 500;
    const left = 138, right = 28, top = 26, bottom = 54;
    const plotW = W - left - right;
    const plotH = H - top - bottom;
    const bandH = plotH / groups.length;
    const xMin = 1976, xMax = 2021;
    const x = (year) => left + ((year - xMin) / (xMax - xMin)) * plotW;
    const ticks = [1980, 1990, 2000, 2010, 2020];

    let out = '';
    ticks.forEach((t) => {
      out += `<line class="violin-grid" x1="${x(t)}" y1="${top}" x2="${x(t)}" y2="${top + plotH}"/>`;
      out += `<text class="violin-tick" x="${x(t)}" y="${H - 22}" text-anchor="middle">${t}</text>`;
    });
    out += `<line class="violin-axis" x1="${left}" y1="${top}" x2="${left}" y2="${top + plotH}"/>`;

    groups.forEach((g, i) => {
      const values = (datesMap[g] || []).slice().sort((a, b) => a - b);
      const st = statsMap[g];
      if (!values.length || !st) return;
      const y0 = top + i * bandH;
      const center = y0 + bandH * 0.52;
      const amp = bandH * 0.33;
      const bw = 2.2;
      const samples = 120;
      const xs = [];
      const dens = [];
      for (let j = 0; j <= samples; j++) {
        const year = xMin + (j / samples) * (xMax - xMin);
        xs.push(year);
        dens.push(kde(values, year, bw));
      }
      const max = Math.max(...dens) || 1;
      const topPts = xs.map((year, j) => [x(year), center - (dens[j] / max) * amp]);
      const botPts = xs.map((year, j) => [x(year), center + (dens[j] / max) * amp]).reverse();
      const path = 'M ' + topPts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L ') + ' L ' + botPts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L ') + ' Z';
      const color = colors[g] || '#c8a45c';
      const label = regionShort[g] || g;
      const maxLabel = st.max.toFixed(0);
      const minLabel = st.min.toFixed(0);
      const tip = `<strong>${label}</strong><span class="tnum">n = ${st.n} · median ${st.median}</span><span>Q1 ${st.q1} · Q3 ${st.q3}</span><span>range ${minLabel}–${maxLabel}</span>`;
      out += `<g class="violin-group" tabindex="0" role="button" aria-label="${label}: n ${st.n}, median ${st.median}, range ${minLabel} to ${maxLabel}" data-tip="${tip.replace(/"/g, '&quot;')}">`;
      out += `<rect class="violin-hit" x="${left}" y="${y0}" width="${plotW}" height="${bandH}"/>`;
      out += `<path class="violin-shape" d="${path}" fill="${color}" stroke="${color}"/>`;
      out += `<line class="violin-median" x1="${x(st.median)}" y1="${center - amp * 1.06}" x2="${x(st.median)}" y2="${center + amp * 1.06}" stroke="${color}"/>`;
      out += `<circle class="violin-dot" cx="${x(st.median)}" cy="${center}" r="3.2" fill="${color}"/>`;
      out += `<text class="violin-label" x="${left - 12}" y="${center + 3}" text-anchor="end">${label}</text>`;
      out += `<text class="violin-sub" x="${left - 12}" y="${center + 17}" text-anchor="end">n = ${st.n}</text>`;
      out += `</g>`;
    });

    svg.innerHTML = out;
    svg.setAttribute('aria-label', `Violin plot of inscription years by ${violinState.mode}`);

    if (note) {
      note.textContent = violinState.mode === 'region'
        ? 'Five main regions. Shapes are normalised within each group. Hover or focus a group for n, median, and quartiles.'
        : 'Three categories. Mixed has only 39 records; read its shape with care. Hover or focus a group for n, median, and quartiles.';
    }
    if (insight) {
      if (violinState.mode === 'region') {
        const arab = D.stats.region['Arab States'];
        const asia = D.stats.region['Asia and the Pacific'];
        const europe = D.stats.region['Europe and North America'];
        insight.innerHTML = `<strong>The clocks are not aligned.</strong> Arab States has a median inscription year of ${arab.median}; Asia and the Pacific ${asia.median}; Europe and North America ${europe.median}. The distributions overlap, but their centres and spreads differ.`;
      } else {
        const cultural = D.stats.category['Cultural'];
        const natural = D.stats.category['Natural'];
        const mixed = D.stats.category['Mixed'];
        insight.innerHTML = `<strong>The three categories have different rhythms.</strong> Cultural median ${cultural.median}, Natural ${natural.median}, Mixed ${mixed.median}. Mixed is the smallest group, so its shape is the least stable.`;
      }
    }
    setTimeout(onScroll, 40);
  }

  /* ---------- controls ---------- */
  $$('.mosaic-controls .toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.mosaic-controls .toggle').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      mosaicState.filter = btn.dataset.filter;
      renderMosaic();
    });
  });
  $$('.violin-controls .toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.violin-controls .toggle').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      violinState.mode = btn.dataset.mode;
      renderViolin();
    });
  });

  /* ---------- top buttons ---------- */
  ['#topBtn'].forEach((sel) => {
    const btn = $(sel);
    if (btn) btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  });

  /* ---------- init ---------- */
  renderData();
  renderSieve();
  renderMosaic();
  renderDecade();
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { updateCue(); }, { passive: true });
})();
