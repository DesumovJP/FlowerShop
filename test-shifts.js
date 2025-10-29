// Тестовий скрипт для перевірки збереження змін у Strapi
const STRAPI_URL = 'http://localhost:1337';
const FRONTEND_URL = 'http://localhost:3000';

async function testShiftsAPI() {
  console.log('🧪 Тестування API змін...\n');

  try {
    // Тест 1: Створення нової зміни
    console.log('1️⃣ Тестування створення нової зміни...');
    const createResponse = await fetch(`${FRONTEND_URL}/api/shifts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: '2024-01-15',
        employee: 'Іван Петренко',
        shiftType: 'day',
        notes: 'Тестова зміна'
      }),
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Зміна створена успішно:', createData);
      
      const shiftId = createData.data?.id;
      
      if (shiftId) {
        // Тест 2: Оновлення зміни
        console.log('\n2️⃣ Тестування оновлення зміни...');
        const updateResponse = await fetch(`${FRONTEND_URL}/api/shifts`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: shiftId,
            date: '2024-01-15',
            employee: 'Марія Коваленко',
            shiftType: 'night',
            notes: 'Оновлена тестова зміна'
          }),
        });

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          console.log('✅ Зміна оновлена успішно:', updateData);
        } else {
          const errorData = await updateResponse.json();
          console.log('❌ Помилка оновлення зміни:', errorData);
        }

        // Тест 3: Видалення зміни
        console.log('\n3️⃣ Тестування видалення зміни...');
        const deleteResponse = await fetch(`${FRONTEND_URL}/api/shifts?id=${shiftId}`, {
          method: 'DELETE',
        });

        if (deleteResponse.ok) {
          const deleteData = await deleteResponse.json();
          console.log('✅ Зміна видалена успішно:', deleteData);
        } else {
          const errorData = await deleteResponse.json();
          console.log('❌ Помилка видалення зміни:', errorData);
        }
      }
    } else {
      const errorData = await createResponse.json();
      console.log('❌ Помилка створення зміни:', errorData);
    }

    // Тест 4: Отримання змін
    console.log('\n4️⃣ Тестування отримання змін...');
    const getResponse = await fetch(`${FRONTEND_URL}/api/shifts?year=2024&month=1`);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ Зміни отримані успішно:', getData);
    } else {
      const errorData = await getResponse.json();
      console.log('❌ Помилка отримання змін:', errorData);
    }

  } catch (error) {
    console.log('❌ Загальна помилка:', error.message);
  }
}

// Запуск тесту
testShiftsAPI();
