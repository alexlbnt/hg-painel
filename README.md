# HG Painel

Um painel completo, híbrido e moderno para gerenciamento de campanhas de RPG de Mesa (D&D 5e) e Quadro de Tarefas / Missões de desenvolvimento e comunidade. 

Construído com as melhores práticas de desenvolvimento web/mobile usando o ecossistema Expo e banco de dados relacional via Prisma.

## 🚀 Funcionalidades Principais

### 🧙‍♂️ Fichas de Personagem (D&D 5e)
- **Atributos e Proficiências:** Controle automático de modificadores, testes de resistência (Saving Throws) e perícias.
- **Magias e Recursos:** Gerenciamento dinâmico de Espaços de Magia (Spell Slots), Lista de Magias e Pontos de Feitiçaria (Sorcery Points).
- **Equipamentos e Inventário:** Rastreamento de peso, armas e armaduras, além de bônus na Classe de Armadura.
- **Condições e Habilidades:** Rastreamento completo das condições do personagem e gerenciamento de habilidades por descanso curto/longo.

### 🗺️ Mesa e Diário de Campanha
- **Sistema de Sessões:** Criação de anotações (Journal Notes) segmentadas por sessão e por autor.
- **Multi-usuários (DM vs Player):** Permissões distintas para jogadores e para o Mestre da Campanha.

### 📋 Quadro de Tarefas (Kanban)
- **Sistema Integrado de Missões/Tarefas:** Ideal para organizar tarefas de desenvolvimento da campanha (Arte, Lore, Mecânica, Dev).
- **Sugestões:** Jogadores podem enviar tarefas para aprovação do Mestre.
- **Transições de Status:** Fluxo de *Sugerido* -> *Parado* -> *Em Andamento* -> *Finalizado* -> *Aprovado/Arquivado*.

## 🛠️ Tecnologias Utilizadas

- **[Expo](https://expo.dev/) & [React Native](https://reactnative.dev/):** Framework principal permitindo compilação nativa para Web, iOS e Android através do mesmo código.
- **[Expo Router](https://docs.expo.dev/router/introduction/):** Navegação baseada em rotas de arquivos (File-based routing) e API Routes nativas (Fullstack).
- **[Prisma ORM](https://www.prisma.io/):** Modelagem de banco de dados e migrações tipadas e consistentes (PostgreSQL).
- **[TypeScript](https://www.typescriptlang.org/):** Base de código inteiramente tipada, prevenindo dezenas de bugs antes de rodar a aplicação.
- **[Lucide Icons](https://lucide.dev/):** Biblioteca de ícones moderna.

## ⚙️ Pré-requisitos

- [Node.js](https://nodejs.org/en/) (Versão recomendada: >= 20.19.4)
- Banco de Dados PostgreSQL configurado localmente ou em nuvem (ex: Neon, Supabase).

## 🏃 Como Rodar o Projeto

**1. Instale as dependências:**
```bash
npm install
```

**2. Configure as Variáveis de Ambiente:**
Crie um arquivo `.env` na raiz do projeto contendo a sua URI de banco de dados PostgreSQL.
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/hgpainel?schema=public"
```

**3. Prepare o Banco de Dados:**
Rode os comandos do Prisma para inicializar e sincronizar seu esquema do banco de dados e gerar a tipagem.
```bash
npx prisma generate
npx prisma db push
```

**4. Inicie o Servidor:**
Para rodar diretamente na versão Web (recomendado):
```bash
npm run web
```
*(Você também pode usar `npm start` para abrir o menu do Expo e escolher outras plataformas).*

## 📖 Estrutura do Banco de Dados
Abaixo estão os principais models encontrados no banco (Veja `prisma/schema.prisma` para detalhes):
- `User` - Usuários, Autenticação e Perfis.
- `Character` - Ficha complexa de Personagens incluindo relação com magias, slots, itens e condições.
- `Task` - Gerenciamento Kanban de construção do cenário.
- `Room` / `CampaignSession` / `JournalNote` - Organização da campanha e registros de aventura.

## 🤝 Contribuição
Para contribuir com novos sistemas no código:
- Utilize a página correspondente no diretório `src/app`.
- Componentes isolados e reutilizáveis devem ficar na pasta `src/components`.
- Lógica de interação com a base de dados ocorre nas Expo API Routes (`src/app/api`). Certifique-se de testar as mudanças do ORM gerando o Prisma novamente.
