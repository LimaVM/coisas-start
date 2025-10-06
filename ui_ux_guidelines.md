# Diretrizes de UI/UX para o PWA de Orçamentos

## Visão Geral
Este documento define as diretrizes de design e experiência do usuário para a reformulação do PWA de Orçamentos, com foco em criar uma interface moderna, requintada e 100% responsiva.

## Paleta de Cores

### Cores Primárias
- **Azul Principal**: `#2563eb` (substituindo o atual #4285f4)
- **Azul Escuro**: `#1d4ed8` (para estados hover)
- **Azul Claro**: `#93c5fd` (para fundos e elementos secundários)

### Cores Secundárias
- **Verde**: `#10b981` (substituindo o atual #34a853)
- **Vermelho**: `#ef4444` (para erros e alertas)
- **Amarelo**: `#f59e0b` (para avisos)

### Cores Neutras
- **Texto Principal**: `#111827` (quase preto)
- **Texto Secundário**: `#4b5563` (cinza escuro)
- **Fundo Principal**: `#ffffff` (branco)
- **Fundo Secundário**: `#f9fafb` (cinza muito claro)
- **Borda**: `#e5e7eb` (cinza claro)

## Tipografia

### Família de Fontes
- **Principal**: 'Inter', sans-serif (substituindo Roboto)
- **Fallback**: system-ui, -apple-system, sans-serif

### Tamanhos de Fonte
- **Extra Pequeno**: 0.75rem (12px)
- **Pequeno**: 0.875rem (14px)
- **Base**: 1rem (16px)
- **Médio**: 1.125rem (18px)
- **Grande**: 1.25rem (20px)
- **Extra Grande**: 1.5rem (24px)
- **Título**: 1.875rem (30px)

### Pesos de Fonte
- **Regular**: 400
- **Médio**: 500
- **Semi-Bold**: 600
- **Bold**: 700

## Espaçamento e Layout

### Sistema de Grid
- Grid flexível baseado em 12 colunas para desktop
- Layout de coluna única para dispositivos móveis
- Breakpoints responsivos:
  - **Mobile**: < 640px
  - **Tablet**: 640px - 1024px
  - **Desktop**: > 1024px

### Espaçamento
- **2xs**: 0.25rem (4px)
- **xs**: 0.5rem (8px)
- **sm**: 0.75rem (12px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

## Componentes UI

### Cartões
- Fundo branco
- Sombra suave: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- Borda arredondada: 12px
- Transição suave ao hover com elevação aumentada
- Padding interno: 1.5rem

### Botões
- **Primário**: Fundo azul principal, texto branco, borda arredondada 8px
- **Secundário**: Fundo transparente, borda azul principal, texto azul principal
- **Terciário**: Apenas texto azul principal, sem fundo ou borda
- **Perigo**: Fundo vermelho, texto branco
- **Desabilitado**: Opacidade reduzida (60%)
- Todos os botões têm:
  - Padding: 0.625rem 1.25rem
  - Transição suave (0.2s) para hover/focus
  - Estado hover com leve escurecimento
  - Estado active com leve compressão (transform: scale(0.98))

### Inputs
- Borda arredondada: 8px
- Borda leve: 1px solid var(--border-color)
- Padding: 0.625rem 0.875rem
- Transição suave para focus
- Estado focus com borda azul principal e leve sombra
- Placeholder em cinza claro
- Labels acima dos inputs, não dentro

### Modais
- Fundo branco
- Borda arredondada: 16px
- Sombra pronunciada
- Animação de entrada/saída suave
- Header com título centralizado
- Botões de ação alinhados à direita
- Overlay com desfoque (backdrop-filter)

### Navegação
- Menu lateral com transição suave
- Indicador visual claro para item ativo
- Ícones consistentes com texto
- Feedback visual ao hover/click

## Microinterações e Animações

### Transições
- Duração padrão: 0.2s a 0.3s
- Timing function: ease-out para entradas, ease-in para saídas
- Elementos que mudam de estado (hover, active, etc) devem ter transições suaves

### Feedback Visual
- Ripple effect nos botões e itens clicáveis
- Mudança de escala sutil em elementos interativos
- Feedback de loading com animações suaves
- Toasts com animações de entrada/saída

### Animações Específicas
- Menu lateral: deslizar da esquerda
- Modais: fade in + scale up
- Cards: elevação ao hover
- Listas: fade in sequencial dos itens
- Botão flutuante: pequeno bounce ao aparecer

## Responsividade

### Princípios
- Mobile-first em todas as implementações
- Flexbox e CSS Grid para layouts adaptáveis
- Nenhum elemento com largura fixa que possa quebrar em telas pequenas
- Testes em múltiplos breakpoints

### Adaptações Específicas
- **Mobile**:
  - Menu de navegação em tela cheia
  - Botões de ação em largura total
  - Cards em coluna única
  - Modais em tela quase completa
  
- **Tablet**:
  - Grid de 2 colunas para cards
  - Modais com largura máxima de 80%
  
- **Desktop**:
  - Grid de 3+ colunas para cards
  - Modais com largura máxima de 600px
  - Sidebar potencialmente visível permanentemente

## Acessibilidade

### Contraste
- Relação de contraste mínima de 4.5:1 para texto normal
- Relação de contraste mínima de 3:1 para texto grande

### Interação
- Todos os elementos interativos devem ser acessíveis por teclado
- Foco visível em todos os elementos interativos
- Tamanho mínimo de área clicável: 44x44px

### Semântica
- Uso apropriado de elementos HTML semânticos
- ARIA labels onde necessário
- Hierarquia clara de cabeçalhos

## Iconografia

### Estilo
- Linha fina e consistente
- Preenchimento opcional para estados ativos
- Tamanho base: 24x24px
- Cores que seguem a paleta principal

### Uso
- Ícones sempre acompanhados de texto (exceto em casos muito óbvios)
- Consistência no uso (mesmo ícone para mesma ação)
- Animações sutis em ícones interativos

## Experiência do Usuário

### Navegação
- Máximo de 3 cliques para qualquer funcionalidade
- Breadcrumbs para navegação em fluxos complexos
- Botão de voltar sempre disponível em subpáginas

### Formulários
- Validação em tempo real
- Mensagens de erro claras e específicas
- Agrupamento lógico de campos relacionados
- Progresso visual em formulários multi-etapa

### Feedback
- Toasts para ações concluídas
- Indicadores de loading para operações assíncronas
- Confirmação para ações destrutivas
- Estado vazio bem desenhado para listas

### Performance
- Carregamento progressivo de conteúdo
- Skeleton screens durante carregamento
- Otimização de imagens
- Prefetch de dados prováveis

## Implementação Técnica

### CSS
- Variáveis CSS para todos os valores de design system
- Uso de flexbox e grid para layouts
- Media queries para responsividade
- Transições e animações otimizadas

### JavaScript
- Animações performáticas (preferência por CSS)
- Debounce em eventos de scroll/resize
- Lazy loading de componentes pesados
- Feedback tátil em dispositivos móveis
