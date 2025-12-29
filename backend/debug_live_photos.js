var axios = require('axios');

async function runTest() {
    const BASE_URL = 'http://localhost:3000/api';
    const droneName = 'test_drone_' + Date.now();

    try {
        console.log(`1. Registering drone: ${droneName}`);
        await axios.post(`${BASE_URL}/register`, {
            drone_name: droneName,
            drone_lat: 37.5,
            drone_lon: 127.0
        });

        console.log('2. Creating a fire event...');
        await axios.post(`${BASE_URL}/event`, {
            drone_name: droneName,
            confidence: 0.9,
            image_path: 'http://example.com/fire.jpg'
        });

        // Wait a bit
        await new Promise(r => setTimeout(r, 1000));

        console.log('3. Fetching live photos (should see 1)...');
        let res = await axios.get(`${BASE_URL}/drones/${droneName}/live-photos`);
        console.log(`   Photos count: ${res.data.data.photos.length}`);
        if (res.data.data.photos.length > 0) {
            console.log(`   First photo time: ${res.data.data.photos[0].event_time}`);
        }

        console.log('4. Calling /connect to update connect_time...');
        await axios.post(`${BASE_URL}/drones/${droneName}/connect`);

        // Wait for DB update (just in case, though it should be instant for next query)
        await new Promise(r => setTimeout(r, 1000));

        console.log('5. Fetching live photos again (should be 0)...');
        res = await axios.get(`${BASE_URL}/drones/${droneName}/live-photos`);
        console.log(`   Photos count: ${res.data.data.photos.length}`);
        console.log(`   Connect time from server: ${res.data.data.connect_time}`);

        if (res.data.data.photos.length === 0) {
            console.log('✅ TEST PASSED: Photos filtered correctly.');
        } else {
            console.log('❌ TEST FAILED: Photos still visible after connect.');
        }

    } catch (e) {
        console.error('Test Error:', e.message);
        if (e.response) console.error('Response:', e.response.data);
    }
}

runTest();
