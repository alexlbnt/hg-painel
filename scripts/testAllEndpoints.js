const BASE_URL = 'http://localhost:8081';

async function testEndpoints() {
  console.log('=== TESTE DE ENDPOINTS DA API ===\n');
  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`✅ [OK] ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ [FALHA] ${name}:`, e.message);
      failed++;
    }
  }

  // 1. GET /api/rooms
  await check('GET /api/rooms (listar salas e contagens)', async () => {
    const res = await fetch(`${BASE_URL}/api/rooms`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length !== 3) throw new Error(`Esperado 3 salas, recebido ${data?.length}`);
    const alex = data.find(r => r.code === 'MESA-ALEX');
    const joao = data.find(r => r.code === 'MESA-JOAO');
    const lobo = data.find(r => r.code === 'MESA-LOBO');
    if (!alex || !joao || !lobo) throw new Error('Salas ALEX, JOAO ou LOBO ausentes');
    if (alex._count.characters !== 2) throw new Error(`Mesa Alex deveria ter 2 personagens, tem ${alex._count.characters}`);
    if (joao._count.characters !== 2) throw new Error(`Mesa João deveria ter 2 personagens, tem ${joao._count.characters}`);
    if (lobo._count.characters !== 3) throw new Error(`Mesa Lobo deveria ter 3 personagens, tem ${lobo._count.characters}`);
  });

  // 2. Auth Logins
  const usersToTest = [
    { username: 'alex.g', pass: '2807', expectedRole: 'DM', name: 'Alex' },
    { username: 'joao.c', pass: '7392', expectedRole: 'DM', name: 'João' },
    { username: 'lobo.l', pass: '9024', expectedRole: 'DM', name: 'Lobo' },
    { username: 'allan.m', pass: '6271', expectedRole: 'PLAYER', name: 'Allan' }
  ];

  for (const u of usersToTest) {
    await check(`POST /api/auth/login (login de ${u.name} - @${u.username})`, async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u.username, password: u.pass })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || data.role !== u.expectedRole) {
        throw new Error(`Role inesperado: ${data?.role} vs ${u.expectedRole}`);
      }
      if (!data.roomId) {
        throw new Error(`Usuário @${u.username} não retornou roomId no login`);
      }
    });
  }

  // 3. Characters por Sala
  await check('GET /api/characters?roomId=MESA-ALEX', async () => {
    const res = await fetch(`${BASE_URL}/api/characters?roomId=c643dd1e-bd68-4ae3-9b3f-3b697ea78a27`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.length !== 2) throw new Error(`Esperado 2 personagens na Mesa Alex, recebido ${data.length}`);
  });

  await check('GET /api/characters?roomId=MESA-JOAO', async () => {
    const res = await fetch(`${BASE_URL}/api/characters?roomId=ddbb1f6b-cd09-49ca-ab67-fdc5b797c65c`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.length !== 2) throw new Error(`Esperado 2 personagens na Mesa João, recebido ${data.length}`);
  });

  await check('GET /api/characters?roomId=MESA-LOBO', async () => {
    const res = await fetch(`${BASE_URL}/api/characters?roomId=fd78299e-9c16-471c-ac98-3af9fe9a609d`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.length !== 3) throw new Error(`Esperado 3 personagens na Mesa Lobo, recebido ${data.length}`);
  });

  // 4. GET /api/users
  await check('GET /api/users (listar usuários com salas)', async () => {
    const res = await fetch(`${BASE_URL}/api/users`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 9) throw new Error(`Esperado >= 9 usuários, recebido ${data.length}`);
    const withRooms = data.filter(u => u.roomId && u.room);
    if (withRooms.length < 9) throw new Error(`Apenas ${withRooms.length} usuários têm room populado`);
  });

  // 5. GET /api/tasks (tarefas compartilhadas)
  await check('GET /api/tasks (tarefas compartilhadas)', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Retorno de tarefas não é array');
  });

  // 6. GET /api/journal/sessions (sessões)
  await check('GET /api/journal/sessions', async () => {
    const res = await fetch(`${BASE_URL}/api/journal/sessions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Retorno de sessões não é array');
  });

  console.log(`\n========================================`);
  console.log(`RESULTADO FINAL: ${passed} passaram | ${failed} falharam`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

testEndpoints().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
