const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../wwwroot/app.js'),'utf8');
function harness(fetch,stored={}){
 const elements=new Map(),events={},storage=new Map(Object.entries(stored));
 const element=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',value:'',className:'',dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},removeAttribute(){},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;}});return elements.get(s);};
 const context=vm.createContext({fetch,document:{querySelector:element,addEventListener:(n,f)=>events[n]=f,hidden:false},window:{addEventListener(){},scrollTo(){},print(){}},location:{hash:''},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setInterval(){},setTimeout(){},clearTimeout(){},Intl,URLSearchParams,console});
 vm.runInContext(source,context);return {context,elements,events,storage};
}
const tick=()=>new Promise(r=>setImmediate(r));
test('URL ảnh admin được ưu tiên, escape thuộc tính và đồng bộ ảnh giỏ hàng',async()=>{
 const h=harness(async url=>({ok:true,json:async()=>data(url)}));await tick();
 assert.equal(vm.runInContext('dishPhoto({name:"Cơm gà lá dứa",imageUrl:"https://example.com/new.jpg?a=1&b=2"})',h.context),'https://example.com/new.jpg?a=1&amp;b=2');
 assert.match(vm.runInContext('dishPhoto({name:"Cơm gà lá dứa",imageUrl:"javascript:alert(1)"})',h.context),/^\/assets\/menu\//);
 vm.runInContext('state.menu=[{id:99,name:"Món mới",imageUrl:"https://example.com/new.jpg"}]',h.context);
 assert.equal(vm.runInContext('dishPhoto({dishId:99,name:"Tên lưu cũ"})',h.context),'https://example.com/new.jpg');
});
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

test('Admin xem được Tài khoản & Nhân sự, lọc vai trò và hiện/ẩn mật khẩu; Staff không có quyền',async()=>{
 const accounts=[
  {id:1,username:'admin',name:'Quản lý A',phone:'0901000001',role:'admin',demoPassword:'admin123',createdAt:'2026-01-01T00:00:00Z',reservationCount:0,orderCount:0},
  {id:2,username:'nv_minhan',name:'Trần Văn An',phone:'0902000002',role:'staff',demoPassword:'staff456',createdAt:'2026-01-02T00:00:00Z',reservationCount:0,orderCount:0},
  {id:3,username:'khach_lan',name:'Nguyễn Thị Lan',phone:'0903000003',role:'customer',demoPassword:'khach789',createdAt:'2026-01-03T00:00:00Z',reservationCount:2,orderCount:4}
 ];
 const h=harness(async url=>({ok:true,json:async()=>url.endsWith('/me')?{id:1,role:'admin',name:'Admin'}:url==='/api/customers'?accounts:data(url)}));
 await tick();
 await vm.runInContext("location.hash='#admin/customers';render()",h.context);
 await tick();
 const appHtml=h.elements.get('#app').innerHTML;
 assert.match(appHtml,/data-staff-tab="customers"/);
 assert.match(appHtml,/data-admin-only="true"/);
 assert.match(appHtml,/Tài khoản &amp; Nhân sự|Tài khoản & Nhân sự/);
 const adminHtml=h.elements.get('#admin-content').innerHTML;
 assert.match(adminHtml,/Tất cả/);assert.match(adminHtml,/Nhân viên/);assert.match(adminHtml,/Khách hàng/);assert.match(adminHtml,/Quản lý/);
 assert.match(adminHtml,/nv_minhan/);assert.match(adminHtml,/••••••••••/);assert.doesNotMatch(adminHtml,/staff456/);
 const toggleBtn={dataset:{action:'toggle-password',id:'2',revealed:'false'},disabled:false,setAttribute(){}};
 await h.events.click({target:{closest:()=>toggleBtn}});
 assert.equal(h.elements.get('[data-password-for="2"]').textContent,'staff456');
 assert.equal(toggleBtn.textContent,'Ẩn');
 await h.events.click({target:{closest:()=>toggleBtn}});
 assert.equal(h.elements.get('[data-password-for="2"]').textContent,'••••••••••');
 assert.equal(toggleBtn.textContent,'Hiện');
 await h.events.click({target:{closest:()=>({dataset:{action:'account-filter',role:'staff'},disabled:false})}});
 const filteredHtml=h.elements.get('#admin-content').innerHTML;
 assert.match(filteredHtml,/nv_minhan/);assert.doesNotMatch(filteredHtml,/khach_lan/);

 const hs=harness(async url=>({ok:true,json:async()=>url.endsWith('/me')?{id:2,role:'staff',name:'Nhân viên'}:data(url)}));
 await tick();
 await vm.runInContext("location.hash='#admin/customers';render()",hs.context);
 await tick();
 assert.doesNotMatch(hs.elements.get('#app').innerHTML,/data-staff-tab="customers"/);
 assert.match(hs.elements.get('#admin-content').innerHTML,/không có quyền/i);
});

test('Đặt bàn hiển thị sơ đồ 2D với View khu vực, trạng thái bàn và đồng bộ select #tableId',async()=>{
 const allTables=[
  {id:1,code:'B01',capacity:2,enabled:true,status:'free'},
  {id:2,code:'B02',capacity:2,enabled:true,status:'reserved'},
  {id:4,code:'B04',capacity:4,enabled:true,status:'free'},
  {id:9,code:'B09',capacity:6,enabled:true,status:'free'}
 ];
 const availTables=[allTables[2],allTables[3]];
 const h=harness(async url=>{
  if(url==='/api/tables')return {ok:true,json:async()=>allTables};
  if(url.startsWith('/api/availability'))return {ok:true,json:async()=>availTables};
  return {ok:true,json:async()=>data(url)};
 });
 await tick();
 await vm.runInContext("location.hash='#reserve';render()",h.context);
 await tick();
 vm.runInContext('state.booking={startAt:"2026-12-01T11:00:00.000Z",guests:4};state.allTables=' + JSON.stringify(allTables) + ';availabilityResults(' + JSON.stringify(availTables) + ')',h.context);
 const html=h.elements.get('#availability-results').innerHTML;
 assert.match(html,/View Cửa sổ phố/);assert.match(html,/View Sân vườn/);assert.match(html,/Sảnh chính trung tâm/);assert.match(html,/Phòng VIP Gia đình/);
 assert.match(html,/id="seating-map-2d"/);assert.match(html,/id="tableId"/);
 assert.match(html,/Không đủ chỗ/);assert.match(html,/Đã đặt/);
 await h.events.click({target:{closest:()=>({dataset:{action:'select-table',id:'9'},disabled:false})}});
 assert.equal(h.elements.get('#tableId').value,'9');
 assert.match(h.elements.get('#seating-map-container').innerHTML,/Đã chọn Bàn B09 – Phòng VIP Gia đình \(6 ghế\)/);
 await h.events.click({target:{closest:()=>({dataset:{action:'zone-filter',zone:'Phòng VIP Gia đình'},disabled:false})}});
 const vipHtml=h.elements.get('#seating-map-container').innerHTML;
 assert.match(vipHtml,/B09/);assert.doesNotMatch(vipHtml,/B04/);
});

test('Hóa đơn tối giản trắng đen, phân quyền chọn thanh toán QR/Tiền mặt và nút In hóa đơn khi đã thanh toán',async()=>{
 const unpaidInv={id:10,sessionId:5,tableCode:'B04',customerName:'Lan',phone:'0903000003',total:158000,status:'unpaid',method:null,createdAt:'2026-11-24T10:00:00Z',paidAt:null,items:[{dishName:'Cơm gà',quantity:2,unitPrice:79000}]};
 const paidInv={...unpaidInv,status:'paid',method:'transfer',paidAt:'2026-11-24T11:00:00Z'};
 let currentInv=unpaidInv;
 let role='customer';
 const json=d=>({ok:true,json:async()=>d});
 const h=harness(async url=>{
  if(url.endsWith('/me'))return json({id:7,role,name:role==='customer'?'Lan':'Nhân viên'});
  if(url==='/api/invoices/10')return json(currentInv);
  if(url==='/api/invoices')return json([paidInv]);
  if(url==='/api/sessions')return json([{id:5,tableCode:'B04',customerName:'Lan',status:'closed',openedAt:'2026-11-24T09:00:00Z',invoiceId:10,invoiceStatus:'paid',total:158000}]);
  if(url==='/api/reservations')return json([]);
  if(url==='/api/sessions/5/orders')return json([]);
  return json(data(url));
 });
 await tick();
 assert.equal(vm.runInContext('BANK_QR_CONFIG.bankId',h.context),'VCB');
 assert.equal(vm.runInContext('BANK_QR_CONFIG.customQrImageUrl',h.context),'/assets/payment-qr.jpg');

 // Khách mở hóa đơn chưa thanh toán: chỉ xem bill, không có nút chỉnh phương thức hay In
 await vm.runInContext('invoiceModal(10)',h.context);
 await tick();
 const custBill=h.elements.get('#dialog').innerHTML;
 assert.match(custBill,/id="invoiceBox"/);
 assert.match(custBill,/<th>Mục<\/th><th>Số lượng<\/th><th>Đơn giá<\/th><th>Thành tiền<\/th>/);
 assert.match(custBill,/Thuế \(0%\)/);assert.match(custBill,/Thông tin thanh toán/);
 assert.doesNotMatch(custBill,/id="payment-form"|select-pay-method|data-action="print"/);

 // Nhân viên mở hóa đơn chưa thanh toán: được chọn Tiền mặt / Chuyển khoản QR & thấy Thanh toán hoàn tất
 role='staff';
 vm.runInContext('state.user={id:2,role:"staff",name:"Nhân viên"}',h.context);
 await vm.runInContext('invoiceModal(10)',h.context);
 await tick();
 assert.match(h.elements.get('#dialog').innerHTML,/Thanh toán hoàn tất/);
 assert.doesNotMatch(h.elements.get('#dialog').innerHTML,/data-action="print"/);
 await h.events.click({target:{closest:()=>({dataset:{action:'select-pay-method',method:'transfer'},disabled:false})}});
 const qrHtml=h.elements.get('#dialog').innerHTML;
 assert.match(qrHtml,/Hình thức thanh toán: Chuyển khoản/);
 assert.match(qrHtml,/id="invoice-qr-box"/);
 assert.match(qrHtml,/src="\/assets\/payment-qr\.jpg"/);

 // Hóa đơn đã thanh toán: hiện nút In hóa đơn ở cả dialog, bảng nhân viên và trang Bữa ăn của tôi
 currentInv=paidInv;
 await vm.runInContext('invoiceModal(10)',h.context);
 await tick();
 assert.match(h.elements.get('#dialog').innerHTML,/Đã thanh toán/);
 assert.match(h.elements.get('#dialog').innerHTML,/data-action="print"[^>]*>.*In hóa đơn/);

 await vm.runInContext("location.hash='#admin/invoices';render()",h.context);
 await tick();
 assert.match(h.elements.get('#admin-content').innerHTML,/data-action="print-invoice" data-id="10"/);

 vm.runInContext("state.user={id:7,role:'customer',name:'Lan'};location.hash='#my';render()",h.context);
 await tick();
 assert.match(h.elements.get('#app').innerHTML,/data-action="print-invoice" data-id="10"/);
});

test('Đơn đặt bàn chỉ hiện nút Hủy đặt bàn khi pending; đã xác nhận (confirmed) ẩn nút hủy ở cả khách và nhân viên',async()=>{
 const future=new Date(Date.now()+2*3600*1000).toISOString();
 const end=new Date(Date.now()+4*3600*1000).toISOString();
 const reservations=[
  {id:10,tableCode:'B04',name:'Nguyễn Thị Lan',phone:'0903000003',guests:2,startAt:future,endAt:end,status:'confirmed',note:null,cancelReason:null},
  {id:11,tableCode:'B05',name:'Nguyễn Thị Lan',phone:'0903000003',guests:4,startAt:future,endAt:end,status:'pending',note:null,cancelReason:null},
  {id:12,tableCode:'B06',name:'Nguyễn Thị Lan',phone:'0903000003',guests:2,startAt:future,endAt:end,status:'seated',note:null,cancelReason:null},
  {id:13,tableCode:'B07',name:'Nguyễn Thị Lan',phone:'0903000003',guests:2,startAt:future,endAt:end,status:'cancelled',note:null,cancelReason:'Bận'}
 ];
 let role='customer';
 const json=d=>({ok:true,json:async()=>d});
 const h=harness(async url=>{
  if(url.endsWith('/me'))return json({id:7,role,name:role==='customer'?'Lan':'Nhân viên'});
  if(url==='/api/reservations')return json(reservations);
  if(url==='/api/sessions')return json([]);
  if(url==='/api/invoices')return json([]);
  return json(data(url));
 });
 await tick();

 vm.runInContext("location.hash='#my';render()",h.context);
 await tick();
 const custHtml=h.elements.get('#app').innerHTML;
 assert.match(custHtml,/Nhà hàng đã xác nhận đơn đặt bàn của bạn\./);
 assert.doesNotMatch(custHtml,/data-action="cancel-reservation" data-id="10"/);
 assert.match(custHtml,/data-action="cancel-reservation" data-id="11"/);
 assert.doesNotMatch(custHtml,/data-action="cancel-reservation" data-id="12"/);
 assert.doesNotMatch(custHtml,/data-action="cancel-reservation" data-id="13"/);

 role='staff';
 vm.runInContext("state.user={id:2,role:'staff',name:'Nhân viên'};location.hash='#admin/reservations';render()",h.context);
 await tick();
 const staffHtml=h.elements.get('#admin-content').innerHTML;
 assert.match(staffHtml,/data-action="seat" data-id="10"/);
 assert.doesNotMatch(staffHtml,/data-action="cancel-reservation" data-id="10"/);
 assert.match(staffHtml,/data-action="confirm-reservation" data-id="11"/);
 assert.match(staffHtml,/data-action="cancel-reservation" data-id="11"/);
 assert.doesNotMatch(staffHtml,/data-action="cancel-reservation" data-id="12"/);
 assert.doesNotMatch(staffHtml,/data-action="cancel-reservation" data-id="13"/);
});
