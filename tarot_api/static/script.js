// Función para mostrar resultados en el contenedor de cartas
function mostrarCartas(cartas) {
    const container = document.getElementById('cartas-container');
    container.innerHTML = '';
    
    cartas.forEach(carta => {
        const card = document.createElement('div');
        card.className = 'carta card mb-3';
        card.innerHTML = `
            <div class="card-body">
                ${carta.imagen_url ? `<img src="${carta.imagen_url}" class="card-img-top mb-3" alt="${carta.nombre}">` : ''}
                <h5 class="card-title">${carta.nombre}</h5>
                <p class="card-text"><strong>Tipo:</strong> ${carta.tipo === 'mayor' ? 'Arco Mayor' : 'Arco Menor'}</p>
                <p class="card-text"><strong>Número:</strong> ${carta.numero_romano}</p>
                <div class="significados">
                    <div class="significado">
                        <h6>Significado Derecho:</h6>
                        <p>${carta.significado_upright.join(', ')}</p>
                    </div>
                    <div class="significado">
                        <h6>Significado Invertido:</h6>
                        <p>${carta.significado_reversed.join(', ')}</p>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Función para manejar errores
function manejarError(error) {
    const container = document.getElementById('cartas-container');
    container.innerHTML = `
        <div class="alert alert-danger text-center" role="alert">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <p>${error.message || 'Ocurrió un error al cargar las cartas'}</p>
        </div>
    `;
}

// Función para mostrar un mensaje de carga
function mostrarCargando() {
    const container = document.getElementById('cartas-container');
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3">Cargando cartas...</p>
        </div>
    `;
}

// CRUD Cartas
async function getCartas() {
    mostrarCargando();
    try {
        const response = await fetch('/cartas');
        if (!response.ok) throw new Error('Error al cargar las cartas');
        const cartas = await response.json();
        mostrarCartas(cartas);
    } catch (error) {
        manejarError(error);
    }
}

// Función para guardar edición
async function guardarEdicion() {
    const id = document.getElementById('editarId').value;
    const nombre = document.getElementById('editarNombre').value;
    const significadoDerecho = document.getElementById('editarSignificadoDerecho').value;
    const significadoInvertido = document.getElementById('editarSignificadoInvertido').value;

    if (!id || !nombre || !significadoDerecho || !significadoInvertido) {
        manejarError({ message: "Por favor, complete todos los campos" });
        return;
    }

    mostrarCargando();
    try {
        const response = await fetch(`/cartas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                numero_romano: '', // Mantener el número romano original
                significado_upright: significadoDerecho.split('\n'),
                significado_reversed: significadoInvertido.split('\n')
            })
        });
        
        if (!response.ok) throw new Error('Error al editar la carta');
        const data = await response.json();
        
        mostrarMensajeExito('Carta editada exitosamente');
        cerrarModal('editarModal');
        getCartas();
    } catch (error) {
        manejarError(error);
    }
}

// Función para confirmar eliminación
async function confirmarEliminacion() {
    const id = document.getElementById('eliminarId').value;
    if (!id) {
        manejarError({ message: "Por favor, ingrese un ID válido" });
        return;
    }

    if (!confirm('¿Está seguro que desea eliminar esta carta?')) {
        return;
    }

    mostrarCargando();
    try {
        const response = await fetch(`/cartas/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Error al eliminar la carta');
        const data = await response.json();
        
        mostrarMensajeExito('Carta eliminada exitosamente');
        cerrarModal('eliminarModal');
        getCartas();
    } catch (error) {
        manejarError(error);
    }
}

// Función para crear arco menor con soporte para imágenes
async function crearArcoMenor() {
    const nombre = document.getElementById('crearNombre').value;
    const significadoDerecho = document.getElementById('crearSignificadoDerecho').value;
    const significadoInvertido = document.getElementById('crearSignificadoInvertido').value;
    const imagenInput = document.getElementById('crearImagen');
    const imagen = imagenInput.files[0];

    if (!nombre || !significadoDerecho || !significadoInvertido) {
        manejarError({ message: "Por favor, complete todos los campos" });
        return;
    }

    mostrarCargando();
    try {
        let imagen_url = '';
        if (imagen) {
            // Subir la imagen al servidor
            const formData = new FormData();
            formData.append('file', imagen);
            const uploadResponse = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            if (!uploadResponse.ok) throw new Error('Error al subir la imagen');
            const uploadData = await uploadResponse.json();
            imagen_url = uploadData.url;
        }

        const response = await fetch('/cartas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                significado_upright: significadoDerecho.split('\n'),
                significado_reversed: significadoInvertido.split('\n'),
                elemento: '',
                planeta: '',
                imagen_url,
                tipo: 'menor' // Especificamos que es un arcano menor
            })
        });
        
        if (!response.ok) throw new Error('Error al crear la carta');
        const data = await response.json();
        
        mostrarMensajeExito('Carta creada exitosamente');
        cerrarModal('crearModal');
        getCartas();
    } catch (error) {
        manejarError(error);
    }
}

// Función para crear arco mayor con soporte para imágenes
async function crearArcoMayor() {
    const nombre = document.getElementById('crearNombre').value;
    const significadoDerecho = document.getElementById('crearSignificadoDerecho').value;
    const significadoInvertido = document.getElementById('crearSignificadoInvertido').value;
    const imagenInput = document.getElementById('crearImagen');
    const imagen = imagenInput.files[0];

    if (!nombre || !significadoDerecho || !significadoInvertido) {
        manejarError({ message: "Por favor, complete todos los campos" });
        return;
    }

    mostrarCargando();
    try {
        let imagen_url = '';
        if (imagen) {
            // Subir la imagen al servidor
            const formData = new FormData();
            formData.append('file', imagen);
            const uploadResponse = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            if (!uploadResponse.ok) throw new Error('Error al subir la imagen');
            const uploadData = await uploadResponse.json();
            imagen_url = uploadData.url;
        }

        const response = await fetch('/cartas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                significado_upright: significadoDerecho.split('\n'),
                significado_reversed: significadoInvertido.split('\n'),
                elemento: '',
                planeta: '',
                imagen_url,
                tipo: 'mayor' // Especificamos que es un arcano mayor
            })
        });
        
        if (!response.ok) throw new Error('Error al crear la carta');
        const data = await response.json();
        
        mostrarMensajeExito('Carta creada exitosamente');
        cerrarModal('crearModal');
        getCartas();
    } catch (error) {
        manejarError(error);
    }
}

// Función para consultar una carta por ID
async function consultarCarta() {
    const tipo = document.getElementById('tipoCarta').value;
    const id = document.getElementById('idCarta').value;
    
    if (!id) {
        manejarError({ message: "Por favor, ingrese un ID válido" });
        return;
    }

    mostrarCargando();
    try {
        const response = await fetch(`/cartas/${id}`);
        if (!response.ok) throw new Error('No se encontró la carta');
        const carta = await response.json();
        
        // Mostrar la carta en el contenedor
        const container = document.getElementById('cartas-container');
        container.innerHTML = '';
        
        const card = document.createElement('div');
        card.className = 'carta card mb-3';
        card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${carta.nombre}</h5>
                <p class="card-text"><strong>ID:</strong> ${carta.id}</p>
                <p class="card-text"><strong>Tipo:</strong> ${tipo === 'mayor' ? 'Arco Mayor' : 'Arco Menor'}</p>
                <div class="significados">
                    <div class="significado">
                        <h6>Significado Derecho:</h6>
                        <p>${carta.significado_upright.join(', ')}</p>
                    </div>
                    <div class="significado">
                        <h6>Significado Invertido:</h6>
                        <p>${carta.significado_reversed.join(', ')}</p>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
        
        // Cerrar el modal automáticamente
        const modal = bootstrap.Modal.getInstance(document.getElementById('consultaModal'));
        if (modal) {
            modal.hide();
        }
    } catch (error) {
        manejarError(error);
        // Revertir el estado de carga en caso de error
        const container = document.getElementById('cartas-container');
        container.innerHTML = '';
    }
}

async function editarCarta() {
    const id = document.getElementById('editarId').value;
    const nombre = document.getElementById('editarNombre').value;
    const significadoDerecho = document.getElementById('editarSignificadoDerecho').value;
    const significadoInvertido = document.getElementById('editarSignificadoInvertido').value;

    if (!id || !nombre || !significadoDerecho || !significadoInvertido) {
        manejarError({ message: "Por favor, complete todos los campos" });
        return;
    }

    mostrarCargando();
    try {
        const response = await fetch(`/cartas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                numero_romano: '', // Mantener el número romano original
                significado_upright: significadoDerecho.split('\n'),
                significado_reversed: significadoInvertido.split('\n')
            })
        });
        
        if (!response.ok) throw new Error('Error al editar la carta');
        const data = await response.json();
        
        mostrarMensajeExito('Carta editada exitosamente');
        cerrarModal('editarModal');
        getCartas();
    } catch (error) {
        manejarError(error);
        // Revertir el estado de carga en caso de error
        const container = document.getElementById('cartas-container');
        container.innerHTML = '';
    }
}

async function eliminarCarta() {
    const id = document.getElementById('eliminarId').value;
    if (!id) {
        manejarError({ message: "Por favor, ingrese un ID válido" });
        return;
    }

    if (!confirm('¿Está seguro que desea eliminar esta carta?')) {
        return;
    }

    mostrarCargando();
    try {
        const response = await fetch(`/cartas/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Error al eliminar la carta');
        const data = await response.json();
        
        mostrarMensajeExito('Carta eliminada exitosamente');
        cerrarModal('eliminarModal');
        getCartas(); // Actualizar la lista de cartas
    } catch (error) {
        manejarError(error);
        // Revertir el estado de carga en caso de error
        const container = document.getElementById('cartas-container');
        container.innerHTML = '';
    }
}

async function crearCarta() {
    const nombre = document.getElementById('crearNombre').value;
    const significadoDerecho = document.getElementById('crearSignificadoDerecho').value;
    const significadoInvertido = document.getElementById('crearSignificadoInvertido').value;

    if (!nombre || !significadoDerecho || !significadoInvertido) {
        manejarError({ message: "Por favor, complete todos los campos" });
        return;
    }

    mostrarCargando();
    try {
        const response = await fetch('/cartas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                numero_romano: '', // Se generará automáticamente
                significado_upright: significadoDerecho.split('\n'),
                significado_reversed: significadoInvertido.split('\n'),
                elemento: '', // Se generará automáticamente
                planeta: '', // Se generará automáticamente
                imagen_url: '' // Se generará automáticamente
            })
        });
        
        if (!response.ok) throw new Error('Error al crear la carta');
        const data = await response.json();
        
        mostrarMensajeExito('Carta creada exitosamente');
        cerrarModal('crearModal');
        getCartas(); // Actualizar la lista de cartas
    } catch (error) {
        manejarError(error);
        // Revertir el estado de carga en caso de error
        const container = document.getElementById('cartas-container');
        container.innerHTML = '';
    }
}

// Función para cerrar modal
function cerrarModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) {
        modal.hide();
    }
    // Limpiar campos del formulario
    const form = document.getElementById(modalId)?.querySelector('form');
    if (form) {
        form.reset();
    }
}

// Función para mostrar mensaje de éxito
function mostrarMensajeExito(mensaje) {
    const container = document.getElementById('cartas-container');
    container.innerHTML = `
        <div class="alert alert-success text-center" role="alert">
            <i class="bi bi-check-circle-fill"></i>
            <p>${mensaje}</p>
        </div>
    `;
    
    // Cerrar todos los modales abiertos
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        }
    });
    
    setTimeout(() => {
        getCartas();
    }, 2000);
}

// Cargar cartas al inicio
document.addEventListener('DOMContentLoaded', getCartas);
document.addEventListener('DOMContentLoaded', getArcanosMayores);
