const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Array para acumular todos os eventos
  let allEvents = [];
  
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

  // --- RUN 1: SUCESSO E CLIQUES ---
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  
  await page1.goto('https://www.fluxeer.com.br');
  await page1.waitForLoadState('networkidle');

  await page1.click('header a[href="#demonstracao"]');
  await page1.waitForTimeout(500);

  await page1.click('section#hero a[href="#demonstracao"]');
  await page1.waitForTimeout(500);

  await page1.click('section#solucao a[href="#demonstracao"]');
  await page1.waitForTimeout(500);

  await page1.fill('input[name="name"]', 'QA Test Success');
  await page1.fill('input[name="company"]', 'QA Corp');
  await page1.fill('input[name="email"]', 'qa@qacorp.com.br');
  await page1.fill('input[name="whatsapp"]', '11999999999');
  await page1.selectOption('select[name="monthlyVolume"]', 'Ate 50');

  await page1.click('button[type="submit"]');
  await page1.waitForSelector('text=Solicitação enviada com sucesso', { timeout: 10000 });
  
  const dataLayer1 = await page1.evaluate(() => window.dataLayer);
  allEvents.push(...dataLayer1.filter(item => eventosTarget.includes(item.event)));
  await context1.close();

  // --- RUN 2: ERRO ---
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  
  // Aborta requests de POST (Server Actions) para forçar o erro
  await page2.route('**/*', route => {
    if (route.request().method() === 'POST') {
      route.abort('failed');
    } else {
      route.continue();
    }
  });

  await page2.goto('https://www.fluxeer.com.br');
  await page2.waitForLoadState('networkidle');

  await page2.fill('input[name="name"]', 'QA Test Error');
  await page2.fill('input[name="company"]', 'QA Corp');
  await page2.fill('input[name="email"]', 'qa_error@qacorp.com.br');
  await page2.fill('input[name="whatsapp"]', '11999999999');
  await page2.selectOption('select[name="monthlyVolume"]', 'Ate 50');

  await page2.click('button[type="submit"]');
  await page2.waitForTimeout(2000); // Aguarda o erro ser processado pelo React
  
  const dataLayer2 = await page2.evaluate(() => window.dataLayer);
  allEvents.push(...dataLayer2.filter(item => item.event === 'lead_form_error'));
  await context2.close();

  // --- OUTPUT FINAL ---
  console.log(JSON.stringify(allEvents, null, 2));

  await browser.close();
})();
