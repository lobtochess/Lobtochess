(() => {
const SIN={"분노":"怒","우울":"憂","나태":"怠","탐식":"食","색욕":"欲","오만":"傲","질투":"嫉"};
const ROSTER=[
{id:"yi",name:"이상",sin:"우울",role:"침착한 책략가",hp:8,atk:3,cost:5,hair:"#34353a",accent:"#536f93",desc:"균형 잡힌 능력치. 후열에서 안정적으로 피해를 누적한다."},
{id:"faust",name:"파우스트",sin:"오만",role:"전술 분석가",hp:7,atk:4,cost:5,hair:"#a8a5a0",accent:"#b9a3d8",desc:"높은 공격력과 낮은 체력. 빠르게 적을 압박한다."},
{id:"don",name:"돈키호테",sin:"색욕",role:"돌격형 전위",hp:10,atk:4,cost:2,hair:"#c3b99c",accent:"#bd3835",desc:"튼튼한 전위. 초반 보드의 중심을 맡기 좋다."},
{id:"ryoshu",name:"료슈",sin:"분노",role:"고화력 공격수",hp:6,atk:5,cost:5,hair:"#282426",accent:"#a72f2c",desc:"강한 일격을 가하지만 생존력은 낮다."},
{id:"meur",name:"뫼르소",sin:"나태",role:"방어 담당",hp:12,atk:2,cost:2,hair:"#252b30",accent:"#6b7d8d",desc:"높은 체력으로 아군이 공격할 시간을 벌어 준다."},
{id:"hong",name:"홍루",sin:"탐식",role:"유연한 지원가",hp:7,atk:3,cost:1,hair:"#704b8b",accent:"#91a96d",desc:"어느 편성에나 무난한 균형형 유닛."},
{id:"heath",name:"히스클리프",sin:"분노",role:"난폭한 타격수",hp:8,atk:4,cost:3,hair:"#5a4438",accent:"#9b4238",desc:"공격적인 전투 스타일. 분노 공명과 잘 어울린다."},
{id:"ish",name:"이스마엘",sin:"우울",role:"끈질긴 전투원",hp:9,atk:3,cost:2,hair:"#b77b48",accent:"#6e9bb7",desc:"체력과 공격력이 고르게 분배된 전투원."},
{id:"rod",name:"로쟈",sin:"탐식",role:"전선 유지",hp:10,atk:2,cost:2,hair:"#a8a4a0",accent:"#8b8c8c",desc:"전선을 지키며 적의 공격을 흡수한다."},
{id:"sinclair",name:"싱클레어",sin:"질투",role:"잠재력형 공격수",hp:7,atk:4,cost:1,hair:"#d0bca2",accent:"#8eb5a8",desc:"빠르게 적을 줄일 수 있는 공격형 유닛."},
{id:"outis",name:"오티스",sin:"오만",role:"노련한 지휘관",hp:8,atk:3,cost:1,hair:"#5c5147",accent:"#9b8c76",desc:"꾸준한 전투 능력을 가진 지휘형 유닛."},
{id:"greg",name:"그레고르",sin:"나태",role:"회복력 있는 전위",hp:10,atk:3,cost:3,hair:"#6c5745",accent:"#77966e",desc:"오래 버티며 피해를 누적하는 전위."}
];
const ENEMIES=[
{name:"하급 환상체",sin:"분노",hp:7,atk:2,hair:"#171416",accent:"#852e2a",role:"불안정한 개체"},
{name:"뒤틀린 개체",sin:"질투",hp:9,atk:3,hair:"#171416",accent:"#76504d",role:"뒤틀린 존재"},
{name:"수상한 해결사",sin:"오만",hp:8,atk:4,hair:"#292021",accent:"#8f3e39",role:"위협적 적대자"},
{name:"정체불명 개체",sin:"우울",hp:11,atk:3,hair:"#0d0e10",accent:"#526a85",role:"미확인 개체"}
];
const $=id=>document.getElementById(id); let gold=10,hp=20,round=1,chapter=1,level=1,xp=0,nextId=1,bench=[],board=Array(8).fill(null),shop=[],selected=null,busy=false,enemyState=[],ownedItems=[],shopLocked=false,plannedEnemies=[];
const maxField=()=>Math.min(8,level); const xpNeed=()=>level*4;
const TRAITS={yi:["관통","호흡"],faust:["관통","화상"],don:["관통","호흡"],ryoshu:["참격","출혈"],meur:["타격","호흡"],hong:["관통","화상"],heath:["타격","출혈"],ish:["관통","호흡"],rod:["타격","출혈"],sinclair:["참격","화상"],outis:["참격","호흡"],greg:["타격","출혈"]};
const cloneUnit=t=>({...t,damage:(TRAITS[t.id]||["참격","호흡"])[0],keyword:(TRAITS[t.id]||["참격","호흡"])[1],uid:nextId++,star:t.star||1,currentHp:t.hp,maxHp:t.hp,side:"ally"});
const choose=a=>a[Math.floor(Math.random()*a.length)]; const wait=ms=>new Promise(r=>setTimeout(r,ms));
function toast(m){let t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1900)}
// Finite shared identity pool. A 2-star consumes 3 copies; a 3-star consumes 9.
const POOL_BY_COST={1:29,2:22,3:18,5:10};
function ownedCopies(id){return bench.concat(board.filter(Boolean)).filter(u=>u.id===id).reduce((n,u)=>n+Math.pow(3,(u.star||1)-1),0)}
function poolRemaining(id){const t=ROSTER.find(x=>x.id===id);return Math.max(0,(POOL_BY_COST[t.cost]||10)-ownedCopies(id)-shop.filter(x=>x.id===id).length)}
function shopPool(){const maxCost=level===1?1:level===2?2:level===3?3:5;const weighted=[];ROSTER.filter(u=>u.cost<=maxCost).forEach(u=>{const remaining=poolRemaining(u.id);const weight=u.cost===1?8:u.cost===2?5:u.cost===3?3:1;for(let i=0;i<Math.min(remaining,weight);i++)weighted.push(u)});return weighted}
function makeShop(force=false){if(shopLocked&&!force&&shop.length){renderShop();return}shop=[];const offers=[];for(let i=0;i<4;i++){const pool=shopPool();if(!pool.length)break;offers.push(choose(pool));shop=offers.slice()}shop=offers;renderShop()}
function renderShopLock(){const b=$("shopLockBtn");if(!b)return;b.textContent=shopLocked?"🔒 고정됨":"🔓 라운드 갱신";b.classList.toggle("locked",shopLocked);b.title=shopLocked?"다음 라운드에도 현재 모집 목록 유지":"다음 라운드에 모집 목록 자동 갱신";}
function sigil(u){return SIN[u.sin]||"罪"} function sinClass(s){return "sin-"+s}
function findUnit(uid){return bench.find(u=>u.uid===uid)||board.find(u=>u?.uid===uid)||null}
function portrait(u){return `<div class="portrait" style="--hair:${u.hair||'#242020'};--accent:${u.accent||'#a63b36'}"><i class="cape"></i><i class="head"></i><i class="hair"></i><i class="scarf"></i><i class="weapon"></i></div>`}
function token(u,enemy=false){return `<div class="unit-token ${enemy?'enemy':'ally'} ${u.currentHp<=0?'dead':''} ${u.hit?'hit':''}" data-token="${u.uid}">${portrait(u)}<div class="unit-name">${u.name} ${!enemy&&u.star>1?"★".repeat(u.star):""}</div><div class="unit-role">${enemy?u.role:u.sin}</div>${enemy?`<div class="enemy-stats"><span>♥ ${Math.max(0,u.currentHp)}/${u.maxHp}</span><span>⚔ ${u.atk}</span></div>`:""}<div class="hpbar"><i style="width:${Math.max(0,u.currentHp/u.maxHp*100)}%"></i></div></div>`}
function unitCard(u){return `<div class="bench-card ${selected===u.uid?'selected':''}" data-bench="${u.uid}"><div class="card-top"><div class="mini-sigil ${sinClass(u.sin)}">${sigil(u)}</div><span class="unit-cost">◈ ${u.cost}</span></div><div class="card-name">${u.name} ${"★".repeat(u.star||1)}</div><div class="card-meta">${u.role}</div><div class="card-stats"><span>♥ ${u.hp}</span><span>⚔ ${u.atk}</span></div></div>`}
function renderBench(){$("benchCount").textContent=`${bench.length} / 8`; $("bench").innerHTML=bench.length?bench.map(unitCard).join(""):'<div class="empty-bench">대기 중인 수감자가 없습니다. 인격 모집에서 수감자를 영입하세요.</div>'; $("bench").querySelectorAll("[data-bench]").forEach(el=>el.onclick=()=>{const uid=+el.dataset.bench;if(selected===uid){selected=null;render();showInfo(null);return}if(selected!==null&&selected!==uid){const from=bench.findIndex(u=>u.uid===selected),to=bench.findIndex(u=>u.uid===uid);if(from>=0&&to>=0){[bench[from],bench[to]]=[bench[to],bench[from]];selected=uid;render();toast("대기 구역의 위치를 바꿨습니다.");return}const b=bench.find(u=>u.uid===uid),onBoard=board.findIndex(u=>u?.uid===selected);if(b&&onBoard>=0){const old=board[onBoard];board[onBoard]=b;bench=bench.filter(u=>u.uid!==uid);bench.push(old);selected=b.uid;render();return}}selected=uid;render();showInfo(findUnit(selected))})}
function renderShop(){renderShopLock();$("shop").innerHTML=shop.map((u,i)=>`<div class="shop-card ${gold<u.cost||(bench.length>=8&&!canMergeOnBuy(u.id))?'disabled':''}" data-shop="${i}"><div class="mini-sigil ${sinClass(u.sin)}">${sigil(u)}</div><div class="shop-copy"><div class="card-name">${u.name} ★</div><div class="card-meta">${u.sin} · ${u.role}</div></div><div class="buy-price">◈ ${u.cost}</div></div>`).join("");$("shop").querySelectorAll("[data-shop]").forEach(el=>el.onclick=()=>buy(+el.dataset.shop))}
function showInfo(u){if(!u){$("unitInfo").innerHTML='<div class="empty-sigil">罪</div><p>유닛을 선택하면 능력과 전투 역할이 표시됩니다.</p>';return}$("unitInfo").innerHTML=`<div class="info-title">${u.name} ${"★".repeat(u.star||1)}</div><div class="info-sin">${u.sin} · ${u.role}</div><div class="info-traits"><div class="info-trait-row"><span>피해 유형</span><b>${u.damage||"참격"}</b></div><div class="info-trait-row"><span>키워드</span><b>${u.keyword||"호흡"}</b></div></div><div class="info-grid"><div class="info-stat"><span>체력</span><b>${u.hp}</b></div><div class="info-stat"><span>공격력</span><b>${u.atk}</b></div><div class="info-stat"><span>모집 비용</span><b>◈ ${u.cost}</b></div><div class="info-stat"><span>현재 위치</span><b>${board.includes(u)?"배치 완료":"대기 중"}</b></div></div><div class="info-desc">${u.desc||"적대 개체. 아군을 공격한다."}</div><button class="button secondary sell-unit-btn" id="sellUnitBtn" ${busy?"disabled":""}>인격 판매 · +${sellValue(u)} 코인</button>`;const b=$("sellUnitBtn");if(b)b.onclick=()=>sellUnit(u.uid)}
function sellValue(u){return Math.max(1,u.cost*(u.star===3?5:u.star===2?2:1))}
function sellUnit(uid){if(busy)return toast("전투 중에는 인격을 판매할 수 없습니다.");const u=findUnit(uid);if(!u)return;bench=bench.filter(x=>x.uid!==uid);board=board.map(x=>x?.uid===uid?null:x);gold+=sellValue(u);if(selected===uid)selected=null;render();toast(`${u.name} ${"★".repeat(u.star||1)} 판매: 코인 ${sellValue(u)}개 획득`)}
function getSynergyData(){const units=board.filter(Boolean);const tier=n=>n>=6?3:n>=4?2:n>=2?1:0;const data=[];const add=(category,name,threshold,matcher,effect,tierFn=tier)=>{const members=units.filter(matcher);data.push({category,name,count:members.length,members,threshold,tier:tierFn(members.length),effect,active:members.length>=2})};["분노","우울","나태","탐식","색욕","오만","질투"].forEach(name=>add("죄악 공명",name,"2 / 4 / 6명",u=>u.sin===name,"이 죄악 속성의 배치 아군 공격력 +1"));["참격","관통","타격"].forEach(name=>add("피해 유형",name,"2 / 4 / 6명",u=>u.damage===name,"이 피해 유형의 배치 아군 공격력 +1"));["화상","호흡","출혈"].forEach(name=>add("키워드",name,"2 / 4명",u=>u.keyword===name,name==="출혈"?"출혈 키워드 아군 최대 체력 +2":"이 키워드의 배치 아군 공격력 +1",n=>n>=4?2:n>=2?1:0));return data}
function showSynergyModal(){const data=getSynergyData();const active=data.filter(x=>x.active).length;const modal=document.createElement("div");modal.className="synergy-overlay";modal.innerHTML=`<div class="synergy-dialog" role="dialog" aria-modal="true" aria-labelledby="synergyModalTitle"><div class="synergy-modal-head"><div><span class="eyebrow">FORMATION ANALYSIS</span><h2 id="synergyModalTitle">시너지 목록</h2><p>현재 배치 인격 기준 · 활성화 ${active}/${data.length}</p></div><button class="synergy-close" aria-label="닫기">×</button></div><div class="synergy-list">${data.map(x=>`<article class="synergy-entry ${x.active?"is-active":"is-inactive"}"><div class="synergy-entry-main"><span class="synergy-category">${x.category}</span><strong>${x.name}</strong><span class="synergy-count">${x.count}명 · ${x.active?(x.tier===3?"Ⅲ":x.tier===2?"Ⅱ":"Ⅰ"):"미활성"}</span></div><p>${x.effect}</p><div class="synergy-members"><span class="synergy-members-label">${x.active?"효과 적용 대상":"조건에 포함되는 인격"} · ${x.count}명</span>${x.members.length?x.members.map(u=>`<span class="synergy-member-chip">${u.name}${u.star>1?` ${"★".repeat(u.star)}`:""}</span>`).join(""):'<span class="synergy-no-members">현재 배치된 해당 인격 없음</span>'}</div><div class="synergy-entry-foot"><span>활성 조건: ${x.threshold}</span><b>${x.active?"활성화":"비활성화"}</b></div></article>`).join("")}</div><p class="synergy-note">※ 현재 프로토타입에서는 2명 이상부터 효과가 적용됩니다. Ⅲ/Ⅱ 표시는 편성 인원 단계이며, 효과 수치 자체는 아직 단계별로 증가하지 않습니다.</p></div>`;document.body.appendChild(modal);const close=()=>modal.remove();modal.querySelector(".synergy-close").onclick=close;modal.addEventListener("click",e=>{if(e.target===modal)close()});const onKey=e=>{if(e.key==="Escape"){close();document.removeEventListener("keydown",onKey)}};document.addEventListener("keydown",onKey)}
function renderBoard(){ $("board").innerHTML=board.map((u,i)=>`<div class="board-cell ${u?'occupied':''} ${selected===u?.uid?'selected':''}" data-cell="${i}"><span class="cell-index">P-${String(i+1).padStart(2,"0")}</span>${u?token(u):'<span style="color:#555;font:20px Georgia;z-index:1">＋</span>'}</div>`).join("");$("board").querySelectorAll("[data-cell]").forEach(el=>el.onclick=()=>place(+el.dataset.cell));const data=getSynergyData(),active=data.filter(x=>x.active);$("synergyText").textContent=active.length?active.filter(x=>x.category==="죄악 공명").map(x=>`${x.name} 공명 ${x.tier===3?"Ⅲ":x.tier===2?"Ⅱ":"Ⅰ"}`).concat(active.filter(x=>x.category==="피해 유형").map(x=>`${x.name} 피해 ${x.tier===3?"Ⅲ":x.tier===2?"Ⅱ":"Ⅰ"}`),active.filter(x=>x.category==="키워드").map(x=>`${x.name} ${x.tier===2?"Ⅱ":"Ⅰ"}`)).join(" / "):"아직 공명 없음";$("synergyText").title="클릭하여 전체 시너지와 효과 확인";$("synergyText").onclick=showSynergyModal;renderEnemyPreview()}
function renderEnemyPreview(){const el=$("enemyPreview");const shown=busy&&enemyState.length?enemyState:plannedEnemies;if(shown.length){el.innerHTML=shown.map(e=>`<div class="enemy-slot">${token(e,true)}</div>`).join("");}else{el.innerHTML='<div class="empty-enemy">적 배치를 준비하는 중</div>'}}
function buildEnemyLineup(){const count=round===1?1:Math.min(1+Math.floor((round-1)/3),4);return Array.from({length:count},(_,i)=>{const e=choose(ENEMIES);const boss=round===20;const baseHp=((round===1?4:e.hp+Math.floor((round-1)*1.15))+(chapter-1)*3)*(boss?2:1);const baseAtk=(round===1?1:e.atk+Math.floor((round-1)/4)+(chapter-1))+(boss?2:0);return {...e,name:boss?`제${chapter}장 최종 적대 개체`:e.name,uid:nextId++,lane:i%4,side:"enemy",maxHp:baseHp,currentHp:baseHp,atk:baseAtk}})}
function refreshEnemyPlan(){plannedEnemies=buildEnemyLineup();renderEnemyPreview()}
function syncBattleHp(allies, hitUid){allies.forEach(a=>{const original=board.find(u=>u?.uid===a.uid);if(original)original.currentHp=a.currentHp});renderBoard();if(hitUid!==undefined){const el=document.querySelector(`#board [data-token="${hitUid}"]`);if(el){el.classList.remove("hit");void el.offsetWidth;el.classList.add("hit")}}}
function renderProgress(){const need=xpNeed();$("level").textContent=level;$("xpBar").style.width=Math.min(100,xp/need*100)+"%";$("xpText").textContent=`경험치 ${xp} / ${need}`;$("fieldCount").textContent=`${board.filter(Boolean).length} / ${maxField()}`;$("fieldCountSide").textContent=`${maxField()} 명`;$("nextLevel").textContent=level>=8?"최대 레벨":`배치 한계 ${maxField()} → ${maxField()+1}`;$("levelBtn").innerHTML=`레벨업 ◈ <b>${level>=8?"MAX":4}</b>`;$("levelBtn").disabled=busy||level>=8||gold<4}
function render(){renderBoard();renderBench();renderShop();renderProgress();$("gold").textContent=gold;$("interest").textContent=`◈ +${Math.min(5,Math.floor(gold/10))} / 라운드`;$("playerHp").textContent=`♥ ${hp}`;$("roundLabel").textContent=`제${chapter}장 · ${round}/20라운드 · ${busy?'전투 진행 중':'준비 단계'}`;showInfo(findUnit(selected))}
function mergeCopies(unitId){let mergedAny=false;while(true){const copies=[];bench.forEach((u,i)=>{if(u.id===unitId)copies.push({u,where:"bench",index:i})});board.forEach((u,i)=>{if(u&&u.id===unitId)copies.push({u,where:"board",index:i})});const star=copies.length?Math.min(...copies.map(x=>x.u.star||1)):3;if(star>=3)break;const same=copies.filter(x=>(x.u.star||1)===star);if(same.length<3)break;const chosen=same.slice(0,3);const base=chosen[0].u;const upgraded={...base,uid:nextId++,star:star+1,hp:base.hp,atk:base.atk,maxHp:base.hp,currentHp:base.hp};
// remove exactly the three consumed copies, then place the upgrade where the first copy was
for(const c of chosen){if(c.where==="bench")bench=bench.filter(u=>u.uid!==c.u.uid);else board[c.index]=null}
const first=chosen[0];if(first.where==="board")board[first.index]=upgraded;else bench.push(upgraded);if(chosen.some(c=>c.u.uid===selected))selected=upgraded.uid;
// star upgrades stack by combining three units of the same star; restart to allow a second merge
mergedAny=true;toast(`${base.name} ${"★".repeat(star)} → ${"★".repeat(star+1)} 승급!`);
}
return mergedAny}
function canMergeOnBuy(id){const copies=bench.concat(board.filter(Boolean)).filter(u=>u.id===id);return [1,2].some(star=>copies.filter(u=>(u.star||1)===star).length>=2)}
function buy(i){if(busy)return toast("전투 중에는 모집할 수 없습니다.");const t=shop[i];if(!t)return;if(gold<t.cost)return toast("코인이 부족합니다.");if(bench.length>=8&&!canMergeOnBuy(t.id))return toast("대기 구역이 가득 찼습니다.");gold-=t.cost;bench.push(cloneUnit(t));shop.splice(i,1);mergeCopies(t.id);render();toast(`${t.name} 인격을 영입했습니다.`)}
function place(i){
if(busy)return;
const occupant=board[i];
if(selected!==null){
 const selectedBoard=board.findIndex(u=>u?.uid===selected);
 const selectedBench=bench.find(u=>u.uid===selected);
 if(selectedBoard>=0){
  if(selectedBoard===i){selected=null;render();return}
  // Keep a reference before clearing the origin; findUnit() would return null after removal.
  const moving=board[selectedBoard];
  board[selectedBoard]=occupant||null;
  board[i]=moving;
  selected=null;render();return;
 }
 if(selectedBench){
  if(!occupant && board.filter(Boolean).length>=maxField())return toast(`현재 레벨의 배치 한계는 ${maxField()}명입니다. 레벨업하거나 배치된 수감자를 교체하세요.`);
  bench=bench.filter(u=>u.uid!==selectedBench.uid);
  if(occupant)bench.push(occupant);
  board[i]=selectedBench;selected=null;render();return;
 }
}
if(occupant){selected=occupant.uid;render();showInfo(occupant);return;}
 toast("먼저 대기 중인 수감자를 선택하세요.");
}
function log(m,cls=""){const p=document.createElement("p");if(cls)p.className=cls;p.textContent=m;$("battleLog").appendChild(p);$("battleLog").scrollTop=$("battleLog").scrollHeight}
function addXp(n){const oldLevel=level;xp+=n;while(level<8&&xp>=xpNeed()){xp-=xpNeed();level++;toast(`관리자 레벨 ${level}! 지휘 한계가 ${maxField()}명으로 증가했습니다.`)}if(level>oldLevel)makeShop(true)}
async function battle(){if(busy)return;const originals=board.map((u,i)=>u?{...u,boardIndex:i}:null).filter(Boolean);if(!originals.length)return toast("작전에 투입할 수감자를 먼저 배치하세요.");busy=true;board.filter(Boolean).forEach(u=>{u.currentHp=u.maxHp||u.hp});render();const allies=originals.map(u=>({...u,atk:Math.round(u.atk*(u.star===3?2.25:u.star===2?1.5:1)),hp:Math.round(u.hp*(u.star===3?2.25:u.star===2?1.5:1)),currentHp:Math.round(u.hp*(u.star===3?2.25:u.star===2?1.5:1)),maxHp:Math.round(u.hp*(u.star===3?2.25:u.star===2?1.5:1)),side:"ally",boardIndex:u.boardIndex}));
enemyState=plannedEnemies.length?plannedEnemies.map(e=>({...e,currentHp:e.maxHp,hit:false})):buildEnemyLineup();plannedEnemies=[];const sinCounts={};allies.forEach(u=>sinCounts[u.sin]=(sinCounts[u.sin]||0)+1);allies.forEach(u=>{if(sinCounts[u.sin]>=2)u.atk++});
const dc={},kc={};allies.forEach(u=>{dc[u.damage]=(dc[u.damage]||0)+1;kc[u.keyword]=(kc[u.keyword]||0)+1});
allies.forEach(u=>{if(dc[u.damage]>=2)u.atk++;if(kc[u.keyword]>=2){if(u.keyword==="출혈"){u.maxHp+=2;u.currentHp+=2;u.hp+=2}else u.atk++;}});
allies.forEach(a=>{const original=board.find(u=>u?.uid===a.uid);if(original){original.maxHp=a.maxHp;original.currentHp=a.currentHp}});
$("battleLog").innerHTML="";render();log(`── 작전 ${round} 개시 / 아군 ${allies.length}명, 적대 개체 ${enemyState.length}기 ──`,"log-gold");if(Object.values(sinCounts).some(n=>n>=2))log("죄악 공명 발동: 해당 속성 아군의 공격력 +1","log-gold");await wait(500);let turn=0;
while(allies.some(u=>u.currentHp>0)&&enemyState.some(e=>e.currentHp>0)&&turn<24){turn++;
for(const a of allies.filter(u=>u.currentHp>0)){const target=enemyState.find(e=>e.currentHp>0);if(!target)break;target.currentHp=Math.max(0,target.currentHp-a.atk);log(`${a.name} 공격! ${target.name}에게 ${a.atk} 피해${target.currentHp===0?" — 제압!":""}`,target.currentHp===0?"log-gold":"");target.hit=true;renderEnemyPreview();await wait(450);target.hit=false;renderEnemyPreview()}
for(const e of enemyState.filter(u=>u.currentHp>0)){const alive=allies.filter(a=>a.currentHp>0);const target=alive.sort((a,b)=>{const tier=u=>{const front=u.boardIndex<4;const same=(u.boardIndex%4)===e.lane;if(front&&same)return 0;if(front&&!same)return 1;if(!front&&same)return 2;return 3};return tier(a)-tier(b)||Math.abs((a.boardIndex%4)-e.lane)-Math.abs((b.boardIndex%4)-e.lane)||a.boardIndex-b.boardIndex})[0];if(!target)break;target.currentHp=Math.max(0,target.currentHp-e.atk);target.hit=true;log(`${e.name} 반격! ${target.name}에게 ${e.atk} 피해${target.currentHp===0?" — 전투 불능":""}`,"log-red");syncBattleHp(allies,target.uid);renderEnemyPreview();await wait(400);target.hit=false}
}
const win=enemyState.every(e=>e.currentHp<=0);log(win?"── 작전 성공. 적대 개체가 모두 제압되었습니다. ──":"── 작전 실패. 생존한 적대 개체가 남아 있습니다. ──",win?"log-gold":"log-red");if(win){const reward=3+Math.floor(round/3)+(round===20?10:0);gold+=reward;addXp(2);$("reward").textContent=`승리 시 +${3+Math.floor((round+1)/3)}`;toast(`작전 성공! 코인 ${reward}개와 경험치 2 획득.`)}else{hp=Math.max(0,hp-2);toast("작전 실패. 관리자 체력이 2 감소했습니다.");addXp(1)}
const interest=Math.min(5,Math.floor(gold/10));if(interest>0){gold+=interest;log(`이자 수령: 보유 코인 기준 +${interest} (최대 +5)`,"log-gold")}
// Combat damage is temporary: restore every deployed unit on the live board, not the snapshots in `originals`.
board.filter(Boolean).forEach(u=>{u.maxHp=u.hp;u.currentHp=u.hp});
enemyState.forEach(e=>{if(e.currentHp<=0)e.dead=true});if(!win)plannedEnemies=enemyState.map(e=>({...e,currentHp:e.maxHp,hit:false}));busy=false;
if(hp<=0){log("관리자 체력이 0입니다. 새로고침하여 다시 시작하세요.","log-red");$("battleBtn").disabled=true;$("battleBtn").textContent="작전 종료"}
else if(win&&round===20){chapterClear()}
else if(win&&[3,6,9,12,15,18].includes(round)){showItemReward()}
else if(win){round++;makeShop();refreshEnemyPlan();$("battleBtn").innerHTML='작전 개시 <span>→</span>'}
render()}

const ITEMS=[
{name:"낡은 전투 교본",desc:"모든 아군 공격력 +1",apply(){bench.concat(board.filter(Boolean)).forEach(u=>u.atk++)}},
{name:"보강된 방호복",desc:"모든 아군 체력 +3",apply(){bench.concat(board.filter(Boolean)).forEach(u=>{u.hp+=3;u.maxHp=u.hp;u.currentHp+=3})}},
{name:"금빛 회중시계",desc:"코인 +5",apply(){gold+=5}},
{name:"죄악 공명 장치",desc:"현재 배치 인격 공격력 +2",apply(){board.filter(Boolean).forEach(u=>u.atk+=2)}},
{name:"응급 처치 키트",desc:"관리자 체력 +5",apply(){hp=Math.min(20,hp+5)}},
{name:"전술 지휘 문서",desc:"경험치 +4",apply(){addXp(4)}}
];
function showItemReward(){const modal=document.createElement("div");modal.className="reward-overlay";modal.id="itemReward";const picks=[];while(picks.length<3){const it=choose(ITEMS);if(!picks.includes(it))picks.push(it)}const rerolled=[false,false,false];function draw(){modal.innerHTML=`<div class="reward-dialog"><span class="eyebrow">SUPPLY DROP / ROUND ${round}</span><h2>전투 보상 선택</h2><p>아이템 하나를 선택하세요. 각 카드의 갱신은 한 번만 가능합니다.</p><div class="reward-cards">${picks.map((it,i)=>`<div class="reward-card"><strong>${it.name}</strong><p>${it.desc}</p><button class="button secondary" data-r="${i}" ${rerolled[i]?"disabled":""}>카드 갱신 ${rerolled[i]?"완료":"1회"}</button><button class="button primary" data-p="${i}">선택</button></div>`).join("")}</div></div>`;modal.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{let i=+b.dataset.r;if(rerolled[i])return;let it;do{it=choose(ITEMS)}while(it===picks[i]);picks[i]=it;rerolled[i]=true;draw()});modal.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{let it=picks[+b.dataset.p];it.apply();ownedItems.push(it.name);modal.remove();round++;makeShop();refreshEnemyPlan();$("battleBtn").disabled=false;$("battleBtn").innerHTML='작전 개시 <span>→</span>';log(`보상 획득: ${it.name} — ${it.desc}`,"log-gold");render();toast(`${it.name} 획득`)})}document.body.appendChild(modal);draw()}
function chapterClear(){const modal=document.createElement("div");modal.className="reward-overlay";modal.innerHTML=`<div class="reward-dialog"><span class="eyebrow">CHAPTER COMPLETE</span><h2>제${chapter}장 클리어</h2><p>최종 라운드를 돌파했습니다. 다음 장에서는 난이도가 상승하며 현재 장의 인격·아이템·자원이 초기화됩니다.</p><button class="button primary" id="nextChapterBtn">다음 장으로 →</button></div>`;document.body.appendChild(modal);$("nextChapterBtn").onclick=()=>{modal.remove();chapter++;round=1;gold=10;hp=20;level=1;xp=0;ownedItems=[];shopLocked=false;plannedEnemies=[];bench=[];board=Array(8).fill(null);bench.push(cloneUnit(ROSTER.find(u=>u.id==="don")),cloneUnit(ROSTER.find(u=>u.id==="meur")),cloneUnit(ROSTER.find(u=>u.id==="hong")));selected=null;makeShop();refreshEnemyPlan();$("battleLog").innerHTML='<p class="muted-log">새 장이 시작되었습니다. 편성을 준비하세요.</p>';$("battleBtn").disabled=false;$("battleBtn").innerHTML='작전 개시 <span>→</span>';$("reward").textContent="승리 시 +3";render();toast(`제${chapter}장 시작`)}}

$("battleBtn").onclick=battle;$("synergyAllBtn").onclick=showSynergyModal;$("shopLockBtn").onclick=()=>{shopLocked=!shopLocked;renderShopLock();toast(shopLocked?"모집 목록을 고정했습니다.":"다음 라운드부터 모집 목록이 자동 갱신됩니다.")};$("rerollBtn").onclick=()=>{if(busy)return toast("전투 중에는 갱신할 수 없습니다.");if(gold<2)return toast("갱신에는 코인 2개가 필요합니다.");gold-=2;makeShop(true);render();toast("모집 목록을 갱신했습니다.")};$("clearBtn").onclick=()=>{if(busy)return;board.filter(Boolean).forEach(u=>bench.push(u));board=Array(8).fill(null);selected=null;render();toast("배치를 초기화했습니다.")};$("levelBtn").onclick=()=>{if(busy)return;if(level>=8)return toast("최대 레벨입니다.");if(gold<4)return toast("레벨업에는 코인 4개가 필요합니다.");gold-=4;addXp(4);render();toast(`레벨업 완료! 현재 레벨 ${level}, 지휘 한계 ${maxField()}명.`)};
bench.push(cloneUnit(ROSTER.find(u=>u.id==="don")),cloneUnit(ROSTER.find(u=>u.id==="meur")),cloneUnit(ROSTER.find(u=>u.id==="hong")));makeShop();refreshEnemyPlan();render();
})();