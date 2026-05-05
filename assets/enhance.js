// ─── Herbie PC Care — Shared site enhancements ───
(function(){
  // 1) Reveal-on-scroll
  const revealIO = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('in'); revealIO.unobserve(e.target); }
    });
  }, {threshold:.12, rootMargin:'0px 0px -60px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>revealIO.observe(el));

  // 2) Frame gallery — staggered scale-in by index
  const frames = document.querySelectorAll('.frame');
  if(frames.length){
    const frameIO = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          const idx = [...frames].indexOf(e.target);
          e.target.style.transitionDelay = (idx * 90) + 'ms';
          e.target.classList.add('in');
          frameIO.unobserve(e.target);
        }
      });
    }, {threshold:.18, rootMargin:'0px 0px -40px 0px'});
    frames.forEach(f=>frameIO.observe(f));
  }

  // 2b) Wall tiles — fade-in as each enters viewport
  const tiles = document.querySelectorAll('.wall .tile');
  if(tiles.length){
    const tileIO = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){ e.target.classList.add('in'); tileIO.unobserve(e.target); }
      });
    }, {threshold:.15, rootMargin:'0px 0px -40px 0px'});
    tiles.forEach(t=>tileIO.observe(t));
  }

  // 2c) Hands strip — staggered scale-in by index
  const hands = document.querySelectorAll('.hand');
  if(hands.length){
    const handIO = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          const idx = [...hands].indexOf(e.target);
          e.target.style.transitionDelay = (idx * 110) + 'ms';
          e.target.classList.add('in');
          handIO.unobserve(e.target);
        }
      });
    }, {threshold:.18, rootMargin:'0px 0px -40px 0px'});
    hands.forEach(h=>handIO.observe(h));
  }

  // 3) Counter animation
  function animateCount(el){
    const target = parseFloat(el.dataset.count || '0');
    const dur = 1600;
    const start = performance.now();
    const fmt = target >= 1000
      ? (n)=>Math.round(n).toLocaleString('en-US')
      : (n)=>Math.round(n).toString();
    function step(t){
      const p = Math.min(1, (t - start)/dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if(p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target);
    }
    requestAnimationFrame(step);
  }
  const counters = document.querySelectorAll('.count');
  if(counters.length){
    const countIO = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){ animateCount(e.target); countIO.unobserve(e.target); }
      });
    }, {threshold:.6});
    counters.forEach(c=>countIO.observe(c));
  }

  // 4) Scroll progress bar
  const bar = document.getElementById('scrollBar');
  if(bar){
    let ticking = false;
    function updateBar(){
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener('scroll', ()=>{
      if(!ticking){ requestAnimationFrame(updateBar); ticking = true; }
    }, {passive:true});
    updateBar();
  }

  // 4b) Lightbox (any element with [data-lightbox] opens the shared viewer)
  const lb = document.getElementById('lightbox');
  if(lb){
    const lbImg = document.getElementById('lbImg');
    const lbTicket = document.getElementById('lbTicket');
    const lbLabel = document.getElementById('lbLabel');
    const lbCounter = document.getElementById('lbCounter');
    const lbItems = [...document.querySelectorAll('[data-lightbox]')];
    let lbI = 0;
    function lbOpen(n){
      if(!lbItems.length) return;
      lbI = (n + lbItems.length) % lbItems.length;
      const t = lbItems[lbI];
      lbImg.src = t.dataset.src || (t.querySelector('img')||{}).src || '';
      lbImg.alt = t.dataset.label || '';
      if(lbTicket) lbTicket.textContent = t.dataset.ticket || '';
      if(lbLabel) lbLabel.textContent = t.dataset.label || '';
      if(lbCounter) lbCounter.textContent = (lbI+1)+' / '+lbItems.length;
      lb.classList.add('is-on');
      lb.setAttribute('aria-hidden','false');
      document.body.classList.add('lb-open');
    }
    function lbClose(){
      lb.classList.remove('is-on');
      lb.setAttribute('aria-hidden','true');
      document.body.classList.remove('lb-open');
      lbImg.src = '';
    }
    lbItems.forEach((t, n)=> t.addEventListener('click', (e)=>{
      if(t.dataset.dragged === '1'){ t.dataset.dragged = '0'; return; }
      e.preventDefault(); lbOpen(n);
    }));
    const closeBtn = lb.querySelector('.lb-close');
    const prevBtn = lb.querySelector('.lb-nav.prev');
    const nextBtn = lb.querySelector('.lb-nav.next');
    if(closeBtn) closeBtn.addEventListener('click', lbClose);
    if(prevBtn) prevBtn.addEventListener('click', ()=> lbOpen(lbI-1));
    if(nextBtn) nextBtn.addEventListener('click', ()=> lbOpen(lbI+1));
    lb.addEventListener('click', (e)=>{ if(e.target === lb) lbClose(); });
    document.addEventListener('keydown', (e)=>{
      if(!lb.classList.contains('is-on')) return;
      if(e.key === 'Escape') lbClose();
      else if(e.key === 'ArrowLeft'){ e.preventDefault(); lbOpen(lbI-1); }
      else if(e.key === 'ArrowRight'){ e.preventDefault(); lbOpen(lbI+1); }
    });
    let lbSx = 0;
    lb.addEventListener('touchstart', e=>{ lbSx = e.touches[0].clientX; }, {passive:true});
    lb.addEventListener('touchend', e=>{
      const dx = e.changedTouches[0].clientX - lbSx;
      if(Math.abs(dx) > 40) lbOpen(dx > 0 ? lbI-1 : lbI+1);
    });
  }

  // 4c) FAB stack — staggered entrance, dim near contact form
  const fabStack = document.querySelector('.fab-stack');
  if(fabStack){
    const fabs = fabStack.querySelectorAll('.fab');
    setTimeout(()=>{
      fabs.forEach((f, i)=> setTimeout(()=> f.classList.add('is-in'), i * 90));
    }, 600);
    const form = document.querySelector('.form');
    if(form){
      const fabIO = new IntersectionObserver((entries)=>{
        entries.forEach(e=> fabStack.classList.toggle('is-dim', e.isIntersecting && e.intersectionRatio > 0.4));
      }, {threshold:[0.4]});
      fabIO.observe(form);
    }
  }

  // 5) Smooth in-page scroll
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const id = a.getAttribute('href');
      if(id && id.length > 1 && id !== '#'){
        const t = document.querySelector(id);
        if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth', block:'start'}); }
      }
    });
  });
})();
