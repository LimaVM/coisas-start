# Start Orçamentos - PWA

Um aplicativo web progressivo (PWA) moderno para criação e gerenciamento de orçamentos, desenvolvido para a Start do Brasil.

## Características

- Design moderno e responsivo para qualquer dispositivo
- Cadastro de produtos com imagens
- Criação de orçamentos personalizados
- Modelo de orçamento personalizável
- Geração de PDF para download e compartilhamento
- Funcionamento offline (consulta a produtos e templates mesmo sem conexão, sem cadastro de novos dados)
- Interface intuitiva e amigável
- Sistema de login com usuários e permissões (admin pode gerenciar dados)
- Preenchimento automático de dados de empresas via BrasilAPI ao informar o CNPJ
- Atualização quase em tempo real entre os usuários por meio de Server-Sent Events (SSE)

## Tecnologias Utilizadas

- HTML5, CSS3 e JavaScript moderno
- Express.js para o backend
- Helmet para reforçar a segurança HTTP
- xss-clean e sanitize-html para prevenir injeção XSS
- express-rate-limit para limitar tentativas e ataques de força bruta
- hpp para evitar poluição de parâmetros
- ua-parser-js para registrar navegador e dispositivo nos logs de login
- Armazenamento de dados em JSON
- Geração de PDF com Puppeteer
- Service Worker para funcionalidades offline
- Biblioteca de ícones Material Icons embutida em base64 para funcionar offline sem arquivos binários (CSP permite `data:` para fontes)
- Design responsivo com Flexbox e CSS Grid
- Server-Sent Events (SSE) para notificar atualizações em tempo real

## Estrutura do Projeto

```
orcamento-pwa/
├── data/                  # Armazenamento de dados JSON
│   ├── orcamentos.json    # Dados dos orçamentos
│   └── produtos.json      # Dados dos produtos
├── public/                # Arquivos estáticos
│   ├── css/               # Estilos CSS
│   ├── images/            # Imagens e ícones
│   ├── js/                # Scripts JavaScript
│   ├── pdfs/              # PDFs gerados
│   ├── index.html         # Página principal
│   ├── manifest.json      # Manifest para PWA
│   └── service-worker.js  # Service Worker para PWA
├── templates/             # Templates HTML para orçamentos
├── server.js              # Servidor Express
└── package.json           # Dependências do projeto
```

## Variáveis de Template

O arquivo `variaveis_template.txt` contém todas as variáveis disponíveis para uso nos templates de orçamento:

- `$id` - Identificador único do orçamento (código alfanumérico de 4 caracteres)
- `$nomedocliente` - Nome do cliente
- `$enderecocliente` - Endereço do cliente
- `$telefonecliente` - Telefone do cliente
- `$emailcliente` - Email do cliente
- `$cpf` - CPF ou CNPJ do cliente
- `$dataorcamento` - Data de criação do orçamento
- `$vendedor` - Nome do usuário que gerou o orçamento
- `$observacoes` - Observações adicionais
- `$referencia` - Mesmo valor de `$id`, útil para exibir como referência no documento
- `$valortotal` - Valor total do orçamento
- `$tabelaprodutos` - Tabela HTML com os produtos do orçamento

## Instalação e Execução

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Opcionalmente defina as variáveis de ambiente:
   - `SESSION_SECRET` - chave para assinar a sessão
   - `DOMAIN` - domínio usado nos logs (padrão `start.devlimassh.shop`)
   - `SSL_KEY_PATH` e `SSL_CERT_PATH` - caminhos para os certificados SSL
   - `PORT` - porta HTTP caso não utilize HTTPS
4. Inicie o servidor:
   ```
   npm start
   ```
5. O servidor escuta nas portas 80 e 443 (HTTPS) se os certificados existirem. Acesse em `https://seu_dominio`
6. Faça login com o usuário padrão `start` e senha `start`

Sempre que o servidor é reiniciado, um identificador único é criado e todas as
sessões anteriores tornam-se inválidas. O navegador remove o cache automaticamente
ao detectar uma nova instância do servidor.

### Dependências para geração de PDF (Ubuntu)

Ao gerar PDFs o projeto utiliza o Puppeteer com o navegador Chromium. Em algumas
instalações do Ubuntu o binário `/usr/bin/chromium-browser` não está presente e
aparecem erros semelhantes a:

```
Erro ao baixar PDF: {"erro":"Failed to launch the browser process!\n/usr/bin/chromium-browser: 12: xdg-settings: not found"}
```

Para resolver instale o Chromium e bibliotecas necessárias:

```bash
sudo apt install -y chromium-browser libgbm1 xdg-utils
```

Certifique-se de que o comando `chromium` ou `chromium-browser` funcione em seu
sistema. Se continuar com problemas, consulte o guia oficial em
<https://pptr.dev/troubleshooting>.

## Responsividade

O aplicativo é 100% responsivo e otimizado para:
- Smartphones (telas menores que 640px)
- Tablets (telas entre 640px e 1024px)
- Desktops (telas maiores que 1024px)

## Melhorias Implementadas

- Design moderno com microinterações e animações suaves
- Interface totalmente responsiva para qualquer dispositivo
- Navegação inferior para dispositivos móveis
- Integração da logo da Start em todos os elementos principais
- Paleta de cores moderna e consistente
- Tipografia mais legível com a fonte Inter
- Cards elevados com efeitos de hover
- Formulários mais intuitivos com feedback visual
- Modais redesenhados com animações fluidas
- Página "Sobre" com layout mais profissional
- Dados em cache na memória para respostas mais rápidas
- Instância única do Puppeteer reutilizada para gerar PDFs
- Cada usuário pode atualizar seu próprio perfil (nome, senha e foto)
- Funciona offline permitindo apenas o uso de produtos e templates já cadastrados

## Licença

© 2025 Start do Brasil - Todos os direitos reservados
