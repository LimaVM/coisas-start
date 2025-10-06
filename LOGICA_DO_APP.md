# Lógica do Aplicativo Start Orçamentos PWA

Este documento explica detalhadamente a lógica de funcionamento do aplicativo Start Orçamentos PWA, desenvolvido para criar orçamentos de produtos com templates personalizáveis.

## Arquitetura Geral

O aplicativo segue uma arquitetura cliente-servidor simples:

1. **Backend (Node.js + Express)**: Responsável pelo armazenamento e manipulação dos dados, além de servir o frontend.
2. **Frontend (HTML + CSS + JavaScript puro)**: Interface do usuário, com funcionalidades PWA para uso offline (consulta apenas a dados já existentes quando sem conexão).
3. **Armazenamento (JSON)**: Todos os dados são armazenados em arquivos JSON, sem uso de banco de dados.

## Fluxo de Dados

### 1. Armazenamento em JSON

Todos os dados são armazenados em arquivos JSON na pasta `data/`:

- `produtos.json`: Armazena a lista de produtos cadastrados
  ```json
  [
    {
      "id": "1622654321000",
      "nome": "Produto Exemplo",
      "valor": 99.90,
      "foto": "/images/produtos/produto-1622654321000.jpg",
      "dataCriacao": "2025-06-02T09:25:21.000Z"
    }
  ]
  ```

- `orcamentos.json`: Armazena a lista de orçamentos gerados
  ```json
  [
    {
      "id": "1622654987000",
      "nomeCliente": "Cliente Exemplo",
      "enderecoCliente": "Rua Exemplo, 123",
      "telefoneCliente": "(11) 98765-4321",
      "emailCliente": "cliente@exemplo.com",
      "templateId": "template_padrao.html",
      "produtos": [
        {
          "id": "1622654321000",
          "nome": "Produto Exemplo",
          "valor": 99.90,
          "quantidade": 2,
          "valorTotal": 199.80
        }
      ],
      "valorTotal": 199.80,
      "observacoes": "Entrega em 5 dias úteis",
      "dataCriacao": "2025-06-02T09:36:27.000Z",
      "status": "pendente",
      "pdfUrl": "/pdfs/orcamento_1622654987000.pdf"
    }
  ]
  ```

### 2. Fluxo de Cadastro de Produtos

1. O usuário acessa a página de produtos e clica no botão de adicionar produto
2. Preenche o formulário com nome, valor e foto do produto
3. O frontend envia os dados para o backend via requisição POST para `/api/produtos`
4. O backend processa a requisição:
   - Valida os dados recebidos
   - Gera um ID único baseado no timestamp atual
   - Salva a imagem na pasta `public/images/produtos/`
   - Adiciona o produto ao arquivo `produtos.json`
   - Retorna o produto criado para o frontend
5. O frontend atualiza a lista de produtos exibida

### 3. Fluxo de Criação de Orçamento

1. O usuário acessa a página de orçamentos e clica no botão de adicionar orçamento
2. Preenche os dados do cliente na primeira tab
3. Seleciona os produtos na segunda tab:
   - Clica no botão de adicionar produtos
   - Seleciona os produtos desejados e suas quantidades
   - Confirma a seleção
4. Seleciona um template na terceira tab
5. Clica em "Gerar Orçamento"
6. O frontend envia os dados para o backend via requisição POST para `/api/orcamentos`
7. O backend processa a requisição:
   - Valida os dados recebidos
   - Busca os detalhes completos dos produtos selecionados
   - Calcula o valor total do orçamento
   - Gera um ID único baseado no timestamp atual
   - Adiciona o orçamento ao arquivo `orcamentos.json`
   - Retorna o orçamento criado para o frontend
8. O frontend exibe o modal de visualização do orçamento

### 4. Fluxo de Geração do Orçamento HTML

1. O usuário visualiza um orçamento existente ou após criar um novo
2. O frontend solicita a geração do HTML do orçamento via requisição GET para `/api/orcamentos/:id/gerar`
3. O backend processa a requisição:
   - Busca o orçamento pelo ID
   - Busca o template selecionado na pasta `templates/`
   - Substitui as variáveis do template pelos dados do orçamento:
     - `$nomedocliente` → Nome do cliente
     - `$enderecocliente` → Endereço do cliente (ou vazio se não preenchido)
     - `$telefonecliente` → Telefone do cliente (ou vazio se não preenchido)
    - `$emailcliente` → E-mail do cliente (ou vazio se não preenchido)
    - `$cpf` → CPF ou CNPJ do cliente (ou vazio se não preenchido)
    - `$dataorcamento` → Data de criação formatada
    - `$observacoes` → Observações do orçamento (ou vazio se não preenchido)
    - `$referencia` → Mesmo valor de `$id`, para exibir como referência
    - `$valortotal` → Valor total formatado
     - `$tabelaprodutos` → HTML da tabela de produtos
   - Retorna o HTML gerado para o frontend
4. O frontend exibe o HTML gerado no modal de visualização

### 5. Fluxo de Geração do PDF do Orçamento

1. O usuário visualiza um orçamento e clica no botão "Baixar PDF" ou "Compartilhar"
2. O frontend solicita a geração do PDF via requisição GET para `/api/orcamentos/:id/pdf`
3. O backend processa a requisição:
   - Busca o orçamento pelo ID
   - Busca o template selecionado na pasta `templates/`
   - Substitui as variáveis do template pelos dados do orçamento (mesmo processo do HTML)
   - Gera um arquivo PDF a partir do HTML usando o Puppeteer
   - Salva o PDF na pasta `public/pdfs/` com nome baseado no ID do orçamento
   - Atualiza o orçamento no JSON com a URL do PDF gerado
   - Retorna a URL do PDF e o nome do arquivo para o frontend
4. O frontend permite ao usuário:
   - Baixar o PDF diretamente (botão "Baixar PDF")
   - Compartilhar o PDF usando a Web Share API (botão "Compartilhar")
   - Imprimir o orçamento (botão "Imprimir")

## Componentes Principais

### 1. Backend (server.js)

O backend é responsável por:

1. **Servir arquivos estáticos**: Serve os arquivos do frontend da pasta `public/`
2. **API RESTful**: Fornece endpoints para manipulação de produtos, templates e orçamentos
3. **Processamento de uploads**: Gerencia o upload e armazenamento de imagens de produtos
4. **Manipulação de arquivos JSON**: Lê e escreve nos arquivos de dados
5. **Geração de orçamentos**: Substitui as variáveis nos templates pelos dados do orçamento
6. **Geração de PDFs**: Converte o HTML do orçamento em PDF para download e compartilhamento

#### Funções Auxiliares Importantes

- `lerArquivoJSON(filePath)`: Lê um arquivo JSON e retorna seu conteúdo como objeto JavaScript
- `escreverArquivoJSON(filePath, data)`: Escreve dados em um arquivo JSON
- `criarPastasNecessarias()`: Cria as pastas necessárias para o funcionamento do aplicativo, incluindo a pasta de PDFs

### 2. Frontend (app.js)

O frontend é responsável por:

1. **Interface do usuário**: Exibe as páginas e componentes do aplicativo
2. **Navegação**: Gerencia a navegação entre páginas
3. **Comunicação com a API**: Envia e recebe dados do backend
4. **Manipulação do DOM**: Atualiza a interface com os dados recebidos
5. **Gerenciamento de estado**: Mantém o estado da aplicação no cliente
6. **Funcionalidades PWA**: Registro do service worker e prompt de instalação
7. **Manipulação de PDFs**: Permite baixar e compartilhar PDFs gerados

#### Funções Importantes

- `carregarProdutos()`, `carregarTemplates()`, `carregarOrcamentos()`: Buscam dados da API
- `renderizarProdutos()`, `renderizarTemplates()`, `renderizarOrcamentos()`: Atualizam a interface
- `abrirModalProduto()`, `abrirModalOrcamento()`: Exibem modais para criação/edição
- `abrirModalVisualizarOrcamento(id)`: Exibe o orçamento gerado
- `filtrarProdutos(termo)`, `filtrarOrcamentos(termo)`: Filtram listas por termo de busca
- `baixarPdfOrcamento(id)`: Solicita a geração do PDF e inicia o download
- `compartilharOrcamento(id)`: Solicita a geração do PDF e abre o diálogo de compartilhamento

### 3. Service Worker (service-worker.js)

O service worker é responsável por:

1. **Cache de recursos**: Armazena recursos estáticos para uso offline
2. **Estratégias de cache**: Define como os recursos são buscados (cache ou rede) e mantém cópias dos produtos e templates para uso offline
3. **Instalação e ativação**: Gerencia o ciclo de vida do service worker

## Substituição de Variáveis nos Templates

A substituição de variáveis nos templates é feita no backend, nas rotas `/api/orcamentos/:id/gerar` e `/api/orcamentos/:id/pdf`:

1. O backend busca o orçamento pelo ID
2. Busca o template selecionado na pasta `templates/`
3. Substitui as variáveis usando expressões regulares:
   ```javascript
   let htmlGerado = conteudoTemplate
     .replace(/\$nomedocliente/g, orcamento.nomeCliente)
     .replace(/\$enderecocliente/g, orcamento.enderecoCliente || '')
     .replace(/\$telefonecliente/g, orcamento.telefoneCliente || '')
     .replace(/\$emailcliente/g, orcamento.emailCliente || '')
     .replace(/\$dataorcamento/g, new Date(orcamento.dataCriacao).toLocaleDateString('pt-BR'))
     .replace(/\$observacoes/g, orcamento.observacoes || '')
     .replace(/\$valortotal/g, orcamento.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
   ```
4. Gera a tabela de produtos dinamicamente:
   ```javascript
   const tabelaProdutos = orcamento.produtos.map(produto => `
     <tr>
       <td>${produto.nome}</td>
       <td>${produto.quantidade}</td>
       <td>${produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
       <td>${produto.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
     </tr>
   `).join('');
   
   htmlGerado = htmlGerado.replace(/\$tabelaprodutos/g, tabelaProdutos);
   ```
5. Retorna o HTML gerado para o frontend ou gera o PDF

## Geração de PDF

A geração de PDF é realizada usando o Puppeteer para renderizar o HTML em PDF:

1. O backend recebe a solicitação para gerar o PDF
2. Gera o HTML do orçamento com as variáveis substituídas
3. Configura as opções do PDF:
   ```javascript
   const options = {
     format: 'A4',
     margin: {
       top: '20mm',
       right: '20mm',
       bottom: '20mm',
       left: '20mm'
     },
     printBackground: true
   };
   ```
4. Gera o PDF a partir do HTML usando Puppeteer:
   ```javascript
   const browser = await puppeteer.launch();
   const page = await browser.newPage();
   await page.setContent(htmlGerado);
   const pdfBuffer = await page.pdf(options);
   await browser.close();
   ```
5. Salva o PDF no servidor:
   ```javascript
   const nomeArquivo = `orcamento_${orcamentoId}.pdf`;
   const caminhoArquivo = path.join(__dirname, 'public', 'pdfs', nomeArquivo);
   await fs.writeFile(caminhoArquivo, pdfBuffer);
   ```
6. Atualiza o orçamento no JSON com a URL do PDF
7. Retorna a URL do PDF para o frontend

## Funcionalidades PWA

O aplicativo Start Orçamentos implementa as seguintes funcionalidades PWA:

1. **Manifesto**: Define ícones, cores e comportamento da instalação
2. **Service Worker**: Permite funcionamento offline através de cache
3. **Instalação**: Prompt personalizado para instalação do aplicativo
4. **Responsividade**: Design adaptado para dispositivos móveis

### Estratégias de Cache

O service worker implementa duas estratégias de cache:

1. **Cache First**: Para recursos estáticos (HTML, CSS, JS, imagens)
   - Verifica primeiro no cache
   - Se não encontrar, busca na rede e armazena no cache
   
2. **Network First**: Para outros recursos
   - Tenta buscar primeiro na rede
   - Se falhar, busca no cache como fallback

## Considerações de Segurança

1. **Validação de Dados**: Todos os inputs são validados no backend
2. **Sanitização de Inputs**: Evita injeção de código malicioso
3. **Validação de Uploads**: Aceita apenas imagens e limita o tamanho
4. **Tratamento de Erros**: Mensagens de erro amigáveis e logs no servidor

## Tratamento de Campos Não Preenchidos

O aplicativo trata campos não preenchidos de forma elegante:

1. **No backend**: Campos não preenchidos são substituídos por strings vazias
   ```javascript
   .replace(/\$enderecocliente/g, orcamento.enderecoCliente || '')
   ```
2. **No frontend**: A interface exibe apenas os campos que foram preenchidos
3. **No PDF**: Campos não preenchidos aparecem em branco, sem afetar o layout

## Compartilhamento de PDFs

O aplicativo utiliza a Web Share API para compartilhar PDFs quando disponível:

```javascript
if (navigator.share) {
  navigator.share({
    title: 'Orçamento - Start Orçamentos',
    text: 'Confira o orçamento gerado',
    url: pdfUrl
  });
} else {
  // Fallback para navegadores que não suportam a API
mostrarToast('Compartilhamento não suportado. Use o botão de download.');
}
```

## Autenticação

O backend mantém sessões de usuário. Um administrador padrão é criado na primeira inicialização com usuário `start` e senha `start`. Apenas esse usuário pode cadastrar ou editar produtos e gerenciar outros usuários. Os orçamentos comuns ficam visíveis somente para o usuário que os criou.

## Conclusão

O Start Orçamentos PWA é um aplicativo completo que demonstra como criar uma solução funcional usando tecnologias web modernas, sem depender de frameworks complexos ou bancos de dados. A arquitetura simples e o uso de arquivos JSON para armazenamento tornam o aplicativo leve e fácil de manter, enquanto as funcionalidades PWA proporcionam uma experiência de usuário semelhante a um aplicativo nativo. A adição da geração de PDF permite que os usuários compartilhem e armazenem os orçamentos de forma profissional e prática.
