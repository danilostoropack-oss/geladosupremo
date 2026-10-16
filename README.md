# Gelado Supremo

Site de encomendas de sobremesas com entrega na data e hora marcadas, mais um painel para gerenciar o cardápio.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | O site. As partes entre `<!--GS:...-->` são reescritas pelo painel, não edite à mão. |
| `admin.html` | Painel: produtos, fotos, preços, configurações, SEO e FAQ. |
| `assets/gs-build.js` | Gera cardápio, SEO, dados estruturados e sitemap a partir dos dados. |
| `assets/site.js` | Carrinho e envio do pedido pelo WhatsApp. |
| `img/` | Logo, ícones, imagem de compartilhamento e fotos dos produtos (`img/produtos/`). |
| `sitemap.xml`, `robots.txt`, `manifest.webmanifest` | SEO e instalação no celular. |

## Colocar no ar (GitHub Pages)

1. Envie todos os arquivos desta pasta para o repositório `geladosupremo` (commit + push).
2. No GitHub: **Settings › Pages › Build and deployment › Deploy from a branch**, escolha `main` e pasta `/ (root)`.
3. O site fica em `https://danilostoropack-oss.github.io/geladosupremo/` e o painel em `.../admin.html`.

## Usar o painel

Abra `.../admin.html` e entre com usuário e senha.

**Primeiro acesso (uma vez só):** o painel pede a chave do GitHub. Crie em **GitHub › Settings › Developer settings › Fine-grained tokens**, só para o repositório `geladosupremo`, com **Contents: Read and write**. A chave é guardada criptografada em `assets/acesso.json` com a sua senha; depois disso basta usuário e senha em qualquer aparelho.

Para trocar usuário ou senha, use o botão **Usuário e senha** no topo do painel. Se a chave do GitHub vencer, o painel pede uma nova no login.

Edite o que quiser e clique em **Publicar**. O site atualiza em 1 a 2 minutos.

O WhatsApp dos pedidos e o Instagram ficam em **Configurações**.

## Depois de publicar (Google)

1. Cadastre o site no [Google Search Console](https://search.google.com/search-console), verifique por “Tag HTML” e cole o código no painel (aba SEO).
2. Envie o sitemap: `https://danilostoropack-oss.github.io/geladosupremo/sitemap.xml`.
3. Crie o **Perfil da Empresa no Google** (Google Meu Negócio) como empresa de entrega em Cotia e região, com o link do site. Para buscas locais, é o que mais pesa.
4. Se registrar um domínio próprio, troque o “Endereço do site” na aba SEO e publique de novo.
