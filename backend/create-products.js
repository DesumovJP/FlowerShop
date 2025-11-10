// Using built-in fetch (Node.js 18+)
// Load environment variables from .env file
require('dotenv').config();

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

// 10 Букетів
const bouquets = [
  {
    name: 'Романтичний вечір',
    price: 850,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Ніжний букет з червоних троянд та білих лілій, прикрашений зеленню еустом. Ідеальний вибір для романтичного вечора та вираження глибоких почуттів.' }]
      }
    ],
    productType: 'bouquet',
    cardType: 'large',
    color: 'chervonij',
    availableQuantity: 15
  },
  {
    name: 'Весняна свіжість',
    price: 650,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Яскравий букет з тюльпанів, нарцисів та гіацинтів. Насичений весняними кольорами та ароматами, що нагадують про пробудження природи.' }]
      }
    ],
    productType: 'bouquet',
    cardType: 'standart',
    color: 'zhyovtyj',
    availableQuantity: 20
  },
  {
    name: 'Класична елегантність',
    price: 1200,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Вишуканий букет з білих троянд та калл, доповнений аспарагусом. Символ чистоти, елегантності та високого смаку.' }]
      }
    ],
    productType: 'bouquet',
    cardType: 'standart',
    color: 'bilyj',
    availableQuantity: 12
  },
  {
    name: 'Сонячна радість',
    price: 750,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Жвавий букет з соняшників, гербер та рудбекій. Насичений жовто-помаранчевими відтінками, що додають позитиву та енергії.' }]
      }
    ],
    productType: 'bouquet',
    cardType: 'standart',
    color: 'zhyovtyj',
    availableQuantity: 18
  },
  {
    name: 'Лавандова мрія',
    price: 900,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Ніжний букет з лаванди, фіалок та бузку. Заспокійливий фіолетовий відтінок та приємний аромат створюють атмосферу гармонії.' }]
      }
    ],
    productType: 'bouquet',
    cardType: 'standart',
    color: 'fioletovij',
    availableQuantity: 14
  },
  {
    name: 'Королівська велич',
    price: 1500,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Розкішний букет з бордових троянд, піонів та орхідей. Глибокий багатий колір та вишукана композиція для особливих моментів.' }]
      }
    ],
    productType: 'bouquet',
    cardType: 'large',
    color: 'bordovyj',
    availableQuantity: 8
  },
  {
    name: 'Персиковий блаженство',
    price: 680,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'М\'який букет з персикових троянд та кремових піонів. Ніжні пастельні відтінки створюють теплу та затишну атмосферу.' }]
      }
    ],
    productType: 'bouquet',
    cardType: 'standart',
    color: 'kremovyj',
    availableQuantity: 16
  },
  {
    name: 'Океанська свіжість',
    price: 720,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Свіжий букет з блакитних дельфініумів, гіпсофіли та білих хризантем. Нагадує про морський бриз та безмежність океану.' }]
      }
    ],
    productType: 'bouquet',
    cardType: 'standart',
    color: 'golubyj',
    availableQuantity: 22
  },
  {
    name: 'Осіння палітра',
    price: 800,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Насичений букет з помаранчевих хризантем, червоних астр та жовтих георгинів. Відображає красу осінньої природи.' }]
      }
    ],
    productType: 'bouquet',
    cardType: 'standart',
    color: 'oranzhevyj',
    availableQuantity: 19
  },
  {
    name: 'Рожева ніжність',
    price: 950,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Романтичний букет з рожевих троянд, піонів та еустом. Ніжні відтінки рожевого символізують кохання та турботу.' }]
      }
    ],
    productType: 'bouquet',
    cardType: 'standart',
    color: 'rozhevyj',
    availableQuantity: 17
  }
];

// 10 Композицій
const compositions = [
  {
    name: 'Квіткова композиція "Елеганс"',
    price: 1100,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Вишукана композиція в декоративній вазі з білих орхідей, калл та зеленої рослинності. Ідеальна для офісних приміщень та святкових подій.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: 'bilyj',
    availableQuantity: 10
  },
  {
    name: 'Настільна композиція "Весна"',
    price: 550,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Компактна композиція з тюльпанів, нарцисів та м\'яти в круглій вазі. Чудово підходить для прикраси столу та створення весняного настрою.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: 'zhyovtyj',
    availableQuantity: 25
  },
  {
    name: 'Підвісна композиція "Каскад"',
    price: 1300,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Ефектна підвісна композиція з плюща, фіалок та білих троянд. Створює каскадний ефект, ідеальна для аркових конструкцій.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: 'miks',
    availableQuantity: 6
  },
  {
    name: 'Композиція "Мінімалізм"',
    price: 850,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Сучасна мінімалістична композиція з монстера, сансев\'єрії та сухоцвітів. Підходить для сучасних інтер\'єрів у стилі скандинавського дизайну.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: 'zelenyj',
    availableQuantity: 12
  },
  {
    name: 'Святкова композиція "Різдво"',
    price: 1400,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Тематична композиція з ялинкових гілок, червоних троянд, шишок та декоративних елементів. Створює святкову атмосферу Різдва.' }]
      }
    ],
    productType: 'else',
    cardType: 'large',
    color: 'chervonij',
    availableQuantity: 5
  },
  {
    name: 'Композиція "Тропіки"',
    price: 1200,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Яскрава тропічна композиція з антуріумів, орхідей та монстери. Насичені кольори та екзотичні форми нагадують про тропічні острови.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: 'miks',
    availableQuantity: 8
  },
  {
    name: 'Композиція "Класика"',
    price: 950,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Традиційна композиція в прямокутній вазі з червоних троянд, білих хризантем та зеленої рослинності. Вічна класика для будь-якої нагоди.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: 'chervonij',
    availableQuantity: 15
  },
  {
    name: 'Композиція "Світло"',
    price: 780,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Світла композиція з білих та кремових троянд, доповнена зеленню. Створює відчуття легкості та чистоти, підходить для весільних церемоній.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: 'kremovyj',
    availableQuantity: 18
  },
  {
    name: 'Композиція "Осінь"',
    price: 900,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Тепла осіння композиція з помаранчевих, червоних та жовтих квітів у дерев\'яній вазі. Відображає багатство осінніх кольорів.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: 'oranzhevyj',
    availableQuantity: 14
  },
  {
    name: 'Композиція "Романтика"',
    price: 1050,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Ніжна романтична композиція з рожевих піонів, троянд та еустом у круглій вазі. Ідеальна для вираження кохання та ніжності.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: 'rozhevyj',
    availableQuantity: 16
  }
];

// 10 Одиночних квітів
const singleFlowers = [
  {
    name: 'Червона троянда "Класика"',
    price: 120,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Червона троянда висотою 60-70 см. Символ пристрасті та кохання. Ідеальна для вираження глибоких почуттів.' }]
      }
    ],
    productType: 'singleflower',
    cardType: 'standart',
    color: 'chervonij',
    availableQuantity: 50
  },
  {
    name: 'Біла троянда "Чистота"',
    price: 110,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Біла троянда висотою 60-70 см. Символ чистоти, невинності та нових початків. Чудово підходить для весільних букетів.' }]
      }
    ],
    productType: 'singleflower',
    cardType: 'standart',
    color: 'bilyj',
    availableQuantity: 45
  },
  {
    name: 'Рожева троянда "Ніжність"',
    price: 115,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Рожева троянда висотою 60-70 см. Виражає ніжність, вдячність та симпатію. Ідеальна для дружніх та романтичних жестів.' }]
      }
    ],
    productType: 'singleflower',
    cardType: 'standart',
    color: 'rozhevyj',
    availableQuantity: 48
  },
  {
    name: 'Жовта троянда "Радість"',
    price: 105,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Жовта троянда висотою 60-70 см. Символ дружби, радості та оптимізму. Чудовий вибір для підняття настрою.' }]
      }
    ],
    productType: 'singleflower',
    cardType: 'standart',
    color: 'zhyovtyj',
    availableQuantity: 42
  },
  {
    name: 'Оранжева троянда "Енергія"',
    price: 108,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Оранжева троянда висотою 60-70 см. Насичений колір символізує енергію, ентузіазм та пристрасть до життя.' }]
      }
    ],
    productType: 'singleflower',
    cardType: 'standart',
    color: 'oranzhevyj',
    availableQuantity: 40
  },
  {
    name: 'Біла лілія "Велично"',
    price: 95,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Біла лілія висотою 70-80 см. Вишукана та ароматна квітка, символ чистоти та величі. Чудово доповнює будь-який букет.' }]
      }
    ],
    productType: 'singleflower',
    cardType: 'standart',
    color: 'bilyj',
    availableQuantity: 35
  },
  {
    name: 'Червона гербера "Сонце"',
    price: 85,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Червона гербера діаметром 10-12 см. Яскрава та життєрадісна квітка, що нагадує сонце. Довго стоїть у вазі.' }]
      }
    ],
    productType: 'singleflower',
    cardType: 'standart',
    color: 'chervonij',
    availableQuantity: 60
  },
  {
    name: 'Рожева орхідея "Екзотика"',
    price: 350,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Рожева орхідея фаленопсіс у горщику. Екзотична квітка, що цвіте до 3 місяців. Ідеальна для подарунку та прикраси інтер\'єру.' }]
      }
    ],
    productType: 'singleflower',
    cardType: 'standart',
    color: 'rozhevyj',
    availableQuantity: 20
  },
  {
    name: 'Біла хризантема "Класика"',
    price: 70,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Біла хризантема діаметром 8-10 см. Класична квітка, що символізує довголіття та щастя. Відмінно стоїть у вазі.' }]
      }
    ],
    productType: 'singleflower',
    cardType: 'standart',
    color: 'bilyj',
    availableQuantity: 55
  },
  {
    name: 'Фіолетова еустома "Ніжність"',
    price: 90,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Фіолетова еустома висотою 50-60 см. Ніжна та вишукана квітка з м\'яким ароматом. Чудово доповнює романтичні букети.' }]
      }
    ],
    productType: 'singleflower',
    cardType: 'standart',
    color: 'fioletovij',
    availableQuantity: 38
  }
];

// 10 Супутніх товарів
const accessories = [
  {
    name: 'Добриво для квітів "Флора" 5кг',
    price: 450,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Універсальне мінеральне добриво для квіткових рослин. Містить азот, фосфор та калій у оптимальному співвідношенні. Забезпечує здорове зростання та пишне цвітіння.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: null,
    availableQuantity: 30
  },
  {
    name: 'Горщик керамічний "Елеганс" 20см',
    price: 280,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Вишуканий керамічний горщик з дренажними отворами. Підходить для кімнатних рослин та орхідей. Класичний дизайн під будь-який інтер\'єр.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: null,
    availableQuantity: 25
  },
  {
    name: 'Грунт універсальний "Родючий" 10л',
    price: 180,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Якісний універсальний грунт на основі торфу з додаванням мінеральних речовин. Підходить для більшості кімнатних та садових рослин.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: null,
    availableQuantity: 40
  },
  {
    name: 'Вазон декоративний "Модерн" 25см',
    price: 320,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Сучасний декоративний вазон з міцного пластику. Легкий та міцний, з дренажною системою. Підходить для садових та кімнатних рослин.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: null,
    availableQuantity: 20
  },
  {
    name: 'Розпилювач для рослин 1л',
    price: 150,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Зручний розпилювач з регульованим розпиленням. Ідеальний для поливу та підживлення рослин, створення оптимальної вологості.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: null,
    availableQuantity: 35
  },
  {
    name: 'Садовий інвентар "Комплект"',
    price: 550,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Комплект садового інвентаря: совок, грабельки, міні-мотика. Зручні ручки та міцні сталеві леза. Необхідний набір для догляду за рослинами.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: null,
    availableQuantity: 15
  },
  {
    name: 'Підживлювач для орхідей 250мл',
    price: 220,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Спеціалізоване рідке добриво для орхідей. Збалансований склад для здорового росту та тривалого цвітіння. Легко застосовується.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: null,
    availableQuantity: 28
  },
  {
    name: 'Підставка для квітів "Підвісна"',
    price: 380,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Металева підвісна підставка для квіткових горщиків. Витримує вагу до 5кг. Сучасний дизайн, легко монтується до стелі або стіни.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: null,
    availableQuantity: 18
  },
  {
    name: 'Корм для квітів "Довготривале" 500г',
    price: 190,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Гранульоване довготривале добриво для квіткових рослин. Поступово віддає поживні речовини протягом 3 місяців. Зручне у застосуванні.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: null,
    availableQuantity: 32
  },
  {
    name: 'Декоративна підставка "Дерево"',
    price: 420,
    description: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Екологічна підставка з натурального дерева для квіткових горщиків. Підкреслює природну красу рослин. Підходить для інтер\'єру в еко-стилі.' }]
      }
    ],
    productType: 'else',
    cardType: 'standart',
    color: null,
    availableQuantity: 22
  }
];

// Generate slug from name (handles Ukrainian characters and special symbols)
function generateSlug(name) {
  // Transliterate Ukrainian characters
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ie',
    'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'i', 'й': 'i', 'к': 'k', 'л': 'l',
    'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'iu', 'я': 'ia'
  };
  
  let slug = name.toLowerCase();
  
  // Replace Ukrainian characters
  slug = slug.split('').map(char => translitMap[char] || char).join('');
  
  // Remove quotes and special characters, keep only letters, numbers, spaces, and hyphens
  slug = slug
    .replace(/["'«»]/g, '') // Remove quotes
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();
  
  // Ensure slug is not empty
  if (!slug || slug === '-') {
    slug = 'product-' + Date.now();
  }
  
  return slug;
}

async function createProduct(product) {
  try {
    const mutation = `
      mutation CreateProduct($data: ProductInput!) {
        createProduct(data: $data) {
          documentId
          name
          slug
        }
      }
    `;

    // Generate unique slug with timestamp to avoid duplicates
    const baseSlug = generateSlug(product.name);
    const slug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const variables = {
      data: {
        name: product.name,
        slug: slug,
        price: product.price,
        // description: product.description, // Skip description for now - can be added manually later
        productType: product.productType,
        cardType: product.cardType,
        ...(product.color && { color: product.color }), // Only include color if it's not null
        availableQuantity: product.availableQuantity
        // publishedAt will be set automatically when publishing
      }
    };

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error(`Error creating ${product.name}:`, JSON.stringify(result.errors, null, 2));
      return false;
    }
    
    const documentId = result.data.createProduct.documentId;
    
    // Note: Products are created as drafts. Publish them manually in Strapi Admin if needed.
    console.log(`✓ Created: ${product.name} (${documentId}) - slug: ${slug}`);
    return true;
  } catch (error) {
    console.error(`Error creating ${product.name}:`, error.message);
    return false;
  }
}

async function createAllProducts() {
  console.log('Creating 10 bouquets...');
  for (const product of bouquets) {
    await createProduct(product);
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay to avoid rate limiting
  }

  console.log('\nCreating 10 compositions...');
  for (const product of compositions) {
    await createProduct(product);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\nCreating 10 single flowers...');
  for (const product of singleFlowers) {
    await createProduct(product);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\nCreating 10 accessories...');
  for (const product of accessories) {
    await createProduct(product);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ All products created!');
}

// Run the script
if (require.main === module) {
  if (!STRAPI_TOKEN) {
    console.error('❌ Error: STRAPI_API_TOKEN environment variable is not set!');
    console.log('\n📝 To fix this:');
    console.log('1. Open Strapi Admin: http://localhost:1337/admin');
    console.log('2. Go to: Settings → API Tokens → Create new API Token');
    console.log('3. Name: "Product Creator", Token type: Full access');
    console.log('4. Copy the token and add to backend/.env file:');
    console.log('   STRAPI_API_TOKEN=your_token_here');
    console.log('\nOr set it temporarily:');
    console.log('   $env:STRAPI_API_TOKEN="your_token"; npm run create-products');
    process.exit(1);
  }
  
  console.log(`🚀 Creating products using Strapi at ${STRAPI_URL}...\n`);
  createAllProducts().catch(console.error);
}

module.exports = { createAllProducts, bouquets, compositions, singleFlowers, accessories };

