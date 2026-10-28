const $=(s,root=document)=>root.querySelector(s);
const app=$('#app'),dialog=$('#dialog');
const state={user:null,menu:[],categories:[],cart:[],category:0,search:'',booking:null,view:'menu',selectedSession:null,orderFilter:'active',requestKey:null};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('vi-VN').format(Number(n))+' ₫';
const date=value=>new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'});
const labels={pending:'Chờ xác nhận',confirmed:'Đã xác nhận',seated:'Đã nhận bàn',cancelled:'Đã hủy',preparing:'Đang chế biến',served:'Đã phục vụ',open:'Đang phục vụ',billing:'Đã chốt hóa đơn',closed:'Đã kết thúc',unpaid:'Chưa thanh toán',paid:'Đã thanh toán',free:'Trống',occupied:'Đang sử dụng',reserved:'Sắp đón khách',disabled:'Ngừng phục vụ'};
const pill=s=>`<span class="pill ${esc(s)}">${labels[s]||esc(s)}</span>`;
const iconPaths={cart:'M3 3h2l2 12h11l3-9H6M9 21h.01M18 21h.01',clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',leaf:'M20 3c-9-1-17 3-15 11s14 9 15-11ZM4 20l11-11',check:'m5 12 4 4L19 6',search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',arrow:'M4 12h16m-6-6 6 6-6 6',calendar:'M7 2v4m10-4v4M3 10h18M4 4h16v17H4Z',table:'M6 8h12v9H6ZM2 10v5m20-5v5M8 3h3m2 0h3M8 22h3m2 0h3',menu:'M4 5h16M4 12h16M4 19h16',orders:'M7 2h10v3h4v17H3V5h4Zm0 0v6h10V2M7 12h10m-10 5h7',invoice:'M6 2h12v20l-3-2-3 2-3-2-3 2ZM9 7h6m-6 5h6m-6 5h4',dashboard:'M3 3h7v7H3Zm11 0h7v10h-7ZM3 14h7v7H3Zm11 3h7v4h-7Z',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2',plus:'M12 5v14M5 12h14',chat:'M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-4-.9L4 20l1.8-3.2A7.4 7.4 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7Z'};
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPaths[name]||iconPaths.menu}"/></svg>`;
let toastTimer,renderVersion=0;
let ready=false,initializing=false,initializationError=null;

function toast(message,error=false){const t=$('#toast');t.textContent=message;t.className='show'+(error?' error':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.className='',5000);}
function enhanceView(){
  if(typeof document.querySelectorAll!=='function')return;
  window.dispatchEvent(new Event('bepnha:render'));
}
function updateChrome(){document.querySelector('.header')?.classList?.toggle('scrolled',window.scrollY>8);$('#back-to-top')?.classList?.toggle('visible',window.scrollY>520);}
async function api(path,method='GET',data){
  let response;
  try{response=await fetch('/api'+path,{method,headers:method==='GET'?{}:{'Content-Type':'application/json'},body:method==='GET'?undefined:JSON.stringify(data??{})});}
  catch{throw new Error('Không kết nối được máy chủ. Kiểm tra ứng dụng đang chạy rồi thử lại.');}
  const result=await response.json();
  if(!response.ok){const e=new Error(result.error||'Có lỗi xảy ra.');e.details=result.details;e.status=response.status;throw e;}
  return result;
}
function cartKey(){return state.user?.role==='customer'?'bepnha-cart-'+state.user.id:null;}
function loadCart(){state.cart=[];state.requestKey=null;if(!cartKey())return;try{const data=JSON.parse(localStorage.getItem(cartKey())||'[]');state.cart=Array.isArray(data)?data.filter(i=>Number.isInteger(i.dishId)&&Number.isInteger(i.quantity)&&i.quantity>0&&i.quantity<=99&&Number.isInteger(i.unitPrice)&&i.unitPrice>0):[];}catch{state.cart=[];}state.requestKey=localStorage.getItem(cartKey()+'-key')||null;}
function saveCart(changed=true){if(!cartKey()){state.cart=[];state.requestKey=null;header();return;}localStorage.setItem(cartKey(),JSON.stringify(state.cart));if(changed)state.requestKey=null;if(state.requestKey)localStorage.setItem(cartKey()+'-key',state.requestKey);else localStorage.removeItem(cartKey()+'-key');header();}
const cartCount=()=>state.cart.reduce((n,i)=>n+i.quantity,0),cartTotal=()=>state.cart.reduce((n,i)=>n+i.quantity*i.unitPrice,0);
const staff=()=>state.user&&state.user.role!=='customer';
function header(){
  const nav=[['menu','Thực đơn'],['reserve','Đặt bàn'],['my','Bữa ăn của tôi']];
  $('#navigation').innerHTML=nav.map(([view,label])=>`<a class="nav-link ${state.view===view?'active':''}" href="#${view}">${label}</a>`).join('');
  const managementView=state.user?.role==='admin'?'dashboard':'orders';
  $('#account').innerHTML=`${!staff()?`<a href="#cart" class="btn cart-btn" aria-label="Giỏ hàng${cartCount()?', '+cartCount()+' phần':''}">${icon('cart')}<span class="cart-text">Giỏ hàng</span>${cartCount()?`<span class="cart-count">${cartCount()}</span>`:''}</a>`:''}${state.user?`<span class="account-name">${esc(state.user.name)}</span>${staff()?`<a class="btn secondary" href="#admin/${managementView}">Quản lý</a>`:''}<button class="text-btn logout" data-action="logout">Đăng xuất</button>`:'<button class="text-btn" data-action="auth">Đăng nhập</button>'}`;
}
function navigate(view){if(location.hash==='#'+view)render();else location.hash=view;}
function empty(title,description,action=''){return `<div class="empty">${icon('leaf')}<h3>${title}</h3><p>${description}</p>${action}</div>`;}
const head=(title,sub,action='')=>`<div class="page-head"><div><div class="eyebrow"><span class="dot"></span> Bếp Nhà · ${staff()?'Quản lý nhà hàng':'Một bữa ngon đang chờ'}</div><h1>${title}</h1><p>${sub}</p></div>${action}</div>`;
function menuPage(){
  const featured=state.menu.filter(d=>d.available).filter(d=>['Cá hồi áp chảo','Sườn nướng mật ong','Gỏi cuốn tôm thịt'].includes(d.name));
  const hero=state.menu.find(d=>d.name==='Cá hồi áp chảo');
  app.innerHTML=`<section class="hero feast-hero"><div class="hero-copy"><div class="eyebrow"><span class="dot"></span> Bếp ấm · Món ngon · Chuyện trò</div><h1>Một chút đậm đà.<br><em>Một bữa đáng nhớ.</em></h1><p>Từ món Việt thân quen đến những hương vị mới. Ghé Bếp Nhà, chọn món bạn thích và dành thời gian cho những người thương.</p><div class="hero-actions"><a href="#reserve" class="btn">Đặt bàn hôm nay ${icon('arrow')}</a><button class="hero-menu-link" data-action="scroll-menu">Khám phá thực đơn ↓</button></div><button class="motion-choice" type="button" data-banner-motion aria-pressed="false">Bật hiệu ứng chuyển động</button><div class="hero-signature">Nấu bằng sự tận tâm<span>Phục vụ 10:00 – 22:00 mỗi ngày</span></div></div><div class="hero-art"><img src="${hero?dishPhoto(hero):'/assets/hero-food.jpg'}" alt="Cá hồi áp chảo tại Bếp Nhà" fetchpriority="high"><div class="hero-badge"><span>MÓN NGON ĐÁNG THỬ</span><strong>Cá hồi áp chảo</strong><small>Vàng giòn bên ngoài · Mềm mọng bên trong</small>${hero?`<button class="text-btn" data-action="dish-detail" data-id="${hero.id}">Khám phá món ${icon('arrow')}</button>`:''}</div></div></section><div class="flavor-ribbon" aria-hidden="true">BẾP ẤM <span>✦</span> MÓN NGON <span>✦</span> CHUYỆN TRÒ <span>✦</span> HƯƠNG VỊ THÂN QUEN</div><section class="signature-section"><div class="section-top"><div><div class="eyebrow">Một lời mời từ bếp</div><h2>Để vị ngon <em>dẫn lối.</em></h2></div><p>Chưa biết ăn gì? Bắt đầu với những món này nhé.</p></div><div class="signature-grid">${featured.map((d,i)=>`<button class="signature-card" data-action="dish-detail" data-id="${d.id}"><img src="${dishPhoto(d)}" alt="${esc(d.name)}" loading="lazy"><span class="signature-index">0${i+1}</span><span class="signature-info"><small>${esc(d.categoryName)}</small><strong>${esc(d.name)}</strong><span>${money(d.price)} ${icon('arrow')}</span></span></button>`).join('')}</div></section><div class="benefits"><span>${icon('leaf')} Nguyên liệu tươi ngon</span><span>${icon('clock')} Bếp mở 10:00 – 22:00</span><span>${icon('check')} Đặt bàn ngay trên web</span></div><section id="our-menu" class="menu-section"><div class="section-top"><div><div class="eyebrow">Hôm nay bạn muốn ăn gì?</div><h2>Mỗi món, <em>một niềm vui.</em></h2><p>Chọn một món quen, thử một hương vị mới.</p></div><div class="search">${icon('search')}<input id="menu-search" type="search" placeholder="Tìm hương vị bạn thích…" value="${esc(state.search)}" aria-label="Tìm món"></div></div><div class="menu-toolbar"><div id="filters" class="filters"></div><span id="menu-count" class="menu-count"></span></div><div id="menu-grid" class="menu-grid"></div></section><section class="table-invitation"><div><div class="eyebrow">Hẹn nhau ở Bếp Nhà</div><h2>Bàn đã sẵn.<br><em>Chỉ còn thiếu bạn.</em></h2><p>Một bữa trưa nhẹ nhàng, buổi tối cùng gia đình hay cuộc hẹn với bạn bè. Chọn giờ, chọn bàn, để Bếp Nhà lo phần còn lại.</p><a href="#reserve" class="btn">Chọn bàn của bạn ${icon('arrow')}</a></div><img src="/assets/menu/suon-nuong-mat-ong.jpg?v=20261022" alt="Sườn nướng mật ong cho bữa ăn sum họp" loading="lazy"></section>`;
  menuGrid();
}
function dishPhoto(d){
  const photos = {
  "Cơm gà lá dứa": "/assets/menu/com-ga-la-dua.jpg",
  "Bún bò Huế": "/assets/menu/bun-bo-hue.jpg",
  "Cá hồi áp chảo": "/assets/menu/ca-hoi-ap-chao.jpg",
  "Sườn nướng mật ong": "/assets/menu/suon-nuong-mat-ong.jpg",
  "Cơm nấm rau củ": "/assets/menu/com-nam-rau-cu.jpg",
  "Gỏi cuốn tôm thịt": "/assets/menu/goi-cuon-tom-thit.jpg",
  "Salad vườn nhà": "/assets/menu/salad-vuon-nha.jpg",
  "Khoai tây chiên": "/assets/menu/khoai-tay-chien.jpg",
  "Trà đào cam sả": "/assets/menu/tra-dao-cam-sa.jpg",
  "Nước chanh tươi": "/assets/menu/nuoc-chanh-tuoi.jpg",
  "Cà phê sữa đá": "/assets/menu/ca-phe-sua-da.jpg",
  "Panna cotta xoài": "/assets/menu/panna-cotta-xoai.jpg",
  "Phở bò tái": "/assets/menu/pho-bo-tai.jpg",
  "Mì Quảng tôm thịt": "/assets/menu/mi-quang-tom-thit.jpg",
  "Bún thịt nướng": "/assets/menu/bun-thit-nuong.jpg",
  "Gà nướng lá chanh": "/assets/menu/ga-nuong-la-chanh.jpg",
  "Cá basa kho tộ": "/assets/menu/ca-basa-kho-to.jpg",
  "Mì xào bò rau củ": "/assets/menu/mi-xao-bo-rau-cu.jpg",
  "Cơm sườn bì chả": "/assets/menu/com-suon-bi-cha.jpg",
  "Đậu hũ sốt nấm": "/assets/menu/dau-hu-sot-nam.jpg",
  "Chả giò tôm thịt": "/assets/menu/cha-gio-tom-thit.jpg",
  "Há cảo hấp": "/assets/menu/ha-cao-hap.jpg",
  "Bánh xếp chiên": "/assets/menu/banh-xep-chien.jpg",
  "Đậu hũ chiên sả": "/assets/menu/dau-hu-chien-sa.jpg",
  "Bắp xào tôm khô": "/assets/menu/bap-xao-tom-kho.jpg",
  "Gà popcorn": "/assets/menu/ga-popcorn.jpg",
  "Nấm chiên giòn": "/assets/menu/nam-chien-gion.jpg",
  "Súp bí đỏ kem tươi": "/assets/menu/sup-bi-do-kem-tuoi.jpg",
  "Trà tắc mật ong": "/assets/menu/tra-tac-mat-ong.jpg",
  "Trà vải hoa hồng": "/assets/menu/tra-vai-hoa-hong.jpg",
  "Soda chanh dây": "/assets/menu/soda-chanh-day.jpg",
  "Nước ép cam tươi": "/assets/menu/nuoc-ep-cam-tuoi.jpg",
  "Nước ép dứa bạc hà": "/assets/menu/nuoc-ep-dua-bac-ha.jpg",
  "Cacao nóng": "/assets/menu/cacao-nong.jpg",
  "Bạc xỉu": "/assets/menu/bac-xiu.jpg",
  "Chè khúc bạch": "/assets/menu/che-khuc-bach.jpg",
  "Tàu hũ trân châu đường đen": "/assets/menu/tau-hu-tran-chau-duong-den.jpg",
  "Kem dừa nướng": "/assets/menu/kem-dua-nuong.jpg",
  "Bánh flan cà phê": "/assets/menu/banh-flan-ca-phe.jpg",
  "Mochi kem trà xanh": "/assets/menu/mochi-kem-tra-xanh.jpg",
  "Bánh chuối nướng": "/assets/menu/banh-chuoi-nuong.jpg",
  "Trái cây theo mùa": "/assets/menu/trai-cay-theo-mua.jpg"
};
  return (photos[d.name] || "/assets/menu/placeholder.svg") + "?v=20261022";
}
function menuGrid(){
  $('#filters').innerHTML=[[0,'Tất cả'],...state.categories.map(c=>[c.id,c.name])].map(([id,name])=>`<button class="filter ${state.category===id?'active':''}" data-action="category" data-id="${id}">${esc(name)}<span class="filter-count">${state.menu.filter(d=>!id||d.categoryId===id).length}</span></button>`).join('');
  const dishes=state.menu.filter(d=>(!state.category||d.categoryId===state.category)&&d.name.toLocaleLowerCase('vi').includes(state.search.toLocaleLowerCase('vi')));
  const count=$('#menu-count');if(count)count.textContent=`${dishes.length} món đang phục vụ`;
  $('#menu-grid').innerHTML=dishes.length?dishes.map(d=>`<article class="dish"><button class="dish-art dish-detail-trigger" data-action="dish-detail" data-id="${d.id}" aria-label="Xem chi tiết ${esc(d.name)}">${!d.available?'<span class="dish-label pill cancelled">Tạm hết món</span>':d.id<=2?'<span class="dish-label pill">Bếp gợi ý</span>':''}<img src="${dishPhoto(d)}" alt="Ảnh món ${esc(d.name)}" loading="lazy"></button><div class="dish-body"><div class="dish-category">${esc(d.categoryName)}</div><h3><button class="dish-title" data-action="dish-detail" data-id="${d.id}">${esc(d.name)}</button></h3><p>${esc(d.description)}</p><div class="dish-bottom"><span class="price">${money(d.price)}</span><button class="add-btn" data-action="add" data-id="${d.id}" aria-label="Thêm ${esc(d.name)} vào giỏ" ${!d.available?'disabled':''}>+</button></div></div></article>`).join(''):empty('Chưa tìm thấy món','Thử tên món khác hoặc chọn danh mục khác.');
}
function reservePage(){
  const tomorrow=new Date(Date.now()+86400000),day=tomorrow.toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});
  app.innerHTML=head('Đặt một chiếc bàn','Chọn giờ đến và số khách. Bếp Nhà sẽ xác nhận lịch đặt của bạn.')+`<div class="two-col"><section class="panel"><div class="step-label">01 · CHỌN THỜI GIAN</div><h2>Bạn muốn ghé lúc nào?</h2><form id="availability-form"><div class="form-grid"><label>Ngày đến<input name="day" type="date" value="${day}" required></label><label>Giờ đến<input name="time" type="time" min="10:00" max="20:00" value="18:00" required></label><label class="wide">Số khách<select name="guests">${Array.from({length:10},(_,i)=>`<option value="${i+1}" ${i===1?'selected':''}>${i+1} người</option>`).join('')}</select></label></div><p class="hint">Mỗi lượt giữ bàn 2 giờ. Nhận đặt bàn tối đa 30 ngày trước ngày đến.</p><div class="actions"><button class="btn" type="submit">Tìm bàn phù hợp ${icon('arrow')}</button></div></form><div id="availability-results"></div></section><aside class="panel reserve-info"><div class="eyebrow">Một bữa ăn cùng nhau</div><h2>Chỗ ngồi ấm cúng.<br>Câu chuyện thật vui.</h2><img src="/assets/roll.svg" alt="Minh họa gỏi cuốn"><p>Dành thời gian cho những người bạn thương. Để phần chuẩn bị bữa ăn cho Bếp Nhà.</p><div class="info-line">${icon('clock')} 10:00 – 22:00, mỗi ngày</div><div class="info-line">${icon('table')} Bàn 2, 4 hoặc 6 người</div><div class="info-line">${icon('check')} Xác nhận đặt bàn bởi nhân viên</div></aside></div>`;
}
function availabilityResults(tables){
  const el=$('#availability-results');if(!tables.length){el.innerHTML='<div class="notice warn">Không còn bàn phù hợp tại thời điểm này. Thử giờ khác hoặc giảm số khách.</div>';return;}
  el.innerHTML=`<div class="section-label">02 · Chọn bàn & thông tin liên hệ</div><form id="reservation-form"><div class="table-options">${tables.map((t,i)=>`<label class="table-option"><input type="radio" name="tableId" value="${t.id}" ${i===0?'checked':''}><span><strong>${esc(t.code)}</strong><small>${t.capacity} chỗ ngồi</small></span></label>`).join('')}</div><div class="form-grid"><label>Họ tên<input name="name" maxlength="100" value="${esc(state.user?.name||'')}" required autocomplete="name"></label><label>Số điện thoại<input name="phone" type="tel" pattern="0[0-9]{9,10}" maxlength="11" value="${esc(state.user?.phone||'')}" placeholder="0901234567" required autocomplete="tel"></label><label class="wide">Ghi chú <small>(tùy chọn)</small><textarea name="note" maxlength="500" placeholder="Ví dụ: có trẻ nhỏ, cần ghế em bé…"></textarea></label></div><div class="notice">${icon('calendar')} ${date(state.booking.startAt)} · ${state.booking.guests} người · 2 giờ</div><div class="form-error"></div><button class="btn full" type="submit">${state.user?'Gửi yêu cầu đặt bàn':'Đăng nhập để đặt bàn'} ${icon('arrow')}</button></form>`;
}
function authRequired(){app.innerHTML=head('Chào bạn,','Đăng nhập để xem lịch đặt bàn, gọi món và theo dõi bữa ăn.')+empty('Bữa ăn của bạn ở đây','Mỗi tài khoản chỉ xem được đặt bàn, đơn món và hóa đơn của mình.','<button class="btn" data-action="auth">Đăng nhập / Đăng ký</button>');}
async function myPage(version){
  if(!state.user)return authRequired();
  const [reservations,sessions]=await Promise.all([api('/reservations'),api('/sessions')]);if(version!==renderVersion)return;
  if(staff()){app.innerHTML=head('Bạn đang dùng tài khoản nhân viên','Vào khu vực vận hành để xử lý đặt bàn, đơn món, bàn và hóa đơn.')+empty('Trang dành cho khách hàng','Đăng nhập tài khoản khách để đặt bàn và gọi món.','<a class="btn" href="#admin/orders">Mở khu vực nhân viên</a>');return;}
  const active=sessions.filter(s=>s.status!=='closed');
  let chosen=sessions.find(s=>s.id===state.selectedSession)||active[0]||sessions[0];state.selectedSession=chosen?.id||null;
  let orders=[];if(chosen)orders=await api(`/sessions/${chosen.id}/orders`);if(version!==renderVersion)return;
  app.innerHTML=head('Bữa ăn của tôi','Lịch đặt bàn, tiến độ món ăn và hóa đơn trong cùng một nơi.','<a class="btn secondary" href="#reserve">'+icon('plus')+' Đặt bàn mới</a>')+`<div class="two-col"><section><div class="section-label">Đặt bàn của bạn</div><div class="stack">${reservations.length?reservations.map(r=>bookingCard(r)).join(''):empty('Chưa có lịch đặt bàn','Chọn một chiếc bàn cho buổi ăn sắp tới.','<a href="#reserve" class="btn">Đặt bàn ngay</a>')}</div></section><section><div class="section-label">Đơn món & hóa đơn</div>${sessions.length?`<label>Chọn lượt phục vụ<select id="customer-session">${sessions.map(s=>`<option value="${s.id}" ${chosen.id===s.id?'selected':''}>${esc(s.tableCode)} · Lượt #${s.id} · ${labels[s.status]}</option>`).join('')}</select></label><div class="session-banner"><div><h3>Bàn ${esc(chosen.tableCode)} · Lượt #${chosen.id}</h3><p>${labels[chosen.status]} · ${date(chosen.openedAt)}</p></div>${chosen.status==='open'?'<a class="btn small" href="#menu">Gọi thêm món</a>':chosen.invoiceId?`<button class="btn small secondary" data-action="invoice" data-id="${chosen.invoiceId}">Xem hóa đơn</button>`:''}</div><div class="stack">${orders.length?orders.map(o=>orderCard(o,false)).join(''):empty('Sẵn sàng gọi món','Chọn món trên thực đơn, thêm vào giỏ và gửi đơn khi đã nhận bàn.','<a href="#menu" class="btn">Xem thực đơn</a>')}</div>`:empty('Chưa nhận bàn','Nhân viên sẽ mở lượt phục vụ khi bạn đến nhận bàn. Bạn có thể chọn món vào giỏ trước.')}</section></div>`;
}
function bookingCard(r,admin=false){
  const actionable=['pending','confirmed'].includes(r.status);
  const now=Date.now(),start=new Date(r.startAt).getTime(),end=new Date(r.endAt).getTime(),seatReady=r.status==='confirmed'&&now>=start-30*60*1000&&now<end,expired=now>=end;
  const timingNotice=admin&&r.status==='pending'&&expired?'<p class="notice warn booking-time-warning">Lịch này đã quá giờ đặt bàn, không thể xác nhận.</p>':admin&&r.status==='confirmed'&&expired?'<p class="notice warn booking-time-warning">Lịch này đã quá giờ đặt bàn, không thể nhận bàn.</p>':admin&&r.status==='confirmed'&&!seatReady?`<p class="notice hint booking-time-warning">${icon('clock')} Chưa tới giờ nhận bàn. Có thể nhận từ ${date(new Date(start-30*60*1000))}.</p>`:'';
  return `<article class="panel"><div class="booking-head"><h3>${admin?esc(r.name)+' · ':''}Bàn ${esc(r.tableCode)} <small>· #DB${r.id}</small></h3>${pill(r.status)}</div><div class="booking-meta"><span>${icon('calendar')} ${date(r.startAt)}</span><span>${icon('user')} ${r.guests} người</span>${admin?`<span>${esc(r.phone)}</span>`:''}</div>${r.note?`<p class="booking-note">Ghi chú: ${esc(r.note)}</p>`:''}${r.cancelReason?`<p class="booking-note">Lý do hủy: ${esc(r.cancelReason)}</p>`:''}${timingNotice}${actionable?`<div class="actions">${admin&&r.status==='pending'?(expired?`<button class="btn small secondary" disabled>${icon('clock')} Đã quá giờ</button>`:`<button class="btn small" data-action="confirm-reservation" data-id="${r.id}">Xác nhận</button>`):''}${admin&&r.status==='confirmed'?(seatReady?`<button class="btn small" data-action="seat" data-id="${r.id}">${icon('table')} Nhận bàn</button>`:`<button class="btn small secondary" disabled>${icon('clock')} ${expired?'Đã quá giờ':'Chưa tới giờ'}</button>`):''}<button class="btn small danger" data-action="cancel-reservation" data-id="${r.id}">Hủy đặt bàn</button></div>`:''}</article>`;
}
function orderCard(o,admin=false){
  const steps=['pending','preparing','served'],step=steps.indexOf(o.status),total=o.items.reduce((s,i)=>s+i.quantity*i.unitPrice,0);
  return `<article class="panel"><div class="row-between"><h3>Đơn #${o.id}${admin?` <small>· ${esc(o.tableCode)}</small>`:''}</h3>${pill(o.status)}</div><p class="hint">${date(o.createdAt)}${admin?` · ${esc(o.customerName)}`:''}</p>${o.status!=='cancelled'?`<div class="progress">${steps.map((_,i)=>`<span class="${i<=step?'done':''}"></span>`).join('')}</div><div class="progress-label"><span>Chờ xác nhận</span><span>Đang chế biến</span><span>Đã phục vụ</span></div>`:''}<div class="order-items">${o.items.map(i=>`<div class="order-item"><span>${i.quantity} × ${esc(i.dishName)}</span><span>${money(i.quantity*i.unitPrice)}</span></div>`).join('')}</div>${o.note?`<p class="booking-note">Ghi chú: ${esc(o.note)}</p>`:''}${o.cancelReason?`<p class="booking-note">Lý do hủy: ${esc(o.cancelReason)}</p>`:''}<div class="order-total"><span>Tổng đơn</span><span>${money(total)}</span></div>${admin?`<div class="actions">${o.status==='pending'?`<button class="btn small" data-action="order-status" data-id="${o.id}" data-status="preparing">Tiếp nhận & chế biến</button><button class="btn small danger" data-action="cancel-order" data-id="${o.id}">Hủy đơn</button>`:o.status==='preparing'?`<button class="btn small" data-action="order-status" data-id="${o.id}" data-status="served">Đã phục vụ</button>`:''}</div>`:''}</article>`;
}
async function cartPage(version){
  app.innerHTML='<div class="loading" role="status">Đang kiểm tra tài khoản…</div>';
  const allowed=await requireCustomer();
  if(version!==renderVersion)return;
  if(!allowed){
    app.innerHTML=head('Giỏ hàng','Dành cho tài khoản khách hàng.')+empty(
      state.user?'Giỏ hàng dành cho khách hàng':'Vui lòng đăng nhập',
      state.user?'Dùng tài khoản khách hàng để chọn món và đặt món.':'Đăng nhập tài khoản khách hàng trước khi thêm món hoặc xem giỏ hàng.',
      state.user?'<a class="btn" href="#menu">Về thực đơn</a>':'<button class="btn" data-action="auth">Đăng nhập</button>');
    return;
  }
  const sessions=state.user?await api('/sessions'):[];if(version!==renderVersion)return;
  const active=sessions.filter(s=>s.status==='open');
  if(!state.cart.length){app.innerHTML=head('Giỏ hàng','Một bữa ngon bắt đầu từ những món bạn yêu thích.')+empty('Giỏ hàng đang trống','Cùng chọn vài món ngon trên thực đơn nhé.','<a class="btn" href="#menu">Khám phá thực đơn '+icon('arrow')+'</a>');return;}
  app.innerHTML=head('Giỏ hàng của bạn',`${cartCount()} món được chọn · Kiểm tra lại trước khi gửi cho bếp.`,`<a class="btn secondary" href="#menu">${icon('plus')} Chọn thêm món</a>`)+`<div class="two-col"><section class="panel">${state.cart.map(i=>`<div class="cart-line"><img src="${dishPhoto(i)}" alt=""><div><h3>${esc(i.name)}</h3><small>${money(i.unitPrice)} / phần</small><div class="quantity"><button data-action="quantity" data-id="${i.dishId}" data-delta="-1" aria-label="Giảm số lượng ${esc(i.name)}">−</button><span>${i.quantity}</span><button data-action="quantity" data-id="${i.dishId}" data-delta="1" aria-label="Tăng số lượng ${esc(i.name)}" ${i.quantity>=99?'disabled':''}>+</button></div></div><div class="line-end"><span class="price">${money(i.quantity*i.unitPrice)}</span><button class="remove" data-action="remove" data-id="${i.dishId}">Xóa</button></div></div>`).join('')}<div class="actions"><button class="text-btn" data-action="refresh-cart">Cập nhật giá & tình trạng món</button></div></section><aside class="panel cart-summary"><h2>Gửi món cho bếp</h2>${!state.user?'<div class="notice warn">Đăng nhập và nhận bàn để gửi đơn.</div>':!active.length?'<div class="notice warn">Bạn chưa có lượt bàn đang phục vụ. Nhân viên sẽ mở lượt khi bạn đến nhận bàn.</div>':''}<form id="order-form"><label>Lượt bàn đang dùng<select name="sessionId" ${!active.length?'disabled':''}>${active.length?active.map(s=>`<option value="${s.id}">Bàn ${esc(s.tableCode)} · Lượt #${s.id}</option>`).join(''):'<option>Chưa nhận bàn</option>'}</select></label><label>Ghi chú cho bếp<textarea name="note" maxlength="500" placeholder="Ví dụ: ít cay, không hành…"></textarea></label><div class="summary-row"><span>Số lượng</span><span>${cartCount()} phần</span></div><div class="summary-row"><span>Thanh toán</span><span>Tại nhà hàng</span></div><div class="total-row"><span>Tạm tính</span><span>${money(cartTotal())}</span></div><div class="form-error"></div><button class="btn full" type="submit" ${state.user&&!active.length?'disabled':''}>${state.user?'Xác nhận gọi món':'Đăng nhập để gọi món'} ${icon('arrow')}</button><p class="hint">Bếp kiểm tra giá và tình trạng món khi tiếp nhận. Bạn có thể gọi thêm trong cùng lượt phục vụ.</p></form>${state.user&&!active.length?'<a class="btn secondary full" href="#my">Xem đặt bàn của tôi</a>':''}</aside></div>`;
}
const adminLinks=[['dashboard','dashboard','Dashboard & doanh thu'],['reservations','calendar','Đặt bàn'],['orders','orders','Đơn món'],['tables','table','Quản lý bàn'],['dishes','menu','Quản lý món'],['invoices','invoice','Hóa đơn'],['customers','user','Khách hàng'],['support','chat','Tin nhắn hỗ trợ']];
const staffLinks=adminLinks.filter(([page])=>page!=='dashboard'&&page!=='dishes'&&page!=='customers');
async function adminPage(page,version){
  if(!state.user)return authRequired();if(!staff()){app.innerHTML=head('Trang quản lý','Trang này dành cho nhân viên và quản lý.')+empty('Bạn đang dùng tài khoản khách','Đăng nhập bằng tài khoản nhân viên để tiếp tục.');return;}
  const links=state.user.role==='admin'?adminLinks:staffLinks;
  if(!links.some(l=>l[0]===page))page=state.user.role==='admin'?'dashboard':'orders';
  app.innerHTML=`<div class="admin-layout"><aside><div class="sidebar"><p class="sidebar-heading">${state.user.role==='admin'?'Quản lý nhà hàng':'Khu vực nhân viên'}</p>${links.map(([p,i,t])=>`<a class="side-link ${p===page?'active':''}" href="#admin/${p}">${icon(i)}${t}</a>`).join('')}</div></aside><section class="admin-content" id="admin-content"><div class="loading">Đang tải…</div></section></div>`;
  const content=$('#admin-content');
  if(page==='dashboard'){
    const [stats,reservations,sessions]=await Promise.all([api('/dashboard'),api('/reservations'),api('/sessions')]);if(version!==renderVersion)return;
    content.innerHTML=head('Dashboard & doanh thu','Tổng quan vận hành dành riêng cho quản lý nhà hàng.','<button class="btn secondary small" data-action="reload">'+icon('clock')+' Làm mới</button>')+`<div class="stats">${[[stats.pendingReservations,'Đặt bàn chờ xác nhận','calendar'],[stats.activeTables,'Bàn đang sử dụng','table'],[stats.activeOrders,'Đơn đang xử lý','orders'],[money(stats.todayRevenue),'Doanh thu hôm nay','invoice']].map(([n,t,i])=>`<div class="stat">${icon(i)}<p>${t}</p><strong>${n}</strong></div>`).join('')}</div><div class="split-panels"><div class="panel"><h2>Đặt bàn cần xử lý</h2>${reservations.filter(r=>r.status==='pending').slice(0,4).map(r=>`<a class="quick-link" href="#admin/reservations"><span><strong>${esc(r.name)}</strong><br><small>${esc(r.tableCode)} · ${date(r.startAt)}</small></span>${icon('arrow')}</a>`).join('')||'<p class="mini-empty">Mọi đặt bàn đã được xử lý.</p>'}<a class="text-btn" href="#admin/reservations">Xem tất cả đặt bàn →</a></div><div class="panel"><h2>Bàn đang phục vụ</h2>${sessions.filter(s=>s.status!=='closed').slice(0,4).map(s=>`<a class="quick-link" href="#admin/invoices"><span><strong>${esc(s.tableCode)} · ${esc(s.customerName)}</strong><br><small>Lượt #${s.id} · ${labels[s.status]}</small></span>${icon('arrow')}</a>`).join('')||'<p class="mini-empty">Chưa có bàn đang phục vụ.</p>'}<a class="text-btn" href="#admin/tables">Xem sơ đồ bàn →</a></div></div><div class="notice hint">Dashboard và doanh thu chỉ hiển thị cho tài khoản quản lý. Nhân viên tập trung xử lý đặt bàn, đơn món, bàn và hóa đơn.</div>`;
  }else if(page==='reservations'){
    const reservations=await api('/reservations');if(version!==renderVersion)return;
    content.innerHTML=head('Lịch đặt bàn','Xác nhận yêu cầu và mở lượt phục vụ khi khách đến.')+`<div class="notice hint">Nhận bàn từ 30 phút trước giờ hẹn đến trước giờ kết thúc. Khách đăng nhập tài khoản đã đặt bàn để gọi món.</div><div class="stack">${reservations.length?reservations.map(r=>bookingCard(r,true)).join(''):empty('Chưa có yêu cầu đặt bàn','Lịch đặt của khách sẽ xuất hiện ở đây.')}</div>`;
  }else if(page==='orders'){
    const orders=await api('/orders');if(version!==renderVersion)return;
    const filtered=orders.filter(o=>state.orderFilter==='all'||(state.orderFilter==='active'?['pending','preparing'].includes(o.status):o.status===state.orderFilter));
    content.innerHTML=head('Đơn món','Theo dõi bếp và cập nhật tiến độ để khách biết món sắp được phục vụ.')+`<div class="tabs">${[['active','Đang xử lý'],['served','Đã phục vụ'],['cancelled','Đã hủy'],['all','Tất cả']].map(([v,t])=>`<button data-action="order-filter" data-filter="${v}" class="${state.orderFilter===v?'active':''}">${t}</button>`).join('')}</div><div class="stack">${filtered.length?filtered.map(o=>orderCard(o,true)).join(''):empty('Không có đơn trong danh sách','Đơn mới của khách sẽ xuất hiện tự động.')}</div>`;
  }else if(page==='tables'){
    const tables=await api('/tables');if(version!==renderVersion)return;state.tables=tables;
    content.innerHTML=head('Quản lý bàn','Trạng thái phục vụ và sức chứa của từng bàn.',state.user.role==='admin'?'<button class="btn" data-action="edit-table">'+icon('plus')+' Thêm bàn</button>':'')+`<div class="table-grid">${tables.map(t=>`<article class="table-card ${t.status}"><div class="row-between"><h3>${esc(t.code)}</h3>${pill(t.status)}</div><div class="table-drawing">${icon('table')}</div><div class="row-between"><span class="hint">${t.capacity} chỗ ngồi</span>${t.sessionId?`<small>Lượt #${t.sessionId}</small>`:''}</div><div class="actions">${state.user.role==='admin'?`<button class="btn small secondary" data-action="edit-table" data-id="${t.id}">Chỉnh sửa</button>`:''}${t.sessionId?'<a class="btn small secondary" href="#admin/invoices">Hóa đơn</a>':''}</div></article>`).join('')}</div>`;
  }else if(page==='dishes'){
    if(state.user.role!=='admin'){content.innerHTML=head('Quản lý món','Thay đổi thực đơn dành cho tài khoản quản lý.')+empty('Bạn không có quyền sửa thực đơn','Tài khoản nhân viên chỉ xử lý đặt bàn, đơn món và hóa đơn.');return;}
    const dishes=await api('/menu?all=1');if(version!==renderVersion)return;state.adminDishes=dishes;
    content.innerHTML=head('Quản lý món','Cập nhật giá, tình trạng và món hiển thị trên thực đơn.','<button class="btn" data-action="edit-dish">'+icon('plus')+' Thêm món</button>')+`<div class="data-wrap"><table class="data-table"><thead><tr><th>Món ăn</th><th>Danh mục</th><th>Giá bán</th><th>Tình trạng</th><th></th></tr></thead><tbody>${dishes.map(d=>`<tr><td><div class="cell-dish"><img class="thumb" src="${dishPhoto(d)}" alt=""><strong>${esc(d.name)}</strong></div></td><td>${esc(d.categoryName)}</td><td>${money(d.price)}</td><td>${!d.visible?pill('disabled'):!d.available?'<span class="pill pending">Tạm hết</span>':'<span class="pill">Đang bán</span>'}</td><td><button class="btn secondary small" data-action="dish-detail" data-id="${d.id}">Công thức</button> <button class="btn secondary small" data-action="edit-dish" data-id="${d.id}">Sửa</button></td></tr>`).join('')}</tbody></table></div>`;
  }else if(page==='customers'){
    if(state.user.role!=='admin'){content.innerHTML=head('Khách hàng','Danh sách khách hàng dành riêng cho quản lý.')+empty('Bạn không có quyền xem dữ liệu khách hàng','Tài khoản nhân viên chỉ xử lý vận hành trong ngày.');return;}
    const customers=await api('/customers');if(version!==renderVersion)return;
    content.innerHTML=head('Khách hàng','Theo dõi tài khoản, lịch đặt bàn và số đơn của từng khách.')+`<div class="data-wrap"><table class="data-table"><thead><tr><th>Khách hàng</th><th>Liên hệ</th><th>Đặt bàn</th><th>Đơn món</th><th>Tham gia</th></tr></thead><tbody>${customers.map(c=>`<tr><td><strong>${esc(c.name)}</strong><small>@${esc(c.username)}</small></td><td>${esc(c.phone)}</td><td>${c.reservationCount}</td><td>${c.orderCount}</td><td>${date(c.createdAt)}</td></tr>`).join('')||'<tr><td colspan="5">Chưa có tài khoản khách hàng.</td></tr>'}</tbody></table></div>`;
  }else if(page==='support'){
    const conversations=await api('/support/conversations');if(version!==renderVersion)return;
    content.innerHTML=head('Tin nhắn hỗ trợ','Khách hàng gửi trực tiếp từ website sẽ xuất hiện tại đây.')+`<div class="notice hint">Mở một cuộc trò chuyện để xem toàn bộ nội dung và trả lời khách. Danh sách tự cập nhật khi nhân viên vào lại trang.</div><div class="support-inbox">${conversations.length?conversations.map(c=>`<button class="support-conversation" data-action="support-open" data-id="${c.id}"><span class="support-conversation-icon">${icon('chat')}</span><span class="support-conversation-body"><strong>${esc(c.customerName)}</strong><small>${esc(c.phone||'')} · ${date(c.lastMessageAt)}</small><span>${esc(c.lastMessage||'Chưa có tin nhắn')}</span></span><span class="support-conversation-count">${c.messageCount}</span></button>`).join(''):empty('Chưa có tin nhắn mới','Khi khách gửi tin nhắn trực tiếp, cuộc trò chuyện sẽ hiển thị ở đây.')}</div>`;
  }else if(page==='invoices'){
    const [sessions,invoices]=await Promise.all([api('/sessions'),api('/invoices')]);if(version!==renderVersion)return;
    content.innerHTML=head('Hóa đơn & thanh toán','Tổng hợp tất cả món đã phục vụ trong đúng lượt bàn.')+`<div class="section-label">Lượt đang phục vụ</div><div class="stack">${sessions.filter(s=>s.status!=='closed').map(s=>`<div class="panel"><div class="row-between"><div><h3>${esc(s.tableCode)} · ${esc(s.customerName)}</h3><p class="hint">Lượt #${s.id} · ${date(s.openedAt)}</p></div>${pill(s.status)}</div><div class="actions">${s.invoiceId?`<button class="btn small" data-action="invoice" data-id="${s.invoiceId}">Xem & thanh toán ${money(s.total)}</button>`:`<button class="btn small" data-action="create-invoice" data-id="${s.id}">Lập hóa đơn</button>`}</div></div>`).join('')||empty('Chưa có lượt cần thanh toán','Nhận bàn và phục vụ món để bắt đầu một lượt.')}</div><div class="section-label">Lịch sử hóa đơn</div><div class="data-wrap"><table class="data-table"><thead><tr><th>Mã hóa đơn</th><th>Khách / Bàn</th><th>Thời gian</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr></thead><tbody>${invoices.map(i=>`<tr><td><strong>#HD${i.id}</strong></td><td>${esc(i.customerName)}<small>${esc(i.tableCode)} · Lượt #${i.sessionId}</small></td><td>${date(i.createdAt)}</td><td>${money(i.total)}</td><td>${pill(i.status)}</td><td><button class="btn small secondary" data-action="invoice" data-id="${i.id}">Xem</button></td></tr>`).join('')||'<tr><td colspan="6">Chưa có hóa đơn.</td></tr>'}</tbody></table></div>`;
  }
}
async function render(){
  if(!ready){
    app.innerHTML=initializationError
      ? empty('Chưa tải được thực đơn',esc(initializationError),'<button class="btn" data-action="reload">Thử lại</button>')
      : '<div class="loading" role="status">Đang tải thực đơn…</div>';
    return;
  }
  state.view=(location.hash.slice(1)||'menu');const version=++renderVersion;header();
  try{
    if(state.view==='menu')menuPage();
    else if(state.view==='reserve'){state.booking=null;reservePage();}
    else if(state.view==='my')await myPage(version);
    else if(state.view==='cart')await cartPage(version);
    else if(state.view.startsWith('admin/'))await adminPage(state.view.slice(6),version);
    else navigate('menu');
    if(version===renderVersion)enhanceView();
  }catch(e){if(version===renderVersion)app.innerHTML=empty('Không tải được dữ liệu',esc(e.message),'<button class="btn" data-action="reload">Thử lại</button>');}
}
function modal(title,body,variant=''){dialog.className=variant;dialog.innerHTML=`<div class="dialog-head"><h2 id="dialog-title">${title}</h2><button class="close-dialog no-print" data-action="close-modal" aria-label="Đóng">×</button></div>${body}`;if(!dialog.open)dialog.showModal();}
function authModal(register=false){
  modal('Chào mừng đến Bếp Nhà',`<p class="dialog-sub">Đặt bàn thuận tiện, gọi món thật dễ dàng.</p><div class="auth-tabs"><button data-action="auth-tab" class="${!register?'active':''}">Đăng nhập</button><button data-action="register-tab" class="${register?'active':''}">Tạo tài khoản</button></div><form id="auth-form" data-register="${register}">${register?'<label>Họ tên<input name="name" required maxlength="100" autocomplete="name"></label><label>Số điện thoại<input name="phone" type="tel" pattern="0[0-9]{9,10}" required autocomplete="tel"></label>':''}<label>Tên đăng nhập<input name="username" required minlength="3" maxlength="60" autocomplete="username"></label><label>Mật khẩu<input name="password" type="password" required ${register?'minlength="8"':''} maxlength="128" autocomplete="${register?'new-password':'current-password'}"></label><div class="form-error"></div><button class="btn full" type="submit">${register?'Tạo tài khoản':'Đăng nhập'} ${icon('arrow')}</button></form>${!register?'<div class="demo-box"><p>Tài khoản demo cho bài tập</p><div class="demo-logins"><button data-action="demo" data-user="khach">Khách hàng</button><button data-action="demo" data-user="nhanvien">Nhân viên</button><button data-action="demo" data-user="admin">Quản lý</button></div></div>':''}`);
}
const chatMessage=(m,staffView=false)=>`<div class="chat-message ${m.senderRole==='customer'?'customer':'bot'}">${m.senderRole==='customer'&&!staffView?'':`<span class="chat-avatar">${m.senderRole==='customer'?'👤':'💬'}</span>`}<div><strong>${esc(m.senderName|| (m.senderRole==='customer'?'Khách hàng':'Bếp Nhà'))}</strong><p>${esc(m.message)}</p><small>${date(m.createdAt)}</small></div></div>`;
async function supportChatModal(){
  const initial='<div class="chat-message bot"><span class="chat-avatar">💬</span><div><strong>Bếp Nhà</strong><p>Xin chào! Bếp Nhà đã nhận được tin nhắn của bạn. Bạn cần hỗ trợ về đặt bàn, gọi món hay thông tin món ăn?</p><small>Vừa xong</small></div></div>';
  let messages='';
  if(state.user?.role==='customer'){
    try{const conversation=await api('/support/conversation');messages=conversation?.messages?.map(m=>chatMessage(m)).join('')||'';}catch(error){toast(error.message,true);}
  }
  modal('Nhắn trực tiếp với Bếp Nhà',`<div class="live-chat"><div class="chat-presence"><span class="chat-online-dot"></span><span>Đang hỗ trợ trực tuyến</span><small>10:00 – 22:00 mỗi ngày</small></div><div class="chat-messages" id="live-chat-messages">${initial}${messages}</div><form id="chat-form" class="chat-form"><input name="message" maxlength="500" required autocomplete="off" placeholder="${state.user?.role==='customer'?'Nhập tin nhắn của bạn…':'Đăng nhập tài khoản khách để nhắn'}" aria-label="Tin nhắn"><button class="btn" type="submit">Gửi ${icon('arrow')}</button></form><p class="chat-note">Nhân viên sẽ tham gia cuộc trò chuyện ngay khi online.</p></div>`);
  const box=$('#live-chat-messages');if(box)box.scrollTop=box.scrollHeight;
}
async function staffChatModal(id,name){
  const messages=await api(`/support/conversations/${id}/messages`);
  modal('Trao đổi với '+esc(name),`<div class="live-chat"><div class="chat-presence"><span class="chat-online-dot"></span><span>Đang xử lý cuộc trò chuyện</span><small>Nhân viên Bếp Nhà</small></div><div class="chat-messages" id="staff-chat-messages">${messages.map(m=>chatMessage(m,true)).join('')}</div><form id="staff-chat-form" class="chat-form" data-id="${id}"><input name="message" maxlength="500" required autocomplete="off" placeholder="Nhập câu trả lời cho khách…" aria-label="Câu trả lời"><button class="btn" type="submit">Trả lời ${icon('arrow')}</button></form></div>`);
  const box=$('#staff-chat-messages');if(box)box.scrollTop=box.scrollHeight;
}
function cancelModal(type,id){modal(type==='reservation'?'Hủy đặt bàn':'Hủy đơn món',`<p class="dialog-sub">Nhập lý do để lưu lại thông tin xử lý.</p><form id="cancel-form" data-type="${type}" data-id="${id}"><label>Lý do hủy<textarea name="reason" required maxlength="300" placeholder="Nhập lý do hủy…"></textarea></label><div class="form-error"></div><button class="btn danger full" type="submit">Xác nhận hủy</button></form>`);}
let detailRequest=0;
async function dishDetail(id){
  const request=++detailRequest;
  modal('Chi tiết món','<div class="loading" role="status">Đang tải món ăn…</div>','dish-dialog');
  try{
    const dish=await api('/menu/'+id);
    if(request!==detailRequest||!dialog.open)return;
    const recipe=dish.recipe,isAdmin=state.user?.role==='admin';
    const lines=(text,tag)=>`<${tag} class="recipe-lines">${text.split(/\r?\n/).filter(line=>line.trim()).map(line=>`<li>${esc(line)}</li>`).join('')}</${tag}>`;
    const actions=isAdmin?`<div class="actions"><button class="btn" data-action="recipe-edit" data-id="${id}">${recipe?'Sửa công thức':'Thêm công thức'}</button>${recipe?`<button class="btn danger" data-action="recipe-delete" data-id="${id}">Xóa công thức</button>`:''}</div>`:!staff()?`<div class="actions"><button class="btn full" data-action="add" data-id="${id}" ${!dish.available?'disabled':''}>Thêm vào giỏ hàng</button></div>`:'';
    modal(esc(dish.name),`<div class="dish-detail"><section class="dish-overview"><img class="recipe-image" src="${dishPhoto(dish)}" alt="${esc(dish.name)}"><div class="row-between"><span class="pill">${esc(dish.categoryName)}</span><strong class="price">${money(dish.price)}</strong></div><p class="recipe-description">${esc(dish.description)}</p>${!dish.available?'<p class="notice warn">Món hiện tạm hết.</p>':''}${actions}</section><section class="recipe-content" tabindex="0" aria-label="Nguyên liệu và cách chế biến">${recipe?`<div class="recipe-meta"><span>${recipe.servings} khẩu phần</span><span>${recipe.prepMinutes} phút</span></div><h3>Nguyên liệu</h3>${lines(recipe.ingredients,'ul')}<h3>Cách chế biến</h3>${lines(recipe.instructions,'ol')}`:'<p class="notice">Nhà hàng chưa cập nhật công thức cho món này.</p>'}</section></div>`,'dish-dialog');
  }catch(error){if(request===detailRequest&&dialog.open)modal('Không tải được món',`<p class="notice error">${esc(error.message)}</p><button class="btn" data-action="dish-detail" data-id="${id}">Thử lại</button>`);}
}
async function editRecipe(id){
  const dish=await api('/menu/'+id),r=dish.recipe;
  modal(r?'Sửa công thức':'Thêm công thức',`<p class="dialog-sub">${esc(dish.name)}</p><form id="recipe-form" data-id="${id}" data-exists="${!!r}"><div class="form-grid"><label>Khẩu phần<input name="servings" type="number" min="1" max="20" required value="${r?.servings||1}"></label><label>Thời gian (phút)<input name="prepMinutes" type="number" min="1" max="1440" required value="${r?.prepMinutes||30}"></label></div><label>Nguyên liệu<textarea name="ingredients" rows="5" required maxlength="4000" placeholder="Mỗi dòng một nguyên liệu, kèm định lượng">${esc(r?.ingredients||'')}</textarea></label><label>Cách chế biến<textarea name="instructions" rows="7" required maxlength="8000" placeholder="Mỗi dòng một bước chế biến">${esc(r?.instructions||'')}</textarea></label><div class="form-error" role="alert"></div><div class="actions"><button class="btn" type="submit">Lưu công thức</button><button class="btn secondary" type="button" data-action="dish-detail" data-id="${id}">Quay lại</button></div></form>`);
}
function deleteRecipe(id){
  modal('Xóa công thức',`<p>Chỉ xóa nguyên liệu và cách chế biến. Món ăn và lịch sử đơn hàng vẫn được giữ.</p><form id="delete-recipe-form" data-id="${id}"><div class="form-error" role="alert"></div><div class="actions"><button class="btn danger" type="submit">Xác nhận xóa công thức</button><button class="btn secondary" type="button" data-action="dish-detail" data-id="${id}">Quay lại</button></div></form>`);
}
function editDish(id){
  const d=state.adminDishes?.find(d=>d.id===id)||{categoryId:state.categories[0].id,art:'rice',available:true,visible:true};
  modal(id?'Chỉnh sửa món':'Thêm món mới',`<form id="dish-form" data-id="${id||''}"><label>Tên món<input name="name" value="${esc(d.name||'')}" required maxlength="100"></label><div class="form-grid"><label>Danh mục<select name="categoryId">${state.categories.map(c=>`<option value="${c.id}" ${c.id===d.categoryId?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><label>Giá bán (VND)<input name="price" type="number" min="1" max="10000000" step="1" value="${d.price||''}" required></label></div><label>Mô tả<textarea name="description" maxlength="500">${esc(d.description||'')}</textarea></label><label>Hình minh họa<select name="art">${[['rice','Cơm'],['noodle','Bún / mì'],['fish','Cá'],['grill','Món nướng'],['veg','Rau / salad'],['roll','Gỏi cuốn'],['fries','Khoai chiên'],['tea','Trà / nước trái cây'],['coffee','Cà phê'],['dessert','Tráng miệng']].map(([a,l])=>`<option value="${a}" ${a===d.art?'selected':''}>${l}</option>`).join('')}</select></label><label class="check-row"><input name="available" type="checkbox" ${d.available?'checked':''}>Còn món để phục vụ</label><label class="check-row"><input name="visible" type="checkbox" ${d.visible?'checked':''}>Hiển thị trên thực đơn khách</label><div class="form-error"></div><button class="btn full" type="submit">Lưu món</button></form>`);
}
function editTable(id){const t=state.tables?.find(t=>t.id===id)||{enabled:true};modal(id?'Chỉnh sửa bàn':'Thêm bàn mới',`<form id="table-form" data-id="${id||''}"><label>Mã bàn<input name="code" value="${esc(t.code||'')}" required maxlength="20" placeholder="Ví dụ: B11"></label><label>Sức chứa<input name="capacity" type="number" min="1" max="30" step="1" value="${t.capacity||4}" required></label>${id?`<label class="check-row"><input name="enabled" type="checkbox" ${t.enabled?'checked':''}>Bàn đang phục vụ</label>`:''}<p class="hint">Không sửa bàn đang có khách. Xử lý lịch đặt còn hiệu lực trước khi giảm sức chứa hoặc ngừng phục vụ.</p><div class="form-error"></div><div class="actions"><button class="btn full" type="submit">Lưu bàn</button></div></form>`);}
async function invoiceModal(id){
  const i=await api(`/invoices/${id}`);
  modal('Hóa đơn #HD'+i.id,`<div class="receipt"><div class="invoice-header"><h2>Bếp Nhà</h2><p>Ngon như cơm nhà · Hóa đơn thanh toán</p></div><div class="invoice-meta"><span>Hóa đơn: <strong>#HD${i.id}</strong></span><span>Bàn: <strong>${esc(i.tableCode)}</strong></span><span>Khách: <strong>${esc(i.customerName)}</strong></span><span>Lượt: <strong>#${i.sessionId}</strong></span><span>Ngày: ${date(i.createdAt)}</span><span>${esc(i.phone)}</span></div><div class="invoice-items">${i.items.map(item=>`<div class="invoice-item"><div>${esc(item.dishName)}<small>${item.quantity} × ${money(item.unitPrice)}</small></div><strong>${money(item.quantity*item.unitPrice)}</strong></div>`).join('')||'<p class="hint">Không có món tính tiền.</p>'}</div><div class="invoice-total"><span>Tổng thanh toán</span><span>${money(i.total)}</span></div><div class="invoice-status">${pill(i.status)}${i.paidAt?`<p class="hint">${i.method==='cash'?'Tiền mặt':'Chuyển khoản'} · ${date(i.paidAt)}</p>`:''}</div><p class="invoice-thanks">Cảm ơn bạn đã dành một bữa ở Bếp Nhà.</p></div>${i.status==='unpaid'&&staff()?`<form id="payment-form" data-id="${i.id}" class="no-print"><label>Phương thức thanh toán<select name="method"><option value="cash">Tiền mặt</option><option value="transfer">Chuyển khoản (đã nhận tiền)</option></select></label><div class="notice warn">Chỉ xác nhận khi đã nhận đủ tiền. Thao tác này kết thúc lượt và trả bàn.</div><div class="form-error"></div><button class="btn full" type="submit">Đã nhận ${money(i.total)} · Thanh toán</button></form>`:''}<div class="actions no-print"><button class="btn secondary full" data-action="print">${icon('invoice')} In / Lưu PDF hóa đơn</button></div>`);
}
// Kiểm tra cookie trên server cả khi phiên đăng nhập hết hạn ở tab khác.
async function requireCustomer(){
  if(state.user){
    const current=await api('/auth/me');
    if(!current||current.id!==state.user.id||current.role!==state.user.role){state.user=current;loadCart();header();}
  }
  if(!state.user){state.cart=[];state.requestKey=null;header();authModal();return false;}
  if(state.user.role!=='customer'){toast('Giỏ hàng chỉ dành cho tài khoản khách hàng.',true);return false;}
  return true;
}
async function refreshMenu(){state.menu=await api('/menu');}
async function afterLogin(user){
  state.user=user;loadCart();
  await refreshMenu();dialog.close();header();toast('Xin chào '+user.name+'!');
  if(staff())navigate(user.role==='admin'?'admin/dashboard':'admin/orders');else if(state.view.startsWith('admin/'))navigate('menu');
  else if(state.view==='reserve'){const button=$('#reservation-form button[type=submit]');if(button)button.textContent='Gửi yêu cầu đặt bàn';}
  else render();
}
document.addEventListener('input',e=>{if(e.target.id==='menu-search'){state.search=e.target.value;menuGrid();}});
document.addEventListener('change',e=>{
  if(e.target.id==='customer-session'){state.selectedSession=Number(e.target.value);render();}
  if(e.target.closest('#availability-form')){state.booking=null;$('#availability-results').innerHTML='';}
});
document.addEventListener('click',async e=>{
  const supportMenu=$('#support-menu');
  const supportOpen=supportMenu&&typeof supportMenu.hasAttribute==='function'&&!supportMenu.hasAttribute('hidden');
  if(supportOpen&&!e.target.closest('#support-widget')){$('.support-toggle')?.click();}
  const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const action=b.dataset.action,id=Number(b.dataset.id);
  try{
    if(['add','quantity','remove','refresh-cart'].includes(action)&&!await requireCustomer())return;
    if(action==='support-toggle'){const menu=$('#support-menu'),toggle=$('.support-toggle');const open=!menu||typeof menu.hasAttribute!=='function'||menu.hasAttribute('hidden');menu?.toggleAttribute?.('hidden',!open);toggle?.setAttribute?.('aria-expanded',String(open));return;}
    if(action==='support-chat'){const menu=$('#support-menu'),toggle=$('.support-toggle');menu?.setAttribute('hidden','');toggle?.setAttribute('aria-expanded','false');supportChatModal();return;}
    if(action==='support-open'){await staffChatModal(id);return;}
    if(action==='scroll-menu'){document.querySelector('#our-menu')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(action==='back-to-top'){window.scrollTo({top:0,behavior:'smooth'});return;}
    if(action==='dish-detail')await dishDetail(id);
    else if(action==='recipe-edit')await editRecipe(id);
    else if(action==='recipe-delete')deleteRecipe(id);
    else if(action==='category'){state.category=id;menuGrid();}
    else if(action==='add'){const d=state.menu.find(d=>d.id===id);if(!d?.available)return;const i=state.cart.find(i=>i.dishId===id);if(i){if(i.quantity>=99)return toast('Tối đa 99 phần cho mỗi món.',true);i.quantity++;}else state.cart.push({dishId:id,name:d.name,art:d.art,unitPrice:d.price,quantity:1});saveCart();toast('Đã thêm '+d.name+' vào giỏ.');}
    else if(action==='quantity'){const i=state.cart.find(i=>i.dishId===id);i.quantity+=Number(b.dataset.delta);if(i.quantity<=0)state.cart=state.cart.filter(i=>i.dishId!==id);saveCart();render();}
    else if(action==='remove'){state.cart=state.cart.filter(i=>i.dishId!==id);saveCart();render();}
    else if(action==='auth'||action==='auth-tab')authModal();
    else if(action==='register-tab')authModal(true);
    else if(action==='demo'){const u=b.dataset.user;$('#auth-form [name=username]').value=u;$('#auth-form [name=password]').value=u+'123';$('#auth-form').requestSubmit();}
    else if(action==='close-modal')dialog.close();
    else if(action==='logout'){await api('/auth/logout','POST');state.user=null;loadCart();navigate('menu');header();toast('Đã đăng xuất.');}
    else if(action==='reload'){if(!ready)await init();else{await refreshMenu();await render();}}
    else if(action==='confirm-reservation'){await api(`/reservations/${id}`,'PATCH',{status:'confirmed'});toast('Đã xác nhận đặt bàn.');render();}
    else if(action==='seat'){await api(`/reservations/${id}/seat`,'POST');toast('Đã nhận bàn. Khách có thể gửi món từ giỏ hàng.');render();}
    else if(action==='cancel-reservation')cancelModal('reservation',id);
    else if(action==='cancel-order')cancelModal('order',id);
    else if(action==='order-status'){await api(`/orders/${id}`,'PATCH',{status:b.dataset.status});toast('Đã cập nhật trạng thái đơn.');render();}
    else if(action==='order-filter'){state.orderFilter=b.dataset.filter;render();}
    else if(action==='edit-dish')editDish(id);
    else if(action==='edit-table')editTable(id);
    else if(action==='invoice')await invoiceModal(id);
    else if(action==='create-invoice'){const invoice=await api(`/sessions/${id}/invoice`,'POST');toast('Đã chốt hóa đơn. Lượt bàn ngừng nhận thêm món.');render();await invoiceModal(invoice.id);}
    else if(action==='print')window.print();
    else if(action==='refresh-cart'){
      await refreshMenu();let removed=0;
      state.cart=state.cart.flatMap(i=>{const d=state.menu.find(d=>d.id===i.dishId);if(!d||!d.available){removed++;return [];}return [{...i,name:d.name,unitPrice:d.price,art:d.art}];});saveCart();render();toast(removed?'Đã cập nhật giá và bỏ '+removed+' món không còn phục vụ.':'Giá đã cập nhật. Kiểm tra lại rồi xác nhận gọi món.');
    }
  }catch(err){toast(err.message,true);}
});
document.addEventListener('submit',async e=>{
  const form=e.target;if(!form.id)return;e.preventDefault();const data=Object.fromEntries(new FormData(form));const button=$('button[type=submit]',form);const error=$('.form-error',form);if(error)error.textContent='';if(button?.disabled)return;
  if(button)button.disabled=true;
  try{
    if(form.id==='recipe-form'){await api(`/menu/${form.dataset.id}/recipe`,form.dataset.exists==='true'?'PUT':'POST',{ingredients:data.ingredients,instructions:data.instructions,servings:Number(data.servings),prepMinutes:Number(data.prepMinutes)});toast('Đã lưu công thức.');await dishDetail(Number(form.dataset.id));}
    else if(form.id==='chat-form'){
      if(state.user?.role!=='customer'){authModal();toast('Đăng nhập tài khoản khách để nhân viên nhận được tin nhắn.',true);return;}
      const box=$('#live-chat-messages');if(!box)return;
      const message=data.message.trim();if(!message)return;
      const result=await api('/support/conversation/messages','POST',{message});
      box.insertAdjacentHTML('beforeend',chatMessage(result.message));
      form.reset();box.scrollTop=box.scrollHeight;toast('Đã gửi tin nhắn trực tiếp.');
    }
    else if(form.id==='staff-chat-form'){
      const box=$('#staff-chat-messages');if(!box)return;
      const message=data.message.trim();if(!message)return;
      const result=await api(`/support/conversations/${form.dataset.id}/messages`,'POST',{message});
      box.insertAdjacentHTML('beforeend',chatMessage(result,true));
      form.reset();box.scrollTop=box.scrollHeight;toast('Đã gửi câu trả lời cho khách.');
    }
    else if(form.id==='delete-recipe-form'){await api(`/menu/${form.dataset.id}/recipe`,'DELETE');toast('Đã xóa công thức.');await dishDetail(Number(form.dataset.id));}
    else if(form.id==='auth-form')await afterLogin(await api('/auth/'+(form.dataset.register==='true'?'register':'login'),'POST',data));
    else if(form.id==='availability-form'){
      const start=new Date(`${data.day}T${data.time}:00+07:00`);if(!Number.isFinite(start.getTime()))throw new Error('Chọn ngày và giờ hợp lệ.');
      state.booking={startAt:start.toISOString(),guests:Number(data.guests)};
      const tables=await api('/availability?'+new URLSearchParams(state.booking));availabilityResults(tables);
    }else if(form.id==='reservation-form'){
      if(!state.user){authModal();return;}if(!state.booking)throw new Error('Tìm bàn lại sau khi đổi thời gian hoặc số khách.');await api('/reservations','POST',{...data,tableId:Number(data.tableId),...state.booking});toast('Đã gửi đặt bàn. Nhân viên sẽ xác nhận lịch của bạn.');navigate('my');
    }else if(form.id==='order-form'){
      if(!state.user){authModal();return;}if(!state.requestKey)state.requestKey=crypto.randomUUID();saveCart(false);
      const o=await api('/orders','POST',{sessionId:Number(data.sessionId),note:data.note,requestKey:state.requestKey,items:state.cart.map(({dishId,quantity,unitPrice})=>({dishId,quantity,unitPrice}))});
      state.cart=[];saveCart();state.selectedSession=o.sessionId;toast('Đơn #'+o.id+' đã gửi cho bếp.');navigate('my');
    }else if(form.id==='cancel-form'){
      await api(`/${form.dataset.type==='reservation'?'reservations':'orders'}/${form.dataset.id}`,'PATCH',{status:'cancelled',reason:data.reason});dialog.close();toast('Đã hủy và lưu lý do.');render();
    }else if(form.id==='dish-form'){
      const id=form.dataset.id;await api('/menu'+(id?'/'+id:''),id?'PUT':'POST',{...data,categoryId:Number(data.categoryId),price:Number(data.price),visible:data.visible==='on',available:data.available==='on'});dialog.close();await refreshMenu();toast('Đã lưu món.');render();
    }else if(form.id==='table-form'){
      const id=form.dataset.id;await api('/tables'+(id?'/'+id:''),id?'PUT':'POST',{...data,capacity:Number(data.capacity),enabled:data.enabled==='on'});dialog.close();toast('Đã lưu bàn.');render();
    }else if(form.id==='payment-form'){
      await api(`/invoices/${form.dataset.id}/pay`,'POST',data);toast('Đã thanh toán và trả bàn về trạng thái trống.');await invoiceModal(Number(form.dataset.id));render();
    }
  }catch(err){if(error)error.textContent=err.message;else toast(err.message,true);}
  finally{if(button)button.disabled=false;}
});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#support-menu')?.setAttribute('hidden','');$('.support-toggle')?.setAttribute('aria-expanded','false');}});
window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0,behavior:'smooth'});});
window.addEventListener('scroll',updateChrome,{passive:true});
// Cập nhật tiến độ định kỳ; không làm gián đoạn nhập form hoặc dialog.
setInterval(()=>{if(document.hidden||dialog.open||document.activeElement?.matches('input,select,textarea'))return;if(state.view==='my'||state.view.startsWith('admin/'))render();},10000);
async function init(){
  if(initializing)return;
  initializing=true;initializationError=null;ready=false;
  await render();
  try{
    const [user,menu,categories]=await Promise.all([api('/auth/me'),api('/menu'),api('/categories')]);
    if(!Array.isArray(menu)||!Array.isArray(categories))throw new Error('Dữ liệu thực đơn không hợp lệ. Vui lòng thử lại.');
    state.user=user;state.menu=menu;state.categories=categories;
    loadCart();ready=true;
  }catch(err){initializationError=err.message;}
  finally{initializing=false;await render();}
}
init();
updateChrome();
