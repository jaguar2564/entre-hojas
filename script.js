/* =====================================================================
   BLOQUE A: VARIABLES
   ===================================================================== */
const cuadernos = [
  { nombre: "Cuaderno sencillo", costo: 2000, tiempo: 0.5 },       // Posición 0
  { nombre: "Cuaderno personalizado", costo: 3000, tiempo: 0.75 }  // Posición 1
];

const gastosf = [
  { concepto: "Alquiler de un espacio compartido", importe: 45000 },
  { concepto: "Abono de internet", importe: 15000 }
];


const VALORES_INICIALES = ["40", "20"];
const HORAS_INICIALES = "40";
let temporizadorAviso = null;  // guarda el temporizador del aviso "Datos restablecidos"

/* =====================================================================
   BLOQUE B: FUNCIONES
   ===================================================================== */


// Suma los importes de todos los gastos fijos.
function calcularGastosFijos(lgastosf) {
  let total = 0;
  lgastosf.forEach(function (dgastosf) { total += dgastosf.importe; });
  return total;
}

// Costo variable de un cuaderno = cantidad × costo unitario.
function calcularCostoVariable(dcuadernos, cantidad) {
  return cantidad * dcuadernos.costo;
}

// Suma cantidad × tiempo unitario de cada cuaderno.
function calcularHorasNecesarias(lcuadernos, lcantidades) {
  let total = 0;
  for (let i = 0; i < lcuadernos.length; i++) {
    total += lcantidades[i] * lcuadernos[i].tiempo;
  }
  return total;
}

// Cuenta unidades completas con un ciclo; la fracción sobrante se descarta.
function calcularCapacidad(dcuadernos, horasDisponibles) {
  let unidades = 0;
  while ((unidades + 1) * dcuadernos.tiempo <= horasDisponibles) {
    unidades++;
  }
  return unidades;
}

function redondear(n) { return Math.round(n * 100) / 100; }

// Compara horas disponibles con necesarias y arma el mensaje según el caso.
function evaluarProduccion(lcantidades, horasNecesarias, horasDisponibles) {
  const diferencia = redondear(horasDisponibles - horasNecesarias);
  const hayProduccion = lcantidades.some(function (c) { return c > 0; });

  if (!hayProduccion) {
    return { estado: "sin-produccion", diferencia: diferencia,
      texto: "Sin producción prevista: ambas cantidades son cero. Quedan " + formatoHoras(horasDisponibles) + "." };
  }
  if (diferencia > 0) {
    return { estado: "sobra", diferencia: diferencia,
      texto: "Podés realizar la producción prevista. Te quedan " + formatoHoras(diferencia) + " disponibles." };
  }
  if (diferencia === 0) {
    return { estado: "exacto", diferencia: 0,
      texto: "El tiempo alcanza exactamente para la producción prevista." };
  }
  return { estado: "falta", diferencia: diferencia,
    texto: "Falta tiempo: necesitás " + formatoHoras(Math.abs(diferencia)) + " más para completar la producción." };
}

/* ---------- Lectura y validación ---------- */

// Convierte el texto del input en número. Acepta coma o punto decimal.
function convertirNumero(texto) {
  const limpio = texto.trim().replace(",", ".");
  if (limpio === "") return { error: "está vacío" };
  if (!/^-?\d+(\.\d+)?$/.test(limpio)) return { error: "no es un número válido" };
  return { valor: Number(limpio) };
}

// Valida un campo: vacío, no numérico, negativo o decimal (si debe ser entero).
function validarCampo(texto, nombre, esEntero) {
  const r = convertirNumero(texto);
  if (r.error) return { error: "En " + nombre + ": el dato " + r.error + "." };
  if (r.valor < 0) return { error: "En " + nombre + ": no se admiten valores negativos." };
  if (esEntero && !Number.isInteger(r.valor)) return { error: "En " + nombre + ": ingresá un número entero, sin decimales." };
  return { valor: r.valor };
}

// Lee los tres campos del formulario y devuelve los datos y la lista de errores.
function leerFormulario() {
  const errores = [];
  const datos = { cantidades: [] };

  for (let i = 0; i < cuadernos.length; i++) {
    const idCampo = "cantidad-" + i;
    const r = validarCampo(document.getElementById(idCampo).value, "la cantidad de " + cuadernos[i].nombre.toLowerCase(), true);
    if (r.error) errores.push({ campo: idCampo, mensaje: r.error });
    else datos.cantidades[i] = r.valor;
  }

  const h = validarCampo(document.getElementById("horas").value, "horas disponibles", false);
  if (h.error) errores.push({ campo: "horas", mensaje: h.error });
  else datos.horas = h.valor;

  return { datos: datos, errores: errores };
}

/* ---------- Presentación ---------- */
function formatoPesos(n) { return "$ " + n.toLocaleString("es-AR"); }

function formatoHoras(n) {
  const t = redondear(n).toLocaleString("es-AR", { maximumFractionDigits: 2 });
  return t + (redondear(n) === 1 ? " hora" : " horas");
}

function formatoH(n) { return redondear(n).toLocaleString("es-AR", { maximumFractionDigits: 2 }) + " h"; }

function mostrarGastosFijos() {
  const lista = document.getElementById("lista-fijos");
  lista.innerHTML = "";
  gastosf.forEach(function (dgastosf) {
    lista.innerHTML += `<li><span>${dgastosf.concepto}</span> <span>${formatoPesos(dgastosf.importe)}</span></li>`;
  });
  document.getElementById("total-fijo").textContent = formatoPesos(calcularGastosFijos(gastosf));
}

function mostrarAyudas() {
  for (let i = 0; i < cuadernos.length; i++) {
    document.getElementById("ayuda-" + i).textContent =
      formatoPesos(cuadernos[i].costo) + " en materiales · " + cuadernos[i].tiempo.toLocaleString("es-AR") + " h por unidad";
  }
}

function limpiarErrores() {
  const caja = document.getElementById("errores");
  caja.hidden = true;
  caja.innerHTML = "";
  document.querySelectorAll("input").forEach(function (i) {
    i.classList.remove("invalido");
    i.removeAttribute("aria-invalid");
  });
}

function limpiarResultados() {
  document.getElementById("resultados").innerHTML =
    '<p class="vacio">Completá los datos y presioná <strong>Calcular</strong> para ver los gastos, las horas necesarias y la capacidad de producción.</p>';
}

// Muestra los errores, marca los campos y retira los resultados anteriores.
function mostrarErrores(lerrores) {
  limpiarErrores();
  limpiarResultados();
  const caja = document.getElementById("errores");
  let html = "<p>Revisá estos datos:</p><ul>";
  lerrores.forEach(function (derrores) {
    html += "<li>" + derrores.mensaje + "</li>";
    const input = document.getElementById(derrores.campo);
    input.classList.add("invalido");
    input.setAttribute("aria-invalid", "true");
  });
  caja.innerHTML = html + "</ul>";
  caja.hidden = false;
  document.getElementById(lerrores[0].campo).focus();
}

// Arma el HTML de los resultados con template strings.
function mostrarResultados(r) {
  let filasVariables = "";
  r.variables.forEach(function (dvariables) {
    filasVariables += `<div class="fila"><span>Materiales: ${dvariables.nombre}</span><span>${formatoPesos(dvariables.costo)}</span></div>`;
  });

  const nombre0 = cuadernos[0].nombre.toLowerCase();
  const nombre1 = cuadernos[1].nombre.toLowerCase();

  document.getElementById("resultados").innerHTML = `
    <div class="gasto-total">
      <span>Gasto mensual previsto</span>
      <strong>${formatoPesos(r.gastoMensual)}</strong>
      <small>Gastos fijos + costos variables</small>
    </div>
    <div class="desglose">
      <div class="fila"><span>Gastos fijos</span><span>${formatoPesos(r.fijos)}</span></div>
      ${filasVariables}
      <div class="fila total"><span>Total de costos variables</span><span>${formatoPesos(r.totalVariables)}</span></div>
    </div>

    <h3>Cómo se distribuye tu tiempo</h3>
    <div class="par">
      <div class="dato"><span>Horas necesarias</span><strong>${formatoH(r.horasNecesarias)}</strong></div>
      <div class="dato"><span>Horas disponibles</span><strong>${formatoH(r.horasDisponibles)}</strong></div>
    </div>
    <p class="estado ${r.produccion.estado}">${r.produccion.texto}</p>

    <h3>Capacidad máxima por modelo</h3>
    <p class="ayuda">Si dedicás todas las horas a un único modelo:</p>
    <div class="capacidades">
      <div class="dato centro"><strong>${r.capacidades[0]}</strong> <span>unidades de ${nombre0}</span></div>
      <span class="o">o</span>
      <div class="dato centro"><strong>${r.capacidades[1]}</strong> <span>unidades de ${nombre1}</span></div>
    </div>
    <div class="aclaracion">
      <h4>Son dos posibilidades diferentes</h4>
      <p>Con ${formatoHoras(r.horasDisponibles)} podés fabricar hasta ${r.capacidades[0]} unidades de ${nombre0} si dedicás todo el tiempo a ese modelo, o hasta ${r.capacidades[1]} unidades de ${nombre1} si dedicás todo el tiempo a ese otro modelo.</p>
      <p>Estas cantidades no se suman: cada cálculo utiliza las mismas horas disponibles. Si fabricás ambos modelos, tenés que repartir ese tiempo y comprobar que la suma de las horas necesarias no lo supere.</p>
    </div>`;
}

/* ---------- Eventos ---------- */

// Se ejecuta al presionar "Calcular": lee, valida, calcula y muestra.
function calcular(evento) {
  evento.preventDefault();               // procesa sin recargar la página
  const lectura = leerFormulario();

  if (lectura.errores.length > 0) {      // datos inválidos: no se calcula
    mostrarErrores(lectura.errores);
    return;
  }
  limpiarErrores();

  const d = lectura.datos;
  const variables = [];
  const capacidades = [];
  let totalVariables = 0;

  for (let i = 0; i < cuadernos.length; i++) {
    const costo = calcularCostoVariable(cuadernos[i], d.cantidades[i]);
    variables.push({ nombre: cuadernos[i].nombre, costo: costo });
    totalVariables += costo;
    capacidades.push(calcularCapacidad(cuadernos[i], d.horas));
  }

  const fijos = calcularGastosFijos(gastosf);
  const horasNecesarias = calcularHorasNecesarias(cuadernos, d.cantidades);

  mostrarResultados({
    fijos: fijos,
    variables: variables,
    totalVariables: totalVariables,
    gastoMensual: fijos + totalVariables,
    horasNecesarias: horasNecesarias,
    horasDisponibles: d.horas,
    produccion: evaluarProduccion(d.cantidades, horasNecesarias, d.horas),
    capacidades: capacidades
  });
}

// Se ejecuta al presionar "Restablecer" (registrado con jQuery).
function restablecer() {
  for (let i = 0; i < cuadernos.length; i++) {
    document.getElementById("cantidad-" + i).value = VALORES_INICIALES[i];
  }
  document.getElementById("horas").value = HORAS_INICIALES;
  limpiarErrores();
  limpiarResultados();

  clearTimeout(temporizadorAviso);       // cancela la espera anterior
  $("#aviso").text("Datos restablecidos").show();
  temporizadorAviso = setTimeout(function () {
    $("#aviso").hide().text("");         // retira el aviso a los 3 segundos
  }, 3000);
}

/* =====================================================================
   BLOQUE C: EJECUCIÓN
   Punto de partida del programa: se ejecuta cuando la página termina de cargar.
   ===================================================================== */
document.addEventListener("DOMContentLoaded", function () {
  mostrarGastosFijos();
  mostrarAyudas();
  document.getElementById("formulario").addEventListener("submit", calcular);
  $("#btn-restablecer").on("click", restablecer);   // jQuery
});
