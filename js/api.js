// Url del backend
const API_URL = "http://localhost:8000";

// Se exportan estas funciones para que pueda utilizarla app.js

// LOGIN

/* Envía usuario y contraseña al backend. Si es correcto devuelve un JWT */
export async function login(username, password) {
    
    /* Permite colocar el resultado como lo 
    esperará el backend (como formulario) */
    const formData = new URLSearchParams();

    formData.append("username", username);
    formData.append("password", password);

    // Petición POST.
    const response = await fetch(`${API_URL}/auth/login`,
        {
            method: "POST",
            body: formData
        }
    );

    // La respuesta retorna y es procesada por app.js
    return response;
}

/* Guarda el token en el navegador. Permite mantener la sesión iniciada. */
export function guardarToken(token){
    localStorage.setItem("token", token);
}

/* Obtiene el token guardado para usarlo en futuras peticiones */
export function obtenerToken(){
    return localStorage.getItem("token");
}

/* Al cerrar sesión se elimina el token. */
export function logout(){
    localStorage.removeItem("token");
}

/* Lee la información interna del token JWT (sub, rol, exp) */
export function obtenerPayloadToken(){

    const token = obtenerToken();

    if(!token){
        return null;
    }

    try{
        // Token JWT tiene formato: HEADER.PAYLOAD.FIRMA
        return JSON.parse(
            // Convertir Base 64 a texto legible
            atob(
                // Tomo la parte de PAYLOAD
                token.split(".")[1]
            )
        );

    } catch (error){
        return null;
    }
}

/* Obtiene el nombre del usuario guardado dentro del JWT(payload) */
export function obtenerUsuario(){

    const payload = obtenerPayloadToken();

    // obtiene y retorna sub -> subject (sería el usuario autenticado)
    if(payload){
        return payload.sub;
    }else{
        return null;
    }

}

export function obtenerNombreVisible(){

    const usuario = obtenerUsuario();

    if(!usuario){
        return "Usuario";
    }

    /* if (usuario.includes("@")){
        // recorta el mail de usuario, muestra solo la parte anterior a @
        return usuario.split("@")[0];
    } */

    return usuario;
}

/* Obtiene rol del usuario */
export function obtenerRolUsu(){

    const payload = obtenerPayloadToken();

    if(payload){
        return payload.rol;
    }else{
        return null;
    }
}

// INVENTARIO

export async function obtenerInventario(){
    return await fetch(`${API_URL}/inventario/`,
        {
            /* Agrega el token del usuario a la petición para que el backend sepa
            quién está realizando sea petición */
            headers: {
                Authorization: `Bearer ${obtenerToken()}`
            }
        }
    );
}

export async function eliminarEquipo(idEquipo) {
    return await fetch(`${API_URL}/inventario/equipos/${idEquipo}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${obtenerToken()}`
            }
        }
    );
}