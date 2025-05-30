/**
 * Serviço para comunicação com a API do Ollama via backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Configurações padrão do modelo
const DEFAULT_OPTIONS = {
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 2048
};

/**
 * Envia mensagem para o Ollama via backend
 * @param {string} prompt - Texto de entrada do usuário
 * @param {object} options - Parâmetros do modelo (opcional)
 * @returns {Promise<string>} Resposta do modelo
 */
export const sendMessageToOllama = async (prompt, options = {}) => {
  try {
    const startTime = performance.now();
    
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        options: { ...DEFAULT_OPTIONS, ...options }
      }),
    });

    const data = await response.json();
    const endTime = performance.now();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    console.log(`Response received in ${((endTime - startTime)/1000).toFixed(2)}s`);
    return {
      text: data.response,
      metadata: {
        model: data.model,
        createdAt: data.createdAt,
        metrics: data.metrics
      }
    };
  } catch (error) {
    console.error('Error in sendMessageToOllama:', error);

    // Tratamento de erros amigável
    let userMessage = 'Ocorreu um erro ao processar sua mensagem.';
    
    if (error.message.includes('Failed to fetch')) {
      userMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    } else if (error.message.includes('Ollama not responding')) {
      userMessage = 'O servidor de IA não está respondendo. Tente novamente mais tarde.';
    }

    return {
      text: userMessage,
      error: true,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Verifica o status do servidor Ollama
 * @returns {Promise<object>} Status do servidor
 */
export const checkServerStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Verificação mais robusta do status
    return {
      status: data.status,
      ollamaStatus: data.services?.ollama === 'connected' ? 'connected' : 'disconnected',
      modelStatus: data.services?.model?.status || 'unavailable',
      error: null
    };
  } catch (error) {
    console.error('Error checking server status:', error);
    return {
      status: 'unhealthy',
      ollamaStatus: 'disconnected',
      modelStatus: 'unavailable',
      error: error.message
    };
  }
};

/**
 * Cancela uma requisição em andamento
 * (Implementação básica - pode ser expandida)
 */
export const cancelRequest = () => {
  // Implementação real precisaria de um AbortController
  console.warn('Cancel request feature not fully implemented');
};