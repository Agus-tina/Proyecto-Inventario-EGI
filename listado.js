import { 
    obtenerInventario, eliminarEquipo, obtenerNombreVisible,
    obtenerRolUsu, logout, showMessage
 } from "./api.js";

// Elementos del DOM
const nombreUsuario = document.getElementById("nomUsu");
const cuerpoTabla = document.getElementById("cuerpoTabla");
const sinResultados = document.getElementById("sinResultados");
const btnNuevaMaquina = document.getElementById("btnNuevaMaq");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
const btnTipo = document.getElementById("btnTipo");
const btnUbicacion = document.getElementById("btnUbicacion");
const menuUbicacion = document.getElementById("menuUbicacion");

// Rol usuario
const rol = obtenerRolUsu();
if(!rol){
    window.location.href = "index.html";
}
// Solo Técnicos tienen permiso de escritura
const puedeEscribir = (rol === "Tecnicos");

// Inventario recibido 
let inventarioCompleto = [];

// variables que se utilizarán en funciones de filtrado.
let tipoSeleccionado = "TODOS";
let ubicacionSeleccionada = "TODAS";

// Mostrar el nombre del usuario (evitar innerHTML con contenido externo)
if(nombreUsuario){
    nombreUsuario.textContent = '';
    const icon = document.createElement('i');
    icon.className = 'bi bi-person-circle p-1';
    nombreUsuario.appendChild(icon);
    nombreUsuario.appendChild(document.createTextNode(' ' + obtenerNombreVisible()));
}

/* Roles en esta vista:
    - Solo Tecnicos pueden crear equipos y eliminarlos
    - Docente y Alumnos solo pueden ver la lista. */

if(!puedeEscribir){
    if(btnNuevaMaquina){
        btnNuevaMaquina.classList.add("d-none");
    }
}

// Cargar el Inventario
async function cargarInventario() {
    try{

        const response = await obtenerInventario();

        // No hay sesión válida vuelve a index.html
        if(response.status === 401){
            window.location.href = "index.html";
            return;
        }

        if(!response.ok){
            showMessage('Error al obtener inventario', 'danger');
            throw new Error("Error al obtener inventario")
        }

        // Transforma respuesta a json
        inventarioCompleto = await response.json();
        
        cargarUbicaciones();
        aplicarFiltros();

    } catch (error){
        console.error(error);
        showMessage(error.message || 'Error inesperado', 'danger');
    }
}

function cargarUbicaciones(){
    menuUbicacion.innerHTML = "";
    const ubicaciones = [];

    // Si el usuario eligió TODOS, usa todo el inventario
    let datosFiltrados = inventarioCompleto;

    // Si eligió un tipo, filtra por ese tipo
    if(tipoSeleccionado !== "TODOS"){
        datosFiltrados = inventarioCompleto.filter(item =>
            item.equipo.ubicacion.tipo === tipoSeleccionado
        );
    }

    // Obtiene ubicaciones únicas
    datosFiltrados.forEach(item => {

        const nombreUbicacion = item.equipo.ubicacion.nombre;

        // Si todavía no existe esa ubicación en el array se agrega
        if(!ubicaciones.includes(nombreUbicacion)){
            ubicaciones.push(nombreUbicacion);
        }
    });

    // Opción TODAS
    const liAll = document.createElement('li');
    const aAll = document.createElement('a');
    aAll.className = 'dropdown-item ubicacion-item';
    aAll.href = '#';
    aAll.dataset.ubicacion = 'TODAS';
    aAll.textContent = 'Todas';
    liAll.appendChild(aAll);
    menuUbicacion.appendChild(liAll);

    // Agrega cada ubicación encontrada
    ubicaciones.forEach(nombreUbi =>{
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'dropdown-item ubicacion-item';
        a.href = '#';
        a.dataset.ubicacion = nombreUbi;
        a.textContent = nombreUbi;
        li.appendChild(a);
        menuUbicacion.appendChild(li);
    });

    registrarEventosUbicacion();
    
}

// Eventos filtro Tipo (muestra el nombre del tipo seleccionado)
document.querySelectorAll(".tipo-item").forEach(item =>{

    item.addEventListener("click", (event) =>{

        event.preventDefault();

        /* Obtiene el tipo seleccionado y agrega el nombre al 
        principio del dropdown */
        tipoSeleccionado = item.dataset.tipo;
        btnTipo.textContent = tipoSeleccionado;

        // Reinicia el filtro ubicación
        ubicacionSeleccionada = "TODAS";
        btnUbicacion.textContent = "Ubicación";

        // Regenera las ubicaciones disponibles
        cargarUbicaciones();

        aplicarFiltros();
    });
});

// Eventos filtro Ubicación
function registrarEventosUbicacion(){

    document.querySelectorAll(".ubicacion-item").forEach(item =>{
        item.addEventListener("click", (event) =>{
            event.preventDefault();

            /* Obtiene la ubicación seleccionado y agrega el nombre al 
            principio del dropdown */
            ubicacionSeleccionada = item.dataset.ubicacion;
            btnUbicacion.textContent = ubicacionSeleccionada;

            aplicarFiltros();
        });
    });
}

/* Aplica filtros para conservar solo los equipos de tipo y
ubicación seleccionada por el usuario. */
function aplicarFiltros(){

    let resultado = inventarioCompleto;

    // Guarda solo los equipos del tipo seleccionado por el usuario.
    if (tipoSeleccionado !== "TODOS"){
        resultado = resultado.filter(item => item.equipo.ubicacion.tipo === tipoSeleccionado);
    }

    if (ubicacionSeleccionada !== "TODAS"){
        resultado = resultado.filter(item => item.equipo.ubicacion.nombre === ubicacionSeleccionada);
    }

    // Actualiza la tabla con el resultado final
    dibujarTabla(resultado);
}


// Colocar filas a la tabla
function dibujarTabla(inventario){

    cuerpoTabla.innerHTML = "";

    // Mostrar mensaje del div
    if (inventario.length === 0){
        sinResultados.classList.remove("d-none");
        return;
    }

    // oculta mensaje por defecto
    sinResultados.classList.add("d-none")

    // Agregamos las filas a la tabla (creando nodos para evitar inyección)
    inventario.forEach(item => {
        const fila = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.textContent = item.equipo.id_equipo;

        const tdUbic = document.createElement('td');
        tdUbic.textContent = item.equipo.ubicacion.nombre;

        const tdMesa = document.createElement('td');
        tdMesa.textContent = item.equipo.mesa ?? '-';

        const tdTipo = document.createElement('td');
        tdTipo.textContent = item.componentes?.tipo ?? '-';

        const tdDetalle = document.createElement('td');
        const aDetalle = document.createElement('a');
        aDetalle.className = 'btn btn-primary btn-sm';
        aDetalle.href = `detalle.html?id=${encodeURIComponent(item.equipo.id_equipo)}`;
        aDetalle.textContent = 'Ver Detalle';
        tdDetalle.appendChild(aDetalle);

        const tdEliminar = document.createElement('td');
        if(puedeEscribir){
            const btn = document.createElement('button');
            btn.className = 'btn btn-danger btn-sm';
            btn.type = 'button';
            btn.textContent = 'Eliminar';
            btn.addEventListener('click', () => eliminarEquipoTabla(item.equipo.id_equipo));
            tdEliminar.appendChild(btn);
        } else {
            tdEliminar.textContent = '-';
        }

        fila.appendChild(tdId);
        fila.appendChild(tdUbic);
        fila.appendChild(tdMesa);
        fila.appendChild(tdTipo);
        fila.appendChild(tdDetalle);
        fila.appendChild(tdEliminar);

        cuerpoTabla.appendChild(fila);
    });

}

// Eliminar equipo
window.eliminarEquipoTabla = async function(idEquipo) {
    if(rol !== "Tecnicos"){
        showMessage('No tiene permisos para eliminar máquinas.','warning');
        return;
    }

    const confirmar = confirm("¿Eliminar equipo?")
    if(!confirmar){
        return;
    }

    try{
        const response = await eliminarEquipo(idEquipo)
        if(response.status === 403){
            showMessage('Acceso denegado. No tiene permisos para eliminar máquinas.','warning');
            return;
        }

    if(response.status === 401){
        window.location.href = "index.html";
        return;
    }

    if(!response.ok){
        showMessage('Error al eliminar', 'danger');
        throw new Error("Error al eliminar");
    }

    // Recargamos el inventario por si se elimino algún equipo
    cargarInventario();

    } catch(error){
        console.error(error);
        // showMessage can be called already, but ensure the user sees something
        if(!document.getElementById('globalAlert')) showMessage(error.message || 'Error inesperado', 'danger');
    }
}

// Cerrar Sesión
btnCerrarSesion?.addEventListener("click", (event) => {
    event.preventDefault();
    logout();
    window.location.href = "index.html";
});

// Iniciar
cargarInventario();