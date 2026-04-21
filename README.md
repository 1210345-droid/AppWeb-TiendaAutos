# 🚗 Sistema Autopartes V3 - ERP & C2C Marketplace

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-LocalDB-blue.svg)](https://microsoft.com/sql)
[![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla_JS-yellow.svg)](https://developer.mozilla.org/)

Plataforma unificada y ultraligera construida con **Node.js y SQL Server** que funge simultáneamente como un sistema de **Gestión de Recursos Empresariales (ERP)** para administradores, y un vibrante **E-Commerce Bidireccional (C2C)** estilo Mercado Libre para venta global de repuestos y piezas de segunda mano.

---

## 🌟 Características Principales (Features)

### 🔐 Seguridad y Autenticación
* **Arquitectura Rol-Base:** Ecosistema dividido estructuralmente entre `Administradores` y `Clientes`.
* **Zero-Knowledge Checkout:** Pasarela de pago simulada que cifra o destruye las fechas y CVVs instantáneamente y encripta el LocalStorage.

### 💼 Panel de Control Corporativo (Administradores)
* **Gestión Activa de Catálogo (CRUD):** Control absoluto de subida, bajas y precios del inventario, blindados ante SQL Injections.
* **Tracker Logístico de Nivel Mundial:** Consola de paquetería en tiempo real para modificar la gravedad de envíos (Ej. "En Aduanas", "En camino") actualizándolo en cadena hacia el cliente local.
* **Directorio de Usuarios:** Administración y control del padrón total de clientes registrados en la DB.

### 🛒 Tienda Virtual al Consumidor (Marketplace)
* **Shopping Cart Transaccional:** Sistema atómico (SQL Transactions) que procesa carritos enteros y genera Tickets inviolables de compra global.
* **Modelo Bidireccional C2C (Bazar):** Los clientes pueden fungir como proveedores subiendo y etiquetando piezas bajo sus nombres bajo clasificaciones (Semi-Nuevo, Desgastes).
* **Mega Buscador Global:** Algoritmos de "Búsqueda en Vivo" en NavBox que acortan y filtran la tienda.
* **Perfil Interactivo de Tracking:** Historial detallado por cuentas reflejando instantáneamente el color-tag de progreso logístico por Orden.

---

## 🛠️ Tecnologías Empleadas (Stack)

*   **Backend framework**: `Node.js` + `Express`
*   **Base de Datos**: `Microsoft SQL Server (LocalDB)`
*   **Controlador DB**: `mssql` / `msnodesqlv8` (Autenticación Nativa Windows)
*   **Frontend**: `HTML5`, `Vanilla JavaScript`, `CSS3` (Media-Queries / Mobile Responsive)

---

## 📜 Instrucciones de Instalación Local

1. Asegúrate de tener iniciada y configurada tu base de datos SQL Server Local `(localdb)\\MSSQLLocalDB` con el esquema `sistema_tienda_autos`.
2. Clona este repositorio o descarga los archivos en tu PC.
3. Abre tu terminal de comandos (CMD o Bash) en la ruta del proyecto.
4. Instala las dependencias del motor:
```bash
npm install
```
5. Levanta el servidor estelar:
```bash
node server.js
```
6. Ingresa con cualquier navegador a: `http://localhost:5000`
