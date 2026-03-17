# MyDocker GUI - IA Development Steps

## 📋 Estructura de la Aplicación

### **Arquitectura General**
```
mydockergui/
├── src/
│   ├── main/                    # Proceso Main (Electron)
│   │   ├── main.js             # Ventana principal y configuración
│   │   ├── preload.js          # Puente IPC seguro
│   │   └── docker-service.js  # Capa de API centralizada
│   └── renderer/               # Proceso Renderer (UI)
│       ├── index.html          # Página principal
│       ├── router.js           # Navegación SPA
│       ├── components/         # Componentes reutilizables
│       │   └── header.js       # Header compartido
│       ├── pages/              # Páginas de la aplicación
│       │   ├── dashboard.js    # Dashboard principal
│       │   ├── create-single.js # Crear contenedor individual
│       │   └── create-multiple.js # Crear múltiples contenedores
│       └── styles/             # Estilos globales
│           └── main.css        # CSS variables y utilidades
├── package.json                # Dependencias y scripts
└── README.md                   # Documentación del proyecto
```

## 🏗️ Principios de Clean Architecture Aplicados

### **1. Separación de Responsabilidades**
- **Main Process**: Solo gestión de ventana y comunicación IPC
- **Renderer Process**: Solo lógica de UI y presentación
- **Docker Service**: Única fuente de verdad para operaciones Docker
- **Router**: Gestión de navegación desacoplada

### **2. Comunicación Segura**
- **preload.js**: Expone solo APIs necesarias al renderer
- **IPC Handlers**: Validación y manejo de errores en main process
- **Context Isolation**: Previene acceso directo a Node APIs

### **3. Componentización**
- **Web Components**: Reutilizables y encapsulados
- **Shadow DOM**: Aislamiento de estilos
- **Single Responsibility**: Cada componente tiene una función clara

## 🚀 Pasos de Desarrollo Seguidos

### **Fase 1: Configuración Base**
1. **Package.json**: Dependencias de Electron y scripts
2. **Main Process**: Ventana, configuración y preload
3. **Docker Service**: Capa centralizada con logging

### **Fase 2: Arquitectura de Comunicación**
1. **IPC Handlers**: Métodos seguros para operaciones Docker
2. **Preload Bridge**: Exposición controlada de APIs
3. **Error Handling**: Manejo robusto de errores

### **Fase 3: UI Components**
1. **Header Component**: Reutilizable con navegación
2. **Router System**: SPA con history management
3. **CSS Architecture**: Variables y diseño consistente

### **Fase 4: Pages Implementation**
1. **Dashboard**: Visualización de datos Docker
2. **Create Single**: Formulario reactivo para un contenedor
3. **Create Multiple**: Sistema de servicios complejos

### **Fase 5: UX/UI Enhancements**
1. **Dark Theme**: Diseño consistente estilo Discord
2. **Responsive Design**: Mobile-first approach
3. **Form Reactivity**: Vista previa en tiempo real

## 🎯 Patrones y Buenas Prácticas

### **Data Flow Pattern**
```
User Action → Component → IPC → Main Process → Docker Service → System
                ↓
            Update UI ← IPC Response ← Processed Result
```

### **Error Handling Pattern**
```javascript
try {
    const result = await operation();
    return { success: true, data: result };
} catch (error) {
    console.error(`[Service] Error: ${error.message}`);
    return { success: false, error: error.message };
}
```

### **Component Pattern**
```javascript
class ComponentName extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }
}
```

## 🔧 Configuración de Scripts

### **Development vs Production**
- **npm run dev**: Muestra DevTools para debugging
- **npm run start**: Modo producción sin DevTools
- **npm run build**: Empaqueta aplicación para distribución

### **Logging Strategy**
- **Development**: Logs detallados de comandos Docker
- **Production**: Logs esenciales con información de contexto
- **Error Tracing**: Stack traces y contexto completo

## 📊 Tipos de Datos y Validación

### **Docker Data Structures**
```javascript
// Container
{
    id: string,
    image: string,
    status: string,
    ports: string,
    names: string
}

// Image
{
    repository: string,
    tag: string,
    id: string,
    createdAt: string,
    size: string
}

// Volume
{
    name: string,
    driver: string
}
```

### **Form Data Validation**
- **Required Fields**: Validación antes de ejecutar comandos
- **Type Checking**: Asegurar tipos correctos (puertos como números)
- **Sanitization**: Prevenir inyección de comandos

## 🎨 Sistema de Estilos

### **CSS Architecture**
- **CSS Variables**: Tema consistente y fácil mantenimiento
- **Component Scoping**: Shadow DOM para aislamiento
- **Responsive Units**: rem/em para accesibilidad
- **Dark Theme**: Colores consistentes estilo Discord

### **Color Palette (Dark Theme)**
```css
--bg-primary: #36393f;      /* Fondo principal */
--bg-secondary: #2f3136;    /* Contenedores */
--bg-tertiary: #40444b;     /* Tarjetas */
--accent-primary: #5865f2;   /* Azul Discord */
--accent-success: #3ba55c;   /* Verde */
--accent-danger: #ed4245;    /* Rojo */
--text-primary: #dcddde;     /* Texto principal */
--text-secondary: #b9bbbe;   /* Texto secundario */
```

## 🔄 Estado Actual y Próximos Pasos

### **Implementado ✅**
- Arquitectura base con separación clara
- Comunicación IPC segura
- Dashboard con visualización de datos
- Formularios reactivos con vista previa
- Tema oscuro consistente
- Logging detallado

### **Mejoras Futuras 🎯**
- **Testing**: Unit tests para Docker Service
- **Config Persistence**: Guardar configuraciones
- **Advanced Docker**: Networks, secrets, configs
- **Performance**: Lazy loading de componentes
- **Accessibility**: ARIA labels y keyboard navigation

## 📝 Guía para Mantenimiento

### **Al Modificar Docker Commands**
1. **Actualizar Docker Service**: Método en `docker-service.js`
2. **IPC Handler**: Exponer nuevo método en `main.js`
3. **Preload Bridge**: Añadir al `preload.js`
4. **Component**: Implementar lógica en componente específico

### **Al Añadir Nueva Página**
1. **Crear Component**: Nuevo archivo en `pages/`
2. **Crear HTML**: Archivo `.html` correspondiente en `pages/`
3. **Actualizar Router**: Añadir ruta en `router.js`
4. **Header Navigation**: Añadir enlace si es necesario
5. **Estilos**: Usar variables CSS existentes

### **📌 REGLA IMPORTANTE: Separación HTML/JS**
**SIEMPRE** que se cree una página nueva:
- El HTML debe ir en un archivo `.html` separado (ej: `dashboard.html`)
- El JavaScript debe ir en un archivo `.js` separado (ej: `dashboard.js`)
- El método `render()` del componente JavaScript **SIEMPRE** debe cargar el contenido desde el archivo HTML usando:
  ```javascript
  this.render('./pages/nombre-pagina.html')
  ```
- **NUNCA** embeber HTML directamente en el JavaScript como string
- Esto aplica a TODOS los componentes: páginas, componentes reutilizables, etc.

**Ejemplo correcto:**
```javascript
class NuevaPagina extends BaseComponent {
    connectedCallback() {
        this.render('./pages/nueva-pagina.html').then(() => {
            this.attachEventListeners();
            this.loadData();
        });
    }
}
```

### **Al Modificar Estilos**
1. **CSS Variables**: Priorizar variables globales
2. **Component Scoped**: Mantener en Shadow DOM
3. **Responsive**: Probar en mobile y desktop
4. **Dark Theme**: Mantener coherencia de colores

## 🎯 Principios para Vibe Coding Prolongado

### **1. Consistencia sobre Creatividad**
- Patrones repetibles para componentes
- Nomenclatura estándar
- Estructura de archivos predecible

### **2. Documentación Viva**
- Comentarios en puntos clave
- Nombres descriptivos de funciones
- README actualizado

### **3. Testing Mental**
- ¿Qué pasa si Docker no está instalado?
- ¿Cómo maneja comandos inválidos?
- ¿Qué pasa con datos vacíos?

### **4. Escalabilidad**
- Componentes desacoplados
- Fácil añadir nuevas funcionalidades
- Configuración centralizada

---

**Última Actualización**: 17/03/2026  
**Estado**: Functional MVP con Clean Architecture  
**Próximo Objetivo**: Testing y Persistencia de Configuración
