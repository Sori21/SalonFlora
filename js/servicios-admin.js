let servicioEditando = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarServicios();

    document
    .getElementById("crearServicioForm")
    .addEventListener("submit", guardarServicio);
});

function mostrarFormulario() {

    const formulario = document.getElementById("formularioServicio");

    if (formulario.style.display === "none") {
        formulario.style.display = "block";
    } else {
        formulario.style.display = "none";
    }
}

async function guardarServicio(e) {

    e.preventDefault();

    const servicio = {
        nombre: document.getElementById("nombre").value,
        descripcion: document.getElementById("descripcion").value,
        duracionMinutos: parseInt(document.getElementById("duracion").value),
        precio: parseFloat(document.getElementById("precio").value),
        estado: document.getElementById("estado").value
    };

    let url = "http://localhost:3000/api/servicios";
    let metodo = "POST";

    if (servicioEditando !== null) {

        url = `http://localhost:3000/api/servicios/${servicioEditando}`;
        metodo = "PUT";
    }

    try {

        const respuesta = await fetch(url, {
            method: metodo,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(servicio)
        });

        const resultado = await respuesta.json();

        document.getElementById("mensaje").textContent =
            resultado.mensaje;

        document.getElementById("crearServicioForm").reset();

        servicioEditando = null;

        document.querySelector(".btn-guardar").textContent =
            "Guardar Servicio";

        document.getElementById("formularioServicio").style.display =
            "none";

        cargarServicios();

    } catch (error) {

        console.error(error);

        document.getElementById("mensaje").textContent =
            "Error al guardar el servicio";
    }
}

async function cargarServicios() {

    try {

        const respuesta = await fetch(
        "http://localhost:3000/api/servicios"
        );

        const servicios = await respuesta.json();

        const tbody =
            document.getElementById("tabla-servicios");

        tbody.innerHTML = "";

        servicios.forEach(servicio => {

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${servicio.IdServicio}</td>
                <td>${servicio.Nombre}</td>
                <td>${servicio.DuracionMinutos} min</td>
                <td>$${servicio.Precio}</td>
                <td>${servicio.Estado}</td>

                <td>

                    <button
                        class="editar"
                        onclick="editarServicio(
                            ${servicio.IdServicio},
                            '${servicio.Nombre}',
                            \`${servicio.Descripcion}\`,
                            ${servicio.DuracionMinutos},
                            ${servicio.Precio},
                            '${servicio.Estado}'
                        )">
                        Editar
                    </button>

                    <button
                        class="eliminar"
                        onclick="eliminarServicio(${servicio.IdServicio})">
                        Eliminar
                    </button>

                </td>
            `;

            tbody.appendChild(fila);
        });

    } catch (error) {

        console.error(
            "Error al cargar servicios:",
            error
        );
    }
}

async function eliminarServicio(id) {

    try {

        const respuesta = await fetch(
            `http://localhost:3000/api/servicios/${id}`,
            {
                method: "DELETE"
            }
        );

        const resultado = await respuesta.json();

        document.getElementById("mensaje").textContent =
            resultado.mensaje;

        cargarServicios();

    } catch (error) {

        console.error(error);

        document.getElementById("mensaje").textContent =
            "Error al eliminar servicio";
    }
}

function editarServicio(
    id,
    nombre,
    descripcion,
    duracion,
    precio,
    estado
) {

    servicioEditando = id;

    document.getElementById("formularioServicio")
        .style.display = "block";

    document.getElementById("nombre")
        .value = nombre;

    document.getElementById("descripcion")
        .value = descripcion;

    document.getElementById("duracion")
        .value = duracion;

    document.getElementById("precio")
        .value = precio;

    document.getElementById("estado")
        .value = estado;

    document.querySelector(".btn-guardar")
        .textContent = "Actualizar Servicio";
}