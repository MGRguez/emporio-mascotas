const supabaseAdmin = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =============================
// CONFIGURACIÓN ADMIN
// =============================

const ADMIN_USER = "mascotas";

// Pon aquí el correo técnico que creaste en Supabase.
// Este correo NO se mostrará a los alumnos.
const ADMIN_EMAIL = "lupitarodriiguezb@gmail.com";


// =============================
// ELEMENTOS
// =============================

const seccionLogin =
    document.getElementById("seccion-login");

const seccionPanel =
    document.getElementById("seccion-panel");

const inputUsuario =
    document.getElementById("usuario");

const inputPassword =
    document.getElementById("password");

const btnLogin =
    document.getElementById("btn-login");

const btnLogout =
    document.getElementById("btn-logout");

const mensajeLogin =
    document.getElementById("mensaje-login");


const inputCategoria =
    document.getElementById("categoria");

const inputPrecio =
    document.getElementById("precio");

const inputImagen =
    document.getElementById("imagen");

const btnAgregar =
    document.getElementById("btn-agregar");

const mensajeAgregar =
    document.getElementById("mensaje-agregar");

const catalogoAdmin =
    document.getElementById("catalogo-admin");

const filtroCategoria =
    document.getElementById("filtro-categoria");

const filtroEstado =
    document.getElementById("filtro-estado");

const contadorResultados =
    document.getElementById("contador-resultados");

let mascotasAdmin = [];


// =============================
// INICIO
// =============================

verificarSesion();

filtroCategoria.addEventListener("change", aplicarFiltrosAdmin);
filtroEstado.addEventListener("change", aplicarFiltrosAdmin);


// =============================
// LOGIN
// =============================

btnLogin.addEventListener("click", async () => {

    mensajeLogin.textContent = "";

    const usuario =
        inputUsuario.value.trim().toLowerCase();

    const password =
        inputPassword.value;

    if (!usuario || !password) {

        mensajeLogin.textContent =
            "Escribe usuario y contraseña.";

        return;
    }

    if (usuario !== ADMIN_USER) {

        mensajeLogin.textContent =
            "Usuario incorrecto.";

        return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = "Entrando...";

    const { error } =
        await supabaseAdmin.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: password
        });

    btnLogin.disabled = false;
    btnLogin.textContent = "Entrar";

    if (error) {

        console.error(error);

        mensajeLogin.textContent =
            "Contraseña incorrecta.";

        return;
    }

    inputPassword.value = "";

    mostrarPanel();
});


// =============================
// CERRAR SESIÓN
// =============================

btnLogout.addEventListener("click", async () => {

    await supabaseAdmin.auth.signOut();

    seccionPanel.style.display = "none";

    seccionLogin.style.display = "block";

    inputUsuario.value = "";
    inputPassword.value = "";
});


// =============================
// VERIFICAR SESIÓN
// =============================

async function verificarSesion() {

    const {
        data: { session }
    } = await supabaseAdmin.auth.getSession();

    if (session) {

        mostrarPanel();

    } else {

        seccionLogin.style.display = "block";
        seccionPanel.style.display = "none";
    }
}


// =============================
// MOSTRAR PANEL
// =============================

async function mostrarPanel() {

    seccionLogin.style.display = "none";

    seccionPanel.style.display = "block";

    await cargarMascotasAdmin();
}


// =============================
// AGREGAR MASCOTA
// =============================

btnAgregar.addEventListener("click", async () => {

    mensajeAgregar.textContent = "";

    const categoria =
        inputCategoria.value;

    const precio =
        Number(inputPrecio.value);

    const archivo =
        inputImagen.files[0];

    if (!categoria) {

        mensajeAgregar.textContent =
            "Selecciona una categoría.";

        return;
    }

    if (
        inputPrecio.value === "" ||
        precio < 0
    ) {

        mensajeAgregar.textContent =
            "Captura un precio válido.";

        return;
    }

    if (!archivo) {

        mensajeAgregar.textContent =
            "Selecciona una imagen.";

        return;
    }

    btnAgregar.disabled = true;
    btnAgregar.textContent = "Subiendo...";

    try {

        const extension =
            archivo.name.split(".").pop();

        const nombreArchivo =
            `${Date.now()}-${crypto.randomUUID()}.${extension}`;

        const ruta =
            `catalogo/${nombreArchivo}`;


        // SUBIR IMAGEN

        const {
            error: errorUpload
        } =
            await supabaseAdmin.storage
                .from("mascotas")
                .upload(
                    ruta,
                    archivo,
                    {
                        cacheControl: "3600",
                        upsert: false
                    }
                );

        if (errorUpload) {
            throw errorUpload;
        }


        // URL PÚBLICA

        const {
            data: datosUrl
        } =
            supabaseAdmin.storage
                .from("mascotas")
                .getPublicUrl(ruta);

        const imagenUrl =
            datosUrl.publicUrl;


        // INSERTAR EN TABLA

        const {
            error: errorInsert
        } =
            await supabaseAdmin
                .from("mascotas")
                .insert({
                    categoria: categoria,
                    precio: precio,
                    imagen_url: imagenUrl,
                    estatus: "DISPONIBLE"
                });

        if (errorInsert) {
            throw errorInsert;
        }


        mensajeAgregar.textContent =
            "Mascota agregada correctamente ✨";


        inputCategoria.value = "";
        inputPrecio.value = "";
        inputImagen.value = "";

        await cargarMascotasAdmin();

    }
    catch (error) {

        console.error(error);

        mensajeAgregar.textContent =
            "Ocurrió un error al agregar la mascota.";
    }

    btnAgregar.disabled = false;
    btnAgregar.textContent =
        "+ Agregar mascota";
});


// =============================
// CARGAR MASCOTAS
// =============================

async function cargarMascotasAdmin() {

    catalogoAdmin.innerHTML =
        `<div class="mensaje">
            Cargando mascotas...
        </div>`;

    const {
        data,
        error
    } =
        await supabaseAdmin
            .from("mascotas")
            .select("*")
            .order(
                "fecha_creacion",
                { ascending: false }
            );

    if (error) {

        console.error(error);

        catalogoAdmin.innerHTML =
            `<div class="mensaje">
                No fue posible cargar el catálogo.
            </div>`;

        return;
    }

    mascotasAdmin = data || [];

    aplicarFiltrosAdmin();
}


function aplicarFiltrosAdmin() {

    const categoriaSeleccionada = filtroCategoria.value;
    const estadoSeleccionado = filtroEstado.value;

    let resultado = [...mascotasAdmin];

    if (categoriaSeleccionada !== "TODAS") {
        resultado = resultado.filter(
            mascota => mascota.categoria === categoriaSeleccionada
        );
    }

    if (estadoSeleccionado !== "TODOS") {
        resultado = resultado.filter(
            mascota => mascota.estatus === estadoSeleccionado
        );
    }

    resultado.sort((a, b) => {
        if (a.estatus !== b.estatus) {
            return a.estatus === "DISPONIBLE" ? -1 : 1;
        }

        const categoria = a.categoria.localeCompare(
            b.categoria,
            "es",
            { sensitivity: "base" }
        );

        if (categoria !== 0) {
            return categoria;
        }

        return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
    });

    mostrarMascotasAdmin(resultado);
}


function mostrarMascotasAdmin(mascotas) {

    catalogoAdmin.innerHTML = "";

    contadorResultados.textContent =
        `${mascotas.length} ${mascotas.length === 1 ? "mascota" : "mascotas"}`;

    if (!mascotas || mascotas.length === 0) {

        catalogoAdmin.innerHTML =
            `<div class="mensaje">
                No hay mascotas que coincidan con estos filtros.
            </div>`;

        return;
    }

    mascotas.forEach(mascota => {

        catalogoAdmin.appendChild(
            crearTarjetaAdmin(mascota)
        );
    });
}


// =============================
// TARJETA ADMIN
// =============================

function crearTarjetaAdmin(mascota) {

    const tarjeta =
        document.createElement("div");

    tarjeta.className =
        "tarjeta-admin";


    const adoptada =
        mascota.estatus === "ADOPTADA";


    tarjeta.innerHTML = `

        <div class="imagen-admin">

            <img
                src="${mascota.imagen_url}"
                alt="Mascota"
            >

            ${
                adoptada
                    ? `<div class="sello-adoptada">
                        ADOPTADA
                       </div>`
                    : ""
            }

        </div>


        <div class="contenido-admin">

            <label>Categoría</label>

            <input
                type="text"
                class="editar-categoria"
                value="${escapeHtml(mascota.categoria)}"
            >


            <label>Precio</label>

            <input
                type="number"
                min="0"
                step="1"
                class="editar-precio"
                value="${mascota.precio}"
            >


            <div class="acciones-admin">

                <button
                    class="btn-guardar"
                >
                    Guardar
                </button>


                <button
                    class="btn-estado"
                >
                    ${
                        adoptada
                            ? "Volver disponible"
                            : "Marcar adoptada"
                    }
                </button>


                <button
                    class="btn-eliminar"
                >
                    Eliminar
                </button>

            </div>

        </div>
    `;


    const categoria =
        tarjeta.querySelector(
            ".editar-categoria"
        );

    const precio =
        tarjeta.querySelector(
            ".editar-precio"
        );


    tarjeta
        .querySelector(".btn-guardar")
        .addEventListener(
            "click",
            () =>
                actualizarMascota(
                    mascota.id,
                    categoria.value,
                    precio.value
                )
        );


    tarjeta
        .querySelector(".btn-estado")
        .addEventListener(
            "click",
            () =>
                cambiarEstado(mascota)
        );


    tarjeta
        .querySelector(".btn-eliminar")
        .addEventListener(
            "click",
            () =>
                eliminarMascota(mascota)
        );


    return tarjeta;
}


// =============================
// ACTUALIZAR
// =============================

async function actualizarMascota(
    id,
    categoria,
    precio
) {

    categoria =
        categoria.trim();

    precio =
        Number(precio);

    if (!categoria) {

        alert("La categoría no puede quedar vacía.");

        return;
    }

    if (precio < 0) {

        alert("El precio no es válido.");

        return;
    }

    const {
        error
    } =
        await supabaseAdmin
            .from("mascotas")
            .update({
                categoria: categoria,
                precio: precio
            })
            .eq("id", id);

    if (error) {

        console.error(error);

        alert(
            "No fue posible guardar los cambios."
        );

        return;
    }

    alert("Cambios guardados.");

    await cargarMascotasAdmin();
}


// =============================
// CAMBIAR ESTADO
// =============================

async function cambiarEstado(mascota) {

    const nuevoEstado =
        mascota.estatus === "ADOPTADA"
            ? "DISPONIBLE"
            : "ADOPTADA";


    const {
        error
    } =
        await supabaseAdmin
            .from("mascotas")
            .update({
                estatus: nuevoEstado
            })
            .eq("id", mascota.id);


    if (error) {

        console.error(error);

        alert(
            "No fue posible cambiar el estado."
        );

        return;
    }

    await cargarMascotasAdmin();
}


// =============================
// ELIMINAR
// =============================

async function eliminarMascota(mascota) {

    const confirmar =
        confirm(
            "¿Seguro que deseas eliminar esta mascota?"
        );

    if (!confirmar) {
        return;
    }


    const {
        error
    } =
        await supabaseAdmin
            .from("mascotas")
            .delete()
            .eq("id", mascota.id);


    if (error) {

        console.error(error);

        alert(
            "No fue posible eliminar la mascota."
        );

        return;
    }

    await cargarMascotasAdmin();
}


// =============================
// SEGURIDAD TEXTO
// =============================

function escapeHtml(texto) {

    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
