require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HERO_DATA = {
  thorgnar: {
    avatarUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=900&q=85',
    lore: 'Cicatrizes de guerra forjadas no gelo do norte. Onde a fúria começa, a dúvida dos deuses termina.',
    playerBio: 'A vanguarda e a força inabalável da Mesa Lobo.',
  },
  ayla: {
    avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=85',
    lore: 'Consagrada pelo juramento da devoção, sua espada corta as trevas e sua fé restaura a esperança dos aflitos.',
    playerBio: 'Portadora da justiça radiante e defensora dos inocentes.',
  },
  tarraco: {
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=85',
    lore: 'O equilíbrio entre a vida e a morte reside na ponta dos dedos. Um sopro de misericórdia precede o golpe fatal.',
    playerBio: 'Mestre das artes marciais ancestrais e toque restaurador.',
  },
  bartolomeu: {
    avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=85',
    lore: 'Lendas não sobrevivem por acaso; são tecidas com acordes precisos e palavras capazes de dobrar até governantes.',
    playerBio: 'Historiador sagaz, melodista e negociador da comitiva.',
  },
  sedmoy: {
    avatarUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=900&q=85',
    lore: 'Sob a vigília dos deuses, seu escudo resiste ao peso da tempestade para que seus irmãos continuem de pé.',
    playerBio: 'Guardião resoluto e braço sagrado da comitiva.',
  },
  hebert: {
    avatarUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=85',
    lore: 'As raízes da floresta ancestral escutam cada passo. Quando a terra desperta, o aço dos homens é vão.',
    playerBio: 'Voz dos ermos antigos e condutor das forças elementais.',
  },
  claive: {
    avatarUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=900&q=85',
    lore: 'Feitiços não são meras palavras, mas a reescrita deliberada do cosmos segundo a vontade de quem os conjura.',
    playerBio: 'Erudito dos mistérios arcanos e manipulador do véu da magia.',
  },
};

const USER_DATA = {
  'allan.m': {
    bio: 'Combatente visceral e estrategista de linha de frente da Mesa Lobo.',
    avatarUrl: 'icon:axe',
  },
  'gabi.f': {
    bio: 'Defensora incansável e coração moral da Mesa João.',
    avatarUrl: 'icon:sun',
  },
  'leo.a': {
    bio: 'Disciplinado e cirúrgico nos confrontos decisivos da comitiva.',
    avatarUrl: 'icon:sword',
  },
  'dantas.p': {
    bio: 'Diplomata astuto e guardião dos grandes segredos da campanha.',
    avatarUrl: 'icon:book',
  },
  'joao.c': {
    bio: 'Mestre da Mesa João e combatente destemido quando veste a armadura.',
    avatarUrl: 'icon:shield',
  },
  'luis.k': {
    bio: 'Sentinela da natureza e conhecedor dos segredos ocultos da Mesa Alex.',
    avatarUrl: 'icon:compass',
  },
  'lobo.l': {
    bio: 'Mestre da Mesa Lobo e conjurador arcano de segredos ancestrais.',
    avatarUrl: 'icon:skull',
  },
  'alex.g': {
    bio: 'Mestre Geral e Arquiteto do Mundo de Honra & Egoísmo.',
    avatarUrl: 'icon:crown',
  },
  'pastor.j': {
    bio: 'Aventureiro fiel e pilar de suporte nas noites de campanha.',
    avatarUrl: 'icon:flame',
  },
};

async function seed() {
  console.log('=== POVOANDO ARTES CONCEITUAIS E BIOS DE DARK FANTASY ===\n');

  // 1. Atualizar Personagens
  const characters = await prisma.character.findMany();
  for (const c of characters) {
    const key = Object.keys(HERO_DATA).find(k => c.name.toLowerCase().includes(k));
    if (key) {
      const data = HERO_DATA[key];
      await prisma.character.update({
        where: { id: c.id },
        data: {
          avatarUrl: data.avatarUrl,
          description: c.description ? c.description : data.lore,
          lore: c.lore ? c.lore : data.lore,
        },
      });
      console.log(`✅ Arte, Lore e Descrição vinculadas a: ${c.name} (${c.class})`);
    }
  }

  // 2. Atualizar Usuários (Bios e Avatares)
  for (const [username, uData] of Object.entries(USER_DATA)) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          bio: uData.bio,
          avatarUrl: uData.avatarUrl,
        },
      });
      console.log(`✅ Bio e Avatar vinculados a: @${username} (${user.name})`);
    }
  }

  console.log('\n✨ Concluído com sucesso!');
}

seed()
  .catch(e => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
