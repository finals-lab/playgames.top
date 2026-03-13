// generar-guia.js
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Lista de juegos para generar guías
const JUEGOS = [
    { nombre: 'Zelda Tears of the Kingdom', slug: 'zelda-totk' },
    { nombre: 'Super Mario Bros Wonder', slug: 'mario-wonder' },
    { nombre: 'Fortnite', slug: 'fortnite' },
    { nombre: 'Minecraft', slug: 'minecraft' },
    { nombre: 'EA Sports FC 25', slug: 'ea-fc-25' }
];

async function generarGuia(juego) {
    console.log(`🎮 Generando: ${juego.nombre}`);
    
    const prompt = `Escribe una GUÍA COMPLETA sobre "${juego.nombre}" para jugadores.
    
Incluye:
1. Título llamativo
2. Introducción (qué tipo de juego es, por qué es popular)
3. 5 consejos para principiantes
4. 3 trucos avanzados
5. Un dato curioso

Extensión: alrededor de 300-400 palabras.`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 1500
            })
        });

        const data = await response.json();
        const contenido = data.choices[0].message.content;
        const fecha = new Date().toLocaleDateString('es-ES');

        // Crear HTML
        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Guía de ${juego.nombre} - PlayGames.top</title>
    <style>
        body { font-family: Arial; padding: 20px; background: #1a1a2e; color: white; max-width: 800px; margin: 0 auto; }
        h1 { color: #ff6b6b; }
        h2 { color: #ffd966; }
        .fecha { color: #888; font-size: 0.9em; margin-bottom: 30px; }
        a { color: #ffd966; }
        .contenido { line-height: 1.6; }
    </style>
</head>
<body>
    <h1>🎮 Guía de ${juego.nombre}</h1>
    <div class="fecha">📅 Actualizado: ${fecha}</div>
    <div class="contenido">
        ${contenido.replace(/\n/g, '<br>')}
    </div>
    <p><a href="/playgames.top/">← Volver a PlayGames.top</a></p>
</body>
</html>`;

        const nombreArchivo = `guia-${juego.slug}.html`;
        fs.writeFileSync(path.join(__dirname, nombreArchivo), html);
        console.log(`✅ Creado: ${nombreArchivo}`);
        return { nombre: juego.nombre, archivo: nombreArchivo };
        
    } catch (error) {
        console.error(`❌ Error con ${juego.nombre}:`, error.message);
        return null;
    }
}

// ⚠️ FUNCIÓN CORREGIDA - Usa los marcadores de inicio y fin
async function actualizarIndex(guiasGeneradas) {
    const indexPath = path.join(__dirname, 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Generar la lista de guías con la ruta correcta
    const listaGuias = guiasGeneradas.map(g => `
    <div class="guia-item">
        <a href="/playgames.top/${g.archivo}">🎮 ${g.nombre}</a>
    </div>`).join('');
    
    // Crear el bloque completo con los marcadores
    const nuevoBloque = `<!-- GUIAS_AUTOMATICAS -->\n<div class="guias-lista">${listaGuias}</div>\n<!-- FIN GUIAS_AUTOMATICAS -->`;
    
    // Buscar y reemplazar TODO lo que hay entre los marcadores
    const regex = /<!-- GUIAS_AUTOMATICAS -->[\s\S]*?<!-- FIN GUIAS_AUTOMATICAS -->/;
    
    if (regex.test(indexContent)) {
        // Si encuentra los marcadores de inicio y fin, reemplaza todo el bloque
        indexContent = indexContent.replace(regex, nuevoBloque);
        console.log('✅ Reemplazado bloque entre marcadores');
    } else if (indexContent.includes('<!-- GUIAS_AUTOMATICAS -->')) {
        // Si solo encuentra el de inicio, reemplaza desde ahí hasta el final
        const startPos = indexContent.indexOf('<!-- GUIAS_AUTOMATICAS -->');
        indexContent = indexContent.substring(0, startPos) + nuevoBloque;
        console.log('✅ Añadido bloque desde marcador inicio');
    } else {
        // Si no hay marcador, añadirlo antes de </body>
        indexContent = indexContent.replace('</body>', `${nuevoBloque}\n</body>`);
        console.log('✅ Añadido bloque antes de </body>');
    }
    
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Index actualizado correctamente');
}

async function main() {
    console.log('🚀 Iniciando generación automática de guías...');
    
    const guiasGeneradas = [];
    for (const juego of JUEGOS) {
        const resultado = await generarGuia(juego);
        if (resultado) {
            guiasGeneradas.push(resultado);
        }
        // Pequeña pausa entre juegos
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Actualizar index.html
    if (guiasGeneradas.length > 0) {
        await actualizarIndex(guiasGeneradas);
    }
    
    console.log('✨ Proceso completado!');
}

main();
