'use strict';
const $=id=>document.getElementById(id);
const state={z:6,view:'shell',orbital:'2p',shell:2,axis:0,fullConfig:true,compound:'ch4',step:0};
const shellColors=['#a8d3c1','#edb983','#90b9da','#c4b3dd','#e4a8b4','#c7d68b','#8ed9df'];
const COMMON_ELEMENTS=new Set([1,2,3,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,24,25,26,27,28,29,30,35,47,50,53,56,74,78,79,80,82,92]);
const superscript=n=>String(n).split('').map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]).join('');
const fmtCharge=n=>n===0?'0':(n>0?'+':'−')+Math.abs(n);
const currentElement=()=>ELEMENTS[state.z-1];
const currentCompound=()=>localizedCompound(COMPOUNDS.find(c=>c.id===state.compound));
function tablePosition(e){return e.group?{row:e.period+1,column:e.group+1}:{row:e.period===6?10:11,column:e.z-(e.period===6?57:89)+4};}
function renderTable(){
 let html=Array.from({length:18},(_,i)=>`<span class="group-label" style="grid-row:1;grid-column:${i+2}">${i+1}</span>`).join('');
 html+=Array.from({length:7},(_,i)=>`<span class="period-label" style="grid-row:${i+2};grid-column:1">${i+1}</span>`).join('');
 html+=`<span class="series-marker" style="grid-row:7;grid-column:4">57–71</span><span class="series-marker" style="grid-row:8;grid-column:4">89–103</span><span class="series-title" style="grid-row:10;grid-column:1/4">${L('Lanthanides','镧系')}</span><span class="series-title" style="grid-row:11;grid-column:1/4">${L('Actinides','锕系')}</span>`;
 html+=ELEMENTS.map(e=>{const p=tablePosition(e);return `<button class="element-tile ${e.category}" style="grid-row:${p.row};grid-column:${p.column}" data-z="${e.z}" title="${elementName(e)} · ${familyName(e)}" aria-label="${e.z} ${elementName(e)} ${e.symbol}" aria-pressed="${e.z===state.z}"><span class="atomic-no">${e.z}</span><span class="symbol">${e.symbol}</span><span class="element-cn">${elementName(e)}</span></button>`;}).join('');
 $('periodic-table').innerHTML=html;
}
function withinFilter(e,filter){return filter==='all'||filter==='common'&&COMMON_ELEMENTS.has(e.z)||filter==='main'&&['s','p'].includes(e.block)||filter==='d'&&e.block==='d'||filter===e.category;}
function selectElement(z){
 if(!Number.isInteger(z)||z<1||z>118)throw new RangeError('Atomic number must be an integer from 1 to 118.');
 state.z=z;const config=valenceOrbitals(z),focus=config.find(o=>['d','f'].includes(o.name[1])&&o.count<o.capacity)||config.at(-1);state.orbital=focus.name;state.shell=focus.shell;state.step=0;state.axis=0;state.fullConfig=z<=20;
 state.compound=COMPOUNDS.find(c=>c.elements.includes(currentElement().symbol))?.id||null;
 if(!withinFilter(currentElement(),$('element-filter').value))$('element-filter').value='all';
 $('search').value='';filterTable('');renderElement();
}
function renderElement(){
 const e=currentElement(),shells=electronShells(e.z),outer=shells.at(-1);
 for(const b of document.querySelectorAll('[data-z]'))b.setAttribute('aria-pressed',String(Number(b.dataset.z)===e.z));
 $('hero-symbol').textContent=e.symbol;$('element-name').innerHTML=`${elementName(e)} <span>${L('',e.name)}</span>`;
 $('element-meta').innerHTML=`<span>${L('Atomic number','原子序数')} <b>${e.z}</b></span><span>${L('Atomic mass','原子质量')} <b>${e.mass} u</b>${e.massIsotope?L(' (isotope reference)','（同位素参考值）'):''}</span><span>${L('Period','周期')} ${e.period} · ${familyName(e)}</span>`;
 $('prev-element').disabled=e.z===1;$('next-element').disabled=e.z===118;
 $('valence-number').textContent=outer;$('valence-dots').innerHTML=Array.from({length:outer},()=>'<i></i>').join('');
 $('valence-explanation').textContent=L(`Highest occupied shell: n=${shells.length}, with ${outer} electron${outer===1?'':'s'}. `,`最高已占据电子层 n=${shells.length}，含 ${outer} 个电子。`)+(['d','f'].includes(e.block)?L('This is not the total valence electron count.','此数值不是价电子总数。'):L('For main-group elements these are usually treated as valence electrons.','主族近似通常将这些电子视为价电子。'))+(e.z===46?L(' The 5s subshell of Pd is empty.','钯的 5s 亚层为空。'):'');
 $('oxidation-label').textContent=e.predicted?L('Oxidation states (predicted included)','氧化态（含预测）'):L('Oxidation states','参考氧化态');
 $('oxidation-values').textContent=e.oxidation.length?e.oxidation.map(fmtCharge).join('  '):L('Not available','未提供');
 $('oxidation-explanation').textContent=e.predicted?L('May include theoretical predictions, not all experimentally confirmed.','可能包含理论预测，并非全部经过实验确认。'):L('Selected reference states. Oxidation state is formal electron bookkeeping, not actual atomic charge. An element in its free form has oxidation state 0.','参考表收录的部分氧化态。氧化态是形式记账值，不是实际电荷；单质为 0。');
 $('en-value').textContent=e.en===null?L('Not available','未提供'):e.en.toFixed(2);
 $('en-scale').hidden=e.en===null;$('en-scale').nextElementSibling.hidden=e.en===null;$('en-marker').style.left=`${e.en/4*100}%`;
 $('en-explanation').textContent=e.en===null?L('No Pauling value is supplied by the source. Missing does not mean zero.','来源未提供 Pauling 电负性；缺失不代表零。'):L('Higher values generally indicate a stronger attraction for bonding electrons.','数值越高，通常越能吸引成键电子。');
 $('behavior-explanation').textContent=behaviorText(e);$('element-source').href=e.sourceUrl;$('element-source').textContent=`${e.symbol} · PubChem ↗`;
 renderStructure();renderCompounds();renderQuiz();
}
function selectOrbital(name){const o=electronConfiguration(state.z).find(o=>o.name===name);if(!o)return;state.orbital=o.name;state.shell=o.shell;state.axis=0;renderStructure();}
function selectShell(n){state.shell=n;state.orbital=electronConfiguration(state.z).filter(o=>o.shell===n).at(-1).name;state.axis=0;if(!valenceOrbitals(state.z).some(o=>o.name===state.orbital))state.fullConfig=true;renderStructure();}
function renderStructure(){
 const e=currentElement(),config=electronConfiguration(state.z),active=config.find(o=>o.name===state.orbital),visible=state.fullConfig?config:valenceOrbitals(state.z);
 $('config-reference').textContent=state.fullConfig?config.map(o=>o.name+superscript(o.count)).join(' '):e.config.replace(/([spdf])(\d+)/g,(_,l,n)=>l+superscript(n));
 $('stage-status').textContent=e.predicted?L('Neutral atom · theoretical','中性原子 · 理论参考'):L('Neutral atom · ground state','中性原子 · 参考基态');
 $('configuration-note').textContent=L(e.z===103?'Lr uses the NIST 7p¹ configuration.':e.predicted?'Theoretical reference; limited experimental information.':'Reference configuration of a neutral atom.',e.configNote)+(coreSymbol(e.z)?L(` [${coreSymbol(e.z)}] represents the noble-gas core.`,` [${coreSymbol(e.z)}] 表示稀有气体内核。`):'');
 $('configuration-source').href=e.configSourceUrl;$('configuration-source').textContent=L(`Configuration source: ${e.configSource} ↗`,`排布来源：${e.configSource} ↗`);
 $('toggle-core').hidden=!coreSymbol(e.z);$('toggle-core').textContent=state.fullConfig?L('Show shorthand','简写排布'):L('Show full configuration','显示完整排布');$('toggle-core').setAttribute('aria-pressed',String(state.fullConfig));
 $('orbital-boxes').innerHTML=visible.map(o=>`<button class="orbital-group" data-orbital="${o.name}" aria-label="${o.name}, ${o.count} ${L('electrons','个电子')}" aria-pressed="${o.name===state.orbital}"><span class="orbital-label">${o.name}<sup>${o.count}</sup></span><span class="boxes">${orbitalOccupancy(o.count,o.capacity/2).map(n=>`<span class="box">${n===2?'↑↓':n===1?'↑':'&nbsp;'}</span>`).join('')}</span></button>`).join('');
 $('orbital-explanation').textContent=L(`${active.name}${superscript(active.count)}: ${active.capacity/2} orbitals, up to ${active.capacity} electrons. Boxes represent orbitals; arrows represent spin. Electrons occupy separate orbitals before pairing.`,`${active.name}${superscript(active.count)}：${active.capacity/2} 个轨道，最多容纳 ${active.capacity} 个电子。方框表示轨道，箭头表示自旋；先单占，再配对。`);
 const shells=electronShells(state.z);
 $('shell-legend').innerHTML=shells.map((n,i)=>`<button data-shell="${i+1}" aria-pressed="${i+1===state.shell}"><i style="background:${shellColors[i]}"></i>${'KLMNOPQ'[i]} · ${n}</button>`).join('');
 $('shell-view').hidden=state.view!=='shell';$('orbital-view').hidden=state.view!=='orbital';
 for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===state.view));
 $('diagram-disclaimer').textContent=state.view==='shell'?L('Schematic, not electron paths','结构示意，非电子轨迹'):L('Angular shape; radial nodes omitted','角向形状，省略径向节点');
 const shapes=ORBITAL_SHAPES[state.orbital[1]];if(state.axis>=shapes.length)state.axis=0;
 $('orbital-axis-picker').hidden=shapes.length===1;$('orbital-axis-picker').setAttribute('aria-label',L('Choose orbital shape','选择轨道形状'));
 $('orbital-axis-picker').innerHTML=shapes.map((s,i)=>`<button data-axis="${i}" aria-pressed="${state.axis===i}">${s.label}</button>`).join('');
 renderShell();if(state.view==='orbital')drawOrbital();
}
function renderShell(){
 const e=currentElement(),shells=electronShells(e.z),cx=260,cy=152;
 let markup=`<text x="22" y="28" fill="#bed0d9" font-size="11">${e.z} ${L('electrons','个电子')}</text><text x="22" y="44" fill="#a9bdc9" font-size="10">${L('Select a shell','点击电子层')}</text>`;
 for(let i=shells.length-1;i>=0;i--){const radius=34+(i+1)*(96/shells.length),selected=state.shell===i+1,color=shellColors[i];
 markup+=`<g role="button" tabindex="0" data-shell="${i+1}" aria-label="${L('Shell','电子层')} ${i+1}, ${shells[i]} ${L('electrons','个电子')}"><circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="transparent" stroke-width="18"/><circle class="shell-ring" cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="${selected?1.6:.8}" stroke-opacity="${selected?.9:.32}"/>`;
 for(let j=0;j<shells[i];j++){const a=j/shells[i]*Math.PI*2-Math.PI/2+i*.43;markup+=`<circle cx="${cx+Math.cos(a)*radius}" cy="${cy+Math.sin(a)*radius}" r="${selected?5:4}" fill="${color}" fill-opacity="${selected?1:.65}"/>`;}
 markup+=`<text x="${cx+radius+12}" y="${cy+4}" fill="${color}" font-size="11">${'KLMNOPQ'[i]}</text></g>`;}
 markup+=`<circle cx="${cx}" cy="${cy}" r="25" fill="#2c4655" stroke="#53707b"/><text x="${cx}" y="${cy+5}" text-anchor="middle" fill="#e5ede9" font-size="18">${e.symbol}</text><text x="${cx}" y="${cy+40}" text-anchor="middle" fill="#a0b5c0" font-size="9">${e.z} ${L('protons','个质子')}</text>`;
 $('shell-svg').innerHTML=markup;
}
function filterTable(query){
 const q=query.trim().toLowerCase(),filter=$('element-filter').value;let count=0;
 for(const b of document.querySelectorAll('[data-z]')){const e=ELEMENTS[Number(b.dataset.z)-1],match=withinFilter(e,filter)&&(!q||e.cn.includes(q)||e.symbol.toLowerCase().startsWith(q)||e.name.toLowerCase().includes(q)||String(e.z)===q);b.classList.toggle('filtered-out',!match);b.disabled=!match;if(match)count++;}
 $('search-empty').hidden=count>0;$('search-empty').textContent=L('No matches. Select All elements or change your search.','没有匹配元素。请选择全部元素或修改搜索内容。');$('element-count').textContent=`${count} / 118`;
}
function renderCompounds(){
 const e=currentElement(),list=COMPOUNDS.filter(c=>c.elements.includes(e.symbol)).map(localizedCompound);
 $('compound-intro').textContent=L(`${list.length} examples containing ${e.name.toLowerCase()}. Selected compounds, not a complete database.`,`含${e.cn}的实例：${list.length} 个。此列表不是全部已知化合物。`);
 $('compound-tabs').innerHTML=list.map(c=>`<button data-compound="${c.id}" aria-pressed="${state.compound===c.id}"><strong>${c.formula}</strong><span>${c.name}</span></button>`).join('');
 $('compound-workspace').hidden=!list.length;$('compound-empty').hidden=!!list.length;
 $('compound-empty').textContent=L(`No compound examples for ${e.name.toLowerCase()} are included yet. This does not mean the element cannot form compounds.`,`暂未收录${e.cn}的化合物实例，不代表该元素不能形成化合物。`);
 $('explore-compounds').disabled=!list.length;$('explore-compounds').textContent=list.length?L(`View compounds (${list.length}) ↓`,`查看化合物（${list.length}）↓`):L('No examples included','暂无相关实例');
 if(list.length)renderCompound();
}
function renderCompound(){
 const c=currentCompound();if(!c)return;
 $('compound-name').textContent=`${c.name} ${c.formula}`;$('bond-type').textContent=c.ionic?L('Ionic model','离子模型'):L('Covalent bonds','共价键');
 $('compound-description').textContent=c.description;$('molecule-geometry').textContent=c.geometry;
 $('molecule-canvas').setAttribute('aria-label',`${c.name}, ${c.geometry}. ${L('Drag or use arrow keys to rotate. Not to scale.','拖动或用方向键旋转，不按真实比例。')}`);
 $('molecule-legend').innerHTML=[...new Set(c.atoms.map(a=>a.s))].map(s=>`<span class="legend-item"><i style="background:${ATOM_COLORS[s]}"></i>${elementName(ELEMENTS.find(e=>e.symbol===s))} ${s}</span>`).join('');
 $('lewis-label').textContent=c.ionic?L('Charge balance & formula','电荷平衡与化学式'):L('Lewis structure · dots are nonbonding electrons','路易斯结构 · 点表示未成键电子');
 for(const b of document.querySelectorAll('[data-compound]'))b.setAttribute('aria-pressed',String(b.dataset.compound===c.id));
 renderStep();drawMolecule();
}
function renderStep(){const c=currentCompound();if(!c)return;
 $('step-count').textContent=L(`Bonding ${state.step+1} / ${c.steps.length}`,`成键解释 ${state.step+1} / ${c.steps.length}`);
 $('step-title').textContent=c.steps[state.step][0];$('step-description').textContent=c.steps[state.step][1];
 $('prev-step').disabled=state.step===0;$('next-step').disabled=state.step===c.steps.length-1;
 $('next-step').textContent=state.step===c.steps.length-1?L('Complete','已读完'):L('Next →','下一步 →');renderLewis();
}

function renderLewis(){const c=currentCompound();if(!c)return;let s='';
  if(c.ionic){let m=c.negative,n=c.positive;const gcd=(a,b)=>b?gcd(b,a%b):a;let d=gcd(m,n);m/=d;n/=d;
    const charge=(value,positive)=>`${value===1?'':superscript(value)}${positive?'⁺':'⁻'}`;
    s=`<text x="160" y="63" text-anchor="middle" fill="#2c6455" font-size="25">${m>1?m+' × ':''}${c.metal}${charge(c.positive,true)} + ${n>1?n+' × ':''}${c.nonmetal}${charge(c.negative,false)}</text><text x="160" y="102" text-anchor="middle" fill="#637374" font-size="13">${L("Total charge:","总电荷：")} ${m} × (+${c.positive}) + ${n} × (−${c.negative}) = 0</text>`;
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
  $('lewis-svg').innerHTML=s;$('lewis-svg').setAttribute('aria-label',c.ionic?L(`${c.formula}: balanced ionic charges`,`${c.formula} 中正负电荷平衡`):L(`${c.formula}: ${c.bonds.length} connections, ${c.lone} lone pairs on the central atom`,`${c.formula}：${c.bonds.length} 个连接，中心原子 ${c.lone} 对孤电子`));
}
function renderQuiz(){const e=currentElement(),v=electronShells(e.z).at(-1),choices=[...new Set([v,v===8?6:v+1,v===1?3:v-1])].sort((a,b)=>a-b);
  $('quiz-question').textContent=L(`How many electrons occupy the outermost shell of neutral ${e.name.toLowerCase()} (${e.symbol})?`,`${e.cn}（${e.symbol}）中性原子的最外层有几个电子？`);
  $('quiz-answers').innerHTML=choices.map(n=>`<button data-answer="${n}">${n}</button>`).join('');$('quiz-feedback').textContent=L('Select an answer to check.','选择答案后显示核对结果。');
}
function quizAnswer(n){const v=electronShells(state.z).at(-1);for(const b of document.querySelectorAll('[data-answer]')){b.classList.remove('correct','incorrect');if(Number(b.dataset.answer)===n)b.classList.add(n===v?'correct':'incorrect');}$('quiz-feedback').textContent=n===v?L(`Correct. The outermost shell contains ${v} electron${v===1?"":"s"}.`,`正确。最外层含 ${v} 个电子。`):L('Try again. Count only the outermost occupied shell.','请重试，只计入最外层电子。');}
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
  ctx.fillStyle='#d4e4e6';ctx.font='13px sans-serif';ctx.fillText(`${state.orbital[0]}${shape.label} · ${L("angular shape","角向形状")}`,18,27);ctx.font='10px sans-serif';ctx.fillStyle='#acbfca';ctx.fillText(L('One orbital; dots are not electron positions','图形表示一个轨道；点不表示电子位置'),18,46);
}
function drawMolecule(){const c=currentCompound(),cc=canvasContext('molecule-canvas');if(!cc||!c)return;const {ctx,w,h}=cc,cx=w/2,cy=h/2,scale=Math.min(w/5.3,h/4.5);ctx.clearRect(0,0,w,h);
  const projected=c.atoms.map((a,i)=>{const p=project(a.p,moleculeRotation),perspective=1+p[2]*.055;return {s:a.s,i,z:p[2],x:cx+p[0]*scale*perspective,y:cy-p[1]*scale*perspective,r:(a.s==='H'?16:24)*Math.min(w/380,1.15)*perspective};});
  for(const [a,b,order=1] of c.bonds){const p=projected[a],q=projected[b];const dx=q.x-p.x,dy=q.y-p.y,length=Math.hypot(dx,dy)||1;for(let j=0;j<order;j++){const offset=(j-(order-1)/2)*7;ctx.strokeStyle='#b3bdb4';ctx.lineWidth=order===2?5:7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x-dy/length*offset,p.y+dx/length*offset);ctx.lineTo(q.x-dy/length*offset,q.y+dx/length*offset);ctx.stroke();}}
  for(const p of [...projected].sort((a,b)=>a.z-b.z)){const color=ATOM_COLORS[p.s]||'#abbeb0';ctx.shadowColor='rgba(34,55,43,.15)';ctx.shadowBlur=9;ctx.shadowOffsetY=5;const gradient=ctx.createRadialGradient(p.x-p.r*.3,p.y-p.r*.35,p.r*.07,p.x,p.y,p.r);gradient.addColorStop(0,'#fff');gradient.addColorStop(.3,color);gradient.addColorStop(1,color);ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.fillStyle=p.s==='C'?'#fff':'#263c40';ctx.font=`600 ${p.r*.65}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.s,p.x,p.y+1);
    if(c.ionic){const charge=p.s===c.metal?c.positive:-c.negative;ctx.fillStyle='#2c6455';ctx.font='13px sans-serif';ctx.fillText(fmtCharge(charge),p.x+p.r+7,p.y-p.r);}
  }
  if(c.ionic){ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#52665a';ctx.fillText(L('Ion types only; see the charge balance below','仅展示离子种类，组成比见电荷式'),cx,h-15);}
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
function updateLanguage(){applyLanguage();$('dataset-count').textContent=L('118 elements · 17 compounds','118 个元素 · 17 个化合物实例');renderTable();filterTable($('search').value);renderElement();}
document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{language=button.dataset.language;try{localStorage.setItem('element-language',language);}catch{}updateLanguage();}));
updateLanguage();
// Optional browser agent interface shares the exact same validated UI action.
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'select_element',title:'Select element',description:'Select element 1–118 and update its structure, properties, and compound examples.',inputSchema:{type:'object',properties:{atomicNumber:{type:'integer',minimum:1,maximum:118}},required:['atomicNumber'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||Object.keys(input).some(k=>k!=='atomicNumber'))throw new TypeError('Only atomicNumber is accepted');selectElement(input.atomicNumber);return {symbol:currentElement().symbol,atomicNumber:state.z,shells:electronShells(state.z),predicted:currentElement().predicted};}})).catch(()=>{});}catch{}}
