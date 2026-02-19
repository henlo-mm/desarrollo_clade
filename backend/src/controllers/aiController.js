const Anthropic = require('@anthropic-ai/sdk');

const decomposeTask = async (req, res) => {
  try {
    const { description, context } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'La descripción de la tarea es requerida' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ message: 'La API key de Anthropic no está configurada' });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `Eres un experto en gestión de proyectos de software. Tu tarea es descomponer tareas complejas de desarrollo en subtareas específicas y accionables.

Para cada subtarea debes proporcionar:
- title: Título breve y claro (máximo 100 caracteres)
- description: Descripción detallada de lo que hay que hacer
- priority: Una de "alta", "media" o "baja" basada en importancia y dependencias
- estimated_hours: Estimación realista en horas (número decimal, ej: 1.5)

Responde ÚNICAMENTE con un array JSON válido, sin texto adicional, sin markdown, sin bloques de código.`;

    const userMessage = `Descompón la siguiente tarea de desarrollo en subtareas específicas y accionables:

Tarea: "${description}"${context ? `\n\nContexto del proyecto: "${context}"` : ''}

Genera entre 3 y 10 subtareas según la complejidad. Asegúrate de cubrir todos los aspectos necesarios (backend, frontend, tests, documentación si aplica).`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = message.content[0].text.trim();

    let subtasks;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      subtasks = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (parseError) {
      return res.status(500).json({
        message: 'Error al parsear la respuesta de la IA',
        raw: content,
      });
    }

    if (!Array.isArray(subtasks)) {
      return res.status(500).json({ message: 'La IA no devolvió un formato válido' });
    }

    res.json({ subtasks });
  } catch (error) {
    if (error.status === 401) {
      return res.status(401).json({ message: 'API key de Anthropic inválida' });
    }
    if (error.status === 429) {
      return res.status(429).json({ message: 'Límite de rate de la API de Anthropic alcanzado' });
    }
    res.status(500).json({ message: 'Error al llamar al servicio de IA', error: error.message });
  }
};

module.exports = { decomposeTask };
