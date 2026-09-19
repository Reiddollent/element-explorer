// Regenerate the browser dataset from the checked-in PubChem response.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const table=JSON.parse(fs.readFileSync(path.join(root,'sources/pubchem-periodic-table.json'),'utf8')).Table;
// Explicit atomic-number order avoids indexing errors with supplementary Unicode characters.
const chineseNames=('氢 氦 锂 铍 硼 碳 氮 氧 氟 氖 钠 镁 铝 硅 磷 硫 氯 氩 钾 钙 钪 钛 钒 铬 锰 铁 钴 镍 铜 锌 镓 锗 砷 硒 溴 氪 铷 锶 钇 锆 铌 钼 锝 钌 铑 钯 银 镉 铟 锡 锑 碲 碘 氙 铯 钡 镧 铈 镨 钕 钷 钐 铕 钆 铽 镝 钬 铒 铥 镱 镥 铪 钽 钨 铼 锇 铱 铂 金 汞 铊 铅 铋 钋 砹 氡 钫 镭 锕 钍 镤 铀 镎 钚 镅 锔 锫 锎 锿 镄 钔 锘 铹 𬬻 𬭊 𬭳 𬭛 𬭶 鿏 𫟼 𬬭 鿔 鿭 𫓧 镆 𫟷 鿬 鿫').split(' ');
if(chineseNames.length!==118||table.Row.length!==118)throw Error('Expected 118 elements');
const groupNames={'Nonmetal':'非金属','Noble gas':'稀有气体','Alkali metal':'碱金属','Alkaline earth metal':'碱土金属','Metalloid':'类金属','Halogen':'卤素','Post-transition metal':'后过渡金属','Transition metal':'过渡金属','Lanthanide':'镧系','Actinide':'锕系'};
const simpleCategories={'Nonmetal':'nonmetal','Halogen':'nonmetal','Noble gas':'noble','Metalloid':'metalloid','Lanthanide':'lanthanide','Actinide':'actinide','Transition metal':'transition'};
const ends=[2,10,18,36,54,86,118],starts=[1,3,11,19,37,55,87];
const rows=table.Row.map(row=>Object.fromEntries(table.Columns.Column.map((key,i)=>[key,row.Cell[i]])));
const specialBehavior={6:'碳常形成共价键。成键数需要结合具体分子判断，不能直接从孤立原子的未成对电子数推定。',8:'氧在水中形成两个共价键并保留两对孤电子。原子排布与分子中的成键描述不是同一个模型。',11:'钠在氯化钠中以 Na⁺ 形式存在；离子形成后的电子排布与本页中性原子排布不同。',14:'硅与碳同族，但相同的价电子数不意味着相同的键强度或反应性。',17:'氯既可在离子化合物中形成 Cl⁻，也可形成共价键。'};
const elements=rows.map((r,i)=>{
 const z=Number(r.AtomicNumber),period=ends.findIndex(end=>z<=end)+1,start=starts[period-1];
 const series=(z>=57&&z<=71)||(z>=89&&z<=103);
 const group=series?null:period===1?(z===1?1:18):period<4?(z-start<2?z-start+1:z-start+11):period<6?z-start+1:z-start<2?z-start+1:z-start-13;
 const block=series?'f':group<=2||z===2?'s':group>=13?'p':'d';
 const category=simpleCategories[r.GroupBlock]||'metal';
 const config=z===103?'[Rn]5f14 7s2 7p1':r.ElectronConfiguration.replace(/\s*\([^)]*\)/g,'').trim();
 const predicted=z>=104,configSource=z===103?'NIST':'PubChem';
 const en=r.Electronegativity?Number(r.Electronegativity):null;
 const oxidation=r.OxidationStates.trim()?r.OxidationStates.split(',').map(x=>Number(x.trim())):[];
 const massIsotope=[43,61].includes(z)||(z>=84&&![90,91,92].includes(z));
 const behavior=predicted?'超重元素的实验信息有限。此处排布作为理论参考，氧化态可能包含预测值，不能据此确定实际反应性。':specialBehavior[z]||(block==='d'?'d 亚层电子也可能参与成键。最外层电子数不等于这类元素的全部价电子数。':block==='f'?'成键可能涉及 s、d、f 亚层。价电子的选择取决于具体元素及化学环境。':category==='noble'?'闭壳层结构通常与较低的化学活性相关，但不能据此断言该元素不存在化合物。':'主族元素的最外层电子数通常可用于入门成键分析，实际性质仍取决于具体化合物。');
 return {z,symbol:r.Symbol,cn:chineseNames[i],name:r.Name,mass:r.AtomicMass,massIsotope,period,group,block,category,family:groupNames[r.GroupBlock],en,oxidation,behavior,config,predicted,configSource,sourceUrl:`https://pubchem.ncbi.nlm.nih.gov/element/${r.Name}`,configSourceUrl:z===103?'https://physics.nist.gov/cgi-bin/Elements/elInfo.pl?element=103':`https://pubchem.ncbi.nlm.nih.gov/element/${r.Name}`,configNote:z===103?'铹的排布采用 NIST [Rn]5f¹⁴7s²7p¹，修正 PubChem 表中的旧排布。':predicted?'理论参考排布；实验信息有限。':'中性原子的参考基态排布。'};
});
fs.writeFileSync(path.join(root,'dist/elements.js'),`'use strict';\n// PubChem Periodic Table snapshot: 2026-09-19. Lr configuration: NIST override.\nconst ELEMENTS=${JSON.stringify(elements,null,2)};\nif(typeof module!=='undefined')module.exports=ELEMENTS;\n`);
console.log(`Generated ${elements.length} reference elements`);
