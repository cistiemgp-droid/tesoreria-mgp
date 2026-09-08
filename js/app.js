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

const btnDescargarReporte =
    document.getElementById('btnDescargarReporte');


// ==================================================
// INICIO
// ==================================================

document.addEventListener('DOMContentLoaded', function () {

    configurarEventosLogin();

    configurarEventos();

    establecerFechaActual();

    calcularImporteTotal();

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
    aplicacion.hidden = false;

}


function mostrarLogin() {

    aplicacion.hidden = true;
    pantallaLogin.hidden = false;

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


        const respuesta =
            await enviarAPI(
                'registrarMovimiento',
                datos
            );


        if (!respuesta.ok) {

            throw new Error(
                respuesta.error ||
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

async function enviarAPI(
    accion,
    datos = {},
    incluirToken = true
) {
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

    const nombreCallback =
        'tesoreriaMGP_' +
        Date.now() + '_' +
        Math.random()
            .toString(36)
            .substring(2);

    return await new Promise(function (resolve, reject) {
        let terminado = false;
        let script = null;

        const limpiar = function () {
            clearTimeout(temporizador);

            if (script && script.parentNode) {
                script.parentNode.removeChild(script);
            }

            try {
                delete window[nombreCallback];
            } catch (error) {
                console.warn(
                    'No fue posible eliminar callback:',
                    error
                );
            }
        };

        const terminar = function (callback, valor) {
            if (terminado) {
                return;
            }

            terminado = true;
            limpiar();
            callback(valor);
        };

        window[nombreCallback] = function (respuesta) {
            terminar(
                resolve,
                respuesta
            );
        };

        script =
            document.createElement('script');

        const payload =
            encodeURIComponent(
                JSON.stringify(datosEnvio)
            );

        script.src =
            CONFIG.API_URL +
            '?accion=' +
            encodeURIComponent(accion) +
            '&payload=' +
            payload +
            '&callback=' +
            encodeURIComponent(nombreCallback) +
            '&_=' +
            Date.now();

        script.async = true;

        script.onerror = function () {
            terminar(
                reject,
                new Error(
                    'No se pudo comunicar con el servidor de Tesorería.'
                )
            );
        };

        const temporizador =
            setTimeout(
                function () {
                    terminar(
                        reject,
                        new Error(
                            'No se pudo conectar con el servidor de Tesorería. ' +
                            'La solicitud superó los 20 segundos.'
                        )
                    );
                },
                20000
            );

        document.head.appendChild(script);
    });
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
