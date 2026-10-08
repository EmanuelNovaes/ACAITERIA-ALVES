import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import assert from 'node:assert/strict';
const load = async path => import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(readFileSync(path,'utf8'))).toString('base64'));
const { initializeCobertura:init, countSelectedOptions:count, remainingComplementSlots:slots, toggleComplementSelection:toggle, validateOptionGroups:validate } = await load('src/utilitarios/ValidacaoOpcoes.ts');
const { ENFORCE_STORE_HOURS } = await load('src/utilitarios/HorarioLoja.ts');
const options = [{id:'inactive',name:'Inativa',active:false},{id:'a',name:'Abacaxi'},{id:'b',name:'Morango'}];
let tests=0;
function test(name,fn){fn();tests++;console.log('PASS '+name);}
for(const limit of [3,4,5]) test(`Limite ${limit}: cobertura ocupa vaga e bloqueia excesso`,()=>{
 let coverage=init('',options,true), selected=[];
 assert.equal(coverage,'a'); assert.equal(count(selected,coverage),1);
 for(let n=1;n<limit;n++){selected=toggle(selected,{id:String(n)},limit,coverage);assert.equal(count(selected,coverage),n+1);}
 const full=selected; for(let n=0;n<10;n++)selected=toggle(selected,{id:'extra'},limit,coverage);
 assert.deepEqual(selected,full);coverage='b';assert.equal(count(selected,coverage),limit);
 assert.equal(validate([{name:'Total',count:count(selected,coverage),min:0,max:limit}]),undefined);
 assert.ok(validate([{name:'Total',count:limit+1,min:0,max:limit}]));
 selected=toggle(selected,selected[0],limit,coverage);assert.equal(count(selected,coverage),limit-1);
});
test('Inicialização idempotente, opções válidas e produto sem grupo',()=>{assert.equal(init('b',options,true),'b');assert.equal(init(init('',options,true),options,true),'a');assert.equal(init('inactive',options,true),'a');assert.equal(init('a',options,false),'');assert.equal(init('',[],true),'');});
test('Troca para tamanho menor reserva a cobertura',()=>{const selected=[{id:'1'},{id:'2'},{id:'3'},{id:'4'}];assert.equal(count(selected.slice(0,slots(3,'a')),'a'),3);assert.equal(slots(0,'a'),0);});
test('Cobertura obrigatória, acompanhamentos opcionais',()=>{assert.equal(validate([{name:'Total',count:1,min:0,max:3},{name:'Cobertura',count:1,min:1,max:1}]),undefined);assert.ok(validate([{name:'Cobertura',count:0,min:1,max:1}]));});
test('Somente um contador, mensagem verde e substituição sem bloqueio',()=>{const source=readFileSync('src/componentes/ModalOpcoesProduto.tsx','utf8');assert.equal((source.match(/selecionados<|selecionados\s*\n/g)||[]).length,1);assert.ok(source.includes('a cobertura também conta como acompanhamento'));const section=source.slice(source.indexOf('{/* Cobertura */}'));assert.doesNotMatch(section,/de .*selecionados|disabled=\{isDisabled\}|selectedCoberturas/);assert.ok(section.includes('setSelectedCobertura(cob.id)'));assert.ok(source.includes('cobertura: supportsCobertura ?'));assert.ok(source.includes('selectedSize?.maxComplements'));});
test('Horário permanece liberado para testes',()=>assert.equal(ENFORCE_STORE_HOURS,false));
console.log(`${tests} testes passaram.`);
