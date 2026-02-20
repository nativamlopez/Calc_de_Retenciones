// ============================
// Calculadora basada en tu lógica Python
// + UI tipo "pantalla" (como la imagen)
// + Monto neto en palabras
// ============================
let tipoActual = "Factura";
const $ = (id) => document.getElementById(id);

function round2(x){
  return Math.round((Number(x) + Number.EPSILON) * 100) / 100;
}

function ceil2(x){
  return Math.ceil((Number(x) - 1e-12) * 100) / 100;
}

function calcularMontos({ tipo, bien, liquido }) {
  const liq = Number(liquido);
  if (!Number.isFinite(liq) || liq < 0) return [NaN,NaN,NaN,NaN,NaN,NaN];

  if (tipo === "Factura" || tipo === "Peaje") {
    const mn = round2(liq);
    return [mn, 0, 0, 0, 0, mn];
  }

  if (tipo === "Recibo") {
    const porcentaje = (bien === "SI") ? 92 : 84;

    const mn = round2(liq * 100 / porcentaje);

    // clave para que sea como tu captura (ej 3.27)
    const it = ceil2(mn * 0.03);

    const iue   = (bien === "SI")  ? round2(mn * 0.05) : 0;
    const rciva = (bien !== "SI")  ? round2(mn * 0.13) : 0;

    const total = round2(it + iue + rciva);
    return [mn, it, iue, rciva, total, round2(liq)];
  }

  if (tipo === "Viatico" || tipo === "Viático") {
    const mn = round2(liq * 100 / 87);
    const rciva = round2(mn * 0.13);
    return [mn, 0, 0, rciva, rciva, round2(liq)];
  }

  if (tipo === "Planilla" || tipo === "DJ") {
    const mn = round2(liq * 100 / 84);
    const it = round2(mn * 0.03);
    const rciva = round2(mn * 0.13);
    const total = round2(it + rciva);
    return [mn, it, 0, rciva, total, round2(liq)];
  }

  return [NaN,NaN,NaN,NaN,NaN,NaN];
}

function money(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ============================
   Número a palabras (ES)
   - Soporta millones
   - Devuelve formato: "CIENTO OCHO 70/100 BOLIVIANOS"
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

  // millones
  if (n >= 1_000_000){
    const m = Math.floor(n / 1_000_000);
    const rest = n % 1_000_000;
    const mm = (m === 1) ? "UN MILLÓN" : `${toWordsES_int(m)} MILLONES`;
    const rr = rest ? toWordsES_int(rest) : "";
    return [mm, rr].filter(Boolean).join(" ").trim();
  }

  // miles
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

  const abs = Math.abs(x);
  const entero = Math.floor(abs + 1e-9);
  const cent = Math.round((abs - entero) * 100);

  let palabras = toWordsES_int(entero);

  // Ajuste típico: "UNO" -> "UN" antes de "BOLIVIANOS"
  // (solo si termina exactamente en "UNO")
  palabras = palabras.replace(/\bUNO\b$/, "UN");

  const cents = `${twoDigits(cent)}/100`;
  const moneda = (entero === 1) ? "BOLIVIANO" : "BOLIVIANOS";

  const signo = x < 0 ? "MENOS " : "";
  return `${signo}${palabras} ${cents} ${moneda}`.trim();
}

function setCells([mn, it, iue, rciva, total, liq]) {
  $("mn").textContent = money(mn);
  $("it").textContent = money(it);
  $("iue").textContent = money(iue);
  $("rciva").textContent = money(rciva);
  $("total").textContent = money(total);
  $("liqOut").textContent = money(liq);

  // ✅ monto neto en palabras
  $("mnWords").textContent = Number.isFinite(Number(mn)) ? montoEnPalabras(mn) : "—";
}

function updateBienVisibility() {
  const wrap = $("bienWrap");
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

// Init
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
  const bien = $("bien").checked ? "SI" : "NO";
  const liquido = $("liquido").value;

  const res = calcularMontos({ tipo, bien, liquido });
  setCells(res);
  $("hint").textContent = buildHint(tipo, bien);
});

/* ==========================
   CUSTOM SELECT LOGIC
========================== */

const selected = document.getElementById("selectedTipo");
const items = document.querySelector(".select-items");

selected.addEventListener("click", () => {
  items.classList.toggle("select-hide");
});

items.querySelectorAll("div").forEach(opt => {
  opt.addEventListener("click", () => {

    tipoActual = opt.dataset.value;
    selected.textContent = opt.textContent;

    items.classList.add("select-hide");

    updateBienVisibility();
    $("hint").textContent =
      buildHint(tipoActual, $("bien").checked ? "SI" : "NO");
  });
});

document.addEventListener("click", e=>{
  if(!e.target.closest(".custom-select")){
    items.classList.add("select-hide");
  }
});
