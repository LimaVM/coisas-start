# Plano de Componentes UI para o PWA de Orçamentos

## Estrutura Visual Geral

### Layout Base
- Implementar layout baseado em CSS Grid e Flexbox
- Criar sistema de containers responsivos com largura máxima de 1280px
- Definir breakpoints consistentes (mobile: 640px, tablet: 768px, laptop: 1024px, desktop: 1280px)
- Aplicar espaçamento responsivo entre componentes (menor em mobile, maior em desktop)

### Header
- Redesenhar com altura variável (64px em desktop, 56px em mobile)
- Adicionar efeito de elevação com sombra suave
- Implementar logo com versão compacta para mobile
- Adicionar animação de transição ao scroll (header compacto)
- Incluir feedback visual nos botões de ação

### Menu de Navegação
- Redesenhar menu lateral com animação suave de entrada/saída
- Implementar backdrop com efeito de blur
- Adicionar indicador de seleção animado para item ativo
- Criar versão de navegação inferior para mobile (bottom navigation)
- Adicionar transições entre páginas com animações sutis

## Componentes Principais

### Cards
- **Card de Dashboard**
  - Redesenhar com elevação aumentada (sombra mais pronunciada)
  - Adicionar gradiente sutil no fundo
  - Implementar hover state com animação de escala
  - Incluir ícones com animação sutil
  - Garantir espaçamento interno consistente (24px)

- **Card de Produto**
  - Redesenhar com imagem de destaque maior
  - Adicionar badge de status (quando aplicável)
  - Implementar ações contextuais com menu dropdown
  - Criar efeito de hover com elevação
  - Garantir responsividade com grid adaptativo

- **Card de Orçamento**
  - Redesenhar com informações mais organizadas
  - Adicionar código de orçamento em destaque
  - Implementar indicador visual de status (cores)
  - Criar ações rápidas com botões de ícone
  - Garantir legibilidade em todos os tamanhos de tela

### Formulários

- **Campos de Input**
  - Redesenhar com estilo flutuante (floating label)
  - Adicionar animação suave no focus
  - Implementar validação visual em tempo real
  - Criar estados de erro com mensagens claras
  - Garantir tamanho adequado para toque em mobile (min 44px)

- **Seleção de Produtos**
  - Redesenhar interface de seleção com cards
  - Adicionar contador de quantidade com animação
  - Implementar busca com filtragem instantânea
  - Criar indicador visual de seleção
  - Garantir feedback claro de adição/remoção

- **Seleção de Template**
  - Redesenhar com preview visual do template
  - Adicionar carrossel horizontal em mobile
  - Implementar seleção com animação de escala
  - Criar indicador claro de template ativo
  - Garantir visualização adequada em todos os dispositivos

### Modais

- **Modal Base**
  - Redesenhar com cantos mais arredondados (16px)
  - Adicionar animação de entrada/saída mais fluida
  - Implementar backdrop com blur
  - Criar botão de fechar mais visível
  - Garantir comportamento responsivo (tela cheia em mobile)

- **Modal de Produto**
  - Reorganizar layout para fluxo mais intuitivo
  - Adicionar preview de imagem com zoom
  - Implementar upload de imagem com drag & drop
  - Criar feedback visual durante salvamento
  - Garantir validação clara dos campos

- **Modal de Orçamento**
  - Redesenhar com navegação por tabs mais clara
  - Adicionar indicador de progresso
  - Implementar resumo visual dos dados inseridos
  - Criar transições suaves entre etapas
  - Garantir que funcione bem em telas pequenas

- **Modal de Visualização**
  - Redesenhar com foco no conteúdo do orçamento
  - Adicionar opções de compartilhamento mais visíveis
  - Implementar zoom e navegação no documento
  - Criar botões de ação flutuantes em mobile
  - Garantir visualização adequada do PDF

### Elementos de Feedback

- **Toast Notifications**
  - Redesenhar com estilo mais moderno e cores contextuais
  - Adicionar ícones para diferentes tipos de mensagem
  - Implementar animação de entrada/saída suave
  - Criar sistema de empilhamento para múltiplas mensagens
  - Garantir posicionamento adequado em todos os dispositivos

- **Loading States**
  - Redesenhar spinner com animação mais fluida
  - Adicionar skeleton screens para carregamento de conteúdo
  - Implementar indicadores de progresso quando possível
  - Criar estados de loading contextuais (botões, cards)
  - Garantir feedback visual claro durante operações

- **Empty States**
  - Redesenhar com ilustrações mais atraentes
  - Adicionar mensagens mais amigáveis e acionáveis
  - Implementar animações sutis para engajamento
  - Criar CTA (call-to-action) claro
  - Garantir alinhamento com a identidade visual

## Elementos de Navegação

### Botões

- **Botão Primário**
  - Redesenhar com gradiente sutil
  - Adicionar efeito de ripple ao clicar
  - Implementar hover state com animação
  - Criar variantes de tamanho (sm, md, lg)
  - Garantir contraste adequado para acessibilidade

- **Botão Secundário**
  - Redesenhar com borda e sem preenchimento
  - Adicionar hover state com preenchimento leve
  - Implementar animação de focus
  - Criar variantes para diferentes contextos
  - Garantir alinhamento visual com botões primários

- **Botão de Ícone**
  - Redesenhar com área de toque adequada
  - Adicionar tooltip em desktop
  - Implementar feedback visual ao hover/active
  - Criar variantes para diferentes ações
  - Garantir reconhecimento claro do ícone

- **FAB (Floating Action Button)**
  - Redesenhar com elevação aumentada
  - Adicionar animação de entrada
  - Implementar efeito de pressionar ao clicar
  - Criar variante expandida com texto
  - Garantir posicionamento adequado em todos os dispositivos

### Navegação

- **Tabs**
  - Redesenhar com indicador animado
  - Adicionar efeito de hover
  - Implementar scroll horizontal em mobile
  - Criar variante com ícones
  - Garantir feedback claro de tab ativa

- **Breadcrumbs**
  - Implementar para navegação em fluxos complexos
  - Adicionar separadores visuais claros
  - Criar versão compacta para mobile
  - Garantir que seja clicável para navegação

- **Paginação**
  - Redesenhar com estilo mais moderno
  - Adicionar animação ao mudar de página
  - Implementar versão simplificada para mobile
  - Garantir feedback visual claro

## Implementação Técnica

### CSS Base

- Criar arquivo de reset CSS moderno
- Implementar sistema de variáveis CSS para todo o design system
- Definir classes utilitárias para espaçamento, tipografia e cores
- Organizar CSS em módulos por componente
- Implementar estratégia de nomenclatura consistente (BEM)

### Animações e Transições

- Criar biblioteca de animações reutilizáveis
- Implementar transições consistentes para estados de componentes
- Definir curvas de easing padronizadas
- Otimizar performance com propriedades GPU-accelerated
- Garantir que animações sejam sutis e não intrusivas

### Responsividade

- Implementar abordagem mobile-first em todos os componentes
- Criar mixins de media queries para breakpoints consistentes
- Definir comportamentos específicos para cada breakpoint
- Testar em múltiplos tamanhos de tela
- Garantir que nenhum elemento quebre o layout

### Acessibilidade

- Implementar contraste adequado para todos os elementos
- Garantir navegação por teclado
- Adicionar atributos ARIA onde necessário
- Testar com ferramentas de acessibilidade
- Garantir que o app seja utilizável com leitores de tela

## Páginas Específicas

### Home

- Redesenhar dashboard com cards mais visuais
- Adicionar seção de orçamentos recentes
- Implementar estatísticas básicas com visualização gráfica
- Criar atalhos para ações comuns
- Garantir hierarquia visual clara

### Produtos

- Redesenhar lista com opções de visualização (grid/lista)
- Adicionar filtros rápidos por categoria
- Implementar ordenação com feedback visual
- Criar ações em lote para múltiplos produtos
- Garantir performance com carregamento lazy

### Orçamentos

- Redesenhar lista com mais informações visíveis
- Adicionar filtros por status e data
- Implementar busca avançada
- Criar visualização de timeline
- Garantir acesso rápido às ações comuns

### Visualização de Orçamento

- Redesenhar com layout mais profissional
- Adicionar opções de personalização visual
- Implementar zoom e navegação intuitiva
- Criar ações contextuais baseadas no status
- Garantir que a impressão seja formatada corretamente
