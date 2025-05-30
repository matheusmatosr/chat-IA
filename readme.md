## 🤖 Chat IA: Interface de conversação com modelo Qwen2

Chat interativo com inteligência artificial capaz de:

- Conversação em tempo real com modelo LLM
- Histórico de conversas persistente
- Copiar respostas da IA
- Visualização do status de conexão
- Configuração de parâmetros do modelo

🚀 Tecnologias Utilizadas

- Frontend: React + Material-UI
- Backend: Node.js + Express
- IA: Ollama com modelo Qwen2:7b
- Containerização: Docker

🖥️ Pré-requisitos

- Docker instalado
- Node.js (v18+)
- NPM

### ⚙️ Configuração do Ambiente

Configuração das variáveis de ambiente

- Backend (backend/.env):

```bash
PORT=5000
OLLAMA_MODEL=qwen2:7b
OLLAMA_HOST=http://localhost:11434
```

- Frontend (frontend/.env):

```bash
REACT_APP_API_URL=http://localhost:5000
```

### 🖥️ Instalação

1. Clone este repositório

```bash
git clone https://github.com/matheusmatosr/chat-ia.git
```

### ⚙️ Configuração do Ambiente

1. Iniciar o Ollama (Docker)

```bash
docker-compose up ollama
```

2. Baixar o modelo de IA

```bash
docker exec -it ollama ollama pull qwen2:7b
```

3. Verifique se o modelo foi baixado

```bash
docker exec -it ollama ollama list
```

### Rodar projeto:

#### Backend

Abra o terminal e faça os seguintes comandos:

1. Para acessar a pasta

```bash
cd backend
```

2. Para instalar as dependências

```bash
npm install
```

3. Para rodar o backend:

```bash
npm run dev
```

#### Frontend

Abra um novo terminal e faça os seguintes comandos:

1. Para acessar a pasta

```bash
cd frontend
```

2. Para instalar as dependências

```bash
npm install
```

3. Para rodar o projeto:

```bash
npm start
```

### 🌐 Acesso
O sistema estará disponível em:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Ollama: http://localhost:11434
