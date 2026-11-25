const KEY='privatelens.scans.v1';
const seed=[
 {id:'seed-1',name:'Expense_Request.txt',createdAt:Date.now()-120000,findings:4,route:'LOCAL → CLOUD',sanitizedContent:'[PERSON] submitted an expense reimbursement request.'},
 {id:'seed-2',name:'Meeting_Notes.txt',createdAt:Date.now()-1080000,findings:7,route:'LOCAL ONLY',sanitizedContent:'Sanitized meeting notes.'}
];
function load(){ try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return Array.isArray(x)?x:seed;}catch{return seed;} }
export const localScanRepository={
 list:()=>load().sort((a,b)=>b.createdAt-a.createdAt),
 save:(scan)=>{const items=load();const safe={...scan,id:scan.id||crypto.randomUUID(),createdAt:scan.createdAt||Date.now()};delete safe.originalContent;localStorage.setItem(KEY,JSON.stringify([safe,...items.filter(x=>x.id!==safe.id)]));return safe;},
 clear:()=>localStorage.removeItem(KEY)
};
// Firestore adapter can implement the same list/save/clear contract later.
export const scanRepository=localScanRepository;
