const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const catalogo = document.getElementById("catalogo");
const mensajeCarga = document.getElementById("mensaje-carga");
const botonesCategoria = document.querySelectorAll(".tab-categoria");

let mascotasCargadas = [];
let categoriaActiva = "TODAS";

botonesCategoria.forEach(boton => {
    boton.addEventListener("click", () => {
        categoriaActiva = boton.dataset.categoria;

        botonesCategoria.forEach(item => item.classList.remove("activa"));
        boton.classList.add("activa");

        mostrarMascotas(mascotasCargadas);
    });
});

async function cargarMascotas() {
    mensajeCarga.style.display = "block";
    mensajeCarga.textContent = "Cargando mascotas...";

    const { data, error } = await supabaseClient
        .from("mascotas")
        .select("*")
        .order("categoria", { ascending: true })
        .order("fecha_creacion", { ascending: true });

    if (error) {
        console.error(error);
        mensajeCarga.textContent = "No fue posible cargar el catálogo.";
        return;
    }

    mascotasCargadas = data || [];
    mensajeCarga.style.display = "none";

    mostrarMascotas(mascotasCargadas);
}

function mostrarMascotas(mascotas) {
    catalogo.innerHTML = "";

    const filtradas = categoriaActiva === "TODAS"
        ? mascotas
        : mascotas.filter(mascota => mascota.categoria === categoriaActiva);

    if (!filtradas || filtradas.length === 0) {
        catalogo.innerHTML = `
            <div class="mensaje">
                No hay mascotas en esta categoría por el momento.
            </div>
        `;
        return;
    }

    const categorias = {};

    filtradas.forEach(mascota => {
        if (!categorias[mascota.categoria]) {
            categorias[mascota.categoria] = [];
        }

        categorias[mascota.categoria].push(mascota);
    });

    Object.keys(categorias).forEach(categoria => {
        const seccion = document.createElement("section");
        seccion.classList.add("categoria");

        const titulo = document.createElement("h2");
        titulo.textContent = categoria;
        seccion.appendChild(titulo);

        const grid = document.createElement("div");
        grid.classList.add("grid-mascotas");

        categorias[categoria].forEach(mascota => {
            grid.appendChild(crearTarjeta(mascota));
        });

        seccion.appendChild(grid);
        catalogo.appendChild(seccion);
    });
}

function crearTarjeta(mascota) {
    const tarjeta = document.createElement("div");
    tarjeta.classList.add("tarjeta");

    if (mascota.estatus === "ADOPTADA") {
        tarjeta.classList.add("adoptada");
    }

    tarjeta.innerHTML = `
        <div class="contenedor-imagen">
            <img
                src="${mascota.imagen_url}"
                alt="Mascota de la categoría ${escapeHtml(mascota.categoria)}"
                loading="lazy"
            >

            ${
                mascota.estatus === "ADOPTADA"
                    ? `<div class="sello-adoptada">ADOPTADA</div>`
                    : ""
            }
        </div>

        <div class="precio">
            ${formatearPrecio(mascota.precio)} 🪙
        </div>
    `;

    return tarjeta;
}

function formatearPrecio(precio) {
    const numero = Number(precio);

    if (Number.isInteger(numero)) {
        return numero;
    }

    return numero.toFixed(2);
}

function escapeHtml(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

cargarMascotas();
