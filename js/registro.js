document
.getElementById("registroForm")
.addEventListener("submit", registrarUsuario);

async function registrarUsuario(e){

    e.preventDefault();

    const nombre =
        document.getElementById("nombre").value;

    const correo =
        document.getElementById("correo").value;

    const telefono =
        document.getElementById("telefono").value;

    const password =
        document.getElementById("password").value;

    const confirmarPassword =
        document.getElementById("confirmarPassword").value;

    const mensaje =
        document.getElementById("mensaje");

    mensaje.textContent = "";

    if(password !== confirmarPassword){

        mensaje.textContent =
            "Las contraseñas no coinciden";

        return;
    }

    try {

        const respuesta = await fetch(
            "http://localhost:3000/api/registro",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body: JSON.stringify({
                    nombre,
                    correo,
                    telefono,
                    password
                })
            }
        );

        const resultado =
            await respuesta.json();

        mensaje.textContent =
            resultado.mensaje;

        if(resultado.exitoso){

            document
                .getElementById("registroForm")
                .reset();

            setTimeout(() => {

                window.location.href =
                "../login/login.html";

            }, 1500);

        }

    } catch(error){

        console.error(error);

        mensaje.textContent =
            "Error al conectar con el servidor";

    }

}