# Salespace Challenge API

## Visão Geral

Esta é uma API REST desenvolvida como parte de um desafio da Salespace.  
A API calcula o valor final de um pedido aplicando um conjunto de regras de desconto progressivas e combinadas.  
Ela permite simulação de preços, criação de cotações com validade e finalização de pedidos.

O projeto foi construído em **TypeScript** e **Node.js**, seguindo **arquitetura limpa** e desacoplada, separando responsabilidades em camadas distintas (`domain`, `application` e `infrastructure`).

---

## Tecnologias Utilizadas

- **Node.js** — Ambiente de execução para JavaScript no servidor.
- **Express.js** — Framework para criação da API REST e gerenciamento de rotas.
- **TypeScript** — Superset do JavaScript com tipagem estática.
- **Jest** — Framework de testes.
- **Supertest** — Biblioteca para testes de integração das rotas da API.
- **Swagger (OpenAPI)** — Documentação interativa da API (`swagger-ui-express`).
- **YAML** — Utilizado na documentação OpenAPI.
- **ts-jest** — Preset para rodar testes Jest em TypeScript.
- **nodemon** — Reinício automático do servidor em desenvolvimento.

---

## Funcionalidades

- **Cálculo de Descontos** — Regras aplicadas pelo `DiscountEngine`:
  - **Desconto por Volume** — 10%, 15% e 20% ao atingir 10, 20 e 50 unidades no pedido.
  - **Desconto por Valor do Carrinho** — R$ 50 de desconto para compras ≥ R$ 1000 e R$ 150 para compras ≥ R$ 2000.
  - **Desconto por Categoria** — 5% de desconto para categoria "acessórios" quando houver mais de 5 itens dessa categoria.
- **Criação de Cotações** — "Congela" preços e descontos por 30 minutos.
- **Finalização de Pedidos** — Baseada em `quoteId` válido.

---

## Estrutura do Projeto

```

src/
├── domain/          # Entidades de negócio e abstrações de repositórios
├── application/     # Casos de uso e serviços
├── infrastructure/  # Servidor Express, rotas, controllers, repositórios concretos
├── tests/           # Testes unitários e de integração
└── docs/            # Documentação OpenAPI (swagger.yaml)

````

---

## Endpoints da API

### `POST /v1/orders/calculate`
Calcula o preço final de um pedido sem criar cotação.

**Exemplo de Request Body:**
```json
{
  "items": [
    { "productId": "sku-001", "quantity": 5 },
    { "productId": "sku-002", "quantity": 10 }
  ]
}
````

---

### `POST /v1/orders/quote`

Cria uma cotação com validade de 30 minutos.

**Exemplo de Request Body:**

```json
{
  "items": [
    { "productId": "sku-004", "quantity": 1 }
  ]
}
```

---

### `POST /v1/orders`

Finaliza um pedido a partir de uma cotação existente.

**Exemplo de Request Body:**

```json
{
  "quoteId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
}
```

---

## Como Rodar o Projeto

### Pré-requisitos

* Node.js v14 ou superior
* npm ou yarn

### 1. Instalar dependências

```bash
npm install
```

### 2. (Opcional) Compilar TypeScript

```bash
npm run build
```

Gera código JS no diretório `/dist`.

### 3. Rodar servidor

Produção (após build):

```bash
npm start
```

Desenvolvimento (com nodemon):

```bash
npm run dev
```

Servidor disponível em `http://localhost:3000`.

### 4. Documentação interativa

Com o servidor rodando, acesse:

```
http://localhost:3000/api-docs
```

---

## Como Rodar os Testes

Para rodar todos os testes unitários e de integração com relatório de cobertura:

```bash
npm test
```

### Relatório de Cobertura (`coverage/`)

Ao rodar os testes, o **Jest** cria automaticamente a pasta `coverage/` na raiz do projeto.
Ela contém relatórios detalhados sobre quais partes do código foram executadas durante os testes.

O mais prático é abrir o arquivo:

```
coverage/lcov-report/index.html
```

no navegador, que exibe uma interface interativa com:

* Percentual de cobertura por arquivo (linhas, funções, branches).
* Linhas cobertas (verde) e não cobertas (vermelho).
* Navegação por pastas do projeto.

### Qualidade e Cobertura

O projeto atingiu **100% de cobertura** em:

* Código
* Condições
* Decisões

Todos os cenários de sucesso, falha, borda e exceção foram testados, garantindo confiabilidade e facilitando manutenção futura.

