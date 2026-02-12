// zoom-demo.js — slide-up popup (card-top anchored)
(function(){
  const cards = document.querySelectorAll('.card');

  function openPopupFor(card){
    const rect = card.getBoundingClientRect();
    const popup = document.createElement('div');
    popup.className = 'zoom-clone';

    // popup size (user edited to 380x130)
    const targetW = 380;
    const targetH = 130;

    // center horizontally above the card, with 8px gap; clamp to viewport
    let targetLeft = rect.left + rect.width / 2 - targetW / 2;
    if (targetLeft + targetW > window.innerWidth - 8) targetLeft = Math.max(8, window.innerWidth - targetW - 8);
    if (targetLeft < 8) targetLeft = 8;
    let targetTop = rect.top - targetH - 8;
    if (targetTop < 8) targetTop = rect.bottom + 8;

    popup.style.left = targetLeft + 'px';
    popup.style.top = targetTop + 'px';
    popup.style.width = targetW + 'px';
    popup.style.height = targetH + 'px';
    popup.style.transform = 'translateY(12px)';
    popup.style.opacity = '0';
    popup.style.transition = 'transform 320ms cubic-bezier(.2,.9,.3,1), opacity 220ms ease';

    // create an inline SVG that matches popup orientation (380x130)
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='380' height='130'><defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='%23f8fafc'/><stop offset='1' stop-color='%23e6eefc'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='18'>더미 이미지</text></svg>`;
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    img.alt = '더미 이미지';
    popup.appendChild(img);

    document.body.appendChild(popup);

    // animate slide-up
    requestAnimationFrame(()=>{ requestAnimationFrame(()=>{ popup.style.transform = 'translateY(0)'; popup.style.opacity = '1'; }); });

    // close handlers: Esc and click outside
    function escHandler(e){ if(e.key === 'Escape') closePopup(); }
    function clickOutside(e){ if(!popup.contains(e.target) && e.target !== card) closePopup(); }
    function closePopup(){
      document.removeEventListener('keydown', escHandler);
      document.removeEventListener('click', clickOutside);
      popup.style.transform = 'translateY(12px)';
      popup.style.opacity = '0';
      popup.addEventListener('transitionend', function handler(ev){ if(ev.propertyName === 'opacity'){ popup.removeEventListener('transitionend', handler); popup.remove(); } });
    }

    document.addEventListener('keydown', escHandler);
    setTimeout(()=> document.addEventListener('click', clickOutside), 10);
  }

  cards.forEach(c=> c.addEventListener('click', ()=> openPopupFor(c)));
})();
