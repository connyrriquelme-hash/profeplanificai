const endpoint = 'http://localhost:8787/api/planificar';

const payload = {
  curso: '2\u00B0 B\u00E1sico',
  asignatura: 'Lenguaje',
  objetivo_id: 'OA_3',
  necesidad_aula: 'Tengo estudiantes con d\u00E9ficit atencional y necesito estrategias DUA para la lectura.',
};

async function main() {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    console.log('Status:', response.status, response.statusText);
    console.log('Respuesta:');

    try {
      console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      console.log(text);
    }
  } catch (error) {
    console.error('Error al llamar al endpoint:', error);
    process.exitCode = 1;
  }
}

main();
