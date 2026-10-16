/* Gelado Supremo — interações do site (carrinho e pedido pelo WhatsApp) */
(function () {
  "use strict";
  var B = window.GSBuild;
  var D = JSON.parse(document.getElementById("gs-dados").textContent);
  var C = D.config;
  var PROD = {};
  D.produtos.forEach(function (p) { if (p.ativo !== false) PROD[p.id] = p; });
  var $ = function (id) { return document.getElementById(id); };
  var WA = String(C.whatsapp || "").replace(/\D/g, "");

  /* ---------- carrinho ---------- */
  var KEY = "gs-carrinho";
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || "[]").filter(function (i) { return PROD[i.id]; }); } catch (e) { cart = []; }
  function salvar() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }

  function un(p) { return B.UNIDADES[p.unidade] || B.UNIDADES.un; }
  function minimo(p) { return Math.max(Number(p.minimo) || 0, p.unidade === "kg" ? 1 : 1); }
  function fmtQtd(p, q) {
    var u = un(p), n = String(q).replace(".", ",");
    return n + " " + (q === 1 ? u.singular : u.plural);
  }
  function find(id) { for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i]; return null; }

  function add(id) {
    var p = PROD[id]; if (!p) return;
    var it = find(id);
    if (it) it.q = +(it.q + un(p).passo).toFixed(2);
    else cart.push({ id: id, q: minimo(p) });
    salvar(); render();
    toast("Adicionado ao pedido: " + p.nome);
  }
  function mudar(id, dir) {
    var p = PROD[id], it = find(id); if (!p || !it) return;
    var nq = +(it.q + dir * un(p).passo).toFixed(2);
    if (nq < minimo(p)) { if (dir < 0) cart.splice(cart.indexOf(it), 1); }
    else it.q = Math.min(nq, 500);
    salvar(); render();
  }
  function total() {
    return cart.reduce(function (s, i) { return s + (Number(PROD[i.id].preco) || 0) * i.q; }, 0);
  }

  function render() {
    var ul = $("itens"), h = "";
    cart.forEach(function (i) {
      var p = PROD[i.id];
      h += '<li data-id="' + B.esc(p.id) + '"><span class="nm">' + B.esc(p.nome) + "<small>" + B.esc(B.precoTexto(p)) + "</small></span>" +
        '<span class="lt">' + B.brl(p.preco * i.q) + "</span>" +
        '<span class="qty"><button type="button" data-m="-1" aria-label="Diminuir ' + B.esc(p.nome) + '">−</button><output>' +
        B.esc(fmtQtd(p, i.q)) + '</output><button type="button" data-m="1" aria-label="Aumentar ' + B.esc(p.nome) + '">+</button></span>' +
        '<button type="button" class="rm" data-rm>Remover</button></li>';
    });
    ul.innerHTML = h;
    $("vazio").hidden = cart.length > 0;
    $("totalbox").hidden = !cart.length;
    $("total").textContent = B.brl(total());
    document.querySelectorAll("[data-add]").forEach(function (b) {
      var no = !!find(b.getAttribute("data-add"));
      b.classList.toggle("added", no);
      b.textContent = no ? "Adicionar +1" : "Adicionar";
    });
    var n = cart.length, fab = $("fab");
    fab.textContent = n ? "Ver pedido (" + n + ") · " + B.brl(total()) : "Fazer pedido";
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-add]");
    if (a) { add(a.getAttribute("data-add")); return; }
    var li = e.target.closest("#itens li");
    if (li) {
      var m = e.target.closest("[data-m]");
      if (m) mudar(li.getAttribute("data-id"), +m.getAttribute("data-m"));
      if (e.target.closest("[data-rm]")) {
        cart = cart.filter(function (i) { return i.id !== li.getAttribute("data-id"); });
        salvar(); render();
      }
    }
    var chip = e.target.closest(".chip");
    if (chip) {
      var cat = chip.getAttribute("data-cat");
      document.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("on", c === chip); });
      document.querySelectorAll("#grid .card").forEach(function (c) { c.hidden = !!cat && c.getAttribute("data-cat") !== cat; });
    }
  });

  var tt;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(tt); tt = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ---------- formulário ---------- */
  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  var min = new Date(hoje); min.setDate(min.getDate() + (Number(C.antecedenciaMin) || 0));
  var data = $("data"), hora = $("hora");
  data.min = iso(min);
  if (C.horaInicio) hora.min = C.horaInicio;
  if (C.horaFim) hora.max = C.horaFim;

  var MAP_DIAS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  var NOME_DIA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

  function modo() { var r = document.querySelector('input[name="modo"]:checked'); return r ? r.value : ""; }
  function syncModo() { $("endbox").hidden = modo() === "Retirada"; }
  document.querySelectorAll('input[name="modo"]').forEach(function (r) { r.addEventListener("change", syncModo); });
  syncModo();

  function erro(msg, el) {
    var e = $("erro"); e.textContent = msg; e.hidden = !msg;
    if (el) el.focus();
    return false;
  }

  $("f").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = function (i) { return $(i).value.trim(); };
    if (!cart.length) return erro("Adicione pelo menos um doce ao pedido.", null) || document.getElementById("cardapio").scrollIntoView();
    if (!v("nome")) return erro("Informe seu nome.", $("nome"));
    if (!v("local")) return erro("Informe o bairro ou a cidade.", $("local"));
    if (modo() !== "Retirada" && !v("end")) return erro("Informe o endereço de entrega.", $("end"));
    if (!v("data")) return erro("Escolha o dia da entrega.", data);
    if (v("data") < data.min) return erro("Escolha uma data a partir de " + data.min.split("-").reverse().join("/") + ".", data);
    var dt = new Date(v("data") + "T12:00:00");
    if (C.dias && C.dias.length && C.dias.indexOf(MAP_DIAS[dt.getDay()]) < 0)
      return erro("Não fazemos entregas neste dia da semana (" + NOME_DIA[dt.getDay()] + "). Escolha outro dia.", data);
    if (!v("hora")) return erro("Escolha a hora da entrega.", hora);
    if ((C.horaInicio && v("hora") < C.horaInicio) || (C.horaFim && v("hora") > C.horaFim))
      return erro("Entregamos entre " + C.horaInicio + " e " + C.horaFim + ".", hora);
    erro("");

    var linhas = cart.map(function (i) {
      var p = PROD[i.id];
      return "• " + fmtQtd(p, i.q) + " — " + p.nome + " (" + B.brl(p.preco * i.q) + ")";
    });
    var m = "Olá, " + C.nome + "! Quero fazer uma encomenda:\n\n" + linhas.join("\n") +
      "\nTotal estimado: " + B.brl(total()) +
      "\n\nNome: " + v("nome") +
      "\nRecebimento: " + modo() +
      "\nBairro/cidade: " + v("local") +
      (modo() !== "Retirada" ? "\nEndereço: " + v("end") : "") +
      "\nData: " + v("data").split("-").reverse().join("/") + " (" + NOME_DIA[dt.getDay()] + ")" +
      "\nHora: " + v("hora") +
      (v("obs") ? "\nObservações: " + v("obs") : "");
    if (typeof gtag === "function") gtag("event", "generate_lead", { currency: "BRL", value: total() });
    window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(m), "_blank", "noopener");
  });

  render();
})();
