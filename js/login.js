document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await iniciarSesion();
});

async function iniciarSesion() {

    const mensaje = document.getElementById("mensaje-login");
    mensaje.style.display = "none";
    mensaje.textContent = "";

    const correo = document.getElementById("correo").value;
    const password = document.getElementById("password").value;

    if (!correo || !password) {
        mensaje.textContent = "Por favor rellena todos los campos";
        mensaje.style.display = "block";
        return;
    }

    try {

        const respuesta = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ correo, password })
        });

        const resultado = await respuesta.json();

        if (resultado.exitoso) {

            // 🔐 TOKEN
            

            // datos usuario
            localStorage.setItem("usuarioNombre", resultado.usuario.nombre);
            localStorage.setItem("usuarioRol", resultado.usuario.rol);
            localStorage.setItem("usuarioId", resultado.usuario.idUsuario);

            const rolUsuario = resultado.usuario.rol.toLowerCase().trim();

            console.log("Rol recibido:", rolUsuario);

            if (rolUsuario === "administrador") {
                window.location.href = "../admin/dashboard.html";
            } else if (rolUsuario === "cliente") {
                window.location.href = "../cliente/dashboard-cliente.html";
            }

        } else {

            if (
                resultado.mensaje?.toLowerCase().includes("correo") ||
                resultado.mensaje?.toLowerCase().includes("usuario") ||
                resultado.mensaje?.toLowerCase().includes("no existe")
            ) {
                mensaje.textContent = "El correo no está registrado. Por favor crea una cuenta.";
            } else {
                mensaje.textContent = resultado.mensaje;
            }

            mensaje.style.display = "block";
        }

    } catch (error) {
        mensaje.textContent = "No se pudo conectar con el servidor.";
        mensaje.style.display = "block";
        console.error(error);
    }
}