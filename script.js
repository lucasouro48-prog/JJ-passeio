// script.js - tradução, seleção de passeios, cálculo, reserva e WA
const PHONE_WHATSAPP = "559999999999"; // substitua pelo número da sua empresa sem + ou espaços (ex: 5585999999999)
const SITE_LANG = { current: "pt" }; // pt ou en

/* --- Tradução simples --- */
const DICT = {
  pt: {
    reservar: "Reservar",
    verDetalhes: "Ver detalhes",
    pessoas: "Pessoas",
    horario: "Horário",
    total: "Total",
    taxaPreservacao: "Taxa de preservação",
    taxaMaquininha: "Taxa maquininha (+R$)",
    formaPagamento: "Forma de pagamento",
    finalizar: "Finalizar (enviar WhatsApp)",
    escolherPasseio: "Escolha um passeio",
    selecionar: "Selecionar",
    remover: "Remover",
    nomes: "Nomes (separe por vírgula)",
    quantidade: "Quantidade",
    idioma: "EN",
  },
  en: {
    reservar: "Book",
    verDetalhes: "See details",
    pessoas: "People",
    horario: "Time",
    total: "Total",
    taxaPreservacao: "Preservation fee",
    taxaMaquininha: "Card fee (+R$)",
    formaPagamento: "Payment method",
    finalizar: "Finish (send WhatsApp)",
    escolherPasseio: "Choose a tour",
    selecionar: "Select",
    remover: "Remove",
    nomes: "Names (comma separated)",
    quantidade: "Quantity",
    idioma: "PT",
  }
};

function t(key){
  const lang = SITE_LANG.current;
  return DICT[lang][key] || key;
}

/* update text elements with data-i18n attribute */
function applyTranslations(){
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    el.innerText = t(key);
  });
  // language toggle text
  const btn = document.getElementById("langToggle");
  if(btn) btn.innerText = DICT[SITE_LANG.current].idioma;
}

/* --- Reserva / carrinho --- */
const cart = [];

function addToCart(tour){
  // tour: {id,title,price,preservation,cardFee, duration, times}
  const exists = cart.find(c=>c.id===tour.id);
  if(exists){
    alert("Passeio já selecionado.");
    return;
  }
  cart.push(Object.assign({},tour, {quantity:1, names:"", chosenTime: tour.times ? tour.times[0] : ""}));
  renderCart();
}

function removeFromCart(id){
  const idx = cart.findIndex(c=>c.id===id);
  if(idx>=0) cart.splice(idx,1);
  renderCart();
}

function changeQuantity(id, q){
  const it = cart.find(c=>c.id===id);
  if(!it) return;
  it.quantity = Math.max(1, parseInt(q)||1);
  renderCart();
}

function changeNames(id, names){
  const it = cart.find(c=>c.id===id);
  if(!it) return;
  it.names = names;
}

function changeTime(id, time){
  const it = cart.find(c=>c.id===id);
  if(!it) return;
  it.chosenTime = time;
}

function calculateTotals(){
  let subtotal = 0;
  let preservation = 0;
  let cardFees = 0;
  cart.forEach(it=>{
    subtotal += it.price * it.quantity;
    preservation += (it.preservation || 0) * it.quantity;
    if(it.cardFee) cardFees += it.cardFee * it.quantity;
  });
  const total = subtotal + preservation + cardFees;
  return {subtotal, preservation, cardFees, total};
}

function renderCart(){
  const el = document.getElementById("cart");
  if(!el) return;
  el.innerHTML="";
  if(cart.length===0){
    el.innerHTML = `<div class="summary"><strong>${t("escolherPasseio")}</strong></div>`;
    return;
  }
  cart.forEach(it=>{
    const card = document.createElement("div");
    card.className="card";
    card.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center;">
        <div style="flex:1">
          <h3>${it.title}</h3>
          <div class="small">${it.duration} • R$ ${it.price.toFixed(2)} / unidade</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:800">R$ ${ (it.price * it.quantity).toFixed(2)}</div>
          <button class="btn" onclick="removeFromCart('${it.id}')">${t("remover")}</button>
        </div>
      </div>
      <div style="margin-top:8px" class="form-row">
        <input class="input" placeholder="${t("nomes")}" value="${it.names}" onchange="changeNames('${it.id}', this.value)"/>
        <input class="input" type="number" min="1" value="${it.quantity}" style="width:110px" onchange="changeQuantity('${it.id}', this.value)"/>
      </div>
      <div style="margin-top:8px">${renderTimeSelect(it)}</div>
    `;
    el.appendChild(card);
  });
  const totals = calculateTotals();
  const footer = document.createElement("div");
  footer.className="summary";
  footer.innerHTML = `
    <div style="display:flex;justify-content:space-between"><div>${t("taxaPreservacao")}</div><div>R$ ${totals.preservation.toFixed(2)}</div></div>
    <div style="display:flex;justify-content:space-between"><div>${t("taxaMaquininha")}</div><div>R$ ${totals.cardFees.toFixed(2)}</div></div>
    <hr/>
    <div style="display:flex;justify-content:space-between;font-weight:800"><div>${t("total")}</div><div>R$ ${totals.total.toFixed(2)}</div></div>
    <div style="margin-top:10px;display:flex;gap:8px">
      <select id="paymentMethod" class="input" style="width:50%">
        <option value="pix">PIX</option>
        <option value="dinheiro">Dinheiro</option>
        <option value="cartao">Cartão</option>
      </select>
      <button class="btn" onclick="finalize()">${t("finalizar")}</button>
    </div>
  `;
  el.appendChild(footer);
}

function renderTimeSelect(it){
  if(!it.times || it.times.length===0) return "";
  let html = `<select class="input" onchange="changeTime('${it.id}', this.value)">${it.times.map(ti=>`<option value="${ti}">${ti}</option>`).join("")}</select>`;
  return html;
}

function finalize(){
  if(cart.length===0){ alert("Nenhum passeio selecionado."); return; }
  // validate names and times
  for(const it of cart){
    if(!it.names || it.names.trim().length<2){
      if(!confirm(`Não há nomes cadastrados para ${it.title}. Deseja continuar?`)==true) return;
    }
    if(it.times && it.times.length>0 && !it.chosenTime){
      alert("Escolha horário para cada passeio."); return;
    }
  }
  // build message
  const totals = calculateTotals();
  let msg = `Olá! Gostaria de reservar:\n`;
  cart.forEach(it=>{
    msg += `\n• ${it.title}\n  ${it.quantity} x R$ ${it.price.toFixed(2)}\n  Horário: ${it.chosenTime || "-"}\n  Nomes: ${it.names || "-"}\n`;
  });
  msg += `\nTaxa preservação: R$ ${totals.preservation.toFixed(2)}\nTaxa maquininha: R$ ${totals.cardFees.toFixed(2)}\nTotal: R$ ${totals.total.toFixed(2)}\nForma de pagamento: ${document.getElementById("paymentMethod") ? document.getElementById("paymentMethod").value : ""}\n\nPor favor confirme disponibilidade.`;
  const url = `https://wa.me/${PHONE_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

/* --- Helpers para iniciar tours list dinamicamente --- */
const TOURS = [
  // lancha
  {
    id:"lancha",
    title:"Passeio de Lancha - 1,5h",
    price:70.00,
    preservation:10.00,
    cardFee:5.00,
    duration:"1.5h",
    times:["10:00 - 11:30","11:30 - 13:00","13:00 - 14:30","14:30 - 16:00","16:00 - Pôr do sol"],
    images:[
      "https://picsum.photos/id/1018/800/600",
      "https://picsum.photos/id/1015/800/600",
      "https://picsum.photos/id/1025/800/600",
      "https://picsum.photos/id/1035/800/600",
      "https://picsum.photos/id/1043/800/600"
    ],
    excerpt:"Passeio de lancha com paradas para banho e paisagens incríveis."
  },
  // quadriciclo
  {
    id:"quadri",
    title:"Passeio Quadriciclo - 2h",
    price:240.00,
    preservation:10.00,
    cardFee:5.00,
    duration:"2h",
    times:["09:20 - 11:20","13:00 - 15:00","15:30 - 17:30"],
    images:[
      "https://picsum.photos/id/1003/800/600",
      "https://picsum.photos/id/1001/800/600",
      "https://picsum.photos/id/1011/800/600",
      "https://picsum.photos/id/1005/800/600",
      "https://picsum.photos/id/1012/800/600"
    ],
    excerpt:"Aventura com quadriciclo pelas trilhas e dunas."
  },
  // 4x4 (consultar)
  {
    id:"4x4",
    title:"Passeio 4x4 - Consulte valores",
    price:0.00,
    preservation:0.00,
    cardFee:0.00,
    duration:"Consulte",
    times:[],
    images:[
      "https://picsum.photos/id/1050/800/600",
      "https://picsum.photos/id/1051/800/600",
      "https://picsum.photos/id/1052/800/600",
      "https://picsum.photos/id/1053/800/600",
      "https://picsum.photos/id/1054/800/600"
    ],
    excerpt:"Passeio 4x4 — consulte valores e horários pelo WhatsApp."
  },
  // catamarã
  {
    id:"catamara",
    title:"Catamarã - 2h30",
    price:65.00,
    preservation:10.00,
    cardFee:5.00,
    duration:"2h30",
    times:["09:30"],
    images:[
      "https://picsum.photos/id/1060/800/600",
      "https://picsum.photos/id/1061/800/600",
      "https://picsum.photos/id/1062/800/600",
      "https://picsum.photos/id/1063/800/600",
      "https://picsum.photos/id/1064/800/600"
    ],
    excerpt:"Relax no catamarã com música e paradas para banho."
  },
  // buggy
  {
    id:"buggy",
    title:"Passeio Buggy - Consulte valores",
    price:0.00,
    preservation:0.00,
    cardFee:0.00,
    duration:"Consulte",
    times:[],
    images:[
      "https://picsum.photos/id/1070/800/600",
      "https://picsum.photos/id/1071/800/600",
      "https://picsum.photos/id/1072/800/600",
      "https://picsum.photos/id/1073/800/600",
      "https://picsum.photos/id/1074/800/600"
    ],
    excerpt:"Buggy — consulte valores e horários pelo WhatsApp."
  }
];

function buildToursList(containerId, tourIds){
  const cont = document.getElementById(containerId);
  if(!cont) return;
  cont.innerHTML = "";
  tourIds.forEach(id=>{
    const tdata = TOURS.find(tt=>tt.id===id);
    if(!tdata) return;
    const el = document.createElement("div");
    el.className="card";
    el.innerHTML = `
      <img src="${tdata.images[0]}" alt="${tdata.title}">
      <h3>${tdata.title}</h3>
      <p class="small">${tdata.excerpt}</p>
      <div style="display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:8px">
        <div><strong>R$ ${tdata.price.toFixed(2)}</strong></div>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick='addToCart(${JSON.stringify(tdata).replaceAll("'", "\\'")})'>${t("selecionar")}</button>
          <a class="btn secondary" href="#${tdata.id}">${t("verDetalhes")}</a>
        </div>
      </div>
    `;
    cont.appendChild(el);
  });
}

function buildTourDetails(targetId, tourId){
  const tdata = TOURS.find(tt=>tt.id===tourId);
  const el = document.getElementById(targetId);
  if(!tdata || !el) return;
  el.innerHTML = `
    <div class="hero-card">
      <h2 id="${tdata.id}">${tdata.title}</h2>
      <div class="markers">
        <div class="marker">${tdata.duration}</div>
        <div class="marker">R$ ${tdata.price.toFixed(2)}</div>
        <div class="marker">${tdata.times.length? tdata.times.join(" • ") : "Consultar horário"}</div>
      </div>
      <div class="tour-gallery" style="margin-top:12px">
        <div>
          <div class="photos-grid">
            ${tdata.images.slice(0,4).map(src=>`<img src="${src}" alt="">`).join("")}
          </div>
          <img src="${tdata.images[4]}" style="width:100%;height:260px;object-fit:cover;border-radius:8px;margin-top:8px"/>
        </div>
        <div class="tour-sidebar">
          <div class="tour-price">R$ ${tdata.price.toFixed(2)}</div>
          <div class="small" style="margin-top:6px">Taxa preservação: R$ ${tdata.preservation.toFixed(2)}</div>
          <div class="small">Taxa maquininha: R$ ${tdata.cardFee.toFixed(2)}</div>
          <p style="margin-top:10px">${tdata.excerpt}</p>
          <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn" onclick='addToCart(${JSON.stringify(tdata).replaceAll("'", "\\'")})'>${t("selecionar")}</button>
            <a class="btn secondary" href="reserva.html">${t("reservar")}</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* --- on load --- */
window.addEventListener("DOMContentLoaded", ()=>{
  applyTranslations();
  renderCart();

  // if pages include containers, build lists
  buildToursList("list-a", ["lancha","quadri","4x4"]);
  buildToursList("list-b", ["catamara","buggy"]);
  // build details for each tour if placeholder exists
  ["lancha","quadri","4x4","catamara","buggy"].forEach(id=>{
    buildTourDetails("details-"+id, id);
  });

  // language toggle
  const langBtn = document.getElementById("langToggle");
  if(langBtn) langBtn.addEventListener("click", ()=>{
    SITE_LANG.current = SITE_LANG.current === "pt" ? "en" : "pt";
    applyTranslations();
    renderCart();
  });
});
