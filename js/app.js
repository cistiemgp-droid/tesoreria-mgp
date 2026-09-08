/****************************************************
 * TESORERÍA MGP V1
 * FRONTEND
 ****************************************************/

// ==================================================
// CONFIGURACIÓN
// ==================================================

const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbxiODFMTjypL7GmoLZjMfpxUk_UmnMt2WgLmbkNyEE9eI2Tnnnxp4BOhVQZrRfLJkWH/exec',
    STORAGE_TOKEN: 'TESORERIA_MGP_TOKEN',
    API_TIMEOUT_MS: 15000
};


// ==================================================
// ELEMENTOS DEL DOM
// ==================================================

const pantallaLogin =
    document.getElementById('pantallaLogin');

const aplicacion =
    document.getElementById('aplicacion');

const loginForm =
    document.getElementById('loginForm');

const loginUsuario =
    document.getElementById('loginUsuario');

const loginPassword =
    document.getElementById('loginPassword');

const btnLogin =
    document.getElementById('btnLogin');

const loginMensaje =
    document.getElementById('loginMensaje');

const btnCerrarSesion =
    document.getElementById('btnCerrarSesion');


const btnIngreso =
    document.getElementById('btnIngreso');

const btnEgreso =
    document.getElementById('btnEgreso');

const formulario =
    document.getElementById('formulario');

const movimientoForm =
    document.getElementById('movimientoForm');

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

const btnDescargarExcel =
    document.getElementById('btnDescargarExcel');

const btnDescargarPDF =
    document.getElementById('btnDescargarPDF');

const resultadoReporte =
    document.getElementById('resultadoReporte');

let movimientoEditandoId = null;
let movimientosActuales = [];


// ==================================================
// INICIO
// ==================================================

document.addEventListener('DOMContentLoaded', function () {

    configurarEventosLogin();

    configurarEventos();

    establecerFechaActual();

    calcularImporteTotal();

    // Estado inicial seguro: SOLO LOGIN visible.
    mostrarLogin();
    comprobarSesion();

});


// ==================================================
// LOGIN
// ==================================================

function configurarEventosLogin() {

    loginForm.addEventListener(
        'submit',
        iniciarSesion
    );

    btnCerrarSesion.addEventListener(
        'click',
        cerrarSesion
    );

}


function mostrarLoginMensaje(mensaje, error = false) {

    loginMensaje.textContent = mensaje;
    loginMensaje.style.display = 'block';

    if (error) {
        loginMensaje.style.color = '#b91c1c';
    } else {
        loginMensaje.style.color = '#166534';
    }

}


async function iniciarSesion(evento) {

    evento.preventDefault();

    const usuario = loginUsuario.value.trim();
    const password = loginPassword.value;

    if (!usuario) {
        mostrarLoginMensaje(
            'Ingrese el usuario.',
            true
        );
        loginUsuario.focus();
        return;
    }

    if (!password) {
        mostrarLoginMensaje(
            'Ingrese la contraseña.',
            true
        );
        loginPassword.focus();
        return;
    }

    if (!CONFIG.API_URL) {
        mostrarLoginMensaje(
            'La API no está configurada.',
            true
        );
        return;
    }

    try {

        btnLogin.disabled = true;
        btnLogin.textContent = 'Verificando...';

        mostrarLoginMensaje(
            'Conectando con el servidor...'
        );

        const respuesta = await enviarAPI(
            'login',
            {
                usuario: usuario,
                password: password
            },
            false
        );

        if (!respuesta || !respuesta.ok) {

            throw new Error(
                respuesta &&
                (respuesta.error || respuesta.mensaje)
                    ? (respuesta.error || respuesta.mensaje)
                    : 'Usuario o contraseña incorrectos.'
            );

        }

        if (!respuesta.token) {
            throw new Error(
                'El servidor no devolvió el token de sesión.'
            );
        }

        localStorage.setItem(
            CONFIG.STORAGE_TOKEN,
            respuesta.token
        );

        mostrarAplicacion();

        loginForm.reset();

        try {

            await cargarDatos();

        } catch (error) {

            console.error(
                'La sesión inició correctamente, pero no se pudieron cargar los datos:',
                error
            );

        }

    } catch (error) {

        console.error(
            'Error de inicio de sesión:',
            error
        );

        mostrarLoginMensaje(
            error.message ||
            'No se pudo iniciar sesión.',
            true
        );

    } finally {

        btnLogin.disabled = false;
        btnLogin.textContent = 'Iniciar sesión';

    }

}


async function comprobarSesion() {

    const token = localStorage.getItem(
        CONFIG.STORAGE_TOKEN
    );

    if (!token) {

        mostrarLogin();

        return;
    }

    try {

        mostrarAplicacion();

        const respuesta = await enviarAPI(
            'obtenerDatos'
        );

        if (!respuesta || !respuesta.ok) {
            throw new Error(
                respuesta &&
                (respuesta.error || respuesta.mensaje)
                    ? (respuesta.error || respuesta.mensaje)
                    : 'Sesión inválida.'
            );
        }

        actualizarResumen(
            respuesta.resumen
        );

        mostrarMovimientos(
            respuesta.movimientos
        );

    } catch (error) {

        console.warn(
            'Sesión no válida:',
            error
        );

        localStorage.removeItem(
            CONFIG.STORAGE_TOKEN
        );

        mostrarLogin();

    }

}


function mostrarAplicacion() {

    pantallaLogin.hidden = true;
    pantallaLogin.style.display = 'none';

    aplicacion.hidden = false;
    aplicacion.style.display = 'block';

}


function mostrarLogin() {

    aplicacion.hidden = true;
    aplicacion.style.display = 'none';

    pantallaLogin.hidden = false;
    pantallaLogin.style.display = 'flex';

    loginMensaje.style.display = 'none';

    setTimeout(function () {
        loginUsuario.focus();
    }, 0);

}


async function cerrarSesion() {

    const token = localStorage.getItem(
        CONFIG.STORAGE_TOKEN
    );

    try {

        if (token) {

            await enviarAPI(
                'logout',
                {
                    token: token
                }
            );

        }

    } catch (error) {

        console.warn(
            'No se pudo notificar el cierre de sesión:',
            error
        );

    } finally {

        localStorage.removeItem(
            CONFIG.STORAGE_TOKEN
        );

        movimientoForm.reset();

        tipoInput.value = '';

        importeTotalInput.value = 'S/ 0.00';

        formulario.classList.add('oculto');

        mostrarLogin();

    }

}


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

    btnDescargarExcel.addEventListener(
        'click',
        descargarReporteExcel
    );

    btnDescargarPDF.addEventListener(
        'click',
        descargarReportePDF
    );

    tablaMovimientos.addEventListener('click', function (evento) {
        const boton = evento.target.closest('button[data-accion]');
        if (!boton) return;
        const accion = boton.dataset.accion;
        const id = boton.dataset.id;
        if (accion === 'editar') editarMovimientoDesdeTabla(id);
        if (accion === 'anular') anularMovimientoDesdeTabla(id);
    });

}


// ==================================================
// FORMULARIO
// ==================================================

function abrirFormulario(tipo, movimiento = null) {

    movimientoEditandoId = movimiento ? String(movimiento.id || '') : null;

    tipoInput.value = tipo;

    if (tipo === 'INGRESO') {
        tituloFormulario.textContent = 'Registrar ingreso';
    } else {
        tituloFormulario.textContent = 'Registrar egreso';
    }

    formulario.classList.remove('oculto');
    movimientoForm.reset();
    tipoInput.value = tipo;

    if (movimiento) {
        fechaInput.value = movimiento.fecha || '';
        boletaInput.value = movimiento.boleta || '';
        cantidadInput.value = movimiento.cantidad ?? '';
        descripcionInput.value = movimiento.descripcion || '';
        importeUnitarioInput.value = movimiento.importeUnitario ?? '';
        btnGuardar.textContent = 'Actualizar movimiento';
    } else {
        establecerFechaActual();
        importeTotalInput.value = 'S/ 0.00';
        btnGuardar.textContent = 'Guardar movimiento';
    }

    calcularImporteTotal();
    boletaInput.focus();

    formulario.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}


function cerrarFormulario() {

    formulario.classList.add('oculto');

    movimientoEditandoId = null;
    movimientoForm.reset();
    tipoInput.value = '';
    importeTotalInput.value = 'S/ 0.00';
    btnGuardar.textContent = 'Guardar movimiento';
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

    const token =
        localStorage.getItem(
            CONFIG.STORAGE_TOKEN
        );

    if (!token) {

        mostrarLogin();

        return;

    }

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


        const accion = movimientoEditandoId
            ? 'editarMovimiento'
            : 'registrarMovimiento';

        const datosEnvio = movimientoEditandoId
            ? { ...datos, id: movimientoEditandoId }
            : datos;

        const respuesta =
            await enviarAPI(
                accion,
                datosEnvio
            );


        if (!respuesta.ok) {

            throw new Error(
                respuesta.error ||
                respuesta.mensaje ||
                'No se pudo registrar el movimiento.'
            );

        }


        alert(
            movimientoEditandoId
                ? 'Movimiento actualizado correctamente.'
                : 'Movimiento registrado correctamente.'
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

async function enviarAPI(
    accion,
    datos = {},
    incluirToken = true
) {

    const url =
        `${CONFIG.API_URL}?accion=${encodeURIComponent(accion)}`;

    const datosEnvio = {
        ...datos
    };

    if (
        incluirToken &&
        !datosEnvio.token
    ) {

        const token =
            localStorage.getItem(
                CONFIG.STORAGE_TOKEN
            );

        if (token) {
            datosEnvio.token = token;
        }

    }

    const controlador =
        new AbortController();

    const temporizador =
        setTimeout(
            function () {
                controlador.abort();
            },
            CONFIG.API_TIMEOUT_MS
        );

    try {

        const respuesta =
            await fetch(
                url,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'text/plain;charset=utf-8'
                    },
                    body:
                        JSON.stringify(datosEnvio),
                    cache: 'no-store',
                    redirect: 'follow',
                    signal:
                        controlador.signal
                }
            );

        if (!respuesta.ok) {

            throw new Error(
                'El servidor respondió con error HTTP ' +
                respuesta.status +
                '.'
            );

        }

        const texto =
            await respuesta.text();

        if (!texto) {

            throw new Error(
                'El servidor no devolvió una respuesta.'
            );

        }

        try {

            return JSON.parse(texto);

        } catch (error) {

            console.error(
                'Respuesta recibida del servidor:',
                texto
            );

            throw new Error(
                'El servidor devolvió una respuesta no válida.'
            );

        }

    } catch (error) {

        if (error.name === 'AbortError') {

            throw new Error(
                'No se pudo conectar con el servidor de Tesorería. ' +
                'La solicitud superó los 15 segundos.'
            );

        }

        if (
            error instanceof TypeError ||
            error.message === 'Failed to fetch'
        ) {

            throw new Error(
                'No se pudo comunicar con Google Apps Script. ' +
                'Verifique la publicación de la API y su acceso.'
            );

        }

        throw error;

    } finally {

        clearTimeout(temporizador);

    }

}


// ==================================================
// CARGAR DATOS
// ==================================================

async function cargarDatos() {

    const token =
        localStorage.getItem(
            CONFIG.STORAGE_TOKEN
        );

    if (!CONFIG.API_URL || !token) {

        return;

    }


    try {

        const respuesta =
            await enviarAPI(
                'obtenerDatos'
            );


        if (!respuesta.ok) {

            throw new Error(
                respuesta.error ||
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

        if (
            error.message &&
            (
                error.message
                    .toLowerCase()
                    .includes('sesión') ||
                error.message
                    .toLowerCase()
                    .includes('token')
            )
        ) {

            localStorage.removeItem(
                CONFIG.STORAGE_TOKEN
            );

            mostrarLogin();

        }

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

    movimientosActuales = Array.isArray(movimientos)
        ? movimientos.slice()
        : [];

    tablaMovimientos.innerHTML = '';

    if (movimientosActuales.length === 0) {
        tablaMovimientos.innerHTML = `
            <tr>
                <td colspan="8" class="tabla-vacia">
                    No hay movimientos registrados.
                </td>
            </tr>
        `;
        return;
    }

    movimientosActuales.forEach(function (movimiento) {
        const fila = document.createElement('tr');
        const claseTipo = movimiento.tipo === 'INGRESO'
            ? 'tipo-ingreso'
            : 'tipo-egreso';
        const estadoAnulado = String(movimiento.estado || '').toUpperCase() === 'ANULADO';

        if (estadoAnulado) fila.classList.add('movimiento-anulado');

        const acciones = estadoAnulado
            ? '<span class="estado-anulado">ANULADO</span>'
            : `
                <button type="button" class="btn-tabla btn-editar" data-accion="editar" data-id="${escaparHTML(movimiento.id)}">Editar</button>
                <button type="button" class="btn-tabla btn-anular" data-accion="anular" data-id="${escaparHTML(movimiento.id)}">Anular</button>
              `;

        fila.innerHTML = `
            <td>${escaparHTML(movimiento.fecha)}</td>
            <td><span class="${claseTipo}">${escaparHTML(movimiento.tipo)}</span></td>
            <td>${escaparHTML(movimiento.boleta)}</td>
            <td>${escaparHTML(movimiento.descripcion)}</td>
            <td>${Number(movimiento.cantidad || 0)}</td>
            <td>${formatearMoneda(movimiento.importeUnitario)}</td>
            <td><strong>${formatearMoneda(movimiento.importeTotal)}</strong></td>
            <td class="celda-acciones">${acciones}</td>
        `;

        tablaMovimientos.appendChild(fila);
    });
}

function obtenerMovimientoPorId(id) {
    return movimientosActuales.find(function (movimiento) {
        return String(movimiento.id) === String(id);
    }) || null;
}

function editarMovimientoDesdeTabla(id) {
    const movimiento = obtenerMovimientoPorId(id);
    if (!movimiento) {
        alert('No se encontró el movimiento seleccionado.');
        return;
    }
    if (String(movimiento.estado || '').toUpperCase() === 'ANULADO') {
        alert('No se puede editar un movimiento anulado.');
        return;
    }
    abrirFormulario(movimiento.tipo, movimiento);
}

async function anularMovimientoDesdeTabla(id) {
    const movimiento = obtenerMovimientoPorId(id);
    if (!movimiento) {
        alert('No se encontró el movimiento seleccionado.');
        return;
    }
    if (String(movimiento.estado || '').toUpperCase() === 'ANULADO') {
        alert('El movimiento ya está anulado.');
        return;
    }

    const motivo = window.prompt('Ingrese el motivo de la anulación:', '');
    if (motivo === null) return;
    if (!motivo.trim()) {
        alert('Debe indicar el motivo de la anulación.');
        return;
    }

    const token = localStorage.getItem(CONFIG.STORAGE_TOKEN);
    if (!token) {
        mostrarLogin();
        return;
    }

    try {
        const respuesta = await enviarAPI('anularMovimiento', {
            id: id,
            motivo: motivo.trim()
        });

        if (!respuesta || !respuesta.ok) {
            throw new Error(
                respuesta && (respuesta.error || respuesta.mensaje)
                    ? (respuesta.error || respuesta.mensaje)
                    : 'No se pudo anular el movimiento.'
            );
        }

        alert('Movimiento anulado correctamente.');
        await cargarDatos();
    } catch (error) {
        console.error(error);
        alert(error.message || 'Ocurrió un error al anular el movimiento.');
    }
}

// ==================================================
// REPORTE
// ==================================================

function obtenerDatosReporte() {

    const desde = fechaDesde.value;
    const hasta = fechaHasta.value;

    if (!desde || !hasta) {
        alert('Seleccione la fecha inicial y final.');
        return null;
    }

    if (desde > hasta) {
        alert('La fecha inicial no puede ser mayor que la fecha final.');
        return null;
    }

    const datos = movimientosActuales.filter(function (movimiento) {
        const fecha = String(movimiento.fecha || '');
        return fecha >= desde && fecha <= hasta;
    });

    const ingresos = datos.filter(function (movimiento) {
        return String(movimiento.tipo || '').toUpperCase() === 'INGRESO';
    });

    const egresos = datos.filter(function (movimiento) {
        return String(movimiento.tipo || '').toUpperCase() === 'EGRESO';
    });

    let totalIngresos = 0;
    let totalEgresos = 0;
    let anulados = 0;

    ingresos.forEach(function (movimiento) {
        const anulado = String(movimiento.estado || '').toUpperCase() === 'ANULADO';
        if (anulado) {
            anulados++;
            return;
        }
        totalIngresos += Number(movimiento.importeTotal) || 0;
    });

    egresos.forEach(function (movimiento) {
        const anulado = String(movimiento.estado || '').toUpperCase() === 'ANULADO';
        if (anulado) {
            anulados++;
            return;
        }
        totalEgresos += Number(movimiento.importeTotal) || 0;
    });

    return {
        desde: desde,
        hasta: hasta,
        datos: datos,
        ingresos: ingresos,
        egresos: egresos,
        totalIngresos: totalIngresos,
        totalEgresos: totalEgresos,
        saldo: totalIngresos - totalEgresos,
        anulados: anulados
    };
}

function formatearFechaReporte(fecha) {
    const texto = String(fecha || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
    const partes = texto.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function formatearNumeroReporte(valor) {
    const numero = Number(valor) || 0;
    return numero.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function generarFilasReporteHTML(lista) {

    if (!lista.length) {
        return '<tr><td colspan="7" class="tabla-vacia">No hay movimientos en esta sección.</td></tr>';
    }

    return lista.map(function (movimiento) {

        const anulado = String(movimiento.estado || '').toUpperCase() === 'ANULADO';
        const clase = anulado ? 'movimiento-anulado' : '';
        const estado = anulado
            ? '<span class="estado-anulado">ANULADO</span>'
            : '<span class="estado-activo">ACTIVO</span>';

        return `
            <tr class="${clase}">
                <td>${escaparHTML(formatearFechaReporte(movimiento.fecha))}</td>
                <td>${escaparHTML(movimiento.boleta)}</td>
                <td>${escaparHTML(movimiento.descripcion)}</td>
                <td>${Number(movimiento.cantidad || 0)}</td>
                <td>${formatearMoneda(movimiento.importeUnitario)}</td>
                <td><strong>${formatearMoneda(movimiento.importeTotal)}</strong></td>
                <td>${estado}</td>
            </tr>
        `;
    }).join('');
}

function generarBloqueReporteHTML(titulo, clase, lista, total) {

    return `
        <section class="reporte-seccion ${clase}">
            <div class="reporte-seccion-titulo">
                <h3>${titulo}</h3>
                <strong>${formatearMoneda(total)}</strong>
            </div>

            <div class="tabla-contenedor reporte-tabla">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>N° Boleta</th>
                            <th>Descripción</th>
                            <th>Cantidad</th>
                            <th>Importe Unitario</th>
                            <th>Importe Total</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generarFilasReporteHTML(lista)}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

function generarReporte() {

    const reporte = obtenerDatosReporte();
    if (!reporte) return;

    resultadoReporte.innerHTML = `
        <div class="reporte-cabecera">
            <div>
                <span class="reporte-etiqueta">TESORERÍA</span>
                <h2>Tesorería MGP</h2>
                <p>Reporte de movimientos</p>
            </div>
            <div class="reporte-periodo">
                <span>Período</span>
                <strong>${formatearFechaReporte(reporte.desde)} — ${formatearFechaReporte(reporte.hasta)}</strong>
            </div>
        </div>

        ${generarBloqueReporteHTML(
            'INGRESOS',
            'reporte-ingresos',
            reporte.ingresos,
            reporte.totalIngresos
        )}

        ${generarBloqueReporteHTML(
            'EGRESOS',
            'reporte-egresos',
            reporte.egresos,
            reporte.totalEgresos
        )}

        <section class="reporte-resumen-final">
            <div class="reporte-resumen-titulo">
                <h3>RESUMEN DEL PERÍODO</h3>
                <span>${reporte.datos.length} movimiento(s)</span>
            </div>

            <div class="reporte-resumen-cards">
                <div class="resumen-reporte-card ingreso">
                    <span>Total ingresos</span>
                    <strong>${formatearMoneda(reporte.totalIngresos)}</strong>
                </div>
                <div class="resumen-reporte-card egreso">
                    <span>Total egresos</span>
                    <strong>${formatearMoneda(reporte.totalEgresos)}</strong>
                </div>
                <div class="resumen-reporte-card saldo">
                    <span>Saldo</span>
                    <strong>${formatearMoneda(reporte.saldo)}</strong>
                </div>
                <div class="resumen-reporte-card cantidad">
                    <span>Movimientos</span>
                    <strong>${reporte.datos.length}</strong>
                </div>
                <div class="resumen-reporte-card anulados">
                    <span>Anulados</span>
                    <strong>${reporte.anulados}</strong>
                </div>
            </div>
        </section>

        <p class="reporte-nota">
            Los movimientos ANULADOS se muestran como referencia y no se consideran en los totales.
        </p>
    `;

    resultadoReporte.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function prepararFilasExcel(lista) {

    return lista.map(function (movimiento) {
        const anulado = String(movimiento.estado || '').toUpperCase() === 'ANULADO';

        return [
            formatearFechaReporte(movimiento.fecha),
            movimiento.boleta || '',
            movimiento.descripcion || '',
            Number(movimiento.cantidad) || 0,
            Number(movimiento.importeUnitario) || 0,
            Number(movimiento.importeTotal) || 0,
            anulado ? 'ANULADO' : 'ACTIVO'
        ];
    });
}

function descargarReporteExcel() {

    const reporte = obtenerDatosReporte();
    if (!reporte) return;

    if (typeof XLSX === 'undefined') {
        alert('No se pudo cargar el generador de Excel. Verifique su conexión a Internet y vuelva a intentar.');
        return;
    }

    const filas = [];

    filas.push(['TESORERÍA MGP']);
    filas.push(['REPORTE DE MOVIMIENTOS']);
    filas.push(['Período', formatearFechaReporte(reporte.desde) + ' al ' + formatearFechaReporte(reporte.hasta)]);
    filas.push([]);

    filas.push(['INGRESOS']);
    filas.push(['Fecha', 'N° Boleta', 'Descripción', 'Cantidad', 'Importe Unitario', 'Importe Total', 'Estado']);
    filas.push.apply(filas, prepararFilasExcel(reporte.ingresos));
    filas.push(['', '', '', '', 'TOTAL INGRESOS', reporte.totalIngresos, '']);
    filas.push([]);

    filas.push(['EGRESOS']);
    filas.push(['Fecha', 'N° Boleta', 'Descripción', 'Cantidad', 'Importe Unitario', 'Importe Total', 'Estado']);
    filas.push.apply(filas, prepararFilasExcel(reporte.egresos));
    filas.push(['', '', '', '', 'TOTAL EGRESOS', reporte.totalEgresos, '']);
    filas.push([]);

    filas.push(['RESUMEN DEL PERÍODO']);
    filas.push(['Total ingresos', reporte.totalIngresos]);
    filas.push(['Total egresos', reporte.totalEgresos]);
    filas.push(['Saldo', reporte.saldo]);
    filas.push(['Movimientos', reporte.datos.length]);
    filas.push(['Anulados', reporte.anulados]);
    filas.push([]);
    filas.push(['Nota', 'Los movimientos ANULADOS se muestran como referencia y no se consideran en los totales.']);

    const hoja = XLSX.utils.aoa_to_sheet(filas);

    hoja['!cols'] = [
        { wch: 13 },
        { wch: 16 },
        { wch: 42 },
        { wch: 12 },
        { wch: 20 },
        { wch: 18 },
        { wch: 14 }
    ];

    hoja['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Reporte Tesorería');

    XLSX.writeFile(
        libro,
        `tesoreria_mgp_${reporte.desde}_${reporte.hasta}.xlsx`
    );
}

function descargarReportePDF() {

    const reporte = obtenerDatosReporte();
    if (!reporte) return;

    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        alert('No se pudo cargar el generador de PDF. Verifique su conexión a Internet y vuelva a intentar.');
        return;
    }

    const jsPDF = window.jspdf.jsPDF;
    const documento = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const margen = 12;

    documento.setFontSize(18);
    documento.setFont(undefined, 'bold');
    documento.text('TESORERÍA MGP', margen, 16);

    documento.setFontSize(12);
    documento.setFont(undefined, 'normal');
    documento.text('Reporte de movimientos', margen, 23);
    documento.text(
        'Período: ' + formatearFechaReporte(reporte.desde) + ' al ' + formatearFechaReporte(reporte.hasta),
        285 - margen,
        16,
        { align: 'right' }
    );

    function agregarTabla(titulo, lista, total, inicioY) {

        documento.setFontSize(12);
        documento.setFont(undefined, 'bold');
        documento.text(titulo, margen, inicioY);

        const filas = lista.map(function (movimiento) {
            const anulado = String(movimiento.estado || '').toUpperCase() === 'ANULADO';

            return [
                formatearFechaReporte(movimiento.fecha),
                String(movimiento.boleta || ''),
                String(movimiento.descripcion || ''),
                String(Number(movimiento.cantidad) || 0),
                formatearNumeroReporte(movimiento.importeUnitario),
                formatearNumeroReporte(movimiento.importeTotal),
                anulado ? 'ANULADO' : 'ACTIVO'
            ];
        });

        if (!filas.length) {
            filas.push(['', '', 'Sin movimientos en esta sección.', '', '', '', '']);
        }

        documento.autoTable({
            startY: inicioY + 3,
            head: [[
                'Fecha', 'N° Boleta', 'Descripción', 'Cantidad',
                'Importe Unitario', 'Importe Total', 'Estado'
            ]],
            body: filas,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak'
            },
            headStyles: {
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 23 },
                1: { cellWidth: 28 },
                2: { cellWidth: 78 },
                3: { cellWidth: 18, halign: 'right' },
                4: { cellWidth: 35, halign: 'right' },
                5: { cellWidth: 32, halign: 'right' },
                6: { cellWidth: 25 }
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.row.index < lista.length) {
                    const estado = String(lista[data.row.index].estado || '').toUpperCase();
                    if (estado === 'ANULADO') {
                        data.cell.text = data.cell.text;
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        const finalY = documento.lastAutoTable.finalY + 5;
        documento.setFontSize(10);
        documento.setFont(undefined, 'bold');
        documento.text(
            'Total ' + titulo.toLowerCase() + ': ' + formatearMoneda(total),
            285 - margen,
            finalY,
            { align: 'right' }
        );

        return finalY + 9;
    }

    let siguienteY = agregarTabla(
        'INGRESOS',
        reporte.ingresos,
        reporte.totalIngresos,
        31
    );

    if (siguienteY > 170) {
        documento.addPage();
        siguienteY = 18;
    }

    siguienteY = agregarTabla(
        'EGRESOS',
        reporte.egresos,
        reporte.totalEgresos,
        siguienteY
    );

    if (siguienteY > 180) {
        documento.addPage();
        siguienteY = 18;
    }

    documento.setFontSize(12);
    documento.setFont(undefined, 'bold');
    documento.text('RESUMEN DEL PERÍODO', margen, siguienteY + 2);

    documento.setFontSize(10);
    documento.setFont(undefined, 'normal');

    const resumen = [
        ['Total ingresos', formatearMoneda(reporte.totalIngresos)],
        ['Total egresos', formatearMoneda(reporte.totalEgresos)],
        ['Saldo', formatearMoneda(reporte.saldo)],
        ['Movimientos', String(reporte.datos.length)],
        ['Anulados', String(reporte.anulados)]
    ];

    documento.autoTable({
        startY: siguienteY + 5,
        body: resumen,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 2.5
        },
        columnStyles: {
            0: { cellWidth: 55, fontStyle: 'bold' },
            1: { cellWidth: 45, halign: 'right' }
        },
        margin: { left: margen }
    });

    documento.setFontSize(8);
    documento.setFont(undefined, 'normal');
    documento.text(
        'Los movimientos ANULADOS se muestran como referencia y no se consideran en los totales.',
        margen,
        198
    );

    documento.save(`tesoreria_mgp_${reporte.desde}_${reporte.hasta}.pdf`);
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
