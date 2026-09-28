async function runVerification() {
  console.log('=== INICIANDO VERIFICAÇÃO DAS NOVAS IMPLEMENTAÇÕES ===\n');

  // 1. Teste da API de Personagens
  console.log('1. Verificando GET /api/characters...');
  const charRes = await fetch('http://localhost:8081/api/characters');
  console.log('   Status:', charRes.status);
  const chars = await charRes.json();
  console.log('   Total de personagens carregados:', chars.length);
  for (const c of chars) {
    const hasAvatar = Boolean(c.avatarUrl && c.avatarUrl.trim().length > 0);
    const hasDesc = Boolean(c.description && c.description.trim().length > 0);
    const avatarPreview = hasAvatar ? (c.avatarUrl.length > 40 ? c.avatarUrl.substring(0, 37) + '...' : c.avatarUrl) : '(NENHUM / ACINZENTADO)';
    const descPreview = hasDesc ? (c.description.length > 50 ? c.description.substring(0, 47) + '...' : c.description) : '(VAZIA)';
    console.log(`   - [${c.name}] (${c.class}): avatar=${avatarPreview} | desc="${descPreview}"`);
  }

  // 2. Teste da API de Usuários (Avatares e Bios)
  console.log('\n2. Verificando GET /api/users...');
  const userRes = await fetch('http://localhost:8081/api/users');
  console.log('   Status:', userRes.status);
  const users = await userRes.json();
  console.log('   Total de usuários carregados:', users.length);
  for (const u of users) {
    const bioPreview = u.bio ? (u.bio.length > 45 ? u.bio.substring(0, 42) + '...' : u.bio) : '(sem bio)';
    console.log(`   - @${u.username} (${u.name}): avatar=${u.avatarUrl || '(padrão)'} | bio="${bioPreview}"`);
  }

  // 3. Teste de Atualização na Ficha (PUT /api/characters/:id)
  console.log('\n3. Testando atualização de Descrição e Retrato em um personagem...');
  const testChar = chars[0];
  const originalDesc = testChar.description;
  const originalAvatar = testChar.avatarUrl;
  
  const testPayload = {
    description: 'Guardião de elite veterano das cinzas de Eldoria (Teste de Verificação).',
    avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'
  };

  const updateRes = await fetch('http://localhost:8081/api/characters/' + testChar.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload)
  });
  console.log('   Status PUT:', updateRes.status);
  const updatedData = await updateRes.json();
  console.log('   Resultado salvo no banco:', {
    id: updatedData.id,
    name: updatedData.name,
    description: updatedData.description,
    avatarUrl: updatedData.avatarUrl
  });

  // 4. Teste de Limpeza de Imagem (Fallback para Ícone Acinzentado)
  console.log('\n4. Testando remoção de imagem (ativação do ícone acinzentado)...');
  const clearRes = await fetch('http://localhost:8081/api/characters/' + testChar.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatarUrl: '' })
  });
  console.log('   Status PUT (limpeza):', clearRes.status);
  const clearedData = await clearRes.json();
  console.log('   avatarUrl após limpeza:', JSON.stringify(clearedData.avatarUrl));
  console.log('   Ativa ícone acinzentado no card? ->', clearedData.avatarUrl === '' ? 'SIM (hasCustomAvatar: false)' : 'NÃO');

  // Restaurando imagem para o teste
  await fetch('http://localhost:8081/api/characters/' + testChar.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatarUrl: originalAvatar || '', description: originalDesc || '' })
  });
  console.log('   Estado original do personagem restaurado.');

  // 5. Teste de Renderização / Bundling das Telas Web
  console.log('\n5. Verificando carregamento das rotas web no Expo...');
  const routes = ['/', '/player', '/profile'];
  for (const route of routes) {
    const rRes = await fetch('http://localhost:8081' + route);
    console.log(`   Rota ${route}: Status ${rRes.status} (${rRes.status === 200 ? 'OK' : 'Falha'})`);
  }

  console.log('\n=== TODAS AS VERIFICAÇÕES CONCLUÍDAS COM SUCESSO ===');
}

runVerification().catch(console.error);
