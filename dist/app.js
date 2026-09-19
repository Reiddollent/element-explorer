'use strict';
const $=id=>document.getElementById(id);
const state={z:6,view:'shell',orbital:'2p',shell:2,axis:0,fullConfig:true,compound:'ch4',step:0};
const shellColors=['#a8d3c1','#edb983','#90b9da','#c4b3dd','#e4a8b4','#c7d68b','#8ed9df'];
const COMMON_ELEMENTS=new Set([1,2,3,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,24,25,26,27,28,29,30,35,47,50,53,56,74,78,79,80,82,92]);
const superscript=n=>String(n).split('').map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]).join('');
const fmtCharge=n=>n===0?'0':(n>0?'+':'−')+Math.abs(n);
const currentElement=()=>ELEMENTS[state.z-1];
const currentCompound=()=>COMPOUNDS.find(c=>c.id===state.compound);
function renderTable(){
  $('periodic-table').innerHTML=ELEMENTS.map(e=>`<button class="element-tile ${e.category}" data-z="${e.z}" title="${e.cn} ${e.name} · ${e.family}" aria-label="${e.z}号元素 ${e.cn} ${e.symbol}" aria-pressed="${e.z===state.z}"><span class="atomic-no">${e.z}</span><span class="symbol">${e.symbol}</span><span class="element-cn">${e.cn}</span></button>`).join('');
}
function withinFilter(e,filter){return filter==='all'||filter==='common'&&COMMON_ELEMENTS.has(e.z)||filter==='main'&&['s','p'].includes(e.block)||filter==='d'&&e.block==='d'||filter===e.category;}
function selectElement(z){
  if(!Number.isInteger(z)||z<1||z>118)throw new RangeError('请选择 1—118 号元素');
  state.z=z;const config=valenceOrbitals(z),focus=config.find(o=>['d','f'].includes(o.name[1])&&o.count<o.capacity)||config.at(-1);state.orbital=focus.name;state.shell=focus.shell;state.step=0;state.axis=0;state.fullConfig=z<=20;
  const compounds=COMPOUNDS.filter(c=>c.elements.includes(currentElement().symbol));state.compound=compounds[0]?.id||null;
  if(!withinFilter(currentElement(),$('element-filter').value))$('element-filter').value='all';
  $('search').value='';filterTable('');renderElement();
}
function renderElement(){
  const e=currentElement(),shells=electronShells(e.z),valence=shells.at(-1);
  for(const b of document.querySelectorAll('[data-z]'))b.setAttribute('aria-pressed',String(Number(b.dataset.z)===e.z));
  $('hero-symbol').textContent=e.symbol;$('element-name').innerHTML=`${e.cn} <span>${e.name}</span>`;
  $('element-meta').innerHTML=`<span>原子序数<b>${e.z}</b></span><span title="${e.massIsotope?'数据库采用的同位素参考质量，不是天然平均原子量':'数据库采用的参考原子质量'}">原子质量/u<b>${e.mass}</b>${e.massIsotope?'（同位素参考值）':''}</span><span>第 ${e.period} 周期 · ${e.family}</span>`;
  $('prev-element').disabled=e.z===1;$('next-element').disabled=e.z===118;
  $('valence-number').textContent=valence;
  $('valence-dots').innerHTML=Array.from({length:Math.max(valence,e.z<=2?2:['s','p'].includes(e.block)?8:valence)},(_,i)=>`<i class="${i>=valence?'empty':''}"></i>`).join('');
  $('valence-explanation').textContent=`最高已占据电子层为 n=${shells.length}，含 ${valence} 个电子。${['d','f'].includes(e.block)?'此数值不是价电子总数。':'主族近似通常将最外层电子视为价电子。'}${e.z===46?'钯的 5s 亚层为空。':''}`;
  $('oxidation-label').textContent=e.predicted?'氧化态（含预测）':'参考氧化态';
  $('oxidation-values').textContent=e.oxidation.length?e.oxidation.map(fmtCharge).join('  '):'未提供';
  $('oxidation-explanation').textContent=e.predicted?'此列表可能包含理论预测，不应解释为全部已实验确认的常见氧化态。':e.oxidation.length?'参考表收录的氧化态，并非完整列表。氧化态是形式记账值，不是原子的实际电荷；单质为 0。':'参考表未提供数值；未提供不代表不存在。';
  $('en-value').textContent=e.en===null?'未提供':e.en.toFixed(2);
  $('en-scale').hidden=e.en===null;$('en-scale').nextElementSibling.hidden=e.en===null;
  $('en-marker').style.left=`${e.en/4*100}%`;
  $('en-explanation').textContent=e.en===null?'参考表未提供 Pauling 电负性，不能按零处理。':'参考值。数值越高，通常越能吸引化学键中的电子。';
  $('behavior-explanation').textContent=e.behavior;
  $('element-source').href=e.sourceUrl;
  $('element-source').textContent=`${e.symbol} 的参考数据（PubChem） ↗`;
  renderStructure();renderCompounds();renderQuiz();
}
function selectOrbital(name){const o=electronConfiguration(state.z).find(o=>o.name===name);if(!o)return;state.orbital=o.name;state.shell=o.shell;state.axis=0;renderStructure();}
function selectShell(n){state.shell=n;state.orbital=electronConfiguration(state.z).filter(o=>o.shell===n).at(-1).name;state.axis=0;if(!valenceOrbitals(state.z).some(o=>o.name===state.orbital))state.fullConfig=true;renderStructure();}
function renderStructure(){
  const e=currentElement(),config=electronConfiguration(state.z),active=config.find(o=>o.name===state.orbital),visible=state.fullConfig?config:valenceOrbitals(state.z);
  $('config-reference').textContent=e.config.replace(/([spdf])(\d+)/g,(_,l,n)=>l+superscript(n));
  $('stage-status').textContent=e.predicted?'中性原子 · 理论参考':'中性原子 · 参考基态';
  $('configuration-note').textContent=e.configNote+(coreSymbol(e.z)?` [${coreSymbol(e.z)}] 表示该稀有气体的内层排布。`:'');
  $('configuration-source').href=e.configSourceUrl;$('configuration-source').textContent=`排布来源：${e.configSource} ↗`;
  $('toggle-core').hidden=!coreSymbol(e.z);$('toggle-core').textContent=state.fullConfig?'简写排布':'显示完整排布';$('toggle-core').setAttribute('aria-pressed',String(state.fullConfig));
  $('orbital-boxes').innerHTML=visible.map(o=>{const occupancy=orbitalOccupancy(o.count,o.capacity/2);return `<button class="orbital-group" data-orbital="${o.name}" aria-label="${o.name}，${o.count} 个电子" aria-pressed="${o.name===state.orbital}"><span class="orbital-label">${o.name}<sup>${o.count}</sup></span><span class="boxes">${occupancy.map(n=>`<span class="box">${n===2?'↑↓':n===1?'↑':'&nbsp;'}</span>`).join('')}</span></button>`;}).join('');
  $('orbital-explanation').textContent=`${active.name}${superscript(active.count)}：n=${active.shell}，${active.name[1]} 亚层有 ${active.capacity/2} 个轨道，最多 ${active.capacity} 个电子。方框表示轨道，箭头表示自旋。先单占再配对是教学表示，不是分子成键图。`;
  const shells=electronShells(state.z);
  $('shell-legend').innerHTML=shells.map((n,i)=>`<button data-shell="${i+1}" aria-pressed="${i+1===state.shell}"><i style="background:${shellColors[i]}"></i>${'KLMNOPQ'[i]} 层 · ${n}</button>`).join('');
  $('shell-view').hidden=state.view!=='shell';$('orbital-view').hidden=state.view!=='orbital';
  for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===state.view));
  $('diagram-disclaimer').textContent=state.view==='shell'?'结构示意，非电子运动轨迹':'轨道形状示意，省略径向节点';
  const shapes=ORBITAL_SHAPES[state.orbital[1]];if(state.axis>=shapes.length)state.axis=0;
  $('orbital-axis-picker').hidden=shapes.length===1;
  $('orbital-axis-picker').setAttribute('aria-label',`选择${state.orbital[1]}轨道形状`);
  $('orbital-axis-picker').innerHTML=shapes.map((s,i)=>`<button data-axis="${i}" aria-pressed="${state.axis===i}">${s.label}</button>`).join('');
  renderShell();if(state.view==='orbital')drawOrbital();
}
function renderShell(){
  const e=currentElement(),shells=electronShells(e.z),cx=260,cy=152;
  let markup=`<text x="22" y="35" fill="#bed0d9" font-size="11">${e.z} 个电子</text><text x="22" y="53" fill="#8fa8b8" font-size="9">点击电子层，查看排布</text>`;
  // Outer shells are painted first so inner interactive targets remain reachable.
  for(let i=shells.length-1;i>=0;i--){const radius=34+(i+1)*(96/shells.length),selected=state.shell===i+1,color=shellColors[i];
    markup+=`<g role="button" tabindex="0" data-shell="${i+1}" aria-label="第${i+1}电子层，${shells[i]}个电子"><circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="transparent" stroke-width="18"/><circle class="shell-ring" cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="${selected?1.6:.8}" stroke-opacity="${selected?.9:.32}"/>`;
    for(let j=0;j<shells[i];j++){const a=(j/shells[i]*Math.PI*2)-Math.PI/2+i*.43;const x=cx+Math.cos(a)*radius,y=cy+Math.sin(a)*radius;markup+=`<circle cx="${x}" cy="${y}" r="${selected?5:4}" fill="${color}" fill-opacity="${selected?1:.65}"/>`;}
    markup+=`<text x="${cx+radius+12}" y="${cy+4}" fill="${color}" fill-opacity="${selected?1:.65}" font-size="11">${'KLMNOPQ'[i]}</text></g>`;
  }
  markup+=`<circle cx="${cx}" cy="${cy}" r="25" fill="#2c4655" stroke="#53707b" stroke-width=".7"/><text x="${cx}" y="${cy+5}" text-anchor="middle" fill="#e5ede9" font-size="18" font-family="Georgia,serif">${e.symbol}</text><text x="${cx}" y="${cy+40}" text-anchor="middle" fill="#a0b5c0" font-size="8">原子核 · ${e.z} 个质子</text>`;
  $('shell-svg').innerHTML=markup;
}
function filterTable(query){const q=query.trim().toLowerCase(),filter=$('element-filter').value;let count=0;for(const b of document.querySelectorAll('[data-z]')){const e=ELEMENTS[Number(b.dataset.z)-1];const match=withinFilter(e,filter)&&(!q||e.cn.includes(q)||e.symbol.toLowerCase().startsWith(q)||e.name.toLowerCase().includes(q)||String(e.z)===q);b.hidden=!match;b.disabled=!match;if(match)count++;}$('search-empty').hidden=count>0;$('search-empty').textContent='当前范围内没有匹配元素。可切换“全部元素”，或输入元素符号、中文名、英文名及原子序数。';$('element-count').textContent=`${count} / 118`;}
function renderCompounds(){
  const e=currentElement(),list=COMPOUNDS.filter(c=>c.elements.includes(e.symbol));
  $('compound-intro').textContent=`含${e.cn}的预设实例：${list.length} 个。此列表不是全部已知化合物。`;
  $('compound-tabs').innerHTML=list.map(c=>`<button data-compound="${c.id}" aria-pressed="${state.compound===c.id}"><strong>${c.formula}</strong><span>${c.name}</span></button>`).join('');
  $('compound-workspace').hidden=!list.length;$('compound-empty').hidden=!!list.length;
  $('compound-empty').textContent=`本库暂未收录 ${e.cn}（${e.symbol}）的化合物实例。收录范围与元素是否形成化合物无关，不能据此判断其化学活性。当前可查看该元素的原子电子结构和参考性质。`;
  $('explore-compounds').disabled=!list.length;
  $('explore-compounds').innerHTML=list.length?`查看相关化合物（${list.length}） <span aria-hidden="true">↓</span>`:'暂无相关实例';
  if(list.length)renderCompound();
}
function renderCompound(){
  const c=currentCompound();if(!c)return;
  $('compound-name').textContent=`${c.name} ${c.formula}`;$('bond-type').textContent=c.ionic?'离子模型':'共价键';
  $('compound-description').textContent=c.description;$('molecule-geometry').textContent=c.geometry;
  $('molecule-canvas').setAttribute('aria-label',`${c.name}，${c.geometry}。拖动或用方向键旋转，结构不按真实比例。`);
  $('molecule-legend').innerHTML=[...new Set(c.atoms.map(a=>a.s))].map(s=>`<span class="legend-item"><i style="background:${ATOM_COLORS[s]}"></i>${ELEMENTS.find(e=>e.symbol===s)?.cn} ${s}</span>`).join('');
  $('lewis-label').textContent=c.ionic?'电荷与化学式 · 扩展晶体的组成关系':'路易斯结构 · 点表示未成键电子';
  for(const b of document.querySelectorAll('[data-compound]'))b.setAttribute('aria-pressed',String(b.dataset.compound===c.id));
  moleculeRotation.x=.25;moleculeRotation.y=.35;
  renderStep();drawMolecule();
}
function renderStep(){const c=currentCompound();if(!c)return;
  $('step-count').textContent=`成键解释 ${state.step+1} / ${c.steps.length}`;
  $('step-title').textContent=c.steps[state.step][0];$('step-description').textContent=c.steps[state.step][1];
  $('prev-step').disabled=state.step===0;$('next-step').disabled=state.step===c.steps.length-1;
  $('next-step').textContent=state.step===c.steps.length-1?'已读完':'下一步 →';renderLewis();
}
function renderLewis(){const c=currentCompound();if(!c)return;let s='';
  if(c.ionic){let m=c.negative,n=c.positive;const gcd=(a,b)=>b?gcd(b,a%b):a;let d=gcd(m,n);m/=d;n/=d;
    const charge=(value,positive)=>`${value===1?'':superscript(value)}${positive?'⁺':'⁻'}`;
    s=`<text x="160" y="63" text-anchor="middle" fill="#2c6455" font-size="25">${m>1?m+' × ':''}${c.metal}${charge(c.positive,true)} + ${n>1?n+' × ':''}${c.nonmetal}${charge(c.negative,false)}</text><text x="160" y="102" text-anchor="middle" fill="#637374" font-size="13">总电荷：${m} × (+${c.positive}) + ${n} × (−${c.negative}) = 0</text>`;
  }else{
    const cx=160,cy=76;let positions=c.outer.length===4?[[0,-52],[72,0],[0,52],[-72,0]]:c.outer.length===3?[[0,-50],[75,28],[-75,28]]:c.outer.length===2?[[-76,0],[76,0]]:[[75,0]];
    const text=(x,y,label,size=20)=>`<text x="${x}" y="${y+7}" text-anchor="middle" fill="#284c40" font-size="${size}" font-family="Georgia,serif">${label}</text>`;
    const dots=(x,y,count,avoid)=>{let out='';const sides=[[-21,0],[0,-22],[21,0],[0,22]].filter((_,i)=>i!==avoid);for(let k=0;k<count;k++){const [dx,dy]=sides[k];for(let j=-1;j<=1;j+=2)out+=`<circle cx="${x+dx+(dx===0?j*4:0)}" cy="${y+dy+(dy===0?j*4:0)}" r="2" fill="#788a77"/>`;}return out;};
    positions.forEach(([dx,dy],i)=>{const length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length,order=c.orders?.[i]||1;
      for(let j=0;j<order;j++){const off=(j-(order-1)/2)*5;s+=`<line x1="${cx+ux*16-uy*off}" y1="${cy+uy*16+ux*off}" x2="${cx+dx-ux*17-uy*off}" y2="${cy+dy-uy*17+ux*off}" stroke="${state.step===1?'#2c6455':'#8a9b8c'}" stroke-width="${state.step===1?2.5:1.5}"/>`;}
      s+=text(cx+dx,cy+dy,c.outer[i]);if(c.outerLone){const avoid=Math.abs(dx)>Math.abs(dy)?(dx>0?0:2):(dy>0?1:3);s+=dots(cx+dx,cy+dy,c.outerLone,avoid);}
    });s+=text(cx,cy,c.center);
    // Place central lone pairs in unoccupied directions, leaving bond labels clear.
    if(c.lone===1)s+=dots(cx+30,cy-23,1,3);
    if(c.lone===2){s+=`<circle cx="155" cy="52" r="2" fill="#788a77"/><circle cx="165" cy="52" r="2" fill="#788a77"/><circle cx="155" cy="100" r="2" fill="#788a77"/><circle cx="165" cy="100" r="2" fill="#788a77"/>`;}
    if(c.lone===3)s+=dots(cx,cy,3,2);
  }
  $('lewis-svg').innerHTML=s;$('lewis-svg').setAttribute('aria-label',c.ionic?`${c.formula} 中正负电荷平衡`:`${c.formula} 的路易斯结构：${c.bonds.length} 个连接，中心原子 ${c.lone} 对孤电子`);
}
function renderQuiz(){const e=currentElement(),v=electronShells(e.z).at(-1),choices=[...new Set([v,v===8?6:v+1,v===1?3:v-1])].sort((a,b)=>a-b);
  $('quiz-question').textContent=`${e.cn}（${e.symbol}）的中性原子，最外层有几个电子？`;
  $('quiz-answers').innerHTML=choices.map(n=>`<button data-answer="${n}">${n} 个</button>`).join('');$('quiz-feedback').textContent='选择答案后显示核对结果。';
}
function quizAnswer(n){const v=electronShells(state.z).at(-1);for(const b of document.querySelectorAll('[data-answer]')){b.classList.remove('correct','incorrect');if(Number(b.dataset.answer)===n)b.classList.add(n===v?'correct':'incorrect');}$('quiz-feedback').textContent=n===v?`正确。${currentElement().cn}原子的最外层有 ${v} 个电子。`:'不正确。请按最外层计数，不要计入内层电子。';}
function project(p,rotation){let [x,y,z]=p;let a=x*Math.cos(rotation.y)+z*Math.sin(rotation.y);z=-x*Math.sin(rotation.y)+z*Math.cos(rotation.y);x=a;a=y*Math.cos(rotation.x)-z*Math.sin(rotation.x);z=y*Math.sin(rotation.x)+z*Math.cos(rotation.x);return [x,a,z];}
const orbitalRotation={x:.2,y:.4},moleculeRotation={x:.25,y:.35};
function canvasContext(id){const canvas=$(id),rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return null;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return {ctx,w:rect.width,h:rect.height};}
const cloudPoints=Array.from({length:1000},(_,i)=>{const t=(i+.5)/1000;const a=i*2.399963229728653;const y=1-2*t,r=Math.sqrt(1-y*y);return [Math.cos(a)*r,y,Math.sin(a)*r];});
function drawOrbital(){const cc=canvasContext('orbital-canvas');if(!cc)return;const {ctx,w,h}=cc,cx=w/2,cy=(h-55)/2+15,scale=Math.min(w*.29,(h-90)*.44),kind=state.orbital[1],shape=ORBITAL_SHAPES[kind][state.axis];
  ctx.clearRect(0,0,w,h);const colors=[shellColors[state.shell-1],'#91b9da','#cab5da'];
  for(let axis=0;axis<3;axis++){const p=[0,0,0];p[axis]=1.2;const a=project(p,orbitalRotation),b=project(p.map(v=>-v),orbitalRotation);ctx.strokeStyle='#3c5566';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(cx+b[0]*scale,cy-b[1]*scale);ctx.lineTo(cx+a[0]*scale,cy-a[1]*scale);ctx.stroke();ctx.fillStyle='#9eb4c2';ctx.font='10px sans-serif';ctx.fillText(['x','y','z'][axis],cx+a[0]*scale+4,cy-a[1]*scale);}
  let particles=[];
  const values=cloudPoints.map(p=>shape.amplitude(p)),peak=Math.max(...values.map(Math.abs));
  cloudPoints.forEach((p,i)=>{const radius=Math.abs(values[i])/peak*(kind==='s'?.8:1);const r=project(p.map(v=>v*radius),orbitalRotation);particles.push({r,color:colors[0],alpha:.72});});
  particles.sort((a,b)=>a.r[2]-b.r[2]);for(const {r,color,alpha} of particles){ctx.globalAlpha=alpha*(.7+(r[2]+1)*.15);ctx.fillStyle=color;ctx.beginPath();ctx.arc(cx+r[0]*scale,cy-r[1]*scale,1.1+r[2]*.2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  ctx.fillStyle='#edf3ec';ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d4e4e6';ctx.font='13px sans-serif';ctx.fillText(`${state.orbital[0]}${shape.label} · 角向形状`,18,27);ctx.font='10px sans-serif';ctx.fillStyle='#acbfca';ctx.fillText('图形表示一个轨道；点不表示电子位置',18,46);
}
function drawMolecule(){const c=currentCompound(),cc=canvasContext('molecule-canvas');if(!cc||!c)return;const {ctx,w,h}=cc,cx=w/2,cy=h/2,scale=Math.min(w/5.3,h/4.5);ctx.clearRect(0,0,w,h);
  const projected=c.atoms.map((a,i)=>{const p=project(a.p,moleculeRotation),perspective=1+p[2]*.055;return {s:a.s,i,z:p[2],x:cx+p[0]*scale*perspective,y:cy-p[1]*scale*perspective,r:(a.s==='H'?16:24)*Math.min(w/380,1.15)*perspective};});
  for(const [a,b,order=1] of c.bonds){const p=projected[a],q=projected[b];const dx=q.x-p.x,dy=q.y-p.y,length=Math.hypot(dx,dy)||1;for(let j=0;j<order;j++){const offset=(j-(order-1)/2)*7;ctx.strokeStyle='#b3bdb4';ctx.lineWidth=order===2?5:7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x-dy/length*offset,p.y+dx/length*offset);ctx.lineTo(q.x-dy/length*offset,q.y+dx/length*offset);ctx.stroke();}}
  for(const p of [...projected].sort((a,b)=>a.z-b.z)){const color=ATOM_COLORS[p.s]||'#abbeb0';ctx.shadowColor='rgba(34,55,43,.15)';ctx.shadowBlur=9;ctx.shadowOffsetY=5;const gradient=ctx.createRadialGradient(p.x-p.r*.3,p.y-p.r*.35,p.r*.07,p.x,p.y,p.r);gradient.addColorStop(0,'#fff');gradient.addColorStop(.3,color);gradient.addColorStop(1,color);ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.fillStyle=p.s==='C'?'#fff':'#263c40';ctx.font=`600 ${p.r*.65}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.s,p.x,p.y+1);
    if(c.ionic){const charge=p.s===c.metal?c.positive:-c.negative;ctx.fillStyle='#2c6455';ctx.font='13px sans-serif';ctx.fillText(fmtCharge(charge),p.x+p.r+7,p.y-p.r);}
  }
  if(c.ionic){ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#52665a';ctx.fillText('仅展示离子种类，组成比见右侧电荷式',cx,h-15);}
}
function installRotation(canvas,rotation,draw){let drag=null;canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';});canvas.addEventListener('pointermove',e=>{if(!drag)return;rotation.y+=(e.clientX-drag.x)*.01;rotation.x+=(e.clientY-drag.y)*.01;drag={x:e.clientX,y:e.clientY};draw();});for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{drag=null;canvas.style.cursor='grab';});
  // Touch: horizontal swipes rotate; vertical movement remains available for page scrolling.
  let touch=null;canvas.addEventListener('touchstart',e=>{touch={x:e.touches[0].clientX,y:e.touches[0].clientY,mode:null};},{passive:true});canvas.addEventListener('touchmove',e=>{if(!touch)return;const t=e.touches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y;if(!touch.mode&&Math.abs(dx)+Math.abs(dy)>5)touch.mode=Math.abs(dx)>Math.abs(dy)?'rotate':'scroll';if(touch.mode==='rotate'){e.preventDefault();rotation.y+=dx*.015;touch.x=t.clientX;draw();}},{passive:false});canvas.addEventListener('touchend',()=>{touch=null});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')rotation.y-=.15;if(e.key==='ArrowRight')rotation.y+=.15;if(e.key==='ArrowUp')rotation.x-=.15;if(e.key==='ArrowDown')rotation.x+=.15;draw();});canvas.style.cursor='grab';
}
document.addEventListener('click',e=>{const target=e.target.closest('button,[data-shell]');if(!target)return;if(target.dataset.z)selectElement(Number(target.dataset.z));if(target.dataset.orbital)selectOrbital(target.dataset.orbital);if(target.dataset.shell)selectShell(Number(target.dataset.shell));if(target.dataset.axis!==undefined){state.axis=Number(target.dataset.axis);renderStructure();}if(target.dataset.view){state.view=target.dataset.view;renderStructure();}if(target.dataset.compound){state.compound=target.dataset.compound;state.step=0;renderCompound();}if(target.dataset.answer)quizAnswer(Number(target.dataset.answer));});
$('shell-svg').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.dataset.shell){e.preventDefault();selectShell(Number(e.target.dataset.shell));}});
$('search').addEventListener('input',e=>filterTable(e.target.value));$('search').addEventListener('keydown',e=>{if(e.key==='Enter'){const matched=[...document.querySelectorAll('[data-z]:not(:disabled)')],q=$('search').value.trim().toLowerCase();const exact=matched.find(b=>ELEMENTS[Number(b.dataset.z)-1].symbol.toLowerCase()===q)||matched[0];if(exact)selectElement(Number(exact.dataset.z));}});
$('element-filter').addEventListener('change',()=>filterTable($('search').value));
$('toggle-core').onclick=()=>{state.fullConfig=!state.fullConfig;if(!state.fullConfig&&!valenceOrbitals(state.z).some(o=>o.name===state.orbital)){const o=valenceOrbitals(state.z).at(-1);state.orbital=o.name;state.shell=o.shell;state.axis=0;}renderStructure();};
$('prev-element').onclick=()=>selectElement(state.z-1);$('next-element').onclick=()=>selectElement(state.z+1);
$('explore-compounds').onclick=()=>{$('compounds').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});const target=$('compound-tabs').querySelector('button');if(target)target.focus({preventScroll:true});};
$('prev-step').onclick=()=>{if(state.step>0){state.step--;renderStep();}};$('next-step').onclick=()=>{if(state.step<2){state.step++;renderStep();}};
$('reset-molecule').onclick=()=>{moleculeRotation.x=.25;moleculeRotation.y=.35;drawMolecule();};
installRotation($('orbital-canvas'),orbitalRotation,drawOrbital);installRotation($('molecule-canvas'),moleculeRotation,drawMolecule);
new ResizeObserver(()=>{if(state.view==='orbital')drawOrbital();if(state.compound)drawMolecule();}).observe(document.querySelector('.workspace'));
$('dataset-count').textContent=`${ELEMENTS.length} 个元素 · ${COMPOUNDS.length} 个化合物实例`;
renderTable();renderElement();
// Optional browser agent interface shares the exact same validated UI action.
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'select_element',title:'选择元素',description:'选择1—118号元素，更新可见的电子结构、参考性质与已收录化合物。',inputSchema:{type:'object',properties:{atomicNumber:{type:'integer',minimum:1,maximum:118}},required:['atomicNumber'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||Object.keys(input).some(k=>k!=='atomicNumber'))throw new TypeError('只接受 atomicNumber');selectElement(input.atomicNumber);return {symbol:currentElement().symbol,atomicNumber:state.z,shells:electronShells(state.z),predicted:currentElement().predicted};}})).catch(()=>{});}catch{}}
