# 🚀 OfferForge Setup Guide

Esta é uma guia completa para configurar o OfferForge localmente após baixar do GitHub.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://python.org/))
- **MongoDB** ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/))

## 🔧 Configuração Inicial

### 1. Clone o Repositório
```bash
git clone https://github.com/yourusername/OfferForge.git
cd OfferForge
```

### 2. Configurar Backend (Python/FastAPI)

```bash
# Navegar para pasta backend
cd backend

# Instalar dependências Python
pip install -r requirements.txt

# Copiar arquivo de configuração
cp .env.example .env
```

### 3. Configurar Frontend (React Native/Expo)

```bash
# Navegar para pasta frontend
cd frontend

# Instalar dependências
npm install
# ou se preferir yarn:
yarn install
```

## 🔑 Configuração de API Keys

### OpenAI (Obrigatório para IA)

1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Crie uma conta ou faça login  
3. Vá em **API Keys** e crie uma nova chave
4. Copie a chave (formato: `sk-proj-...`)
5. Cole no arquivo `backend/.env`:
```bash
OPENAI_API_KEY="sk-proj-sua_chave_aqui"
```

### Stripe (Opcional para preços)

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/)
2. Crie uma conta ou faça login
3. Em **Developers > API Keys**, copie:
   - **Secret Key** (sk_live_... ou sk_test_...)
   - **Publishable Key** (pk_live_... ou pk_test_...)
4. Cole no arquivo `backend/.env`:
```bash
STRIPE_SECRET_KEY="sk_live_sua_chave_secreta"
STRIPE_PUBLISHABLE_KEY="pk_live_sua_chave_publica"
```

## 📁 Estrutura dos Arquivos .env

### Backend (.env)
```bash
# Database
MONGO_URL="mongodb://localhost:27017"
DB_NAME="offerforge_db"

# OpenAI (Obrigatório)
OPENAI_API_KEY="sk-proj-sua_chave_openai"

# Stripe (Opcional)  
STRIPE_SECRET_KEY="sk_live_sua_chave_stripe"
STRIPE_PUBLISHABLE_KEY="pk_live_sua_chave_publica_stripe"
STRIPE_WEBHOOK_SECRET="whsec_sua_chave_webhook"
```

### Frontend (.env)
```bash
EXPO_PUBLIC_BACKEND_URL="http://localhost:8001"
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_sua_chave_publica_stripe"
```

## 🚀 Executar o Sistema

### 1. Iniciar MongoDB
```bash
# No Windows
mongod

# No macOS (com brew)
brew services start mongodb/brew/mongodb-community

# No Linux  
sudo systemctl start mongod
```

### 2. Iniciar Backend
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Iniciar Frontend
```bash
cd frontend
expo start
```

## 📱 Acessar o App

Após iniciar ambos os serviços:

1. **Web**: Abra `http://localhost:3000` no navegador
2. **Mobile**: Use o app Expo Go para escanear o QR code
3. **API Docs**: Acesse `http://localhost:8001/docs`

## ✅ Verificar Funcionamento

### 1. Teste da API
```bash
curl http://localhost:8001/api/health
```

Deve retornar:
```json
{
  "status": "healthy",
  "services": {
    "mongodb": "connected",
    "openai": "configured",
    "stripe": "configured"
  }
}
```

### 2. Teste do Frontend
- Abra o app no navegador ou mobile
- Deve mostrar "Sistema Online" com status dos serviços
- Teste criando um novo projeto

## 🐛 Resolução de Problemas

### Erro: MongoDB não conecta
```bash
# Verificar se MongoDB está rodando
ps aux | grep mongod

# Iniciar manualmente se necessário
mongod --dbpath /path/to/data/db
```

### Erro: OpenAI não configurado
- Verifique se a chave OpenAI está correta no `.env`
- Teste a chave diretamente na API da OpenAI

### Erro: Expo não inicia
```bash
# Limpar cache
expo start --clear

# Reinstalar dependências
rm -rf node_modules
npm install
```

### Erro: "EADDRINUSE" porta em uso
```bash
# Matar processo na porta 8001
kill -9 $(lsof -ti:8001)

# Ou usar porta diferente
uvicorn server:app --host 0.0.0.0 --port 8002 --reload
```

## 🔧 Configurações Avançadas

### Banco de Dados Remoto
Para usar MongoDB remoto (Atlas, etc.):
```bash
MONGO_URL="mongodb+srv://user:pass@cluster.mongodb.net/offerforge?retryWrites=true"
```

### Domínio Personalizado
Para produção, altere as URLs nos arquivos `.env`:
```bash
# Backend
FRONTEND_URL="https://seudominio.com"

# Frontend
EXPO_PUBLIC_BACKEND_URL="https://api.seudominio.com"
```

## 📊 Monitoramento

### Logs do Sistema
```bash
# Backend logs
tail -f backend.log

# Frontend logs  
expo logs
```

### Health Check
Monitore a saúde do sistema em:
- **API**: `http://localhost:8001/api/health`
- **Frontend**: Indicadores na tela principal

## 🚀 Deploy em Produção

### Backend (Recomendado: Railway, Render, DigitalOcean)
1. Configure variáveis de ambiente
2. Use banco MongoDB remoto
3. Configure domínio personalizado

### Frontend (Recomendado: Vercel, Netlify)
```bash
# Build para web
expo export:web

# Deploy para Vercel
vercel deploy
```

## 📞 Suporte

Se encontrar problemas:

1. **Verifique logs**: Console do navegador e terminal
2. **Teste APIs**: Use `http://localhost:8001/docs`
3. **Reinicie serviços**: Pare e inicie novamente
4. **Limpe cache**: `expo start --clear`

## ✨ Próximos Passos

Após configurar com sucesso:

1. **Teste o Demo**: Use o botão "Demo" no app
2. **Crie um Projeto**: Siga o wizard de 5 etapas  
3. **Gere Conteúdo**: Teste a geração de ofertas com IA
4. **Explore Exports**: Teste os exports ZIP, PDF, HTML

---

**🎉 Parabéns!** Seu OfferForge está pronto para usar!