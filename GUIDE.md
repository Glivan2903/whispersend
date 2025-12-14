# Guia de Instalação e Execução - WhisperSend

## 1. Pré-requisitos

*   **Node.js**: Versão 18 ou superior.
*   **NPM**: Gerenciador de pacotes do Node.
*   **Conta Supabase**: Para o banco de dados e autenticação.

## 2. Configuração do Banco de Dados (Supabase)

1.  Crie um novo projeto no [Supabase](https://supabase.com/).
2.  Acesse o **SQL Editor** no painel do Supabase.
3.  Copie o conteúdo do arquivo `database_full_setup.sql` (localizado na raiz deste projeto).
4.  Cole no SQL Editor e execute (Run).
    *   Isso criará todas as tabelas, funções (RPCs) e políticas de segurança (RLS) necessárias.

## 3. Configuração do Projeto

1.  Clone este repositório ou baixe os arquivos.
2.  No diretório raiz do projeto, crie um arquivo chamado `.env`.
3.  Adicione as seguintes variáveis de ambiente, substituindo pelos seus dados do Supabase:

```env
VITE_SUPABASE_URL=Sua_URL_do_Supabase
VITE_SUPABASE_ANON_KEY=Sua_Anon_Key_do_Supabase
```

> Você encontra essas chaves em **Project Settings > API** no painel do Supabase.

## 4. Instalação e Execução

Abra o terminal na pasta do projeto e execute os comandos:

```bash
# 1. Instalar dependências
npm install

# 2. Rodar o servidor de desenvolvimento
npm run dev
```

O projeto estará rodando em `http://localhost:5173` (ou outra porta indicada no terminal).

## 5. Script de Deploy (Opcional - Vercel)

Para fazer deploy na Vercel:

1.  Instale a Vercel CLI: `npm i -g vercel`
2.  Rode o comando: `vercel`
3.  Siga as instruções para vincular o projeto.
4.  Configure as variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) no painel da Vercel em **Settings > Environment Variables**.
