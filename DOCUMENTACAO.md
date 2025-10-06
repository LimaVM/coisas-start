# Documentação do OrçaFácil PWA

## Visão Geral

O OrçaFácil é um Progressive Web App (PWA) desenvolvido para criação e gerenciamento de orçamentos de produtos. O aplicativo permite cadastrar produtos com nome, valor e foto, selecionar templates de orçamento e gerar orçamentos personalizados para clientes.

O sistema foi desenvolvido utilizando HTML, CSS e JavaScript puro no frontend, e Node.js no backend, com armazenamento de dados em arquivos JSON, conforme solicitado.

## Estrutura do Projeto

```
orcamento-pwa/
├── data/                     # Armazenamento de dados em JSON
│   ├── produtos.json         # Lista de produtos cadastrados
│   └── orcamentos.json       # Lista de orçamentos gerados
├── public/                   # Arquivos estáticos do frontend
│   ├── css/
│   │   └── style.css         # Estilos CSS do aplicativo
│   ├── images/
│   │   ├── icons/            # Ícones para o PWA
│   │   └── produtos/         # Imagens dos produtos cadastrados
│   ├── js/
│   │   └── app.js            # Lógica JavaScript do frontend
│   ├── index.html            # Página principal do aplicativo
│   ├── manifest.json         # Manifesto para PWA
│   └── service-worker.js     # Service Worker para funcionamento offline
├── templates/                # Templates de orçamento
│   ├── template_padrao.html  # Template padrão
│   └── template_empresarial.html # Template empresarial
└── server.js                 # Servidor Node.js (backend)
```

## Backend (server.js)

O backend foi desenvolvido em Node.js utilizando Express.js para criar uma API RESTful que gerencia produtos, templates e orçamentos.

### Principais Funcionalidades do Backend

1. **Gerenciamento de Produtos**
   - Listar todos os produtos
   - Obter um produto específico
   - Adicionar um novo produto
   - Atualizar um produto existente
   - Excluir um produto

2. **Gerenciamento de Templates**
   - Listar todos os templates disponíveis
   - Obter o conteúdo de um template específico

3. **Gerenciamento de Orçamentos**
   - Listar todos os orçamentos
   - Obter um orçamento específico
   - Criar um novo orçamento
   - Gerar o HTML do orçamento com as variáveis substituídas
   - Excluir um orçamento

### Rotas da API

#### Produtos

- `GET /api/produtos` - Lista todos os produtos
- `GET /api/produtos/:id` - Obtém um produto específico
- `POST /api/produtos` - Adiciona um novo produto
- `PUT /api/produtos/:id` - Atualiza um produto existente
- `DELETE /api/produtos/:id` - Exclui um produto

#### Templates

- `GET /api/templates` - Lista todos os templates disponíveis
- `GET /api/templates/:id` - Obtém o conteúdo de um template específico

#### Orçamentos

- `GET /api/orcamentos` - Lista todos os orçamentos
- `GET /api/orcamentos/:id` - Obtém um orçamento específico
- `POST /api/orcamentos` - Cria um novo orçamento
- `GET /api/orcamentos/:id/gerar` - Gera o HTML do orçamento com as variáveis substituídas
- `DELETE /api/orcamentos/:id` - Exclui um orçamento

### Armazenamento de Dados

Os dados são armazenados em arquivos JSON, conforme solicitado:

- `data/produtos.json` - Armazena a lista de produtos cadastrados
- `data/orcamentos.json` - Armazena a lista de orçamentos gerados

As imagens dos produtos são armazenadas na pasta `public/images/produtos/`.

## Frontend

O frontend foi desenvolvido utilizando HTML, CSS e JavaScript puro, seguindo uma abordagem mobile-first para garantir responsividade em dispositivos móveis.

### Principais Funcionalidades do Frontend

1. **Navegação**
   - Menu lateral para navegação entre páginas
   - Dashboard na página inicial

2. **Gerenciamento de Produtos**
   - Listagem de produtos
   - Adição de novos produtos
   - Edição de produtos existentes
   - Exclusão de produtos
   - Busca de produtos

3. **Gerenciamento de Orçamentos**
   - Listagem de orçamentos
   - Criação de novos orçamentos
   - Visualização de orçamentos
   - Exclusão de orçamentos
   - Busca de orçamentos

4. **Seleção de Templates**
   - Listagem de templates disponíveis
   - Seleção de template para o orçamento

5. **Funcionalidades PWA**
   - Instalação como aplicativo
   - Funcionamento offline
   - Cache de recursos estáticos

### Estrutura do HTML

O arquivo `index.html` contém toda a estrutura do aplicativo, incluindo:

- Cabeçalho com título e botão de menu
- Menu lateral para navegação
- Páginas do aplicativo (início, produtos, orçamentos, sobre)
- Modais para adição/edição de produtos, criação de orçamentos, seleção de produtos e visualização de orçamentos
- Toast para notificações
- Spinner de carregamento

### Estilos CSS

O arquivo `style.css` contém todos os estilos do aplicativo, seguindo uma abordagem mobile-first com media queries para dispositivos maiores. Os estilos são organizados por componentes:

- Variáveis CSS para cores e tamanhos
- Estilos base e reset
- Cabeçalho e menu lateral
- Cards e listas de itens
- Formulários e modais
- Botões e elementos interativos
- Responsividade

### Lógica JavaScript

O arquivo `app.js` contém toda a lógica do frontend, incluindo:

- Inicialização do aplicativo
- Navegação entre páginas
- Gerenciamento de modais
- Comunicação com a API
- Manipulação do DOM
- Gerenciamento de estado
- Funcionalidades PWA

## Progressive Web App (PWA)

O aplicativo foi desenvolvido como um Progressive Web App (PWA), permitindo:

1. **Instalação como Aplicativo**
   - Manifesto para definir ícones, cores e comportamento
   - Prompt de instalação personalizado

2. **Funcionamento Offline**
   - Service Worker para cache de recursos estáticos
   - Estratégia Cache First para recursos estáticos
   - Estratégia Network First para outros recursos

3. **Experiência Mobile**
   - Design responsivo
   - Interface adaptada para dispositivos móveis
   - Gestos e interações mobile-friendly

## Templates de Orçamento

Os templates de orçamento são arquivos HTML que contêm variáveis que são substituídas pelos dados do orçamento. As variáveis disponíveis são:

- `$nomedocliente` - Nome do cliente
- `$enderecocliente` - Endereço do cliente
- `$telefonecliente` - Telefone do cliente
- `$emailcliente` - E-mail do cliente
- `$dataorcamento` - Data de criação do orçamento
- `$observacoes` - Observações do orçamento
- `$valortotal` - Valor total do orçamento
- `$tabelaprodutos` - Tabela de produtos do orçamento

## Fluxo de Funcionamento

1. **Cadastro de Produtos**
   - O usuário acessa a página de produtos
   - Clica no botão de adicionar produto
   - Preenche os dados do produto (nome, valor, foto)
   - Salva o produto
   - O produto é armazenado no arquivo `data/produtos.json`

2. **Criação de Orçamento**
   - O usuário acessa a página de orçamentos
   - Clica no botão de adicionar orçamento
   - Preenche os dados do cliente
   - Seleciona os produtos para o orçamento
   - Seleciona um template
   - Salva o orçamento
   - O orçamento é armazenado no arquivo `data/orcamentos.json`

3. **Geração de Orçamento**
   - O usuário visualiza um orçamento
   - O sistema busca o template selecionado
   - Substitui as variáveis pelos dados do orçamento
   - Exibe o HTML gerado para o usuário
   - O usuário pode imprimir ou compartilhar o orçamento

## Considerações de Segurança

1. **Validação de Dados**
   - Validação de campos obrigatórios
   - Validação de tipos de dados
   - Sanitização de inputs

2. **Proteção de Arquivos**
   - Acesso restrito a arquivos sensíveis
   - Validação de uploads de imagens

3. **Tratamento de Erros**
   - Mensagens de erro amigáveis
   - Logs de erros no servidor

## Melhorias Futuras

1. **Autenticação de Usuários**
   - Sistema de login e registro
   - Perfis de usuário

2. **Sincronização em Nuvem**
   - Sincronização de dados entre dispositivos
   - Backup automático

3. **Personalização de Templates**
   - Editor de templates
   - Mais opções de personalização

4. **Estatísticas e Relatórios**
   - Dashboard com estatísticas
   - Relatórios de vendas

5. **Integração com Outros Sistemas**
   - Integração com sistemas de gestão
   - Integração com meios de pagamento

## Conclusão

O OrçaFácil PWA é um aplicativo completo para criação e gerenciamento de orçamentos, desenvolvido com tecnologias web modernas e seguindo boas práticas de desenvolvimento. O aplicativo é responsivo, funciona offline e pode ser instalado como um aplicativo nativo em dispositivos móveis e desktop.
