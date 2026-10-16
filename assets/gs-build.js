/* Gelado Supremo — gerador do site.
 * Usado pelo admin.html para reescrever as partes do index.html que dependem
 * dos produtos e configurações (cardápio, SEO, dados estruturados, FAQ...).
 * Funciona no navegador (window.GSBuild) e no Node (module.exports).
 */
(function (root) {
  "use strict";

  var UNIDADES = {
    un:    { rotulo: "por unidade",  sufixo: "",        passo: 1,   singular: "unidade", plural: "unidades" },
    kg:    { rotulo: "por kg",       sufixo: "/kg",     passo: 0.5, singular: "kg",      plural: "kg" },
    cx:    { rotulo: "por caixa",    sufixo: "/caixa",  passo: 1,   singular: "caixa",   plural: "caixas" },
    fatia: { rotulo: "por fatia",    sufixo: "/fatia",  passo: 1,   singular: "fatia",   plural: "fatias" },
    cento: { rotulo: "por cento",    sufixo: "/cento",  passo: 1,   singular: "cento",   plural: "centos" },
    kit:   { rotulo: "por kit",      sufixo: "/kit",    passo: 1,   singular: "kit",     plural: "kits" }
  };
  var DIAS = [["Mo","Seg"],["Tu","Ter"],["We","Qua"],["Th","Qui"],["Fr","Sex"],["Sa","Sáb"],["Su","Dom"]];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function brl(v) {
    var n = Number(v) || 0;
    return "R$ " + n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function slug(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "item";
  }
  function absUrl(base, path) {
    if (!path) return "";
    if (/^(https?:|data:)/.test(path)) return path;
    return base.replace(/\/?$/, "/") + path.replace(/^\.?\//, "");
  }
  function jsonScript(obj) {
    return JSON.stringify(obj, null, 1).replace(/</g, "\\u003c");
  }
  function ativos(d) { return (d.produtos || []).filter(function (p) { return p.ativo !== false; }); }
  function categorias(d) {
    var out = [];
    ativos(d).forEach(function (p) { var c = p.categoria || "Outros"; if (out.indexOf(c) < 0) out.push(c); });
    return out;
  }
  function precoTexto(p) {
    var u = UNIDADES[p.unidade] || UNIDADES.un;
    return (p.aPartir ? "a partir de " : "") + brl(p.preco) + u.sufixo;
  }
  function fone(cfg) { var n = String(cfg.whatsapp || "").replace(/\D/g, ""); return n ? "+" + n : ""; }
  function listaPt(arr) {
    arr = (arr || []).filter(Boolean);
    if (arr.length < 2) return arr.join("");
    return arr.slice(0, -1).join(", ") + " e " + arr[arr.length - 1];
  }
  // Substitui {cidade}, {areas}, {antecedencia} nos textos do FAQ
  function tpl(s, cfg) {
    return String(s || "")
      .replace(/\{cidade\}/g, cfg.cidade || "")
      .replace(/\{areas\}/g, listaPt(cfg.areas))
      .replace(/\{antecedencia\}/g, String(cfg.antecedencia || 3))
      .replace(/\{horario\}/g, (cfg.horaInicio || "09:00") + " às " + (cfg.horaFim || "20:00"));
  }

  /* ---------- blocos ---------- */

  function head(d) {
    var c = d.config, url = c.siteUrl, og = absUrl(url, "img/og-image.jpg");
    var t = esc(c.seoTitulo), desc = esc(c.seoDescricao);
    var h = [
      "<title>" + t + "</title>",
      '<meta name="description" content="' + desc + '">',
      '<link rel="canonical" href="' + esc(url) + '">',
      '<meta name="robots" content="index, follow, max-image-preview:large">',
      '<meta property="og:type" content="website">',
      '<meta property="og:locale" content="pt_BR">',
      '<meta property="og:site_name" content="' + esc(c.nome) + '">',
      '<meta property="og:title" content="' + t + '">',
      '<meta property="og:description" content="' + desc + '">',
      '<meta property="og:url" content="' + esc(url) + '">',
      '<meta property="og:image" content="' + esc(og) + '">',
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      '<meta property="og:image:alt" content="' + esc(c.nome) + ' — sobremesas por encomenda em ' + esc(c.cidade) + '">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:title" content="' + t + '">',
      '<meta name="twitter:description" content="' + desc + '">',
      '<meta name="twitter:image" content="' + esc(og) + '">',
      '<meta name="geo.region" content="BR-' + esc(c.uf) + '">',
      '<meta name="geo.placename" content="' + esc(c.cidade) + '">'
    ];
    if (c.googleVerificacao) h.push('<meta name="google-site-verification" content="' + esc(c.googleVerificacao) + '">');
    if (c.ga4 && /^G-[A-Z0-9]+$/i.test(c.ga4)) {
      h.push('<script async src="https://www.googletagmanager.com/gtag/js?id=' + esc(c.ga4) + '"></script>');
      h.push("<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','" + esc(c.ga4) + "');</script>");
    }
    return h.join("\n");
  }

  function cards(d, opt) {
    opt = opt || {};
    var img = opt.imgUrl || function (p) { return p; };
    var cats = categorias(d), list = ativos(d), h = "";
    if (!list.length) return '<p class="sub">Cardápio em atualização. Chame no WhatsApp para saber o que temos hoje.</p>';
    if (cats.length > 1) {
      h += '<div class="chips" role="group" aria-label="Filtrar por categoria"><button type="button" class="chip on" data-cat="">Tudo</button>';
      cats.forEach(function (c) { h += '<button type="button" class="chip" data-cat="' + esc(c) + '">' + esc(c) + "</button>"; });
      h += "</div>\n";
    }
    h += '<div class="grid" id="grid">\n';
    list.forEach(function (p) {
      var u = UNIDADES[p.unidade] || UNIDADES.un;
      h += '<article class="card" id="p-' + esc(p.id) + '" data-id="' + esc(p.id) + '" data-cat="' + esc(p.categoria || "Outros") + '">';
      if (p.foto) {
        h += '<div class="ph"><img src="' + esc(img(p.foto, p)) + '" alt="' + esc(p.alt || (p.nome + " — " + d.config.nome)) +
             '" width="640" height="480" loading="lazy" decoding="async"></div>';
      } else {
        h += '<div class="ph ph-cor" style="--c:' + esc(p.cor || "#f2a1b6") + '" aria-hidden="true"><span></span></div>';
      }
      if (p.destaque) h += '<span class="tag">Mais pedido</span>';
      h += "<h3>" + esc(p.nome) + "</h3>";
      h += "<p>" + esc(p.desc) + (p.minimo > 1 ? ' <em>Pedido mínimo: ' + esc(p.minimo) + " " + esc(p.minimo == 1 ? u.singular : u.plural) + ".</em>" : "") + "</p>";
      h += '<div class="price"><span>' + (p.aPartir ? "<small>a partir de</small> " : "") + brl(p.preco) +
           (u.sufixo ? "<small>" + esc(u.sufixo) + "</small>" : "") + "</span>" +
           '<button class="btn alt sm" type="button" data-add="' + esc(p.id) + '" aria-label="Adicionar ' + esc(p.nome) + ' ao pedido">Adicionar</button></div>';
      h += "</article>\n";
    });
    return h + "</div>";
  }

  function pedidoInfo(d) {
    var c = d.config;
    var h = '<h2>Encomende com antecedência</h2>\n' +
      '<p class="sub" style="color:var(--ink)">Para festas e datas especiais, peça com pelo menos ' + esc(c.antecedencia) +
      " dias de antecedência para garantir seu dia e horário. Programamos o preparo para o seu doce chegar fresquinho na hora do evento.</p>\n" +
      '<p style="margin:0;font-weight:700">Entregamos em:</p>\n<ul class="areas">';
    (c.areas || []).forEach(function (a) { h += "<li>" + esc(a) + "</li>"; });
    return h + "</ul>\n" + '<p class="note" style="margin-top:14px">Horário de entrega: ' + esc(c.horaInicio) + " às " + esc(c.horaFim) + ".</p>";
  }

  function faq(d) {
    var h = "";
    (d.faq || []).forEach(function (f, i) {
      h += "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(tpl(f.p, d.config)) + "</summary><p>" + esc(tpl(f.r, d.config)) + "</p></details>\n";
    });
    return h;
  }

  function rodape(d) {
    var c = d.config, ig = String(c.instagram || "").replace(/^@/, "");
    var h = '<p class="brand">' + esc(c.nome) + "</p>\n<p>Sobremesas feitas com amor · " + esc(c.cidade) + " e região</p>\n<p>";
    if (ig) h += '<a href="https://www.instagram.com/' + esc(ig) + '/" target="_blank" rel="noopener">Instagram @' + esc(ig) + "</a>";
    if (fone(c)) h += (ig ? " · " : "") + '<a href="https://wa.me/' + esc(fone(c).slice(1)) + '" target="_blank" rel="noopener">WhatsApp</a>';
    return h + "</p>";
  }

  function ld(d, opt) {
    opt = opt || {};
    var c = d.config, url = c.siteUrl.replace(/\/?$/, "/"), ig = String(c.instagram || "").replace(/^@/, "");
    var img = opt.imgAbs || function (p) { return absUrl(url, p); };
    var negocio = {
      "@type": "Bakery", "@id": url + "#negocio", name: c.nome, description: c.seoDescricao, url: url,
      logo: absUrl(url, "img/logo.png"), image: [absUrl(url, "img/og-image.jpg"), absUrl(url, "img/logo.png")],
      priceRange: "$$", currenciesAccepted: "BRL", servesCuisine: ["Sobremesas", "Bolos", "Doces"],
      address: { "@type": "PostalAddress", addressLocality: c.cidade, addressRegion: c.uf, addressCountry: "BR" },
      areaServed: (c.areas || []).map(function (a) { return { "@type": "City", name: a }; }),
      hasMenu: { "@id": url + "#cardapio" }
    };
    if (fone(c)) negocio.telephone = fone(c);
    if (ig) negocio.sameAs = ["https://www.instagram.com/" + ig + "/"];
    if (c.dias && c.dias.length) {
      negocio.openingHoursSpecification = [{
        "@type": "OpeningHoursSpecification",
        dayOfWeek: c.dias.map(function (x) {
          return { Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday", Su: "Sunday" }[x];
        }).filter(Boolean).map(function (x) { return "https://schema.org/" + x; }),
        opens: c.horaInicio, closes: c.horaFim
      }];
    }
    var secoes = categorias(d).map(function (cat) {
      return {
        "@type": "MenuSection", name: cat,
        hasMenuItem: ativos(d).filter(function (p) { return (p.categoria || "Outros") === cat; }).map(function (p) {
          var u = UNIDADES[p.unidade] || UNIDADES.un;
          var item = {
            "@type": "MenuItem", name: p.nome, description: p.desc, url: url + "#p-" + p.id,
            offers: {
              "@type": "Offer", price: Number(p.preco || 0).toFixed(2), priceCurrency: "BRL",
              availability: "https://schema.org/PreOrder",
              priceSpecification: {
                "@type": "UnitPriceSpecification", price: Number(p.preco || 0).toFixed(2), priceCurrency: "BRL",
                unitText: u.singular
              }
            }
          };
          if (p.unidade === "kg") item.offers.priceSpecification.unitCode = "KGM";
          if (p.foto) item.image = img(p.foto);
          return item;
        })
      };
    });
    var graph = [
      negocio,
      { "@type": "Menu", "@id": url + "#cardapio", name: "Cardápio " + c.nome, inLanguage: "pt-BR", hasMenuSection: secoes },
      { "@type": "WebSite", "@id": url + "#site", url: url, name: c.nome, inLanguage: "pt-BR", publisher: { "@id": url + "#negocio" } },
      {
        "@type": "WebPage", "@id": url + "#pagina", url: url, name: c.seoTitulo, description: c.seoDescricao,
        isPartOf: { "@id": url + "#site" }, about: { "@id": url + "#negocio" }, inLanguage: "pt-BR",
        primaryImageOfPage: absUrl(url, "img/og-image.jpg")
      }
    ];
    if (d.faq && d.faq.length) {
      graph.push({
        "@type": "FAQPage", "@id": url + "#faq",
        mainEntity: d.faq.map(function (f) {
          return { "@type": "Question", name: tpl(f.p, c), acceptedAnswer: { "@type": "Answer", text: tpl(f.r, c) } };
        })
      });
    }
    return '<script type="application/ld+json">\n' + jsonScript({ "@context": "https://schema.org", "@graph": graph }) + "\n</script>";
  }

  function dados(d) {
    return '<script type="application/json" id="gs-dados">\n' + jsonScript(d) + "\n</script>";
  }

  function sitemap(d) {
    var url = d.config.siteUrl.replace(/\/?$/, "/"), hoje = new Date().toISOString().slice(0, 10);
    var imgs = ["img/og-image.jpg"].concat(ativos(d).filter(function (p) { return p.foto; }).map(function (p) { return p.foto; }));
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
      "  <url>\n    <loc>" + esc(url) + "</loc>\n    <lastmod>" + hoje + "</lastmod>\n" +
      imgs.map(function (i) { return "    <image:image><image:loc>" + esc(absUrl(url, i)) + "</image:loc></image:image>\n"; }).join("") +
      "  </url>\n</urlset>\n";
  }

  function robots(d) {
    var url = d.config.siteUrl.replace(/\/?$/, "/");
    return "User-agent: *\nAllow: /\nDisallow: /admin.html\n\nSitemap: " + url + "sitemap.xml\n";
  }

  var BLOCOS = { HEAD: head, CARDS: cards, PEDIDO: pedidoInfo, FAQ: faq, RODAPE: rodape, LD: ld, DADOS: dados };

  function apply(html, d, opt) {
    Object.keys(BLOCOS).forEach(function (k) {
      var re = new RegExp("(<!--GS:" + k + "-->)[\\s\\S]*?(<!--/GS:" + k + "-->)");
      if (!re.test(html)) throw new Error("Marcador GS:" + k + " não encontrado no index.html");
      var conteudo = BLOCOS[k](d, opt);
      html = html.replace(re, function (_, a, b) { return a + "\n" + conteudo + "\n" + b; });
    });
    return html;
  }

  function extrair(html) {
    var m = html.match(/<script type="application\/json" id="gs-dados">([\s\S]*?)<\/script>/);
    if (!m) throw new Error("Bloco de dados (gs-dados) não encontrado no index.html");
    return JSON.parse(m[1]);
  }

  var api = {
    UNIDADES: UNIDADES, DIAS: DIAS, esc: esc, brl: brl, slug: slug, precoTexto: precoTexto, tpl: tpl,
    apply: apply, extrair: extrair, sitemap: sitemap, robots: robots, blocos: BLOCOS
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.GSBuild = api;
})(this);
