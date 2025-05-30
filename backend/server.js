require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Configurações do servidor
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://frontend:3000']
}));
app.use(express.json());

// Configuração do Ollama
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://ollama:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

const ollamaApi = axios.create({
  baseURL: OLLAMA_HOST,
  timeout: 300000, // 5 minutos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Middleware de log aprimorado
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

async function checkOllamaConnection() {
  try {
    console.log(`Verificando conexão com Ollama em ${OLLAMA_HOST}...`);
    const response = await ollamaApi.get('/api/tags');
    console.log('✅ Conectado ao Ollama com sucesso');
    console.log('Modelos disponíveis:', response.data.models?.map(m => m.name) || []);
    
    // Verifica se o modelo está disponível
    try {
      await ollamaApi.post('/api/show', { name: OLLAMA_MODEL });
      console.log(`✅ Modelo ${OLLAMA_MODEL} disponível`);
      return true;
    } catch (modelError) {
      console.error(`❌ Modelo ${OLLAMA_MODEL} não encontrado`);
      return false;
    }
  } catch (error) {
    console.error('❌ Falha ao conectar ao Ollama:', error.message);
    return false;
  }
}

// Middleware de verificação de saúde do Ollama
async function ollamaHealthCheck(req, res, next) {
  if (req.path === '/api/health') return next();
  
  try {
    await ollamaApi.get('/api/tags');
    next();
  } catch (error) {
    res.status(503).json({
      status: 'service_unavailable',
      error: 'Ollama service is not available',
      details: error.message
    });
  }
}

app.use(ollamaHealthCheck);

// Rota de saúde aprimorada
app.get('/api/health', async (req, res) => {
  try {
    // Verifica conexão com Ollama
    const ollamaResponse = await ollamaApi.get('/api/tags').catch(() => null);
    const ollamaStatus = ollamaResponse ? 'connected' : 'disconnected';

    // Verifica modelo específico
    let modelStatus = 'unavailable';
    try {
      await ollamaApi.post('/api/show', { name: OLLAMA_MODEL });
      modelStatus = 'available';
    } catch (e) {
      console.error(`Model check failed: ${e.message}`);
    }

    res.json({ 
      status: 'healthy',
      services: {
        ollama: ollamaStatus,
        model: {
          name: OLLAMA_MODEL,
          status: modelStatus
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Failed to check service status',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota principal de geração com tratamento de erros aprimorado
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt?.trim()) {
      return res.status(400).json({ 
        error: 'Prompt is required',
        details: 'The prompt parameter must be a non-empty string'
      });
    }

    console.log(`Processando prompt (${OLLAMA_MODEL}): ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`);
    
    const requestData = {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        repeat_penalty: 1.1,
        ...options
      }
    };

    console.log('Enviando requisição para Ollama:', JSON.stringify(requestData, null, 2));
    
    const response = await ollamaApi.post('/api/generate', requestData, {
      timeout: 120000 // 2 minutos para resposta
    });

    const result = {
      response: response.data.response,
      model: OLLAMA_MODEL,
      createdAt: new Date().toISOString(),
      metrics: {
        eval_count: response.data.eval_count,
        eval_duration: response.data.eval_duration,
        total_duration: response.data.total_duration
      },
      request: {
        prompt_length: prompt.length,
        options_used: requestData.options
      }
    };

    console.log(`Resposta recebida em ${response.data.total_duration/1e9}s`);
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar requisição:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      config: error.config,
      response: error.response?.data
    });
    
    let statusCode = 500;
    let errorMessage = 'Error processing your request';
    let errorDetails = null;
    
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.error || errorMessage;
      errorDetails = error.response.data;
    } else if (error.code === 'ECONNABORTED') {
      statusCode = 504;
      errorMessage = 'Request timeout - Ollama is taking too long to respond';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      statusCode = 503;
      errorMessage = 'Ollama service is unavailable';
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV !== 'production' ? {
        message: error.message,
        code: error.code,
        ...errorDetails
      } : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Servir frontend em produção
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/build');
  
  // Verifica se o diretório do frontend existe
  try {
    require('fs').accessSync(frontendPath);
    app.use(express.static(frontendPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
    
    console.log('Frontend production files servidos de:', frontendPath);
  } catch (err) {
    console.warn('Diretório do frontend não encontrado:', frontendPath);
    console.warn('O servidor não irá servir arquivos estáticos do frontend');
  }
}

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// Inicia o servidor com verificação de conexão
async function startServer() {
  try {
    const isOllamaConnected = await checkOllamaConnection();
    
    if (!isOllamaConnected && process.env.NODE_ENV === 'production') {
      console.warn('Aviso: Ollama não está conectado, mas o servidor continuará iniciando');
    }

    app.listen(PORT, () => {
      console.log(`\n=== Servidor rodando na porta ${PORT} ===`);
      console.log(`Ollama Host: ${OLLAMA_HOST}`);
      console.log(`Modelo: ${OLLAMA_MODEL}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Modo: ${isOllamaConnected ? 'Conectado ao Ollama' : 'Sem conexão com Ollama'}\n`);
    });
  } catch (error) {
    console.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
}

startServer();