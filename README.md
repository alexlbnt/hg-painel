# Sistema **Honra e Egoísmo** 
(D&D 5e, Dark Fantasy, Neon + Prisma, Vercel) 

---

#### 1. 🏰 Módulo Grimório do Jogador (`/player`)
* **CRUD Completo de Grimórios:** Criar novos personagens com atributos personalizados, visualizar fichas interativas, editar dados ("Reescrever Grimório") e excluir personagens com confirmação.
* **Automação D&D 5e:** Cálculo automático em tempo real de modificadores de atributos, Bônus de Proficiência (escalável por nível), Classe de Armadura (CA), Iniciativa, Percepção Passiva e tabela com as **18 Perícias Medievais** com soma de proficiências.
* **Gestão de Combate & Sinais Vitais:** Barra de vida dinâmica com cores imersivas (Verde floresta, Ouro envelhecido e Vermelho sangue), HP Atual, Máximo e Temporário, botões de dano/cura rápidos (`-10`, `-5`, `-1`, `+1`, `+5`, `+10`), além de campo manual de dano/cura.
* **Resistência contra a Morte:** Contadores interativos de 0 a 3 sucessos e falhas.
* **Rituais de Descanso:** Botões de **Descanso Curto** (gasta dado de vida para curar e restaura dons marciais) e **Descanso Longo** (recupera 100% da vida e todos os feitiços).
* **Pergaminhos Arcanos & Dons:** Abas interativas para gerenciar spell slots de 1º a 9º nível com tokens clicáveis e contadores de habilidades de classe.

#### 2. 👁️ Módulo Escudo do Mestre (`/dm`)
* **Visão Panorâmica em Tempo Real:** Polling automático de 2 em 2 segundos que mantém a tela do Mestre sincronizada com a vida, CA, magias e condições de todos os jogadores da mesa.
* **Intervenção Remota Divina:** Modal de intervenção onde o Mestre altera a vida de um jogador à distância ou aplica maldições e bênções (condições sombrias) que aparecem de imediato na ficha do jogador.
* **Controles em Lote (Rituais em Massa):** Botões para "Descanso Curto em Massa", "Descanso Longo em Massa" e o temido "Praga de Sangue (-10 HP em todos)".

#### 3. ⚙️ Infraestrutura & Design Dark Fantasy
* **Estética Premium Medieval:** Substituição total de neons futuristas pela paleta autêntica de *Dark Fantasy* (Obsidiana `#110F0D`, Madeira Escura `#1A1714`, Ouro Antigo `#C5A059`, Bronze `#80776C` e Sangue `#B82828`) e tipografia serifada clássica.
* **Banco de Dados Real no Neon (PostgreSQL):** ORM Prisma gerando schemas e tabelas reais conectadas à nuvem (`hg-painel`).
* **Deploy Universal para Vercel:** Build universal que exporta o HTML estático na raiz de `dist/` e APIs Serverless na pasta raiz `/api`, garantindo compatibilidade total com o preset "Other" ou qualquer outro no Vercel.