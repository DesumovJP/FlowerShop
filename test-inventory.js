// Тестовий скрипт для перевірки функціоналу залишків
const FRONTEND_URL = 'http://localhost:3000';

async function testInventoryAPI() {
  console.log('🧪 Тестування API залишків...\n');

  try {
    // Тест 1: Створення зміни
    console.log('1️⃣ Створення тестової зміни...');
    const createShiftResponse = await fetch(`${FRONTEND_URL}/api/shifts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: '2024-01-20',
        employee: 'Тестовий Працівник',
        shiftType: 'day',
        notes: 'Тестова зміна для залишків'
      }),
    });

    if (!createShiftResponse.ok) {
      const errorData = await createShiftResponse.json();
      console.log('❌ Помилка створення зміни:', errorData);
      return;
    }

    const shiftData = await createShiftResponse.json();
    const shiftId = shiftData.data?.id;
    console.log('✅ Зміна створена:', shiftData);

    if (shiftId) {
      // Тест 2: Закриття зміни з записом залишків
      console.log('\n2️⃣ Закриття зміни з записом залишків...');
      const closeShiftResponse = await fetch(`${FRONTEND_URL}/api/inventory-records/create-for-shift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shiftId: shiftId,
          inventoryData: {
            bouquetsCount: 25,
            singleFlowersCount: 150,
            varietiesCount: 12,
            notes: 'Тестові залишки на кінець зміни'
          }
        }),
      });

      if (closeShiftResponse.ok) {
        const closeData = await closeShiftResponse.json();
        console.log('✅ Зміна закрита з залишками:', closeData);
      } else {
        const errorData = await closeShiftResponse.json();
        console.log('❌ Помилка закриття зміни:', errorData);
      }

      // Тест 3: Отримання залишків за місяць
      console.log('\n3️⃣ Отримання залишків за місяць...');
      const getInventoryResponse = await fetch(`${FRONTEND_URL}/api/inventory-records?month=1&year=2024`);
      
      if (getInventoryResponse.ok) {
        const inventoryData = await getInventoryResponse.json();
        console.log('✅ Залишки отримані:', inventoryData);
      } else {
        const errorData = await getInventoryResponse.json();
        console.log('❌ Помилка отримання залишків:', errorData);
      }

      // Тест 4: Отримання залишків за діапазон дат
      console.log('\n4️⃣ Отримання залишків за діапазон дат...');
      const getRangeResponse = await fetch(`${FRONTEND_URL}/api/inventory-records?dateFrom=2024-01-01&dateTo=2024-01-31`);
      
      if (getRangeResponse.ok) {
        const rangeData = await getRangeResponse.json();
        console.log('✅ Залишки за діапазон отримані:', rangeData);
      } else {
        const errorData = await getRangeResponse.json();
        console.log('❌ Помилка отримання залишків за діапазон:', errorData);
      }
    }

  } catch (error) {
    console.log('❌ Загальна помилка:', error.message);
  }
}

// Запуск тесту
testInventoryAPI();
