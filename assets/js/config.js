/* ==========================================================================
   Toá Rooftop — Configuração central
   Altere os valores aqui. Links no HTML marcados com data-link="<chave>"
   são atualizados automaticamente a partir deste arquivo.
   ========================================================================== */
window.TOA_CONFIG = {
  /* WhatsApp comercial — confirmado pelo cliente (reservas e eventos).
     Só dígitos: código do país + DDD + número. */
  whatsapp: "5582991828956",

  links: {
    reserva: "https://www.getin.app/maceio/toa-rooftop?utm_source=site&utm_medium=botao-reserva",
    cardapio: "https://menu.getin.app/pt-br/jkv32ZP2/menus/oPMlnGkG",
    tour360: "https://tour.toarooftop.tudoem360.com.br/",
    instagram: "https://www.instagram.com/toarooftop/",
  },

  /* Mensagem padrão do botão de WhatsApp (sem formulário) */
  /* Endereço completo (confirmado: Google Maps do Edf. New Time) */
  address: {
    street: "Av. Dr. Antônio Gouveia, 23",
    building: "Edf. New Time",
    district: "Pajuçara",
    city: "Maceió",
    state: "AL",
    zip: "57030-170",
    lat: -9.6648,
    lng: -35.7118,
  },

  whatsappDefaultMessage: "Olá! Vim pelo site do Toá Rooftop e gostaria de mais informações.",

  /* Horários (briefing, seção 7). Índice = dia da semana: 0 domingo … 6 sábado.
     null = fechado. Usado no "Hoje" do hero e na seção Localização. */
  hours: [
    "12h às 18h",  // domingo
    null,          // segunda
    "17h às 00h",  // terça
    "17h às 00h",  // quarta
    "17h às 00h",  // quinta
    "12h às 01h",  // sexta
    "12h às 01h",  // sábado
  ],
  timezone: "America/Maceio",

  /* Vídeo do hero: preencher quando o corte leve chegar (ex.: "assets/video/hero.mp4").
     Vazio = só a foto. O vídeo não carrega no celular com economia de dados
     nem com "reduzir movimento" ativado. */
  heroVideo: "",

  /* Google Analytics 4 — trocar pelo ID real (G-XXXXXXXXXX).
     Enquanto estiver com o placeholder, o GA não é carregado. */
  ga4Id: "G-XXXXXXXXXX",
};
