let atributos = [];
let datosOriginales = [];
let configuracionDiscretizacion = {};

document.getElementById("excelFile").addEventListener("change", leerExcel);

function leerExcel(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        datosOriginales = rows;
        mostrarTablaOriginal(rows);
        calcularEntropiaGanancia(rows);
    };
    reader.readAsArrayBuffer(file);
}

function generarFormulario() {
    const n = parseInt(document.getElementById("numAttrs").value);
    const form = document.getElementById("atributosForm");
    form.innerHTML = "";
    atributos = [];

    for (let i = 0; i < n - 1; i++) {
        form.innerHTML += `<h4>Atributo ${i + 1}</h4>`;
        form.innerHTML += `<label>Nombre: <input type="text" id="nombre${i}" value="A${i + 1}"></label><br>`;
        form.innerHTML += `
          <label>Tipo:
            <select id="tipo${i}" onchange="mostrarConfiguracionRangos(${i})">
              <option value="nominal">Nominal</option>
              <option value="numerico">Numérico</option>
            </select>
          </label><br>
          <div id="configRangos${i}" style="display:none; background:#e8f4fd; padding:10px; margin:10px 0; border-radius:5px;">
            <label>X1 (valor mínimo): <input type="number" id="x1_${i}" value="10" step="0.1"></label><br><br>
            <label>X2 (valor máximo): <input type="number" id="x2_${i}" value="40" step="0.1"></label><br><br>
            <div id="preview${i}" style="background:#fff; padding:8px; border-radius:3px; font-weight:bold;">
              Rangos generados: &lt;<span id="previewX1_${i}">10</span>, 
              <span id="previewX1_${i}_2">10</span>-<span id="previewX2_${i}">40</span>, 
              &gt;<span id="previewX2_${i}_2">40</span>
            </div>
          </div><hr>
        `;
    }

    form.innerHTML += `
        <button type="button" onclick="crearTablaManual()">Crear tabla manual</button>
      `;

    for (let i = 0; i < n - 1; i++) {
        const tipoSelect = document.getElementById(`tipo${i}`);
        if (tipoSelect) tipoSelect.addEventListener("change", () => mostrarConfiguracionRangos(i));
        const x1 = document.getElementById(`x1_${i}`);
        const x2 = document.getElementById(`x2_${i}`);
        if (x1) x1.addEventListener("input", () => actualizarPreview(i));
        if (x2) x2.addEventListener("input", () => actualizarPreview(i));
    }
}

function mostrarConfiguracionRangos(attrIndex) {
    const tipoSelect = document.getElementById(`tipo${attrIndex}`);
    const configDiv = document.getElementById(`configRangos${attrIndex}`);
    if (tipoSelect.value === "numerico") {
        configDiv.style.display = "block";
        actualizarPreview(attrIndex);
    } else {
        configDiv.style.display = "none";
    }
}

function actualizarPreview(attrIndex) {
    const x1 = document.getElementById(`x1_${attrIndex}`).value || 10;
    const x2 = document.getElementById(`x2_${attrIndex}`).value || 40;
    document.querySelectorAll(`#previewX1_${attrIndex}, #previewX1_${attrIndex}_2`).forEach((el) => (el.textContent = x1));
    document.querySelectorAll(`#previewX2_${attrIndex}, #previewX2_${attrIndex}_2`).forEach((el) => (el.textContent = x2));
}

function crearTablaManual() {
    atributos = [];
    configuracionDiscretizacion = {};
    const numAttrs = parseInt(document.getElementById("numAttrs").value);

    for (let i = 0; i < numAttrs - 1; i++) {
        const nombre = document.getElementById(`nombre${i}`).value || `A${i + 1}`;
        const tipo = document.getElementById(`tipo${i}`).value;
        atributos.push({ nombre, tipo, indice: i });

        if (tipo === "numerico") {
            const x1 = parseFloat(document.getElementById(`x1_${i}`).value) || 10;
            const x2 = parseFloat(document.getElementById(`x2_${i}`).value) || 40;
            if (x1 >= x2) {
                alert(`Error en ${nombre}: X1 (${x1}) debe ser menor que X2 (${x2})`);
                return;
            }
            configuracionDiscretizacion[nombre] = [`<${x1}`, `${x1}-${x2}`, `>${x2}`];
        }
    }

    let html = `<h3>Ingresa los valores para 10 instancias</h3>`;
    html += `<table><tr>`;
    atributos.forEach((attr) => {
        if (attr.tipo === "nominal") {
            html += `<th>${attr.nombre} <br><small>(Ingresa 1, 2 o 3)</small></th>`;
        } else {
            html += `<th>${attr.nombre} <br><small>(Selecciona rango)</small></th>`;
        }
    });
    html += `<th>Clase (1=Pos, 0=Neg)</th></tr>`;

    for (let i = 0; i < 10; i++) {
        html += `<tr>`;
        atributos.forEach((attr, j) => {
            if (attr.tipo === "nominal") {
                html += `<td><input type="number" id="cell-${i}-${j}" min="1" max="3" step="1" /></td>`;
            } else {
                html += `<td><select id="cell-${i}-${j}">`;
                html += `<option value="">Seleccionar...</option>`;
                configuracionDiscretizacion[attr.nombre].forEach((rango) => {
                    html += `<option value="${rango}">${rango}</option>`;
                });
                html += `</select></td>`;
            }
        });
        html += `<td><select id="cell-${i}-clase"><option value="1">1</option><option value="0">0</option></select></td>`;
        html += `</tr>`;
    }

    html += `</table><button onclick="leerTablaManual()">Calcular Árbol</button>`;
    document.getElementById("tablaManual").innerHTML = html;
}

// Función para generar tabla aleatoria editable con atributos por defecto
function generarTablaAleatoriaDirecta() {
    atributos = [
        { nombre: "A1", tipo: "nominal", indice: 0 },
        { nombre: "A2", tipo: "nominal", indice: 1 },
        { nombre: "A3", tipo: "numerico", indice: 2 },
    ];

    configuracionDiscretizacion = {};

    atributos.forEach(attr => {
        if (attr.tipo === "numerico") {
            const x1 = Math.floor(Math.random() * 20) + 1;
            const x2 = x1 + Math.floor(Math.random() * 30) + 1;
            configuracionDiscretizacion[attr.nombre] = [`<${x1}`, `${x1}-${x2}`, `>${x2}`];
        }
    });

    const data = [];
    const headers = atributos.map(a => a.nombre).concat("Clase");
    data.push(headers);

    for (let i = 0; i < 10; i++) {
        let fila = [];
        for (let attr of atributos) {
            if (attr.tipo === "nominal") {
                fila.push(Math.floor(Math.random() * 3) + 1);
            } else {
                const rangos = configuracionDiscretizacion[attr.nombre];
                fila.push(rangos[Math.floor(Math.random() * rangos.length)]);
            }
        }
        fila.push(Math.random() < 0.5 ? 0 : 1);
        data.push(fila);
    }

    datosOriginales = data;
    mostrarTablaOriginal(data);
    calcularEntropiaGanancia(data);

    // Limpiar la tablaManual para que no haya formulario editable visible
    document.getElementById("tablaManual").innerHTML = "";
}


function leerTablaManual() {
    const data = [];
    const headers = atributos.map((a) => a.nombre).concat("Clase");
    data.push(headers);

    for (let i = 0; i < 10; i++) {
        let fila = [];
        for (let j = 0; j < atributos.length; j++) {
            let val = document.getElementById(`cell-${i}-${j}`).value;
            if (!val) {
                alert(`Error en fila ${i + 1}, atributo ${atributos[j].nombre}.`);
                return;
            }
            if (atributos[j].tipo === "nominal") {
                if (!["1", "2", "3"].includes(val)) {
                    alert(`Valor inválido en fila ${i + 1}, atributo ${atributos[j].nombre}. Debe ser 1, 2 o 3.`);
                    return;
                }
            }
            fila.push(val);
        }
        fila.push(parseInt(document.getElementById(`cell-${i}-clase`).value));
        data.push(fila);
    }

    datosOriginales = data;
    mostrarTablaOriginal(data);
    calcularEntropiaGanancia(data);
}

function mostrarTablaOriginal(datos) {
    let html = "<table><tr>";
    datos[0].forEach((col) => (html += `<th>${col}</th>`));
    html += "</tr>";
    for (let i = 1; i < datos.length; i++) {
        html += "<tr>";
        datos[i].forEach((c) => (html += `<td>${c}</td>`));
        html += "</tr>";
    }
    html += "</table>";
    document.getElementById("tablaOriginal").innerHTML = html;
}

function calcularEntropiaGanancia(data) {
  const resultados = document.getElementById("resultados");
  resultados.style.display = "block";

  const headers = data[0];
  const rows = data.slice(1);

  const total = rows.length;
  const pos = rows.filter(r => r[r.length - 1] == 1).length;
  const neg = total - pos;

  // Calcular partes de la entropía total
  let entropyTotal = 0;
  let pasosEntropia = "";

  if (pos === 0 || neg === 0) {
    entropyTotal = 0;
    pasosEntropia = `<p>Como todas las instancias son de una sola clase, la entropía es 0.</p>`;
  } else {
    const pPos = pos / total;
    const pNeg = neg / total;
    const termPos = -pPos * Math.log2(pPos);
    const termNeg = -pNeg * Math.log2(pNeg);
    entropyTotal = termPos + termNeg;

    pasosEntropia = `
      <p>Total instancias: ${total}</p>
      <p>Positivas: ${pos} → p = ${pPos.toFixed(3)}</p>
      <p>Negativas: ${neg} → p = ${pNeg.toFixed(3)}</p>
      <p>Cálculo de entropía:</p>
      <ul>
        <li>- p(Pos) log₂(p(Pos)) = - ${pPos.toFixed(3)} × log₂(${pPos.toFixed(3)}) = ${termPos.toFixed(3)}</li>
        <li>- p(Neg) log₂(p(Neg)) = - ${pNeg.toFixed(3)} × log₂(${pNeg.toFixed(3)}) = ${termNeg.toFixed(3)}</li>
      </ul>
      <p><b>Entropía total = ${entropyTotal.toFixed(3)}</b></p>
    `;
  }

  let pasoAPaso = `<h3>Entropía General</h3>${pasosEntropia}`;

  pasoAPaso += `<h3>Ganancias por atributo</h3>`;

  let maxGain = -1;
  let nodoRaiz = "";

  for (let i = 0; i < headers.length - 1; i++) {
    const map = {};
    for (let r of rows) {
      const val = r[i];
      if (!map[val]) map[val] = { pos: 0, neg: 0 };
      if (r[r.length - 1] == 1) map[val].pos++;
      else map[val].neg++;
    }

    let e = 0;
    let det = `<ul>`;
    for (let key in map) {
      const group = map[key];
      const subtotal = group.pos + group.neg;
      const pGroupPos = group.pos / subtotal || 0;
      const pGroupNeg = group.neg / subtotal || 0;
      const eGroup = entropia(group.pos, group.neg);
      e += (subtotal / total) * eGroup;
      det += `<li><b>${key}</b> → ${group.pos} positivas, ${group.neg} negativas (Entropía = ${eGroup.toFixed(3)})<br>
        &nbsp;&nbsp; Cálculo: -(${pGroupPos.toFixed(3)})log₂(${pGroupPos.toFixed(3)}) - (${pGroupNeg.toFixed(3)})log₂(${pGroupNeg.toFixed(3)}) = ${eGroup.toFixed(3)}
      </li>`;
    }
    det += `</ul>`;

    const gain = entropyTotal - e;
    pasoAPaso += `<h4>${headers[i]}</h4>${det}<p>Ganancia = ${entropyTotal.toFixed(3)} - ${e.toFixed(3)} = <b>${gain.toFixed(3)}</b></p>`;

    if (gain > maxGain) {
      maxGain = gain;
      nodoRaiz = headers[i];
    }
  }

  resultados.innerHTML = `
    ${pasoAPaso}
    <h3>Nodo Raíz</h3>
    <p><b>${nodoRaiz}</b> (atributo con mayor ganancia)</p>
  `;
}


function entropia(p, n) {
    const total = p + n;
    if (p === 0 || n === 0) return 0;
    const pp = p / total,
        pn = n / total;
    return -pp * Math.log2(pp) - pn * Math.log2(pn);
}

function limpiarPagina() {
    atributos = [];
    configuracionDiscretizacion = {};
    datosOriginales = [];

    document.getElementById("atributosForm").innerHTML = "";
    document.getElementById("tablaManual").innerHTML = "";
    document.getElementById("tablaOriginal").innerHTML = "";
    document.getElementById("resultados").innerHTML = "";

    // Opcional: Reiniciar el número de atributos a 3 por defecto
    document.getElementById("numAttrs").value = 3;
}