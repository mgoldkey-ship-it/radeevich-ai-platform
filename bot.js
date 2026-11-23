// Vercel Serverless Function — Telegram Webhook Handler, Real Groq LLM & CRM for @radeevich_bot
// Enterprise Grade Architecture (24/7/365, 0 Rubles, Zero Downtime)

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || 'YOUR_ADMIN_CHAT_ID';
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY';

const WEBAPP_URL = 'https://radeevich-tma.vercel.app';

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const CRM_STORE_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1f251b16a4b87';

const SYSTEM_PROMPT = `Ты — официальный AI-ассистент разработчика Юрия Радеевича (@radeevich).
Позиционирование: Интегратор AI-решений & Fullstack Архитектор (AI Solutions & Fullstack Architect).
Стек: чистый код (Python/FastAPI, React, PostgreSQL). 0 ₽ абонентки (без сторонних конструкторов вроде SaleBot или BotHelp).
Образование и бэкграунд: Высшее инженерно-техническое образование, глубокая профильная база в системной разработке (Python, React, базы данных) и архитектуре нейросетей (LLM, RAG). Практический опыт подтверждён 8+ работающими продуктами в продакшене.
Инфраструктура: Разворачиваю на любых площадках под задачу клиента — как на российских (Timeweb, Selectel, Yandex Cloud с соблюдением 152-ФЗ), так и на зарубежных серверах или на собственном VPS заказчика. Упоминай серверы и 152-ФЗ ТОЛЬКО если клиент прямо спросил об этом! В обычных ответах не грузи этим.
Сроки: 24–72 часа на запуск рабочих прототипов.
Гарантии: Тестовый стенд ДО оплаты. 14 дней гарантийной поддержки (SLA).
Цены: квизы от 19 900 ₽, чат-боты от 29 900 ₽, AI-радары от 39 900 ₽, AI-консультанты от 44 900 ₽, Mini Apps от 59 900 ₽, B2B MVP от 89 000 ₽. Экспресс-аудит & ТЗ: 9 900 ₽.
Юр. чистота: Официальный договор с юрлицами и ИП, безналичный расчёт, закрывающие акты.

Собственные живые продукты:
• Telegram Mini App: @radeevich_bot/app (шоурум кейсов и калькулятор сметы).
• Сайт-визитка / Веб-шоурум: https://radeevich.ru (быстрый адаптивный сайт без Tilda с 100/100 Lighthouse).
• AI-ассистент продаж: @radeevich_bot 24/7.

8 боевых кейсов в продакшене:
1. FRESH BALANCE — Telegram Mini App доставки здорового питания (меню, КБЖУ, СБП в 1 клик).
2. HEDO Gastrobar — Mini App меню ресторана, бронь стола на схеме зала и предзаказ.
3. xswapp2p.com — Некастодиальный P2P/кросс-чейн обмен криптоактивов ($320 000+/мес, AML-check).
4. admin24-7.com — B2B AI-диспетчер и тикет-система техподдержки (-70% нагрузки, ответ 0.1с).
5. ZAUM Hub — Telegram-портал закрытого клуба резидентов и подписка.
6. lekcia.com — EdTech LMS платформа для онлайн-школ и AI-тестирование.
7. lotbase.net — Мониторинг банкротных торгов и Telegram-алерты дисконта.
8. job888.app — HR-агрегатор вакансий и быстрый отклик соискателей в Telegram.

ОТРАБОТКА ВОЗРАЖЕНИЙ:
• 'У нас уже есть бот с кнопками': Бот с кнопками — текстовый прайс-лист. Mini App — полноценный магазин с корзиной и оплатой в 2 клика. Конверсия выше в 2–3 раза.
• 'Почему не конструктор (SaleBot, BotHelp, Tilda)?': Конструкторы берут постоянную абонентку от 2–8 тыс. ₽/мес и имеют потолок. На чистом стеке (FastAPI + React) клиент получает независимый продукт с 0 ₽ абонентки навсегда.
• 'Брошенные корзины': Возврат 15–20% ушедших клиентов автоматическими напоминаниями в боте.

ГЛАВНЫЕ ПРАВИЛА ТОНА И СТИЛЯ:
1. СТРОГИЙ ЗАПРЕТ на слова 'мы', 'наш', 'нами'! Юрий работает ЛИЧНО. Пиши от 1-го лица ('Разрабатываю...', 'Передаю...') или в безличной форме ('Проект разворачивается...', 'В решение входит...').
2. НИКАКОЙ ДУШНОТЫ! Ответ должен быть коротким, лёгким и понятным (3–4 предложения, до 50–70 слов). Никаких простыней текста, лишних терминов и навязчивых законов.
3. Говори на простом языке бизнес-выгоды: заявки, клиенты, надёжность, 0 ₽ абонентки, тестовый стенд до оплаты.
4. Финал: одна короткая строка: 'Рассчитать смету можно в Mini App или в ЛС @radeevich'.
`;

// Локальный кэш CRM в памяти Node.js
const memoryCache = new Map();
let isLoadedFromCloud = false;

function formatDuration(ms) {
  const mins = Math.floor(ms / (1000 * 60));
  if (mins < 60) return `${mins} мин`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return `${hours} ч ${remMins} мин`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days} дн ${remHours} ч`;
}

async function loadCrmData() {
  if (isLoadedFromCloud && memoryCache.size > 0) return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(CRM_STORE_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const users = data?.data?.users || {};
      for (const [id, val] of Object.entries(users)) {
        memoryCache.set(String(id), val);
      }
      isLoadedFromCloud = true;
    }
  } catch (err) {}
}

function saveCrmDataAsync() {
  try {
    const obj = {};
    for (const [id, val] of memoryCache.entries()) {
      obj[id] = val;
    }
    fetch(CRM_STORE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'radeevich_crm', data: { users: obj } }),
    }).catch(() => {});
  } catch (e) {}
}

async function trackUser(user, actionText) {
  await loadCrmData();
  const uid = String(user.id);
  const now = Date.now();
  const uName = user.username ? `@${user.username}` : 'без юзернейма';
  const fName = user.first_name || 'Клиент';

  let statusType = 'NEW';
  let badgeTitle = '🟢 <b>НОВЫЙ ЛИД В БОТЕ (Первый визит!)</b>';
  let statsInfo = '🌟 <b>Статус:</b> Первый контакт в истории бота';

  if (memoryCache.has(uid)) {
    const record = memoryCache.get(uid);
    const diff = now - (record.last_seen || now);
    const count = (record.count || 1) + 1;

    if (diff > 45 * 60 * 1000) {
      statusType = 'RETURN';
      badgeTitle = '🔄 <b>ВЕРНУВШИЙСЯ ЛИД! (Снова в боте)</b>';
      statsInfo = `⏰ <b>Не был в боте:</b> ${formatDuration(diff)}\n📊 <b>Всего визитов/сообщений:</b> ${count}`;
    } else {
      statusType = 'DIALOG';
      badgeTitle = `💬 <b>ДИАЛОГ С ЛИДОМ (Сообщение #${count})</b>`;
      statsInfo = `⏱️ <b>В диалоге:</b> ${formatDuration(diff)} назад\n📊 <b>Сообщение:</b> #${count}`;
    }

    record.count = count;
    record.last_seen = now;
    record.last_action = actionText;
    record.username = uName;
    record.first_name = fName;
    memoryCache.set(uid, record);
  } else {
    memoryCache.set(uid, {
      first_seen: now,
      last_seen: now,
      count: 1,
      last_action: actionText,
      username: uName,
      first_name: fName,
    });
  }

  saveCrmDataAsync();
  return { statusType, badgeTitle, statsInfo };
}

async function callTg(method, payload) {
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error(`TG API error (${method}):`, err);
    return null;
  }
}

// Защищенная отправка сообщений (с автоматическим фоллбэком при ошибках разметки)
async function sendSafeMessage(chatId, text, replyMarkup) {
  const res = await callTg('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });

  if (!res || !res.ok) {
    const cleanText = text.replace(/<[^>]*>/g, '');
    await callTg('sendMessage', {
      chat_id: chatId,
      text: cleanText,
      reply_markup: replyMarkup,
    });
  }
  return res;
}

async function sendAlertToYuri(user, actionText) {
  if (!ADMIN_CHAT_ID) return;
  const uid = user.id;
  const isYuri = String(uid) === String(ADMIN_CHAT_ID);

  if (isYuri) {
    const msg = `🧪 <b>Ваш собственный тест:</b>\n\n` +
      `⚡ <b>Действие:</b> ${actionText}\n` +
      `🕒 <i>(Уведомление видно только вам)</i>`;
    await callTg('sendMessage', {
      chat_id: ADMIN_CHAT_ID,
      text: msg,
      parse_mode: 'HTML',
    });
    return;
  }

  const { badgeTitle, statsInfo } = await trackUser(user, actionText);
  const uName = user.username ? `@${user.username}` : 'без юзернейма';
  const fName = user.first_name || 'Клиент';

  const msg = `${badgeTitle}\n\n` +
    `👤 <b>Клиент:</b> ${fName} (${uName})\n` +
    `🆔 <b>ID:</b> <code>${uid}</code>\n` +
    `${statsInfo}\n` +
    `⚡ <b>Действие:</b> ${actionText}\n\n` +
    `👉 <a href="tg://user?id=${uid}">Открыть диалог с клиентом</a> | ${uName}`;

  await callTg('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text: msg,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
}

// ВЫЗОВ ЖИВОЙ НЕЙРОСЕТИ GROQ (LLM 120B параметров!)
async function callGroqLLM(userQuery, history = []) {
  if (!GROQ_API_KEY) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    if (Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-4);
      for (const msg of recent) {
        if (msg && msg.role && msg.content) {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: String(msg.content).slice(0, 500),
          });
        }
      }
    }

    messages.push({ role: 'user', content: String(userQuery).slice(0, 1000) });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: messages,
        max_tokens: 350,
        temperature: 0.25,
      }),
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      let content = data?.choices?.[0]?.message?.content;
      if (content && content.trim()) {
        content = content.trim();
        // Санитайзер форматирования и принудительное вычищение "мы"
        content = content
          .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
          .replace(/\b[Мм]ы передаём\b/g, 'Передаю')
          .replace(/\b[Мм]ы разворачиваем\b/g, 'Разворачиваю')
          .replace(/\b[Мм]ы соблюдаем\b/g, 'Соблюдаю')
          .replace(/\b[Мм]ы делаем\b/g, 'Делаю')
          .replace(/\b[Мм]ы разрабатываем\b/g, 'Разрабатываю')
          .replace(/\b[Мм]ы подключаем\b/g, 'Подключаю')
          .replace(/\b[Мм]ы\b/g, 'я')
          .replace(/\b[Нн]аш\b/g, 'мой')
          .replace(/\b[Нн]аши\b/g, 'мои')
          .replace(/\b[Нн]ашего\b/g, 'моего')
          .replace(/\b[Нн]ашем\b/g, 'моём')
          .replace(/\b[Нн]аших\b/g, 'моих');
        return content;
      }
    }
  } catch (err) {
    console.error('Groq LLM call error:', err);
  }
  return null;
}

// AI CMO ДВИЖОК ДЛЯ ЮРИЯ РАДЕЕВИЧА (@radeevich)
const CMO_PROMPT = `Ты — личный AI Chief Marketing Officer (CMO) и Senior Presale Architect разработчика Юрия Радеевича (@radeevich).
Позиционирование Юрия:
• Интегратор AI-решений & Fullstack Архитектор (FastAPI, React, PostgreSQL).
• Главное УТП: 0 ₽ ежемесячной абонентки за платформы (никаких Tilda, Chatium, SaleBot, GetCourse).
• Снятие рисков: черновой рабочий прототип на тестовом стенде за 24–48 часов ДО любой предоплаты.
• Срок под ключ: 2–3 дня. Гарантия SLA 14 дней.
• Портфолио: https://radeevich.ru (8 боевых кейсов).

УСЛУГИ И ПРАЙС:
1. Архитектурный экспресс-аудит & ТЗ за 24ч — 9 900 ₽
2. Интерактивные квизы и лид-магниты — от 19 900 ₽ (24–48ч)
3. Чат-боты и автоворонки продаж с CRM/СБП — от 29 900 ₽ (2–3 дня)
4. Автономный AI-Радар лидов в Telegram — от 39 900 ₽ (2–3 дня)
5. Умный AI-Консультант 24/7 (RAG без галлюцинаций) — от 44 900 ₽ (48–72ч)
6. Telegram Mini Apps (магазины / каталоги под ключ) — от 59 900 ₽ (3–4 дня)
7. B2B Порталы, личные кабинеты & MVP стартапов — от 89 000 ₽ (3–5 дней)

ПРАВИЛА:
• Пиши СТРОГО от 1-го лица ('я', 'разверну', 'соберу'). Никаких 'мы'!
• Без звездочек (**), чистый аккуратный текст со списками и отступами.`;

async function generateCMO(type, query) {
  let userInstruction = '';
  if (type === 'kp') {
    userInstruction = `Сформируй мощное, структурированное коммерческое предложение (КП) для клиента по задаче: "${query}".
Структура:
1. Заголовок решения
2. Диагноз задачи и 3 пункта инженерного решения (как именно будет сделано)
3. Снятие рисков (прототип на тестовом стенде за 24-48ч ДО оплаты)
4. Сроки и бюджет (2-3 дня под ключ, 14 дней SLA)
5. 0 ₽ абонентки (почему не будет платить конструкторам)
6. Ссылка на кейсы (https://radeevich.ru) и следующий шаг.`;
  } else if (type === 'post') {
    userInstruction = `Напиши виральный экспертный пост для TenChat и Telegram по теме: "${query || 'Почему пора уходить с конструкторов на чистый код и Telegram Mini Apps'}".
Структура:
1. Заголовок-крючок с сильной проблемой или цифрой.
2. Реальная история/кейс (было -> стало: платили 30 000 ₽/мес за конструктор, сделали на чистом коде FastAPI за 29 900 ₽ разово, сэкономили 300 000 ₽ за год).
3. 3 понятных практических вывода для предпринимателя.
4. Финальный блок контактов (СТРОГО В ЭТОМ ВИДЕ, БЕЗ ИСКАЖЕНИЙ):
👉 Рассчитать смету проекта в боте: @radeevich_bot
👉 Моя витрина с 8 кейсами: https://radeevich.ru
👉 Обсудить задачу лично: @radeevich`;
  } else if (type === 'pitch') {
    userInstruction = `Напиши статусное партнерское предложение агентству: "${query || 'Telegram Ads и трафик'}".
Оффер: субподряд на чистом коде за 2-4 дня, 0 ₽ абонентки клиентам, 15-20% комиссии агентству, тестовый стенд до оплаты.
Контакты: витрина https://radeevich.ru , связь @radeevich`;
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: CMO_PROMPT },
          { role: 'user', content: userInstruction }
        ],
        temperature: 0.35,
        max_tokens: 750,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      let text = data?.choices?.[0]?.message?.content?.trim() || '';
      return text
        .replace(/[*_`]/g, '')
        .replace(/@radeevichbot\b/gi, '@radeevich_bot')
        .replace(/@radeevich_bot_bot\b/gi, '@radeevich_bot');
    }
  } catch (e) {
    console.error('CMO error:', e);
  }
  return 'Не удалось сгенерировать ответ. Попробуйте еще раз.';
}

// Резервный локальный RAG-движок (работает мгновенно при сбое внешних сетей)
function getFallbackRagAnswer(text) {
  const q = text.toLowerCase().trim();

  if (
    q.includes('кто такой') || q.includes('кто ты') || q.includes('а ты кто') ||
    q.includes('о разработчике') || q.includes('о юрии') || q.includes('биографи') ||
    q.includes('учил') || q.includes('образован') || q.includes('опыт') ||
    q.includes('бэкграунд') || q.includes('резюме')
  ) {
    return (
      '👨‍💻 <b>О Юрии Радеевиче (@radeevich):</b>\n\n' +
      '• <b>Позиционирование:</b> Интегратор AI-решений & Fullstack Архитектор (AI Solutions & Fullstack Architect).\n' +
      '• <b>Инженерная база:</b> Высшее профильное техническое образование, глубокий опыт проектирования отказоустойчивых систем и интеграции нейросетевых архитектур.\n' +
      '• <b>Трек-рекорд:</b> 8+ боевых продуктов в продакшене (B2B SaaS, маркетплейсы, Mini Apps, AI-ассистенты).\n' +
      '• <b>Принцип работы:</b> Разработка на чистом коде (FastAPI + React) лично, без джунов и без абонентской платы сторонним конструкторам. Запуск за 24–72 часа с гарантией 14 дней (SLA).\n\n' +
      'Подробное резюме, живые кейсы и калькулятор сметы доступны на сайте https://radeevich.ru или в Mini App @radeevich_bot/app!'
    );
  }

  if (
    q === 'круто' || q === 'отлично' || q === 'супер' || q === 'спасибо' ||
    q === 'понял' || q === 'ясно' || q === 'класс' || q === 'огонь' ||
    q.startsWith('спасибо') || q.startsWith('благодар') || q === 'ок' || q === 'ok' || q === 'хорошо'
  ) {
    return (
      '🤝 <b>Всегда рад помочь!</b>\n\n' +
      'Если у вас есть идея проекта, ссылка на бота конкурента или набросок ТЗ — напишите прямо сюда или в личные сообщения: @radeevich.\n\n' +
      'Юрий сделает бесплатную экспресс-оценку архитектуры и покажет тестовый стенд за 24–48 часов!'
    );
  }

  if (
    q === 'привет' || q === 'здравствуйте' || q === 'добрый день' ||
    q === 'добрый вечер' || q === 'доброе утро' || q === 'хай' || q === 'салам'
  ) {
    return (
      '👋 <b>Здравствуйте! Рад приветствовать.</b>\n\n' +
      'Чем могу помочь по вашему проекту?\n' +
      '• Рассчитать смету и сроки запуска (от 24 до 72 часов)\n' +
      '• Подобрать AI-стек или архитектуру бота/Mini App\n' +
      '• Показать боевые кейсы в проде\n\n' +
      'Опишите вашу задачу в чате или откройте интерактивный калькулятор внизу 👇'
    );
  }

  if (q.includes('радар') || q.includes('лидогенерац') || q.includes('поиск клиентов') ||
    q.includes('лиды') || q.includes('leadhook') || q.includes('leadl') ||
    q.includes('перехват') || q.includes('клиенты из чатов')
  ) {
    return (
      '📡 <b>Автономный AI-Радар клиентов в Telegram под ключ:</b>\n\n' +
      'Круглосуточный перехват горячих заявок из открытых чатов и каналов по смыслу запроса (Intent AI).\n\n' +
      '<b>Как это работает:</b>\n' +
      '• Нейросеть 24/7 анализирует поток сообщений и отсекает 100% спама, резюме и конкурентов.\n' +
      '• Горячая заявка с контактом заказчика мгновенно прилетает в закрытый чат вашей команды.\n' +
      '• Встроенный AI за 2 секунды генерирует черновик идеального первого отклика под запрос клиента.\n' +
      '• <b>0 ₽ абонентской платы навсегда:</b> в отличие от сервисов вроде Leadl.ai или LeadHook (где платят от 8 000 до 15 000 ₽ каждый месяц), вы платите один раз за разработку и экономите от 100 000 ₽ в год.\n\n' +
      '💰 <b>Стоимость под ключ:</b> от 24 900 ₽\n' +
      '⏱️ <b>Срок запуска:</b> 2–3 дня с тестовым стендом ДО оплаты.\n\n' +
      'Напишите вашу нишу в Telegram: @radeevich — покажу примеры перехвата в вашей сфере!'
    );
  }

  if (
    q.includes('квиз') || q.includes('опросник') || q.includes('анкет') ||
    q.includes('тест') || q.includes('лид-форм') || q.includes('quiz')
  ) {
    return (
      '🎯 <b>Разработка интерактивных квизов и опросников:</b>\n\n' +
      'Квиз в Telegram Mini App или на сайте даёт конверсию в заявку до 2.5–3 раз выше обычного лендинга!\n\n' +
      '<b>Что входит в разработку:</b>\n' +
      '• Пошаговое ветвление логики вопросов под ответы пользователя.\n' +
      '• Моментальный расчёт сметы / скидки в реальном времени.\n' +
      '• Автозахват контактов и отправка лида в CRM или в ваш личный Telegram.\n' +
      '• 0 ₽ абонентки (без ежемесячной платы Marquiz и конструкторам).\n\n' +
      '💰 <b>Стоимость:</b> от 19 900 ₽\n' +
      '⏱️ <b>Срок запуска:</b> 24–48 часов с тестовым стендом ДО оплаты.\n\n' +
      'Напишите задачу в Telegram — согласуем структуру вопросов и запустим прототип!'
    );
  }

  if (
    q.includes('сайт') || q.includes('визитк') || q.includes('лендинг') ||
    q.includes('веб') || q.includes('шоурум') || q.includes('на компе') || q.includes('в браузере')
  ) {
    return (
      '🌐 <b>Разработка веб-сайтов и лендингов на чистом коде:</b>\n\n' +
      'Разрабатываю адаптивные сайты, веб-визитки и сервисы без медленных конструкторов вроде Tilda или WordPress.\n\n' +
      '• <b>0 ₽ абонентки:</b> код принадлежит вам навсегда, никаких ежемесячных подписок.\n' +
      '• <b>Скорость:</b> моментальная загрузка (< 0.3 сек) и 100/100 по Google Lighthouse.\n' +
      '• <b>Пример вживую:</b> оцените мой собственный сайт-визитку: https://radeevich.ru\n\n' +
      'Рассчитать смету можно в Mini App или в ЛС @radeevich'
    );
  }

  if (
    q.includes('автоматизац') || q.includes('api') || q.includes('аналитик') ||
    q.includes('парсер') || q.includes('claude code') || q.includes('скрипт') ||
    q.includes('интеграц') || q.includes('crm')
  ) {
    return (
      '⚡ <b>Автоматизация процессов, API и аналитика:</b>\n\n' +
      'Юрий профессионально настраивает инженерные связки любой сложности:\n\n' +
      '• <b>Интеграция с API & CRM:</b> amoCRM, Битрикс24, МойСклад, Google Sheets, платёжные шлюзы (ЮKassa, СБП, CloudPayments).\n' +
      '• <b>Vibe Coding & Claude Code:</b> Написание надежных Python-скриптов, фоновых воркеров (Celery/Redis) и парсеров данных с автопроверкой через pytest.\n' +
      '• <b>Сквозная аналитика & Дашборды:</b> Сбор бизнес-метрик (ROMI, CPA, LTV), генерация отчётов и отправка сводок в закрытый Telegram-канал.\n\n' +
      '⏱️ <b>Срок:</b> от 24 до 48 часов.\n' +
      'Готовы обсудить архитектуру связки? Напишите задачу в Telegram!'
    );
  }

  if (
    q.includes('цена') || q.includes('стоим') || q.includes('скольк') ||
    q.includes('прайс') || q.includes('тариф') || q.includes('бюджет') ||
    q.includes('брониров') || q.includes('бот')
  ) {
    return (
      '💰 <b>Ориентир по сметам и форматам работы:</b>\n\n' +
      '• <b>Интерактивные квизы & калькуляторы:</b> от 19 900 ₽ (24–48 ч)\n' +
      '• <b>Чат-боты с интеграциями (CRM, СБП):</b> от 29 900 ₽ (2–3 дня)\n' +
      '• <b>Автономный AI-Радар лидов:</b> от 39 900 ₽ (2–3 дня)\n' +
      '• <b>AI-Консультант 24/7 (RAG):</b> от 44 900 ₽ (48–72 ч)\n' +
      '• <b>Telegram Mini Apps (магазины под ключ):</b> от 59 900 ₽ (3–4 дня)\n' +
      '• <b>B2B Кабинеты & MVP на чистом коде:</b> от 89 000 ₽ (3–5 дней)\n\n' +
      '⚡ <b>Главное преимущество:</b> 0 ₽ абонентки (чистый код на FastAPI + React). Тестовый стенд ДО оплаты.\n\n' +
      'Вы можете рассчитать предварительную смету за 60 секунд в калькуляторе или обсудить задачу напрямую в Telegram!'
    );
  }

  return (
    'Спасибо за ваш вопрос! Я зафиксировал вашу задачу.\n\n' +
    'Юрий Радеевич разрабатывает высоконагруженные Mini Apps, AI-ботов и MVP для бизнеса на чистом коде за 24–72 часа без абонентки.\n\n' +
    'Вы можете протестировать живые примеры в Mini App ниже или сразу переслать детали задачи в Telegram: @radeevich.'
  );
}

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      bot: '@radeevich_bot',
      owner: '@radeevich',
      engine: 'Groq LLM 120B (Active) + CRM',
      crm_users: memoryCache.size,
      uptime: '24/7/365 Vercel Serverless Webhook',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Direct AI Chat Widget from website or Telegram Mini App
  if (req.body && req.body.action === 'ai_chat') {
    try {
      const userMessage = (req.body.message || '').trim();
      const source = req.body.source || 'website';
      const history = Array.isArray(req.body.history) ? req.body.history : [];

      if (!userMessage) {
        return res.status(400).json({ ok: false, error: 'Empty message' });
      }

      // Security extraction filter
      const isSecretExtraction = 
        /(?:(покажи|дай|выведи|скинь|напиши|раскрой|скажи)\s+.*?(промпт|инструкци|api[_\s]?key|токен|секрет|парол|конфиг))/i.test(userMessage) ||
        /(?:system\s*prompt|jailbreak|ignore\s+all\s+instructions|забудь\s+все\s+инструкции)|\b(api_key|groq_key|bot_token|vcp_)\b/i.test(userMessage);

      let reply = '';
      if (isSecretExtraction) {
        reply = '🛡️ Конфиденциальные системные данные и серверные ключи изолированы в защищенном контуре и не подлежат раскрытию.\n\nПо всем проектным вопросам пишите напрямую Юрию: @radeevich.';
      } else {
        reply = await callGroqLLM(userMessage, history);
        if (!reply) {
          reply = getFallbackRagAnswer(userMessage);
        }
      }

      // Non-blocking Telegram alert to Yuri
      if (ADMIN_CHAT_ID) {
        const platformLabel = source === 'tma' ? '📱 Telegram Mini App' : '🌐 Сайт radeevich.ru';
        const cleanReply = (reply || '').replace(/<[^>]*>/g, '').slice(0, 300);
        const alertMsg = `💬 <b>Вопрос в AI-виджет (${platformLabel}):</b>\n\n` +
          `❓ <b>Клиент:</b> ${userMessage.slice(0, 400)}\n\n` +
          `🤖 <b>AI:</b> ${cleanReply}...\n\n` +
          `🕒 <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</i>`;

        callTg('sendMessage', {
          chat_id: ADMIN_CHAT_ID,
          text: alertMsg,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }).catch(err => console.error('TG widget alert error:', err));
      }

      return res.status(200).json({ ok: true, reply });
    } catch (err) {
      console.error('ai_chat handler error:', err);
      return res.status(500).json({ ok: false, error: 'Internal AI error' });
    }
  }

  // 2. Support direct web leads from radeevich.ru landing page
  if (req.body && req.body.action === 'web_lead') {
    try {
      const { name, contact, task, budget } = req.body;
      const alertMsg = `🚀 <b>Новая заявка с сайта radeevich.ru!</b>\n\n` +
        `👤 <b>Имя:</b> ${name || 'Не указано'}\n` +
        `📞 <b>Контакт:</b> ${contact || 'Не указан'}\n` +
        `💼 <b>Задача:</b> ${task || 'Не указана'}\n` +
        `💰 <b>Смета:</b> ${budget || 'Уточняется'}\n\n` +
        `🕒 <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</i>`;

      if (ADMIN_CHAT_ID) {
        await callTg('sendMessage', {
          chat_id: ADMIN_CHAT_ID,
          text: alertMsg,
          parse_mode: 'HTML',
        });
      }
      return res.status(200).json({ ok: true, message: 'Lead received' });
    } catch (e) {
      console.error('Web lead error:', e);
      return res.status(500).json({ error: 'Failed to process lead' });
    }
  }

  const update = req.body;
  if (!update) {
    return res.status(200).json({ ok: true });
  }

  try {
    // 1. Callback Query (нажатия на inline-кнопки)
    if (update.callback_query) {
      const cb = update.callback_query;
      const cbData = cb.data;
      const chatId = cb.message.chat.id;
      const user = cb.from || {};

      await callTg('answerCallbackQuery', { callback_query_id: cb.id });

      if (cbData === 'get_pdf') {
        const text = '💼 <b>Портфолио и живые кейсы — Юрий Радеевич (@radeevich):</b>\n\n' +
          'Вместо статичного PDF вы можете открыть интерактивное портфолио с живыми демо-стендами, расчётом сметы и описанием архитектуры:\n\n' +
          '• <b>Официальный сайт-витрина:</b> https://radeevich.ru\n' +
          '• <b>Telegram Mini App:</b> t.me/radeevich_bot/app\n' +
          '• <b>Прямая связь лично:</b> @radeevich';
        const kb = {
          inline_keyboard: [
            [
              { text: '🌐 Открыть портфолио (radeevich.ru) ↗', url: 'https://radeevich.ru' },
              { text: '📱 Открыть Mini App ↗', url: 'https://t.me/radeevich_bot/app' }
            ],
            [{ text: '💬 Написать Юрию лично (@radeevich) ↗', url: 'https://t.me/radeevich' }]
          ]
        };
        await sendSafeMessage(chatId, text, kb);
        await sendAlertToYuri(user, 'Запросил портфолио (кнопка)');
      } else if (cbData === 'get_cases') {
        const text = '💼 <b>8 боевых кейсов в продакшене:</b>\n\n' +
          '1. <b>xswapp2p.com</b> — Некастодиальный P2P & кросс-чейн обмен криптоактивов (USDT, TON, BTC) с AML-проверкой.\n' +
          '2. <b>FRESH BALANCE</b> — Telegram Mini App доставки питания: меню, фильтрация по КБЖУ, живая корзина и СБП в 1 клик.\n' +
          '3. <b>HEDO Gastrobar</b> — Telegram Mini App: цифровое меню ресторана, выбор стола на схеме зала и предзаказ блюд.\n' +
          '4. <b>admin24-7.com</b> — Круглосуточный AI-диспетчер и служба клиентской поддержки с тикет-системой (SaaS).\n' +
          '5. <b>ZAUM Hub</b> — Telegram-портал закрытого сообщества: личный кабинет резидента, каталог базы знаний и подписка.\n' +
          '6. <b>lekcia.com</b> — EdTech LMS-экосистема для онлайн-школ: пошаговые модули и AI-тестирование студентов.\n' +
          '7. <b>lotbase.net</b> — Мониторинг банкротных торгов и аукционов: семантический фильтр дисконта и Telegram-алерты.\n' +
          '8. <b>job888.app</b> — HR-Tech сервис: автоматизация первичного отбора соискателей в Telegram со скорингом.\n\n' +
          'Все кейсы с живыми скриншотами, архитектурой и демо-стендами открываются в Mini App 👇';

        await sendSafeMessage(chatId, text, {
          inline_keyboard: [
            [{ text: '📱 Открыть все кейсы в Mini App', web_app: { url: `${WEBAPP_URL}?tab=cases` } }],
            [{ text: '💬 Обсудить задачу в Telegram ↗', url: 'https://t.me/radeevich' }],
          ],
        });
        await sendAlertToYuri(user, 'Изучает список 8 кейсов');
      } else if (cbData === 'get_packages') {
        const pkgsText = '📦 <b>ГОТОВЫЕ ПАКЕТНЫЕ РЕШЕНИЯ [ФИКС-ЦЕНА & СРОКИ]:</b>\n\n' +
          '1️⃣ <b>Telegram Mini App (TMA под ключ)</b> — от 59 900 ₽\n' +
          '• Полноценный магазин/сервис внутри Telegram на чистом React\n' +
          '• Корзина товаров, онлайн-оплата СБП / картой, автовыгрузка в CRM\n' +
          '• <b>0 ₽ комиссий платформам</b> навсегда\n' +
          '• Срок: 3–4 дня · SLA 14 дней\n\n' +
          '2️⃣ <b>Умный AI-Консультант 24/7 (RAG)</b> — от 44 900 ₽\n' +
          '• Ассистент с памятью и базой знаний вашей компании\n' +
          '• Без галлюцинаций, квалифицирует клиентов и ведет запись\n' +
          '• Срок: 48–72 часа · Тест на ваших данных до оплаты\n\n' +
          '3️⃣ <b>Автономный AI-Радар лидов</b> — от 39 900 ₽\n' +
          '• Семантический перехват горячих клиентов в чатах Telegram\n' +
          '• Срок: 2–3 дня\n\n' +
          '4️⃣ <b>B2B Кабинеты & MVP стартапа</b> — от 89 000 ₽\n' +
          '• Высоконагруженный веб-сервис на чистом коде (FastAPI + React)\n' +
          '• PostgreSQL, авторизация, дашборды, права доступа\n' +
          '• 100% владение исходным кодом\n\n' +
          '5️⃣ <b>Интерактивный Квиз / Лид-магнит</b> — от 19 900 ₽\n' +
          '• Входная воронка с прогревом и расчётом сметы\n\n' +
          '🛡️ <b>Экспресс-аудит & ТЗ за 24 часа — 9 900 ₽</b>\n' +
          '<i>(100% суммы аудита засчитывается в разработку проекта!)</i>';

        await sendSafeMessage(chatId, pkgsText, {
          inline_keyboard: [
            [{ text: '📱 Открыть витрину и калькулятор', web_app: { url: `${WEBAPP_URL}?tab=solutions` } }],
            [{ text: '💬 Обсудить задачу лично с Юрием ↗', url: 'https://t.me/radeevich' }],
          ],
        });
        await sendAlertToYuri(user, 'Изучает пакетные решения и тарифы');
      } else if (cbData === 'quiz_start') {
        const text = '🧮 <b>Экспресс-расчёт сметы за 30 секунд:</b>\n\n' +
          '<b>Шаг 1 из 2.</b> Что нужно разработать под вашу задачу?\n\n' +
          '<i>Выберите подходящий вариант кнопкой ниже или напишите свою задачу своими словами прямо в чат 👇</i>';
        await sendSafeMessage(chatId, text, {
          inline_keyboard: [
            [{ text: '🛒 Telegram Mini App (магазин / каталог)', callback_data: 'qz_t_tma' }],
            [{ text: '🤖 Умный AI-Оператор 24/7 (RAG)', callback_data: 'qz_t_ai' }],
            [{ text: '🎯 Автономный AI-Радар лидов', callback_data: 'qz_t_radar' }],
            [{ text: '⚡ Экспресс-MVP на чистом коде', callback_data: 'qz_t_mvp' }],
            [{ text: '🧮 Квиз / Лид-магнит в Telegram', callback_data: 'qz_t_quiz' }],
            [{ text: '✍️ Написать свой вариант / Другая задача', callback_data: 'qz_custom' }],
          ],
        });
        await sendAlertToYuri(user, 'Начал экспресс-расчёт сметы в чате');
      } else if (cbData === 'qz_custom') {
        const customPrompt = 
          '✍️ <b>Опишите вашу задачу своими словами:</b>\n\n' +
          'Напишите прямо сюда в чат:\n' +
          '• Что должен делать сервис или бот?\n' +
          '• Есть ли уже ТЗ, дизайн, сайт или ссылки на аналоги?\n' +
          '• В какие сроки планируете запуск?\n\n' +
          '<i>Отправьте сообщение в чат 👇 Я сразу рассчитаю вилку сметы и передам детали Юрию!</i>';

        await sendSafeMessage(chatId, customPrompt, {
          inline_keyboard: [
            [{ text: '💬 Обсудить задачу напрямую с Юрием (@radeevich) ↗', url: 'https://t.me/radeevich' }],
            [{ text: '◀️ Вернуться к выбору вариантов', callback_data: 'quiz_start' }],
          ],
        });
        await sendAlertToYuri(user, 'Выбрал «Написать свой вариант / Другая задача» в квизе');
      } else if (cbData.startsWith('qz_t_')) {
        const type = cbData.replace('qz_t_', '');
        const text = '🧮 <b>Шаг 2 из 2.</b> На какой стадии находится проект?\n\n' +
          '<i>Выберите стадию кнопкой ниже или напишите детали в чат 👇</i>';
        await sendSafeMessage(chatId, text, {
          inline_keyboard: [
            [{ text: '💡 Только идея (поможем составить ТЗ)', callback_data: `qz_s_idea_${type}` }],
            [{ text: '📋 Есть готовый текст и логика', callback_data: `qz_s_spec_${type}` }],
            [{ text: '🎨 Есть готовый дизайн в Figma', callback_data: `qz_s_figma_${type}` }],
            [{ text: '✍️ Описать детали текстом в чат', callback_data: 'qz_custom' }],
          ],
        });
      } else if (cbData.startsWith('qz_s_')) {
        const parts = cbData.split('_');
        const stage = parts[2];
        const type = parts[3];

        let typeLabel = 'Telegram Mini App (магазин/каталог)';
        let price = 'от 59 900 ₽';
        let term = '3–4 дня';

        if (type === 'ai') {
          typeLabel = 'Умный AI-Консультант 24/7 (RAG)';
          price = 'от 44 900 ₽';
          term = '48–72 часа';
        } else if (type === 'radar') {
          typeLabel = 'Автономный AI-Радар лидов';
          price = 'от 39 900 ₽';
          term = '2–3 дня';
        } else if (type === 'mvp') {
          typeLabel = 'B2B Кабинет / MVP на чистом коде';
          price = 'от 89 000 ₽';
          term = '3–5 дней';
        } else if (type === 'quiz') {
          typeLabel = 'Интерактивный Квиз в Telegram';
          price = 'от 19 900 ₽';
          term = '24–48 часов';
        }

        let stageLabel = 'Только идея';
        if (stage === 'spec') stageLabel = 'Есть текст и логика';
        if (stage === 'figma') stageLabel = 'Готовый дизайн в Figma';

        const resultText = 
          '🎯 <b>ПРЕДВАРИТЕЛЬНЫЙ РАСЧЁТ СМЕТЫ ГОТОВ:</b>\n\n' +
          `📌 <b>Направление:</b> ${typeLabel}\n` +
          `📊 <b>Стадия:</b> ${stageLabel}\n` +
          `💰 <b>Бюджет:</b> <b>${price}</b> (фиксированная смета)\n` +
          `⏱️ <b>Срок запуска:</b> <b>${term}</b>\n\n` +
          '🛡️ <b>Инженерные гарантии:</b>\n' +
          '• <b>0 ₽ ежемесячной абонентки</b> (чистый код без конструкторов)\n' +
          '• <b>Тестовый стенд ДО оплаты</b> (сначала тестируете вживую)\n' +
          '• <b>14 дней бесплатной гарантии</b> (SLA по договору)\n\n' +
          'Юрий уже получил уведомление о вашем расчёте и готов подключиться к обсуждению. Напишите ему в один клик 👇';

        await sendSafeMessage(chatId, resultText, {
          inline_keyboard: [
            [{ text: '💬 Обсудить задачу с Юрием (@radeevich) ↗', url: 'https://t.me/radeevich' }],
            [{ text: '📱 Открыть интерактивную витрину', web_app: { url: WEBAPP_URL } }],
          ],
        });

        await sendAlertToYuri(user, `🎯 РАСЧЁТ В ЧАТЕ: ${typeLabel} | Стадия: ${stageLabel} | Бюджет: ${price} | Срок: ${term}`);
      }

      return res.status(200).json({ ok: true });
    }

    // 2. Входящие сообщения
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const user = msg.from || {};
      const uid = user.id;
      const isYuri = String(uid) === String(ADMIN_CHAT_ID);

      // Входящие файлы (скриншоты, голосовые, документы, стикеры)
      if (!msg.text) {
        let mediaType = 'нетекстовое сообщение';
        if (msg.voice) mediaType = 'голосовое сообщение 🎤';
        else if (msg.photo) mediaType = 'скриншот/фото 📸';
        else if (msg.document) mediaType = 'документ/ТЗ 📄';
        else if (msg.sticker) mediaType = 'стикер/эмодзи 👍';
        else if (msg.video_note) mediaType = 'видео-кружочек 🎥';
        else if (msg.video) mediaType = 'видео 🎬';
        else if (msg.audio) mediaType = 'аудиозапись 🎵';
        else if (msg.animation) mediaType = 'GIF-анимацию 🎞';
        else if (msg.contact) mediaType = 'контакт 📱';

        await sendSafeMessage(chatId, '👍 <b>Материалы получены!</b>\n\nЮрий ознакомится с ними в ближайшее время. Вы также можете отправить пояснение текстом или написать напрямую в Telegram: @radeevich.', {
          inline_keyboard: [
            [{ text: '💬 Написать в Telegram ↗', url: 'https://t.me/radeevich' }],
          ],
        });
        await sendAlertToYuri(user, `Прислал ${mediaType}`);

        // Автоматически пересылаем файл/фото/стикер напрямую в чат Юрия:
        try {
          await fetch(`${TELEGRAM_API}/forwardMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: ADMIN_CHAT_ID,
              from_chat_id: chatId,
              message_id: msg.message_id
            })
          });
        } catch (fwdErr) {
          console.error('Forward err:', fwdErr);
        }

        return res.status(200).json({ ok: true });
      }

      const text = msg.text.trim();

      // Команда /stats для Юрия (CRM-сводка)
      if (isYuri && (text === '/stats' || text === '/crm' || text === '/leads')) {
        await loadCrmData();
        const total = memoryCache.size;
        let listText = '';
        let i = 1;

        for (const [id, val] of memoryCache.entries()) {
          if (id !== ADMIN_CHAT_ID && id !== 'test') {
            const timeAgo = formatDuration(Date.now() - (val.last_seen || Date.now()));
            listText += `<b>${i++}. ${val.first_name || 'Лид'}</b> (${val.username || id})\n` +
              `   • Сообщений: ${val.count || 1} | Был: ${timeAgo} назад\n` +
              `   • Последнее: <i>"${(val.last_action || '').slice(0, 45)}..."</i>\n\n`;
          }
        }

        const statsMsg = `📊 <b>CRM-АНАЛИТИКА @radeevich_bot</b>\n\n` +
          `👥 <b>Всего уникальных лидов:</b> ${Math.max(0, total - 1)}\n\n` +
          (listText || 'Пока нет внешних лидов, база готова к сбору.');

        await sendSafeMessage(chatId, statsMsg);
        return res.status(200).json({ ok: true });
      }

      // Команда /radar или /scan для Юрия — мгновенный запуск поиска заказов
      if (isYuri && (text === '/radar' || text === '/scan' || text === '🔍 Радар')) {
        await sendSafeMessage(chatId, '🔍 <b>Запускаю радар заказов...</b>\nПроверяю Telegram-каналы и биржи...');
        try {
          const radarRes = await fetch(`${WEBAPP_URL}/api/radar`);
          const rData = await radarRes.json();
          await sendSafeMessage(
            chatId,
            `✅ <b>Сканирование завершено (${rData.duration_sec || 2}с)!</b>\n` +
            `• Проверено заказов: ${rData.scanned_leads || 0}\n` +
            `• Новых отправлено выше: ${rData.new_leads_alerted || 0}`
          );
        } catch (e) {
          await sendSafeMessage(chatId, `⚠️ Ошибка вызова радара: ${e.message}`);
        }
        return res.status(200).json({ ok: true });
      }

      // AI CMO Инструменты для Юрия
      if (isYuri && (text === '/cmo' || text === '🎯 AI CMO')) {
        const cmoMenu = 
          '🎯 <b>AI CHIEF MARKETING OFFICER (@radeevich)</b>\n\n' +
          'Ваш персональный инструмент управления маркетингом и B2B-продажами:\n\n' +
          '• <code>/kp [описание задачи]</code> — Мгновенно составить продающее КП для клиента\n' +
          '• <code>/post [тема]</code> — Сгенерировать виральный пост для TenChat / TG\n' +
          '• <code>/pitch [ниша/агентство]</code> — Сформировать партнерское предложение\n' +
          '• <code>/radar</code> — Запустить принудительный скан каналов и бирж\n' +
          '• <code>/crm</code> — Посмотреть аналитику и базу лидов\n\n' +
          '<i>Пример: напишите прямо в чат:\n<code>/kp Бот для доставки цветов с корзиной и amoCRM</code></i>';
        await sendSafeMessage(chatId, cmoMenu);
        return res.status(200).json({ ok: true });
      }

      // Генератор КП через /kp
      if (isYuri && text.startsWith('/kp')) {
        const query = text.replace(/^\/kp\s*/, '').trim();
        if (!query) {
          await sendSafeMessage(chatId, 'ℹ️ Укажите задачу после команды, например:\n<code>/kp Чат-бот для клиники с записью к врачу и amoCRM</code>');
          return res.status(200).json({ ok: true });
        }
        await sendSafeMessage(chatId, '⏳ <b>AI CMO формирует коммерческое предложение...</b>');
        try {
          const kpText = await generateCMO('kp', query);
          await sendSafeMessage(chatId, `📋 <b>ГОТОВОЕ КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ:</b>\n\n${kpText}`);
        } catch (e) {
          await sendSafeMessage(chatId, `⚠️ Ошибка генерации КП: ${e.message}`);
        }
        return res.status(200).json({ ok: true });
      }

      // Генератор постов через /post с автоматическим подбором визуала
      if (isYuri && text.startsWith('/post')) {
        const query = text.replace(/^\/post\s*/, '').trim();
        await sendSafeMessage(chatId, '⏳ <b>AI CMO подбирает визуал и пишет виральный пост...</b>');
        
        const isTma = /mini\s*app|tma|магазин|приложени|сайт|экран|мобильн/i.test(query);
        const photoUrl = isTma 
          ? `${WEBAPP_URL}/tenchat_mockup.png` 
          : `${WEBAPP_URL}/tenchat_infographic.png`;

        try {
          await callTg('sendPhoto', {
            chat_id: chatId,
            photo: photoUrl,
            caption: '🖼 <b>Визуал к посту (прикрепите при публикации в TenChat/TG):</b>',
            parse_mode: 'HTML',
          });

          const postText = await generateCMO('post', query);
          await sendSafeMessage(chatId, `📱 <b>ГОТОВЫЙ ТЕКСТ ПОСТА ДЛЯ ПУБЛИКАЦИИ:</b>\n\n${postText}`);
        } catch (e) {
          await sendSafeMessage(chatId, `⚠️ Ошибка генерации поста: ${e.message}`);
        }
        return res.status(200).json({ ok: true });
      }

      // Генератор партнерских питчей через /pitch
      if (isYuri && text.startsWith('/pitch')) {
        const query = text.replace(/^\/pitch\s*/, '').trim();
        await sendSafeMessage(chatId, '⏳ <b>AI CMO готовит партнерское предложение...</b>');
        try {
          const pitchText = await generateCMO('pitch', query);
          await sendSafeMessage(chatId, `🤝 <b>ГОТОВОЕ ПАРТНЕРСКОЕ ПРЕДЛОЖЕНИЕ:</b>\n\n${pitchText}`);
        } catch (e) {
          await sendSafeMessage(chatId, `⚠️ Ошибка генерации питча: ${e.message}`);
        }
        return res.status(200).json({ ok: true });
      }

      if (text.startsWith('/start')) {
        const firstName = user.first_name || 'Гость';
        const startText = `👋 Здравствуйте, ${firstName}!\n\n` +
          `Рад приветствовать. Я цифровой ассистент <b>Юрия Радеевича</b> (@radeevich) — ` +
          `интегратора AI-решений и разработчика цифровых продуктов для бизнеса.\n\n` +
          `⚡ <b>Что разрабатывает Юрий за 24–72 часа:</b>\n` +
          `• Telegram Mini Apps (магазины, каталоги, сервисы)\n` +
          `• AI-ассистентов (RAG) без галлюцинаций с вашей базой знаний\n` +
          `• Сборку MVP стартапов и микро-SaaS на чистом коде (FastAPI + React)\n\n` +
          `🛡️ <b>Инженерные стандарты качества:</b>\n` +
          `• <b>0 ₽ абонентки</b> (без сторонних конструкторов)\n` +
          `• <b>Тестовый стенд ДО оплаты</b> (сначала проверяете работу, затем платите)\n` +
          `• <b>Гарантия 14 дней</b> (SLA, бесплатное устранение любых правок)\n\n` +
          `Выберите нужное действие ниже или напишите мне любой вопрос в чат 👇`;

        const keyboard = {
          inline_keyboard: [
            [{ text: '📱 Запустить Mini App (Кейсы + Смета)', web_app: { url: WEBAPP_URL } }],
            [{ text: '🧮 Рассчитать смету прямо в чате (30 сек)', callback_data: 'quiz_start' }],
            [
              { text: '📦 Пакеты & Цены', callback_data: 'get_packages' },
              { text: '💼 8 Кейсов в проде', callback_data: 'get_cases' },
            ],
            [
              { text: '💬 Написать лично в Telegram ↗', url: 'https://t.me/radeevich' },
              { text: '🌐 Официальный сайт (radeevich.ru) ↗', url: 'https://radeevich.ru' },
            ],
          ],
        };

        await sendSafeMessage(chatId, startText, keyboard);
        await sendAlertToYuri(user, 'Нажал /start и просматривает главное меню');
      } else if (text.startsWith('/pdf')) {
        const text = '💼 <b>Портфолио и живые кейсы — Юрий Радеевич (@radeevich):</b>\n\n' +
          'Вместо статичного PDF вы можете открыть интерактивное портфолио с живыми демо-стендами, расчётом сметы и описанием архитектуры:\n\n' +
          '• <b>Официальный сайт-витрина:</b> https://radeevich.ru\n' +
          '• <b>Telegram Mini App:</b> t.me/radeevich_bot/app\n' +
          '• <b>Прямая связь лично:</b> @radeevich';
        const kb = {
          inline_keyboard: [
            [
              { text: '🌐 Открыть портфолио (radeevich.ru) ↗', url: 'https://radeevich.ru' },
              { text: '📱 Открыть Mini App ↗', url: 'https://t.me/radeevich_bot/app' }
            ],
            [{ text: '💬 Написать Юрию лично (@radeevich) ↗', url: 'https://t.me/radeevich' }]
          ]
        };
        await sendSafeMessage(chatId, text, kb);
        await sendAlertToYuri(user, 'Запросил портфолио через /pdf');
      } else if (text.startsWith('/cases')) {
        const casesText = '💼 <b>8 боевых кейсов в продакшене:</b>\n\n' +
          '1. <b>xswapp2p.com</b> — Некастодиальный P2P & кросс-чейн обмен криптоактивов (USDT, TON, BTC) с AML-проверкой.\n' +
          '2. <b>FRESH BALANCE</b> — Telegram Mini App доставки питания: меню, фильтрация по КБЖУ, живая корзина и СБП в 1 клик.\n' +
          '3. <b>HEDO Gastrobar</b> — Telegram Mini App: цифровое меню ресторана, выбор стола на схеме зала и предзаказ блюд.\n' +
          '4. <b>admin24-7.com</b> — Круглосуточный AI-диспетчер и служба клиентской поддержки с тикет-системой (SaaS).\n' +
          '5. <b>ZAUM Hub</b> — Telegram-портал закрытого сообщества: личный кабинет резидента, каталог базы знаний и подписка.\n' +
          '6. <b>lekcia.com</b> — EdTech LMS-экосистема для онлайн-школ: пошаговые модули и AI-тестирование студентов.\n' +
          '7. <b>lotbase.net</b> — Мониторинг банкротных торгов и аукционов: семантический фильтр дисконта и Telegram-алерты.\n' +
          '8. <b>job888.app</b> — HR-Tech сервис: автоматизация первичного отбора соискателей в Telegram со скорингом.\n\n' +
          'Все кейсы с живыми скриншотами, архитектурой и демо-стендами открываются в Mini App 👇';

        await sendSafeMessage(chatId, casesText, {
          inline_keyboard: [
            [{ text: '📱 Открыть все кейсы в Mini App', web_app: { url: `${WEBAPP_URL}?tab=cases` } }],
            [{ text: '💬 Обсудить задачу в Telegram ↗', url: 'https://t.me/radeevich' }],
          ],
        });
        await sendAlertToYuri(user, 'Изучает список 8 кейсов');
      } else if (text.startsWith('/contact')) {
        await sendSafeMessage(chatId, '💬 <b>Прямой контакт Юрия Радеевича в Telegram:</b> @radeevich\n\nПишите в любое время — обсудим задачу и запустим прототип за 24–48 часов!');
      } else {
        // Умный AI ответ
        await callTg('sendChatAction', { chat_id: chatId, action: 'typing' });

        const qLower = text.toLowerCase();
        let answer = null;

        // 1. Точечная защита от попыток выудить системный промпт или API-ключи (не блокирует обычные вопросы "под ключ")
        const isSecretExtraction = 
          /(?:(покажи|дай|выведи|скинь|напиши|раскрой|скажи)\s+.*?(промпт|инструкци|api[_\s]?key|токен|секрет|парол|конфиг))/i.test(text) ||
          /(?:system\s*prompt|jailbreak|ignore\s+all\s+instructions|забудь\s+все\s+инструкции)|\b(api_key|groq_key|bot_token|vcp_)\b/i.test(text);

        if (isSecretExtraction) {
          answer = '🛡️ <b>Политика безопасности и конфиденциальности:</b>\n\n' +
            'Все API-ключи, серверные токены и базы данных изолированы в защищенном облачном контуре (Zero Data Loss Architecture).\n\n' +
            'Конфиденциальные данные и исходные ключи доступа не подлежат раскрытию в чате согласно стандартам безопасности разработки.';
        } else {
          // 2. Вызов живой 120-миллиардной нейросети Groq LLM
          answer = await callGroqLLM(text);

          // 3. Если сеть Groq недоступна -> мгновенный фоллбэк на локальный RAG
          if (!answer) {
            answer = getFallbackRagAnswer(text);
          }
        }

        const replyKeyboard = {
          inline_keyboard: [
            [{ text: '📱 Открыть Mini App (Калькулятор)', web_app: { url: `${WEBAPP_URL}?tab=calc` } }],
            [{ text: '💬 Написать в Telegram ↗', url: 'https://t.me/radeevich' }],
          ],
        };

        await sendSafeMessage(chatId, answer, replyKeyboard);
        await sendAlertToYuri(user, `Задал вопрос: <i>"${text}"</i>`);
      }
    }
  } catch (err) {
    console.error('Webhook execution error:', err);
  }

  return res.status(200).json({ ok: true });
}
