/****************************************************
 * TESORERÍA MGP V1
 * FRONTEND
 ****************************************************/

// ==================================================
// CONFIGURACIÓN
// ==================================================

const CONFIG = {

    // IMPORTANTE:
    // Aquí colocaremos posteriormente la URL
    // de nuestra API de Google Apps Script.
    API_URL: ''

};


// ==================================================
// ELEMENTOS DEL DOM
// ==================================================

const btnIngreso = document.getElementById('btnIngreso');
const btnEgreso = document.getElementById('btnEgreso');

const formulario = document.getElementById('formulario');
const movimientoForm = document.getElementById('movimientoForm');

const btnCerrarFormulario =
    document.getElementById('btnCerrarFormulario');

const btnCancelar =
    document.getElementById('btnCancelar');

const btnGuardar =
    document.getElementById('btnGuardar');

const tituloFormulario =
    document.getElementById('tituloFormulario');

const tipoInput =
    document.getElementById('tipo');

const fechaInput =
    document.getElementById('fecha');

const boletaInput =
    document.getElementById('boleta');

const cantidadInput =
    document.getElementById('cantidad');

const descripcionInput =
    document.getElementById('descripcion');

const importeUnitarioInput =
    document.getElementById('importeUnitario');

const importeTotalInput =
    document.getElementById('importeTotal');

const tablaMovimientos =
    document.getElementById('tablaMovimientos');

const totalIngresos =
    document.getElementById('totalIngresos');

const totalEgresos =
    document.getElementById('totalEgresos');

const saldo =
    document.getElementById('saldo');

const fechaDesde =
    document.getElementById('fechaDesde');

const fechaHasta =
    document.getElementById('fechaHasta');

const btnGenerarReporte =
    document.getElementById('btnGenerarReporte');

const btnDescargarReporte =
    document.getElementById('btnDescargarReporte');


// ==================================================
// INICIO
// ==================================================

document.addEventListener('DOMContentLoaded', function () {

    establecerFechaActual();

    configurarEventos();

    calcularImporteTotal();

});


// ==================================================
// EVENTOS
// ==================================================

function configurarEventos() {

    btnIngreso.addEventListener('click', function () {

        abrirFormulario('INGRESO');

    });


    btnEgreso.addEventListener('click', function () {

        abrirFormulario('EGRESO');

    });


    btnCerrarFormulario.addEventListener(
        'click',
        cerrarFormulario
    );


    btnCancelar.addEventListener(
        'click',
        cerrarFormulario
    );


    movimientoForm.addEventListener(
        'submit',
        guardarMovimiento
    );


    cantidadInput.addEventListener(
        'input',
        calcularImporteTotal
    );


    importeUnitarioInput.addEventListener(
        'input',
        calcularImporteTotal
    );


    btnGenerarReporte.addEventListener(
        'click',
        generarReporte
    );


    btnDescargarReporte.addEventListener(
        'click',
        descargarReporte
    );

}


// ==================================================
// FORMULARIO
// ==================================================

function abrirFormulario(tipo) {

    tipoInput.value = tipo;

    if (tipo === 'INGRESO') {

        tituloFormulario.textContent =
            'Registrar ingreso';

    } else {

        tituloFormulario.textContent =
            'Registrar egreso';

    }

    formulario.classList.remove('oculto');

    movimientoForm.reset();

    tipoInput.value = tipo;

    establecerFechaActual();

    importeTotalInput.value = 'S/ 0.00';

    boletaInput.focus();

    formulario.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

}


function cerrarFormulario() {

    formulario.classList.add('oculto');

    movimientoForm.reset();

    tipoInput.value = '';

    importeTotalInput.value = 'S/ 0.00';

    establecerFechaActual();

}


// ==================================================
// FECHA
// ==================================================

function establecerFechaActual() {

    const hoy = new Date();

    const anio =
        hoy.getFullYear();

    const mes =
        String(hoy.getMonth() + 1)
            .padStart(2, '0');

    const dia =
        String(hoy.getDate())
            .padStart(2, '0');

    const fecha =
        `${anio}-${mes}-${dia}`;

    fechaInput.value = fecha;

}


// ==================================================
// CÁLCULO
// ==================================================

function calcularImporteTotal() {

    const cantidad =
        Number(cantidadInput.value) || 0;

    const importeUnitario =
        Number(importeUnitarioInput.value) || 0;

    const total =
        cantidad * importeUnitario;

    importeTotalInput.value =
        formatearMoneda(total);

}


// ==================================================
// FORMATO MONETARIO
// ==================================================

function formatearMoneda(valor) {

    const numero =
        Number(valor) || 0;

    return 'S/ ' +
        numero.toLocaleString(
            'es-PE',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


// ==================================================
// GUARDAR MOVIMIENTO
// ==================================================

async function guardarMovimiento(evento) {

    evento.preventDefault();

    const datos = {

        fecha:
            fechaInput.value,

        tipo:
            tipoInput.value,

        boleta:
            boletaInput.value.trim(),

        cantidad:
            Number(cantidadInput.value),

        descripcion:
            descripcionInput.value.trim(),

        importeUnitario:
            Number(importeUnitarioInput.value)

    };


    // Validaciones básicas

    if (!datos.fecha) {

        alert('Seleccione una fecha.');

        return;

    }


    if (!datos.boleta) {

        alert('Ingrese el número de boleta.');

        boletaInput.focus();

        return;

    }


    if (!datos.cantidad || datos.cantidad <= 0) {

        alert('La cantidad debe ser mayor que cero.');

        cantidadInput.focus();

        return;

    }


    if (!datos.descripcion) {

        alert('Ingrese una descripción.');

        descripcionInput.focus();

        return;

    }


    if (
        isNaN(datos.importeUnitario) ||
        datos.importeUnitario < 0
    ) {

        alert('Ingrese un importe unitario válido.');

        importeUnitarioInput.focus();

        return;

    }


    // ------------------------------------------------
    // POR AHORA
    // ------------------------------------------------
    //
    // La conexión con Apps Script se realizará
    // en el siguiente paso.
    //

    if (!CONFIG.API_URL) {

        alert(
            'El formulario está listo, pero todavía falta conectar la API de Google Apps Script.'
        );

        return;

    }


    try {

        btnGuardar.disabled = true;

        btnGuardar.textContent =
            'Guardando...';


        const respuesta =
            await enviarAPI(
                'registrarMovimiento',
                datos
            );


        if (!respuesta.ok) {

            throw new Error(
                respuesta.mensaje ||
                'No se pudo registrar el movimiento.'
            );

        }


        alert(
            'Movimiento registrado correctamente.'
        );


        cerrarFormulario();


        await cargarDatos();


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            'Ocurrió un error al registrar el movimiento.'
        );

    } finally {

        btnGuardar.disabled = false;

        btnGuardar.textContent =
            'Guardar movimiento';

    }

}


// ==================================================
// COMUNICACIÓN CON API
// ==================================================

async function enviarAPI(accion, datos = {}) {

    const url =
        `${CONFIG.API_URL}?accion=${encodeURIComponent(accion)}`;


    const opciones = {

        method: 'POST',

        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },

        body: JSON.stringify(datos)

    };


    const respuesta =
        await fetch(url, opciones);


    if (!respuesta.ok) {

        throw new Error(
            'Error de comunicación con el servidor.'
        );

    }


    return await respuesta.json();

}


// ==================================================
// CARGAR DATOS
// ==================================================

async function cargarDatos() {

    if (!CONFIG.API_URL) {

        return;

    }


    try {

        const respuesta =
            await enviarAPI(
                'obtenerDatos'
            );


        if (!respuesta.ok) {

            throw new Error(
                respuesta.mensaje ||
                'No se pudieron cargar los datos.'
            );

        }


        actualizarResumen(
            respuesta.resumen
        );


        mostrarMovimientos(
            respuesta.movimientos
        );


    } catch (error) {

        console.error(
            'Error cargando datos:',
            error
        );

    }

}


// ==================================================
// ACTUALIZAR RESUMEN
// ==================================================

function actualizarResumen(datos) {

    if (!datos) {
        return;
    }


    totalIngresos.textContent =
        formatearMoneda(
            datos.totalIngresos
        );


    totalEgresos.textContent =
        formatearMoneda(
            datos.totalEgresos
        );


    saldo.textContent =
        formatearMoneda(
            datos.saldo
        );

}


// ==================================================
// MOSTRAR MOVIMIENTOS
// ==================================================

function mostrarMovimientos(movimientos) {

    tablaMovimientos.innerHTML = '';


    if (
        !movimientos ||
        movimientos.length === 0
    ) {

        tablaMovimientos.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="tabla-vacia">

                    No hay movimientos registrados.

                </td>

            </tr>

        `;

        return;

    }


    movimientos.forEach(function (movimiento) {

        const fila =
            document.createElement('tr');


        const claseTipo =
            movimiento.tipo === 'INGRESO'
                ? 'tipo-ingreso'
                : 'tipo-egreso';


        fila.innerHTML = `

            <td>
                ${escaparHTML(movimiento.fecha)}
            </td>

            <td>
                <span class="${claseTipo}">
                    ${escaparHTML(movimiento.tipo)}
                </span>
            </td>

            <td>
                ${escaparHTML(movimiento.boleta)}
            </td>

            <td>
                ${escaparHTML(movimiento.descripcion)}
            </td>

            <td>
                ${Number(movimiento.cantidad || 0)}
            </td>

            <td>
                ${formatearMoneda(
                    movimiento.importeUnitario
                )}
            </td>

            <td>
                <strong>
                    ${formatearMoneda(
                        movimiento.importeTotal
                    )}
                </strong>
            </td>

        `;


        tablaMovimientos.appendChild(fila);

    });

}


// ==================================================
// REPORTE
// ==================================================

function generarReporte() {

    const desde =
        fechaDesde.value;

    const hasta =
        fechaHasta.value;


    if (!desde || !hasta) {

        alert(
            'Seleccione la fecha inicial y final.'
        );

        return;

    }


    if (desde > hasta) {

        alert(
            'La fecha inicial no puede ser mayor que la fecha final.'
        );

        return;

    }


    if (!CONFIG.API_URL) {

        alert(
            'El reporte está listo, pero todavía falta conectar la API.'
        );

        return;

    }


    // La generación real del reporte
    // la conectaremos en el siguiente paso.

    console.log(
        'Generar reporte:',
        desde,
        hasta
    );

}


function descargarReporte() {

    const desde =
        fechaDesde.value;

    const hasta =
        fechaHasta.value;


    if (!desde || !hasta) {

        alert(
            'Seleccione la fecha inicial y final.'
        );

        return;

    }


    if (desde > hasta) {

        alert(
            'La fecha inicial no puede ser mayor que la fecha final.'
        );

        return;

    }


    if (!CONFIG.API_URL) {

        alert(
            'La descarga estará disponible cuando conectemos la API.'
        );

        return;

    }


    console.log(
        'Descargar reporte:',
        desde,
        hasta
    );

}


// ==================================================
// SEGURIDAD BÁSICA
// ==================================================

function escaparHTML(valor) {

    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}
