require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('=== NORMALIZAÇÃO DE CLASSES E ARQUÉTIPOS NO BANCO ===\n');

  const characters = await prisma.character.findMany();
  let updatedCount = 0;

  for (const char of characters) {
    let cleanClass = char.class.trim();
    let cleanArchetype = (char.archetype || '').trim();

    // Caso Ayla: "paladino  juramento da devoção"
    if (cleanClass.toLowerCase().includes('juramento da devoção') || cleanClass.toLowerCase().includes('juramento da devocao')) {
      cleanClass = 'Paladino';
      cleanArchetype = 'Juramento da Devoção';
    } 
    // Caso Tarraco Zuma: "Monge ( Misericórdia )"
    else if (cleanClass.toLowerCase().includes('misericórdia') || cleanClass.toLowerCase().includes('misericordia')) {
      cleanClass = 'Monge';
      cleanArchetype = 'Caminho da Misericórdia';
    } 
    // Caso genérico com parênteses: "Classe (Arquétipo)"
    else if (cleanClass.includes('(') && cleanClass.includes(')')) {
      const match = cleanClass.match(/^([^(]+)\(([^)]+)\)$/);
      if (match) {
        cleanClass = match[1].trim();
        cleanArchetype = match[2].trim();
      }
    } 
    // Limpeza de capitalização comum
    else if (cleanClass.toLowerCase() === 'mago') {
      cleanClass = 'Mago';
    } else if (cleanClass.toLowerCase() === 'barbaro' || cleanClass.toLowerCase() === 'bárbaro') {
      cleanClass = 'Bárbaro';
    } else if (cleanClass.toLowerCase() === 'bardo') {
      cleanClass = 'Bardo';
    } else if (cleanClass.toLowerCase() === 'druida') {
      cleanClass = 'Druida';
    } else if (cleanClass.toLowerCase() === 'paladino') {
      cleanClass = 'Paladino';
    }

    if (cleanClass !== char.class || cleanArchetype !== (char.archetype || '')) {
      await prisma.character.update({
        where: { id: char.id },
        data: {
          class: cleanClass,
          archetype: cleanArchetype,
        },
      });
      console.log(`✅ Atualizado: ${char.name} -> Classe: "${cleanClass}" | Arquétipo: "${cleanArchetype}" (Antes: "${char.class}")`);
      updatedCount++;
    } else {
      console.log(`- ${char.name} já consistente: Classe: "${cleanClass}" | Arquétipo: "${cleanArchetype || '(nenhum)'}"`);
    }
  }

  console.log(`\nFinalizado: ${updatedCount} fichas atualizadas.`);
}

migrate()
  .catch(e => {
    console.error('Erro na migração:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
