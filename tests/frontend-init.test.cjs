const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../wwwroot/app.js'),'utf8');
function harness(fetch,stored={}){
 const elements=new Map(),events={},storage=new Map(Object.entries(stored));
 const element=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',className:'',addEventListener(){},showModal(){this.open=true;},close(){this.open=false;}});return elements.get(s);};
 const context=vm.createContext({fetch,document:{querySelector:element,addEventListener:(n,f)=>events[n]=f,hidden:false},window:{addEventListener(){},scrollTo(){}},location:{hash:''},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setInterval(){},setTimeout(){},clearTimeout(){},Intl,URLSearchParams,console});
 vm.runInContext(source,context);return {context,elements,events,storage};
}
const tick=()=>new Promise(r=>setImmediate(r));
const data=url=>url.endsWith('/me')?null:url.endsWith('/categories')?[{id:1,name:'Món chính'}]:[{id:1,categoryId:1,name:'Cơm gà',description:'Cơm',price:79000,available:true,art:'rice',categoryName:'Món chính'}];
test('Lỗi tải ban đầu: nút Thử lại gọi API mới và hiển thị món',async()=>{
 let fail=true,calls=0;const h=harness(async url=>{calls++;if(fail)throw Error('offline');return {ok:true,json:async()=>data(url)};});
 await tick();assert.match(h.elements.get('#app').innerHTML,/Chưa tải được thực đơn/);
 assert.equal(vm.runInContext('ready',h.context),false);fail=false;
 await h.events.click({target:{closest:()=>({dataset:{action:'reload'},disabled:false})}});
 assert.equal(calls,6);assert.equal(vm.runInContext('ready',h.context),true);
 assert.match(h.elements.get('#menu-grid').innerHTML,/Cơm gà/);
});
test('Điều hướng lúc API còn chờ không vẽ thực đơn 0 món',async()=>{
 const pending=[];const h=harness(url=>new Promise(resolve=>pending.push(()=>resolve({ok:true,json:async()=>data(url)}))));
 await tick();await vm.runInContext('render()',h.context);
 assert.match(h.elements.get('#app').innerHTML,/Đang tải thực đơn/);assert.ok(!h.elements.has('#filters'));
 pending.forEach(done=>done());await tick();assert.equal(vm.runInContext('ready',h.context),true);
});
test('Phản hồi API sai định dạng được báo lỗi, không hiển thị thực đơn rỗng',async()=>{
 const h=harness(async()=>({ok:true,json:async()=>({unexpected:true})}));await tick();
 assert.match(h.elements.get('#app').innerHTML,/Dữ liệu thực đơn không hợp lệ/);assert.equal(vm.runInContext('ready',h.context),false);
});

const click=(h,action,id=1)=>h.events.click({target:{closest:()=>({dataset:{action,id:String(id)},disabled:false})}});
test('Khách chưa đăng nhập không được thêm món hoặc lưu giỏ guest',async()=>{
 const h=harness(async url=>({ok:true,json:async()=>data(url)}));await tick();await click(h,'add');
 assert.equal(vm.runInContext('state.cart.length',h.context),0);assert.equal(h.storage.size,0);assert.equal(h.elements.get('#dialog').open,true);
});
test('URL cart trực tiếp không hiển thị nội dung giỏ khi chưa đăng nhập',async()=>{
 const h=harness(async url=>({ok:true,json:async()=>data(url)}),{'bepnha-cart-guest':'[{"dishId":1,"quantity":1,"unitPrice":79000}]'});await tick();
 await vm.runInContext("location.hash='#cart';render()",h.context);
 assert.match(h.elements.get('#app').innerHTML,/Vui lòng đăng nhập/);assert.doesNotMatch(h.elements.get('#app').innerHTML,/order-form|cart-line/);assert.equal(vm.runInContext('state.cart.length',h.context),0);
});
test('Khách đăng nhập được thêm món vào giỏ riêng và không nhập giỏ guest cũ',async()=>{
 const customer={id:7,role:'customer',name:'Khách'};
 const h=harness(async url=>({ok:true,json:async()=>url.endsWith('/me')?customer:data(url)}),{'bepnha-cart-guest':'[{"dishId":1,"quantity":5,"unitPrice":79000}]'});await tick();await click(h,'add');
 assert.equal(vm.runInContext('state.cart[0].quantity',h.context),1);assert.equal(JSON.parse(h.storage.get('bepnha-cart-7'))[0].quantity,1);
});
test('Phiên hết hạn chặn thêm món và xóa giỏ khỏi màn hình',async()=>{
 let expired=false;const h=harness(async url=>({ok:true,json:async()=>url.endsWith('/me')?(expired?null:{id:7,role:'customer',name:'Khách'}):data(url)}));await tick();await click(h,'add');expired=true;await click(h,'add');
 assert.equal(vm.runInContext('state.user',h.context),null);assert.equal(vm.runInContext('state.cart.length',h.context),0);assert.equal(JSON.parse(h.storage.get('bepnha-cart-7'))[0].quantity,1);
});
test('Nhân viên không được thêm món vào giỏ khách',async()=>{
 const h=harness(async url=>({ok:true,json:async()=>url.endsWith('/me')?{id:2,role:'staff',name:'Nhân viên'}:data(url)}));await tick();await click(h,'add');
 assert.equal(vm.runInContext('state.cart.length',h.context),0);assert.equal(h.storage.size,0);
});

test('Chi tiết công thức hiển thị an toàn cho khách, không có nút CRUD',async()=>{
 const dish={...data('/menu')[0],recipe:{servings:1,prepMinutes:30,ingredients:'Gạo\n<script>alert(1)</script>',instructions:'Bước 1\nBước 2'}};
 const h=harness(async url=>({ok:true,json:async()=>url==='/api/menu/1'?dish:data(url)}));await tick();await click(h,'dish-detail');
 const html=h.elements.get('#dialog').innerHTML;assert.match(html,/Nguyên liệu/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|data-action="recipe-edit"|data-action="recipe-delete"/);
 assert.equal(vm.runInContext('state.cart.length',h.context),0);
});
test('Admin có thêm khi chưa có công thức và sửa/xóa khi đã có',async()=>{
 let recipe=null;const h=harness(async url=>({ok:true,json:async()=>url.endsWith('/me')?{id:1,role:'admin',name:'Admin'}:url==='/api/menu/1'?{...data('/menu')[0],recipe}:data(url)}));await tick();await click(h,'dish-detail');
 assert.match(h.elements.get('#dialog').innerHTML,/Thêm công thức/);
 recipe={servings:1,prepMinutes:30,ingredients:'Gạo',instructions:'Nấu cơm'};await click(h,'dish-detail');
 assert.match(h.elements.get('#dialog').innerHTML,/Sửa công thức/);assert.match(h.elements.get('#dialog').innerHTML,/Xóa công thức/);
});
