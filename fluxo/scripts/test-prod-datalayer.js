const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navegando para https://www.fluxeer.com.br...");
  await page.goto('https://www.fluxeer.com.br');

  // Espera a página carregar
  await page.waitForLoadState('networkidle');

  console.log("Clicando no CTA do Header...");
  await page.click('header a[href="#demonstracao"]');
  await page.waitForTimeout(1000);

  console.log("Clicando no CTA do Hero...");
  // Encontra o CTA do hero
  await page.click('section#hero a[href="#demonstracao"]');
  await page.waitForTimeout(1000);

  console.log("Clicando no CTA da Solução (Rodapé/Corpo)...");
  await page.click('section#solucao a[href="#demonstracao"]');
  await page.waitForTimeout(1000);

  console.log("Iniciando preenchimento do formulário...");
  await page.fill('input[name="name"]', 'QA Test');
  await page.fill('input[name="company"]', 'QA Corp');
  await page.fill('input[name="email"]', 'qa@qacorp.com.br');
  await page.fill('input[name="whatsapp"]', '11999999999');
  await page.selectOption('select[name="monthlyVolume"]', 'Ate 50');

  console.log("Enviando formulário...");
  await page.click('button[type="submit"]');

  console.log("Aguardando mensagem de sucesso...");
  // Espera a mensagem de sucesso aparecer
  await page.waitForSelector('text=Solicitação enviada com sucesso', { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log("\n--- DUMP DO DATALAYER ---");
  const dataLayer = await page.evaluate(() => window.dataLayer);
  
  // Filtra eventos relevantes
  const eventosTarget = [
    'click_cta_header',
    'click_cta_hero',
    'click_cta_footer',
    'lead_form_start',
    'lead_form_submit',
    'lead_form_success',
    'lead_form_error',
    'set_user_data'
  ];

  const eventosFiltrados = dataLayer.filter(item => eventosTarget.includes(item.event));
  console.log(JSON.stringify(eventosFiltrados, null, 2));

  await browser.close();
})();
