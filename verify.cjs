const assert=require('node:assert/strict');
const fs=require('node:fs');
const {ELEMENTS,electronConfiguration,electronShells,orbitalOccupancy,valenceOrbitals,ORBITAL_SHAPES,COMPOUNDS}=require('./dist/data.js');
const expectedShells=[[1],[2],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,8],[2,8,1],[2,8,2],[2,8,3],[2,8,4],[2,8,5],[2,8,6],[2,8,7],[2,8,8],[2,8,8,1],[2,8,8,2]];
assert.equal(ELEMENTS.length,118);assert.equal(new Set(ELEMENTS.map(e=>e.symbol)).size,118);
for(const [i,e] of ELEMENTS.entries()){assert.equal(e.z,i+1);if(e.z<=20)assert.deepEqual(electronShells(e.z),expectedShells[e.z-1]);assert.equal(electronConfiguration(e.z).reduce((a,o)=>a+o.count,0),e.z);assert.ok(electronConfiguration(e.z).every(o=>o.count>0&&o.count<=o.capacity));assert.ok(electronShells(e.z).every((count,i)=>count<=2*(i+1)**2));assert.ok(valenceOrbitals(e.z).length);assert.ok(e.cn&&e.name&&e.family&&e.sourceUrl);assert.ok(e.en===null||e.en>0&&e.en<=4);assert.ok(e.oxidation.every(Number.isInteger));if(e.z>=104)assert.equal(e.predicted,true);}
for(const [z,name,count] of [[24,'3d',5],[24,'4s',1],[29,'3d',10],[29,'4s',1],[41,'4d',4],[42,'4d',5],[46,'4d',10],[46,'5s',0],[47,'5s',1],[58,'4f',1],[64,'4f',7],[78,'5d',9],[79,'6s',1],[103,'5f',14],[103,'6d',0],[103,'7p',1],[118,'7p',6]])assert.equal(electronConfiguration(z).find(o=>o.name===name)?.count||0,count,`${z}: ${name}`);
assert.deepEqual(electronShells(46),[2,8,18,18]);assert.equal(ELEMENTS[102].configSource,'NIST');
for(const z of [0,119,-1,1.5,NaN,'6',null])assert.throws(()=>electronConfiguration(z),RangeError);
assert.deepEqual(orbitalOccupancy(6,5),[2,1,1,1,1]);assert.deepEqual(orbitalOccupancy(7,7),Array(7).fill(1));assert.deepEqual(orbitalOccupancy(14,7),Array(7).fill(2));
for(const [kind,count] of [['s',1],['p',3],['d',5],['f',7]])assert.equal(ORBITAL_SHAPES[kind].length,count);
assert.equal(ORBITAL_SHAPES.d[0].amplitude([0,1,0]),0);assert.equal(ORBITAL_SHAPES.f[4].amplitude([0,1,0]),0);assert.equal(COMPOUNDS.length,17);
assert.deepEqual(orbitalOccupancy(2,3),[1,1,0]);assert.deepEqual(orbitalOccupancy(3,3),[1,1,1]);assert.deepEqual(orbitalOccupancy(4,3),[2,1,1]);assert.deepEqual(orbitalOccupancy(6,3),[2,2,2]);
for(const c of COMPOUNDS){assert.equal(c.steps.length,3);assert.ok(c.atoms.every(a=>a.p.length===3&&a.p.every(Number.isFinite)));assert.ok(c.bonds.every(([a,b])=>c.atoms[a]&&c.atoms[b]));if(!c.ionic){const total=c.atoms.reduce((sum,a)=>sum+electronShells(ELEMENTS.find(e=>e.symbol===a.s).z).at(-1),0);const drawnElectrons=c.bonds.reduce((sum,b)=>sum+2*(b[2]||1),0)+2*c.lone+2*(c.outerLone||0)*c.outer.length;assert.equal(drawnElectrons,total,`${c.formula}: electron conservation`);}}
const html=fs.readFileSync('dist/index.html','utf8');for(const file of ['styles.css','elements.js','electron-model.js','data.js','app.js']){assert.ok(html.includes(file));assert.ok(fs.statSync('dist/'+file).size>0);}const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
for(const match of fs.readFileSync('dist/app.js','utf8').matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(match[1]),`Missing DOM id: ${match[1]}`);
console.log(`PASS: 118 reference configurations, exceptions, shell conservation, s/p/d/f occupancy, ${COMPOUNDS.length} compound models, electron conservation, assets and DOM IDs.`);
