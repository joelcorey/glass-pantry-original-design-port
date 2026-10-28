/* Reflow the preserved Wix desktop mesh without replacing its components. */
(() => {
 const breakpoint = matchMedia('(max-width: 979px)');
 let prepared = false;
 function prepare() {
  if (prepared || !breakpoint.matches) return;
  prepared = true;
  // Read every original rectangle before enabling the mobile rules. This keeps
  // column order and image proportions independent of the phone's dimensions.
  const grids = [...document.querySelectorAll('[data-mesh-id$="-gridContainer"]')];
  const snapshots = grids.map(grid => ({grid, width:grid.getBoundingClientRect().width,
   items:[...grid.children].map(element => {
    const rect=element.getBoundingClientRect();
    return {element,x:rect.x,y:rect.y,width:rect.width,height:rect.height};
   }).filter(item=>item.width>0 && item.height>0)
  }));
  for (const {grid,width,items} of snapshots) {
   if(width<300)continue; // Keep small forms and decorative groups intact.
   grid.classList.add('pantry-mobile-flow');
   // Sections already have the intended reading order. Within a section, read
   // each original column top to bottom so recipe headings stay with photos.
   const columns=[];
   for(const item of [...items].sort((a,b)=>a.x-b.x || a.y-b.y)) {
    let column=columns.find(column=>Math.abs(column.x-item.x)<100);
    if(!column){column={x:item.x,items:[]};columns.push(column);}
    column.items.push(item);
   }
   let order=0;
   for(const column of columns.sort((a,b)=>a.x-b.x)) {
    for(const {element,width,height} of column.items.sort((a,b)=>a.y-b.y)) {
     element.classList.add('pantry-mobile-item');
     element.style.setProperty('--pantry-order',String(order++));
     element.style.setProperty('--pantry-width',width+'px');
     element.style.setProperty('--pantry-ratio',String(width/height));
    }
   }
  }
  for(const text of document.querySelectorAll('.wixui-rich-text [style*="font-size"]')) {
   const size=parseFloat(getComputedStyle(text).fontSize);
   if(size>32)text.style.setProperty('--pantry-font-size','32px');
  }
  document.documentElement.classList.add('pantry-mobile-ready');
  // Wix may mark desktop overflow items inaccessible after measuring the narrow
  // viewport. Our wrapped menu displays every item, so keep its ARIA state aligned.
  const syncNavigation=()=>{
   if(!breakpoint.matches)return;
   for(const item of document.querySelectorAll('.wixui-dropdown-menu nav > ul > li:not([data-index="__more__"])')) {
    if(item.getAttribute('aria-hidden')==='true')item.setAttribute('aria-hidden','false');
    const link=item.querySelector(':scope > a');
    if(link?.hasAttribute('tabindex'))link.removeAttribute('tabindex');
   }
  };
  syncNavigation();
  for(const menu of document.querySelectorAll('.wixui-dropdown-menu')) {
   new MutationObserver(syncNavigation).observe(menu,{subtree:true,attributes:true,attributeFilter:['aria-hidden','tabindex']});
  }
 }
 // Use the original submenu markup; Wix's live menu services are not required.
 document.addEventListener('click',event=>{
  if(!breakpoint.matches)return;
  const button=event.target.closest('.wixui-dropdown-menu li > button');
  if(!button)return;
  const list=button.parentElement.querySelector(':scope > ul');
  if(!list)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const open=list.getAttribute('aria-hidden')==='true';
  list.setAttribute('aria-hidden',String(!open));
  button.setAttribute('aria-expanded',String(open));
  button.parentElement.querySelector(':scope > a')?.setAttribute('aria-expanded',String(open));
  for(const link of list.querySelectorAll('a'))link.tabIndex=open?0:-1;
 },true);
 prepare();
 breakpoint.addEventListener('change',prepare);
})();
