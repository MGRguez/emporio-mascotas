const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const catalogo = document.getElementById("catalogo");
const mensajeCarga = document.getElementById("mensaje-carga");

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

        mensajeCarga.textContent =
            "No fue posible cargar el catálogo.";

        return;
    }

    mensajeCarga.style.display = "none";

    mostrarMascotas(data);
}

function mostrarMascotas(mascotas) {

    catalogo.innerHTML = "";

    if (!mascotas || mascotas.length === 0) {

        catalogo.innerHTML = `
            <div class="mensaje">
                Aún no hay mascotas disponibles.
            </div>
        `;

        return;
    }

    const categorias = {};

    mascotas.forEach(mascota => {

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

            const tarjeta = crearTarjeta(mascota);

            grid.appendChild(tarjeta);
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
                alt="Mascota"
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

cargarMascotas();