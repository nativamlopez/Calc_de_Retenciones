// ============================
// Calculadora (ENTEROS en centavos)
// + UI tipo "pantalla"
// + Monto neto en palabras
// ============================

let tipoActual = "Factura";
const $ = (id) => document.getElementById(id);

/* ============================
   ENTEROS (centavos) para precisión
   - Recomendado: SCALE = 100 (centavos)
   - Si INSISTES en x10: cambia a 10 (pero pierdes precisión a 2 decimales)
   ============================ */
const SCALE = 100;

function toIntMoney(x){
  const n = Number(x);
  if (!Number.isFinite(n)) return NaN;
  return Math.round((n + Number.EPSILON) * SCALE);
}
function fromIntMoney(i){
  return i / SCALE;
}

// división entera con redondeo al más cercano
function divRound(numer, denom){
  if (denom === 0) return NaN;
  const sign = Math.sign(numer) * Math.sign(denom) || 1;
  numer = Math.abs(numer);
  denom = Math.abs(denom);
  return sign * Math.floor((numer + denom / 2) / denom);
}

// división entera con CEIL (hacia arriba)
function divCeil(numer, denom){
  if (denom === 0) return NaN;
  const sign = Math.sign(numer) * Math.sign(denom) || 1;
  numer = Math.abs(numer);
  denom = Math.abs(denom);
  return sign * Math.floor((numer + denom - 1) / denom);
}

function pctRound(montoInt, pct){
  // montoInt * pct / 100 (redondeo normal)
  return divRound(montoInt * pct, 100);
}
function pctCeil(montoInt, pct){
  // montoInt * pct / 100 (ceil)
  return divCeil(montoInt * pct, 100);
}

/* ============================
   Cálculo de montos (TODO en enteros)
   Devuelve valores como Number en decimal (al final)
   ============================ */
function calcularMontos({ tipo, bien, liquido }) {
  const liqI = toIntMoney(liquido); // ENTERO (centavos)
  if (!Number.isFinite(liqI) || liqI < 0) return [NaN,NaN,NaN,NaN,NaN,NaN];

  // Factura / Peaje: MN = líquido
  if (tipo === "Factura" || tipo === "Peaje") {
    const mnI = liqI;
    return [fromIntMoney(mnI), 0, 0, 0, 0, fromIntMoney(liqI)];
  }

  // Recibo
  if (tipo === "Recibo") {
    const porcentaje = (bien === "SI") ? 92 : 84;

    // 1) MN "teórico" por fórmula (solo para calcular retenciones)
    const mnTheoryI = divRound(liqI * 100, porcentaje);

    // 2) Retenciones sobre MN teórico
    const itI = pctCeil(mnTheoryI, 3);
    const iueI   = (bien === "SI") ? pctRound(mnTheoryI, 5)  : 0;
    const rcivaI = (bien !== "SI") ? pctRound(mnTheoryI, 13) : 0;

    const totalI = itI + iueI + rcivaI;

    // 3) ✅ Reconciliación: fuerza MN = Líquido + Retenciones
    const mnI = liqI + totalI;

    return [
      fromIntMoney(mnI),
      fromIntMoney(itI),
      fromIntMoney(iueI),
      fromIntMoney(rcivaI),
      fromIntMoney(totalI),
      fromIntMoney(liqI),
    ];
  }

  // Viático
  if (tipo === "Viatico" || tipo === "Viático") {
    const mnTheoryI = divRound(liqI * 100, 87);
    const rcivaI = pctRound(mnTheoryI, 13);
    const totalI = rcivaI;

    const mnI = liqI + totalI; // ✅ reconciliado

    return [
      fromIntMoney(mnI),
      0,
      0,
      fromIntMoney(rcivaI),
      fromIntMoney(totalI),
      fromIntMoney(liqI),
    ];
  }

  // Planilla / DJ
  if (tipo === "Planilla" || tipo === "DJ") {
    const mnTheoryI = divRound(liqI * 100, 84);
    const itI = pctRound(mnTheoryI, 3);
    const rcivaI = pctRound(mnTheoryI, 13);
    const totalI = itI + rcivaI;

    const mnI = liqI + totalI; // ✅ reconciliado

    return [
      fromIntMoney(mnI),
      fromIntMoney(itI),
      0,
      fromIntMoney(rcivaI),
      fromIntMoney(totalI),
      fromIntMoney(liqI),
    ];
  }

  return [NaN,NaN,NaN,NaN,NaN,NaN];
}

/* ============================
   Formato de dinero
   ============================ */
function money(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ============================
   Número a palabras (ES)
   - Soporta millones
   - Devuelve: "CIENTO OCHO 70/100 BOLIVIANOS"
   ============================ */
function twoDigits(n){ return String(n).padStart(2, "0"); }

function toWordsES_int(n){
  n = Math.floor(Math.abs(n));
  if (n === 0) return "CERO";

  const unidades = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const especiales = {
    10:"DIEZ", 11:"ONCE", 12:"DOCE", 13:"TRECE", 14:"CATORCE", 15:"QUINCE",
    16:"DIECISÉIS", 17:"DIECISIETE", 18:"DIECIOCHO", 19:"DIECINUEVE",
    20:"VEINTE", 21:"VEINTIUNO", 22:"VEINTIDÓS", 23:"VEINTITRÉS", 24:"VEINTICUATRO",
    25:"VEINTICINCO", 26:"VEINTISÉIS", 27:"VEINTISIETE", 28:"VEINTIOCHO", 29:"VEINTINUEVE"
  };
  const decenas = ["", "","", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  function menosDe100(x){
    if (x < 10) return unidades[x];
    if (x in especiales) return especiales[x];
    const d = Math.floor(x / 10);
    const u = x % 10;
    return u === 0 ? decenas[d] : `${decenas[d]} Y ${unidades[u]}`;
  }

  function menosDe1000(x){
    if (x === 0) return "";
    if (x === 100) return "CIEN";
    const c = Math.floor(x / 100);
    const r = x % 100;
    const a = c ? centenas[c] : "";
    const b = r ? menosDe100(r) : "";
    return [a, b].filter(Boolean).join(" ").trim();
  }

  if (n >= 1_000_000){
    const m = Math.floor(n / 1_000_000);
    const rest = n % 1_000_000;
    const mm = (m === 1) ? "UN MILLÓN" : `${toWordsES_int(m)} MILLONES`;
    const rr = rest ? toWordsES_int(rest) : "";
    return [mm, rr].filter(Boolean).join(" ").trim();
  }

  if (n >= 1000){
    const t = Math.floor(n / 1000);
    const rest = n % 1000;
    const tt = (t === 1) ? "MIL" : `${menosDe1000(t)} MIL`;
    const rr = rest ? menosDe1000(rest) : "";
    return [tt, rr].filter(Boolean).join(" ").trim();
  }

  return menosDe1000(n);
}

function montoEnPalabras(monto){
  const x = Number(monto);
  if (!Number.isFinite(x)) return "—";

  const red = Math.round((x + Number.EPSILON) * 100) / 100;

  const abs = Math.abs(red);
  let entero = Math.floor(abs);
  let cent = Math.round((abs - entero) * 100);

  if (cent === 100) {
    entero += 1;
    cent = 0;
  }

  let palabras = toWordsES_int(entero);
  palabras = palabras.replace(/\bUNO\b$/, "UN");

  const cents = `${twoDigits(cent)}/100`;
  const moneda = (entero === 1) ? "BOLIVIANO" : "BOLIVIANOS";
  const signo = red < 0 ? "MENOS " : "";

  return `${signo}${palabras} ${cents} ${moneda}`.trim();
}

/* ============================
   UI helpers
   ============================ */
function setCells([mn, it, iue, rciva, total, liq]) {
  $("mn").textContent = money(mn);
  $("it").textContent = money(it);
  $("iue").textContent = money(iue);
  $("rciva").textContent = money(rciva);
  $("total").textContent = money(total);
  $("liqOut").textContent = money(liq);

  $("mnWords").textContent = Number.isFinite(Number(mn)) ? montoEnPalabras(mn) : "—";
}

function updateBienVisibility() {
  const wrap = $("bienWrap");
  if (!wrap) return;
  const isRecibo = (tipoActual === "Recibo");
  wrap.style.display = isRecibo ? "flex" : "none";
}

function buildHint(tipo, bien) {
  if (tipo === "Recibo") {
    return `Recibo: porcentaje ${bien === "SI" ? "92%" : "84%"}; IT 3%; ${bien === "SI" ? "IUE 5%" : "RC-IVA 13%"}.`;
  }
  if (tipo === "Viatico" || tipo === "Viático") return "Viático: MN = líquido * 100 / 87; RC-IVA 13%.";
  if (tipo === "Planilla") return "Planilla: MN = líquido * 100 / 84; IT 3%; RC-IVA 13%.";
  if (tipo === "DJ") return "DJ: MN = líquido * 100 / 84; IT 3%; RC-IVA 13%.";
  return "Factura/Peaje: MN = líquido; sin retenciones.";
}

/* ============================
   INIT
   ============================ */
updateBienVisibility();
$("hint").textContent = buildHint(tipoActual, $("bien")?.checked ? "SI" : "NO");
setCells([NaN, NaN, NaN, NaN, NaN, NaN]);

$("bien")?.addEventListener("change", () => {
  const bien = $("bien")?.checked ? "SI" : "NO";
  $("hint").textContent = buildHint(tipoActual, bien);
});

$("form").addEventListener("submit", (e) => {
  e.preventDefault();

  const tipo = tipoActual;
  const bien = $("bien")?.checked ? "SI" : "NO";
  const liquido = $("liquido")?.value;

  const res = calcularMontos({ tipo, bien, liquido });
  setCells(res);
  $("hint").textContent = buildHint(tipo, bien);
});

/* ==========================
   CUSTOM SELECT LOGIC
========================== */
const selected = document.getElementById("selectedTipo");
const items = document.querySelector(".select-items");

selected?.addEventListener("click", () => {
  items?.classList.toggle("select-hide");
});

items?.querySelectorAll("div").forEach(opt => {
  opt.addEventListener("click", () => {
    tipoActual = opt.dataset.value;
    selected.textContent = opt.textContent;

    items.classList.add("select-hide");

    updateBienVisibility();
    $("hint").textContent = buildHint(tipoActual, $("bien")?.checked ? "SI" : "NO");
  });
});

document.addEventListener("click", e=>{
  if(!e.target.closest(".custom-select")){
    items?.classList.add("select-hide");
  }
});
