# EquilibraFC ⚽

Plataforma web para gerenciamento de jogos de futebol (Fut7 / Futsal), com foco em organização de partidas, divisão de times, histórico e estatísticas.

Projeto desenvolvido com foco em **prática de desenvolvimento full stack**, arquitetura de aplicações web e integração entre frontend e backend.

---

## Tecnologias

### Frontend
- Next.js (App Router)
- React
- JavaScript
- CSS Modules

### Backend
- Node.js
- Express
- MongoDB
- JWT (autenticação)

---

## Deploy

- Frontend: Vercel  
- Backend: Render  

---

## Demonstração

A aplicação está disponível em:

https://equilibra-fc.vercel.app

> Observação:
- Projeto utilizado para fins de estudo e prática.
- Existe uma conta de demonstração para testes.
- Contas de demonstração possuem algumas limitações.
- Funcionalidades sensíveis (como backup em nuvem e finalização de jogos) podem estar restritas.
- Dados podem ser resetados periodicamente.
- **A aplicação não está totalmente adaptada para dispositivos mobile.**

---

## Funcionalidades

- Login e autenticação de usuários
- Criação e gerenciamento de listas de jogadores
- Criação e finalização de partidas
- Divisão automática de times
- Histórico de jogos
- MVP e estatísticas
- Backup de listas na nuvem
- Interface web focada em desktop

---

## Como rodar o projeto localmente

### Backend

    cd api  
    npm install  
    npm start  

Crie um arquivo `.env` na pasta `api` com as seguintes variáveis:

- MONGO_URI=...
- JWT_SECRET=...

---

### Frontend

    cd app  
    npm install  
    npm run dev  

Crie um arquivo `.env.local` na pasta `app` com as seguintes variáveis:

- NEXT_PUBLIC_API_URL=http://localhost:5000

## Autor

Projeto desenvolvido por **Rafael R. Oliveira**  
GitHub: https://github.com/RafaelROliveira
