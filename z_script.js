
        const API_URL = "http://localhost:5000/api";

        // Al cargar página revisamos localStorage para UX
        document.addEventListener("DOMContentLoaded", () => {
            if (localStorage.getItem("sesionUnica") === "true") {
                mostrarLogeado();
            }
        });

        let isRegistering = false;

        function toggleRegister() {
            isRegistering = !isRegistering;
            document.getElementById("authTitle").innerText = isRegistering ? "Registrar Nuevo Usuario" : "Iniciar Sesión";
            document.getElementById("authBtn").innerText = isRegistering ? "Crear Cuenta" : "Ingresar";
            document.getElementById("toggleAuth").innerText = isRegistering ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Crear una";
            document.getElementById("loginError").classList.add("hidden");

            if (isRegistering) document.getElementById("regFields").classList.remove("hidden");
            else document.getElementById("regFields").classList.add("hidden");
        }

        async function procesarAuth() {
            if (isRegistering) {
                await register();
            } else {
                await login();
            }
        }

        async function register() {
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            const nombre = document.getElementById("regNombre").value;
            const apellido = document.getElementById("regApellido").value;
            const telefono = document.getElementById("regTelefono").value;
            const errorDiv = document.getElementById("loginError");

            localStorage.setItem("userName", username); // Pre-save 

            if (!username || !password || !nombre || !apellido) {
                errorDiv.innerText = "Usuario, Contraseña, Nombre y Apellido son obligatorios.";
                errorDiv.classList.remove("hidden");
                return;
            }

            try {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, nombre, apellido, telefono: telefono || null })
                });

                const data = !!res.headers.get("content-type")?.includes("json") ? await res.json() : null;

                if (res.ok) {
                    alert("Usuario creado con éxito. Ahora puedes Iniciar Sesión.");
                    document.getElementById("password").value = "";
                    toggleRegister(); // Regresa a pantalla de Login
                } else {
                    errorDiv.innerText = (data && data.message) ? data.message : "Error al crear usuario.";
                    errorDiv.classList.remove("hidden");
                }
            } catch (err) {
                errorDiv.innerText = "Error conectando al backend.";
                errorDiv.classList.remove("hidden");
            }
        }

        async function login() {
            const username = document.getElementById("username").value;
            localStorage.setItem("userName", username);
            const password = document.getElementById("password").value;
            const errorDiv = document.getElementById("loginError");

            if (!username || !password) {
                errorDiv.innerText = "Campos vacíos";
                errorDiv.classList.remove("hidden");
                return;
            }

            try {
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    localStorage.setItem("sesionUnica", "true");
                    localStorage.setItem("userRol", data.rol);
                    errorDiv.classList.add("hidden");
                    mostrarLogeado();
                } else {
                    errorDiv.innerText = "Usuario o contraseña incorrectos.";
                    errorDiv.classList.remove("hidden");
                }
            } catch (err) {
                console.error(err);
                alert("Error conectando al backend (¿Está el servidor escuchando en localhost:5000?)");
            }
        }

        function logout() {
            localStorage.removeItem("sesionUnica");
            localStorage.removeItem("userRol");
            document.getElementById("mainSection").classList.add("hidden");
            document.getElementById("loginSection").classList.remove("hidden");
            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
        }

        function mostrarLogeado() {
            document.getElementById("loginSection").classList.add("hidden");
            document.getElementById("mainSection").classList.remove("hidden");

            if (localStorage.getItem("userRol") === "admin") {
                document.getElementById("navClientes").classList.remove("hidden");
                document.getElementById("navCarrito").classList.add("hidden");
                document.getElementById("navPerfil").classList.add("hidden");
                mostrarSeccion('clientes');
            } else {
                document.getElementById("navClientes").classList.add("hidden");
                document.getElementById("navCarrito").classList.remove("hidden");
                document.getElementById("navPerfil").classList.remove("hidden");
                cargarPerfilSilencioso(); // Get Client ID preemptively
                mostrarSeccion('productos');
            }
        }

        async function cargarPerfilSilencioso() {
            const user = localStorage.getItem("userName");
            try {
                const res = await fetch(`${API_URL}/perfil/${user}`);
                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem("idCliente", data.id);
                }
            } catch (e) { }
        }

        function mostrarSeccion(seccion) {
            document.getElementById("seccionClientes").classList.add("hidden");
            document.getElementById("seccionProductos").classList.add("hidden");
            document.getElementById("seccionCarrito").classList.add("hidden");
            document.getElementById("seccionPerfil").classList.add("hidden");

            if (seccion === 'clientes') {
                document.getElementById("seccionClientes").classList.remove("hidden");
                cargarClientes();
            } else if (seccion === 'productos') {
                document.getElementById("seccionProductos").classList.remove("hidden");

                if (localStorage.getItem("userRol") === "admin") {
                    document.getElementById("tituloProductos").innerText = "Gestión de Productos";
                    document.getElementById("formAddProducto").classList.remove("hidden");
                    document.getElementById("busquedaCliente").classList.add("hidden");
                    cargarSelects();
                } else {
                    document.getElementById("tituloProductos").innerText = "Productos";
                    document.getElementById("formAddProducto").classList.add("hidden");
                    document.getElementById("busquedaCliente").classList.remove("hidden");
                }
                cargarProductos();
            } else if (seccion === 'carrito') {
                document.getElementById("seccionCarrito").classList.remove("hidden");
                renderCarrito();
            } else if (seccion === 'perfil') {
                document.getElementById("seccionPerfil").classList.remove("hidden");
                cargarPerfil();
            }
        }

        /* ----- FUNCIONES PARA CLIENTES ------ */
        async function cargarClientes() {
            try {
                const res = await fetch(`${API_URL}/clientes`);
                const data = await res.json();
                let html = "";
                data.forEach(c => {
                    html += `<tr>
                        <td>${c.id}</td>
                        <td>${c.nombre}</td>
                        <td>${c.apellido}</td>
                        <td>${c.telefono || '-'}</td>
                        <td><button class="btn-danger" onclick="eliminarCliente(${c.id})">Borrar</button></td>
                    </tr>`;
                });
                document.getElementById("tablaClientes").innerHTML = html;
            } catch (err) { console.error(err); }
        }

        async function agregarCliente() {
            const nombre = document.getElementById("cliNombre").value;
            const apellido = document.getElementById("cliApellido").value;
            const telefono = document.getElementById("cliTelefono").value;

            if (!nombre || !apellido) {
                alert("Nombre y apellido son requeridos");
                return;
            }

            try {
                await fetch(`${API_URL}/clientes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, apellido, telefono: telefono || null })
                });

                document.getElementById("cliNombre").value = "";
                document.getElementById("cliApellido").value = "";
                document.getElementById("cliTelefono").value = "";
                alert("Cliente agregado con éxito");
                cargarClientes();
            } catch (error) {
                alert("Error al guardar cliente");
            }
        }

        async function eliminarCliente(id) {
            if (!confirm("¿Estás seguro de borrar este cliente?")) return;
            try {
                await fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' });
                cargarClientes();
            } catch (error) {
                alert("Error al borrar el cliente");
            }
        }

        /* ----- FUNCIONES PARA PRODUCTOS ------ */
        let globalProductos = [];
        let filtroCategoria = 'Todas';

        async function cargarProductos() {
            try {
                const res = await fetch(`${API_URL}/productos`);
                globalProductos = await res.json();
                renderProductosManager();
            } catch (err) { console.error(err); }
        }

        function setFiltroCat(cat) {
            filtroCategoria = cat;
            document.querySelectorAll('.pill').forEach(el => el.classList.remove('active'));
            event.target.classList.add('active');
            filtrarProductos();
        }

        function filtrarProductos() {
            renderProductosManager();
        }

        function renderProductosManager() {
            const isAdmin = localStorage.getItem("userRol") === "admin";
            let data = globalProductos;

            if (!isAdmin) {
                const searchEl = document.getElementById("buscadorDocs");
                const q = searchEl ? searchEl.value.toLowerCase() : "";

                data = globalProductos.filter(p => {
                    let matchCat = (filtroCategoria === 'Todas' || p.categoria === filtroCategoria);

                    let safeDesc = p.descripcion ? p.descripcion.toLowerCase() : "";
                    let safeMarca = p.marca ? p.marca.toLowerCase() : "";
                    let matchSearch = safeDesc.includes(q) || safeMarca.includes(q);

                    return matchCat && matchSearch;
                });
            }

            if (isAdmin) {
                document.getElementById("tablaModoAdmin").classList.remove("hidden");
                document.getElementById("gridProductos").classList.add("hidden");
                let headersHTML = `<tr><th>ID</th><th>Imagen</th><th>Categoria</th><th>Marca</th><th>Descripción</th><th>Costo</th><th>Proveedor</th><th>Precio</th><th>Acciones</th></tr>`;
                document.getElementById("headProductos").innerHTML = headersHTML;
                let html = "";
                data.forEach(p => {
                    let rawDesc = p.descripcion ? p.descripcion : 'Sin nombre';
                    let safeDescForClick = rawDesc.replace(/'/g, "\\'");

                    let rowHtml = `<tr>
                        <td>${p.id}</td>
                        <td><img src="${p.imagen_url || 'https://via.placeholder.com/50'}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"></td>
                        <td>${p.categoria || 'General'}</td>
                        <td>${p.marca || '-'}</td>
                        <td>${rawDesc}</td>
                        <td>$${parseFloat(p.costo || 0).toFixed(2)}</td>
                        <td>${p.proveedor || '-'}</td>
                        <td>$${parseFloat(p.precioVenta || 0).toFixed(2)}</td>
                        <td>
                            <button class="btn-success" style="background:#0284c7;" onclick="editarProducto(${p.id}, '${safeDescForClick}', ${p.precioVenta}, ${p.costo || 0}, '${p.marca || ''}', '${p.proveedor || ''}', '${p.imagen_url || ''}', '${p.categoria || ''}')">✏️ Editar</button>
                            <button class="btn-danger" onclick="eliminarProducto(${p.id})">Borrar</button>
                        </td>
                    </tr>`;
                    html += rowHtml;
                });
                document.getElementById("tablaProductos").innerHTML = html;
            } else {
                document.getElementById("tablaModoAdmin").classList.add("hidden");
                document.getElementById("gridProductos").classList.remove("hidden");
                let gridHtml = '';
                if (data.length === 0) gridHtml = '<p style="grid-column: 1/-1; text-align:center; color:#94a3b8;">No hay resultados para tu búsqueda...</p>';

                data.forEach(p => {
                    let priceFloat = parseFloat(p.precioVenta || 0);
                    let rawDesc = p.descripcion ? p.descripcion : 'Sin nombre';
                    let safeDesc = rawDesc.replace(/'/g, "\\'");
                    let safeMarca = p.marca ? p.marca.replace(/'/g, "\\'") : 'Genérico';
                    let safeImg = p.imagen_url || 'https://via.placeholder.com/200';

                    gridHtml += `
                    <div class="product-card" style="cursor:pointer;" onclick="abrirModalProd(${p.id}, '${safeDesc}', '${safeMarca}', ${priceFloat}, '${safeImg}')">
                        <img src="${safeImg}" alt="${safeDesc}">
                        <div class="marca">${safeMarca}</div>
                        <h3>${rawDesc}</h3>
                        <div class="precio">$${priceFloat.toFixed(2)}</div>
                    </div>`;
                });
                document.getElementById("gridProductos").innerHTML = gridHtml;
            }
        }

        function toggleModal(id, show) {
            const el = document.getElementById(id);
            if (show) el.classList.add("active");
            else el.classList.remove("active");
        }

        function abrirModalProd(id, desc, marca, precio, img) {
            document.getElementById("mProdImg").src = img;
            document.getElementById("mProdMarca").innerText = marca;
            document.getElementById("mProdDesc").innerText = desc;
            document.getElementById("mProdPrecio").innerText = `$${precio.toFixed(2)}`;
            document.getElementById("mProdQty").value = 1;

            document.getElementById("mProdBtn").onclick = function () {
                let qty = parseInt(document.getElementById("mProdQty").value) || 1;
                comprarProductoRapido(id, desc, precio, qty);
                toggleModal('modalProducto', false);
            };

            toggleModal('modalProducto', true);
        }

        function editarProducto(id, desc, precio, costo, marca, prov, img, cat) {
            document.getElementById("prodIdEdit").value = id;
            document.getElementById("prodDesc").value = desc;
            document.getElementById("prodPrecio").value = precio;
            document.getElementById("prodCosto").value = costo || "";
            document.getElementById("prodMarca").value = marca || "";
            document.getElementById("prodProv").value = prov || "";
            document.getElementById("prodImg").value = img || "";
            document.getElementById("prodCat").value = cat || "General";

            document.getElementById("btnGuardarProd").innerText = "🔄 Actualizar Producto";
            document.getElementById("btnCancelarEdit").classList.remove("hidden");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function cancelarEdicion() {
            document.getElementById("prodIdEdit").value = "";
            document.getElementById("prodDesc").value = "";
            document.getElementById("prodPrecio").value = "";
            document.getElementById("prodCosto").value = "";
            document.getElementById("prodMarca").value = "";
            document.getElementById("prodProv").value = "";
            document.getElementById("prodImg").value = "";

            document.getElementById("btnGuardarProd").innerText = "+ Agregar Producto";
            document.getElementById("btnCancelarEdit").classList.add("hidden");
        }

        async function guardarProducto() {
            const idEdit = document.getElementById("prodIdEdit").value;
            const descripcion = document.getElementById("prodDesc").value;
            const precio = document.getElementById("prodPrecio").value;
            const costo = document.getElementById("prodCosto").value;
            const nombreMarca = document.getElementById("prodMarca").value;
            const nombreProv = document.getElementById("prodProv").value;
            const imagen_url = document.getElementById("prodImg").value;
            const categoria = document.getElementById("prodCat").value;

            if (!descripcion || !precio) {
                alert("Descripción y precio son requeridos");
                return;
            }

            const methodType = idEdit ? 'PUT' : 'POST';
            const endpoint = idEdit ? `${API_URL}/productos/${idEdit}` : `${API_URL}/productos`;

            try {
                const res = await fetch(endpoint, {
                    method: methodType,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        descripcion,
                        precioVenta: parseFloat(precio),
                        costo: costo ? parseFloat(costo) : 0,
                        nombreMarca: nombreMarca.trim(),
                        nombreProv: nombreProv.trim(),
                        imagen_url: imagen_url.trim(),
                        categoria: categoria
                    })
                });

                const dataJSON = await res.json();

                if (!res.ok) {
                    alert("Error en SQL: " + (dataJSON.error || "Desconocido"));
                    return;
                }

                cancelarEdicion();
                cargarProductos();
                cargarSelects();
            } catch (e) {
                alert("Error crítico conectando: " + e.message);
            }
        }

        async function cargarSelects() {
            try {
                const [resM, resP] = await Promise.all([
                    fetch(`${API_URL}/marcas`),
                    fetch(`${API_URL}/proveedores`)
                ]);
                const marcas = await resM.json();
                const provs = await resP.json();

                let htmlM = '';
                marcas.forEach(m => htmlM += `<option value="${m.nombre}">`);
                document.getElementById('listMarcas').innerHTML = htmlM;

                let htmlP = '';
                provs.forEach(p => htmlP += `<option value="${p.nombre}">`);
                document.getElementById('listProvs').innerHTML = htmlP;
            } catch (e) { console.error("Error cargando selects"); }
        }

        // ============================================
        // CARRITO LOGIC
        // ============================================
        let carrito = [];

        function comprarProductoRapido(id, desc, precio, qty) {
            let exist = carrito.find(p => p.id === id);
            if (exist) exist.cantidad += qty;
            else carrito.push({ id, desc, precioVenta: precio, cantidad: qty });

            document.getElementById("cartCount").innerText = carrito.reduce((a, b) => a + b.cantidad, 0);
            mostrarSeccion('carrito');
        }

        function removerDelCarrito(id) {
            carrito = carrito.filter(p => p.id !== id);
            document.getElementById("cartCount").innerText = carrito.reduce((a, b) => a + b.cantidad, 0);
            renderCarrito();
        }

        function renderCarrito() {
            let html = "";
            let total = 0;
            carrito.forEach(p => {
                let subtotal = p.cantidad * p.precioVenta;
                total += subtotal;
                html += `<tr>
                    <td>${p.desc}</td>
                    <td>$${parseFloat(p.precioVenta).toFixed(2)}</td>
                    <td>${p.cantidad}</td>
                    <td>$${subtotal.toFixed(2)}</td>
                    <td><button class="btn-danger" onclick="removerDelCarrito(${p.id})">Quitar</button></td>
                </tr>`;
            });
            document.getElementById("tablaCarritoList").innerHTML = html;
            document.getElementById("cartTotal").innerText = total.toFixed(2);
        }

        async function pagarCarrito() {
            if (carrito.length === 0) return alert("Tu carrito está vacío");

            const idClienteStr = localStorage.getItem("idCliente");
            let reqBody = { items: carrito };
            if (idClienteStr) reqBody.idCliente = parseInt(idClienteStr);

            try {
                const res = await fetch(`${API_URL}/checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reqBody)
                });

                if (res.ok) {
                    const data = await res.json();
                    let totalP = document.getElementById("cartTotal").innerText;

                    carrito = [];
                    document.getElementById("cartCount").innerText = "0";
                    renderCarrito();

                    // Show Ticket
                    document.getElementById('tcktId').innerText = data.id_orden;
                    document.getElementById('tcktTotal').innerText = totalP;
                    toggleModal('modalTicket', true);

                } else {
                    const data = await res.json();
                    alert("Error en compra: " + data.error);
                }
            } catch (e) { alert("Error conectando al servidor"); }
        }

        async function eliminarProducto(id) {
            if (!confirm("¿Estás seguro de borrar este producto?")) return;
            try {
                await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' });
                cargarProductos();
            } catch {
                alert("Error al borrar el producto");
            }
        }

        async function cargarPerfil() {
            const user = localStorage.getItem("userName");
            try {
                const res = await fetch(`${API_URL}/perfil/${user}`);
                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem("idCliente", data.id);
                    let perfilHtml = `
                        <div class="profile-icon">🚗</div>
                        <h3>${data.nombre} ${data.apellido}</h3>
                        <p><strong>Teléfono:</strong> ${data.telefono || 'No registrado'}</p>
                        <p><strong>ID Cliente Nro:</strong> #00${data.id}</p>
                    `;
                    document.getElementById("profileCardBox").innerHTML = perfilHtml;
                    cargarHistorial(data.id);
                } else {
                    document.getElementById("profileCardBox").innerHTML = "<p>Tu cuenta no tiene un Perfil de Cliente Asociado (Creado antes de la V3).</p>";
                    document.getElementById("misOrdenesBox").innerHTML = "<p style='color:#94a3b8;'>Sin historial para mostrar.</p>";
                }
            } catch (e) {
                console.error(e);
            }
        }

        async function cargarHistorial(idC) {
            try {
                const res = await fetch(`${API_URL}/mis_ordenes/${idC}`);
                const data = await res.json();

                let box = document.getElementById("misOrdenesBox");
                if (!data || data.length === 0) {
                    box.innerHTML = "<p style='color:#94a3b8;'>Aún no tienes pedidos registrados.</p>";
                    return;
                }

                let html = "";
                data.forEach(o => {
                    let d = new Date(o.fecha).toLocaleDateString();
                    html += `<div class="history-item">
                        <div style="display:flex; justify-content:space-between;">
                            <h4>Orden #00${o.id_orden}</h4>
                            <span style="color:var(--success); font-weight:bold;">$${o.total.toFixed(2)}</span>
                        </div>
                        <p style="margin:5px 0 10px 0; font-size:12px; color:#94a3b8;">${d}</p>
                        <ul>`;
                    o.items.forEach(i => {
                        html += `<li>${i.qty}x ${i.desc} - $${i.price.toFixed(2)}</li>`;
                    });
                    html += `</ul></div>`;
                });
                box.innerHTML = html;
            } catch (e) { console.error(e); }
        }

    