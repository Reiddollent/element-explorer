'use strict';
const MODEL_ELEMENTS=typeof module!=='undefined'?require('./elements.js'):ELEMENTS;
const ORBITALS=[];
for(let n=1;n<=7;n++)for(let l=0;l<Math.min(n,4);l++)ORBITALS.push([`${n}${'spdf'[l]}`,2*(2*l+1),n]);
function electronConfiguration(z){
 if(!Number.isInteger(z)||z<1||z>MODEL_ELEMENTS.length)throw new RangeError('元素序号应为1—118');
 const e=MODEL_ELEMENTS[z-1],result=[];
 const core=e.config.match(/^\[([A-Za-z]+)\]/);
 if(core){const base=MODEL_ELEMENTS.find(x=>x.symbol===core[1]);if(!base||base.z>=z)throw Error('Invalid noble gas core');result.push(...electronConfiguration(base.z));}
 const suffix=e.config.replace(/^\[[^\]]+\]/,'');
 for(const match of suffix.matchAll(/([1-7])([spdf])(\d*)/g)){
  const name=match[1]+match[2],count=Number(match[3]||1),capacity=2*(2*'spdf'.indexOf(match[2])+1);
  if(count>capacity||result.some(o=>o.name===name))throw Error(`Invalid occupation ${z}: ${name}`);
  if(count)result.push({name,capacity,shell:Number(match[1]),count});
 }
 if(result.reduce((sum,o)=>sum+o.count,0)!==z)throw Error(`Electron count mismatch: ${z}`);
 return result.sort((a,b)=>a.shell-b.shell||'spdf'.indexOf(a.name[1])-'spdf'.indexOf(b.name[1]));
}
function electronShells(z){const config=electronConfiguration(z),shells=Array(Math.max(...config.map(o=>o.shell))).fill(0);for(const o of config)shells[o.shell-1]+=o.count;return shells;}
function orbitalOccupancy(count,boxes){if(!Number.isInteger(count)||count<0||count>2*boxes)throw RangeError('Invalid orbital occupation');return Array.from({length:boxes},(_,i)=>(count>i?1:0)+(count>boxes+i?1:0));}
function coreSymbol(z){return MODEL_ELEMENTS[z-1].config.match(/^\[([A-Za-z]+)\]/)?.[1]||null;}
function valenceOrbitals(z){const all=electronConfiguration(z),core=coreSymbol(z);if(!core)return all;const excluded=new Set(electronConfiguration(MODEL_ELEMENTS.find(e=>e.symbol===core).z).map(o=>o.name));return all.filter(o=>!excluded.has(o.name));}
const ORBITAL_SHAPES={
 s:[{label:'s',amplitude:()=>1}],
 p:[{label:'pₓ',amplitude:([x])=>x},{label:'pᵧ',amplitude:([x,y])=>y},{label:'p_z',amplitude:([x,y,z])=>z}],
 d:[{label:'d_xy',amplitude:([x,y])=>2*x*y},{label:'d_xz',amplitude:([x,y,z])=>2*x*z},{label:'d_yz',amplitude:([x,y,z])=>2*y*z},{label:'d_x²−y²',amplitude:([x,y])=>x*x-y*y},{label:'d_z²',amplitude:([x,y,z])=>(3*z*z-1)/2}],
 f:[{label:'f_z³',amplitude:([x,y,z])=>z*(5*z*z-3)/2},{label:'f_xz²',amplitude:([x,y,z])=>x*(5*z*z-1)},{label:'f_yz²',amplitude:([x,y,z])=>y*(5*z*z-1)},{label:'f_z(x²−y²)',amplitude:([x,y,z])=>z*(x*x-y*y)},{label:'f_xyz',amplitude:([x,y,z])=>x*y*z},{label:'f_x(x²−3y²)',amplitude:([x,y])=>x*(x*x-3*y*y)},{label:'f_y(3x²−y²)',amplitude:([x,y])=>y*(3*x*x-y*y)}]
};
if(typeof module!=='undefined')module.exports={ORBITALS,electronConfiguration,electronShells,orbitalOccupancy,coreSymbol,valenceOrbitals,ORBITAL_SHAPES};
