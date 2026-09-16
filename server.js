const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
const AIRLABS_API_KEY = 'd702a552-a0b5-4e04-b840-08cb220cb353'; 
const FIREBASE_URL = 'https://hanoi-airport-9faea-default-rtdb.firebaseio.com'; // 주의: 맨 끝의 '/'는 지우세요.

const VIETNAM_DOMESTIC_AIRPORTS = [
    'SGN', 'DAD', 'CXR', 'PQC', 'DLI', 'HUI', 'VDO', 'VDH', 
    'UIH', 'VCL', 'THD', 'VII', 'PXU', 'BMV', 'TBB', 'VKG', 
    'VCA', 'VCS', 'DIN', 'HPH'
];
const KOREA_AIRPORTS = ['ICN', 'PUS', 'GMP', 'CJJ', 'TAE', 'MWX'];

// ==========================================
// [미래 날짜용 예측 스케줄 (Prediction)]
// * 추후 상용화를 위해 누락된 노선을 수동으로 더 추가해야 합니다.
// ==========================================
const baseArrivalSchedule = [
    { time: '00:10', flight: 'VJ961', airline: 'VietJetAir', route: 'ICN', isKorea: true, seats: 200 },
    { time: '01:50', flight: 'LJ057', airline: 'Jin Air', route: 'ICN', isKorea: true, seats: 189 },
    { time: '07:30', flight: 'VN385', airline: 'Vietnam', route: 'HND', isKorea: false, seats: 305 },
    { time: '08:25', flight: 'SU0294', airline: 'Aeroflot', route: 'SVO', isKorea: false, seats: 300 },
    { time: '09:40', flight: 'TG560', airline: 'Thai', route: 'BKK', isKorea: false, seats: 280 },
    { time: '10:05', flight: 'CZ8475', airline: 'China Southern', route: 'CAN', isKorea: false, seats: 189 },
    { time: '10:45', flight: 'KE455', airline: 'Korean Air', route: 'ICN', isKorea: true, seats: 290 },
    { time: '11:15', flight: 'SQ192', airline: 'Singapore', route: 'SIN', isKorea: false, seats: 305 },
    { time: '11:40', flight: 'BR397', airline: 'EVA Air', route: 'TPE', isKorea: false, seats: 250 },
    { time: '12:05', flight: 'VN427', airline: 'Vietnam', route: 'PUS', isKorea: true, seats: 200 },
    { time: '13:30', flight: 'JL751', airline: 'Japan Airlines', route: 'NRT', isKorea: false, seats: 290 },
    { time: '14:10', flight: 'CX741', airline: 'Cathay', route: 'HKG', isKorea: false, seats: 330 },
    { time: '15:20', flight: 'TR300', airline: 'Scoot', route: 'SIN', isKorea: false, seats: 230 },
    { time: '16:30', flight: 'AK512', airline: 'AirAsia', route: 'KUL', isKorea: false, seats: 180 },
    { time: '18:10', flight: 'VN311', airline: 'Vietnam', route: 'NRT', isKorea: false, seats: 305 },
    { time: '19:15', flight: 'JX715', airline: 'STARLUX', route: 'TPE', isKorea: false, seats: 188 },
    { time: '20:45', flight: 'OZ731', airline: 'Asiana', route: 'ICN', isKorea: true, seats: 280 },
    { time: '21:30', flight: 'VN415', airline: 'Vietnam', route: 'ICN', isKorea: true, seats: 305 },
    { time: '22:10', flight: 'VJ983', airline: 'VietJetAir', route: 'PUS', isKorea: true, seats: 200 },
    { time: '23:05', flight: 'KE441', airline: 'Korean Air', route: 'ICN', isKorea: true, seats: 280 },
    { time: '23:25', flight: 'QR976', airline: 'Qatar', route: 'DOH', isKorea: false, seats: 360 },
    { time: '23:45', flight: 'EK394', airline: 'Emirates', route: 'DXB', isKorea: false, seats: 360 }
];

const baseDepartureSchedule = [
    { time: '00:30', flight: 'VJ960', airline: 'VietJetAir', route: 'ICN', isKorea: true, seats: 200 },
    { time: '01:15', flight: 'KE442', airline: 'Korean Air', route: 'ICN', isKorea: true, seats: 280 },
    { time: '02:30', flight: 'VJ938', airline: 'VietJetAir', route: 'TPE', isKorea: false, seats: 200 },
    { time: '08:15', flight: 'VN384', airline: 'Vietnam', route: 'HND', isKorea: false, seats: 305 },
    { time: '08:40', flight: 'CX742', airline: 'Cathay', route: 'HKG', isKorea: false, seats: 330 },
    { time: '09:20', flight: 'TG561', airline: 'Thai', route: 'BKK', isKorea: false, seats: 280 },
    { time: '10:05', flight: 'VN416', airline: 'Vietnam', route: 'ICN', isKorea: true, seats: 305 },
    { time: '10:40', flight: 'SQ191', airline: 'Singapore', route: 'SIN', isKorea: false, seats: 305 },
    { time: '12:00', flight: 'OZ728', airline: 'Asiana', route: 'ICN', isKorea: true, seats: 280 },
    { time: '13:10', flight: 'MH753', airline: 'Malaysia', route: 'KUL', isKorea: false, seats: 160 },
    { time: '14:30', flight: 'JL752', airline: 'Japan Airlines', route: 'NRT', isKorea: false, seats: 290 },
    { time: '16:00', flight: 'VJ901', airline: 'VietJetAir', route: 'BKK', isKorea: false, seats: 200 },
    { time: '16:45', flight: 'TR301', airline: 'Scoot', route: 'SIN', isKorea: false, seats: 230 },
    { time: '18:20', flight: 'CI794', airline: 'China Airlines', route: 'TPE', isKorea: false, seats: 300 },
    { time: '19:00', flight: 'VN592', airline: 'Vietnam', route: 'HKG', isKorea: false, seats: 200 },
    { time: '21:30', flight: 'VN310', airline: 'Vietnam', route: 'NRT', isKorea: false, seats: 305 },
    { time: '22:45', flight: 'VJ982', airline: 'VietJetAir', route: 'PUS', isKorea: true, seats: 200 },
    { time: '23:30', flight: 'BX792', airline: 'Air Busan', route: 'PUS', isKorea: true, seats: 195 },
    { time: '23:50', flight: 'OZ734', airline: 'Asiana', route: 'ICN', isKorea: true, seats: 200 }
];

let cachedArrivals = [];
let cachedDepartures = [];
let lastFetchTimestamp = 0; 

function estimateSeats(route) {
    const largeAircraftRoutes = [...KOREA_AIRPORTS, 'NRT', 'HND', 'KIX', 'DOH', 'DXB', 'IST', 'CDG', 'LHR', 'FRA', 'TPE', 'HKG'];
    return largeAircraftRoutes.includes(route) ? 300 : 200; 
}

async function fetchFlightsFromAirLabs() {
    try {
        const [arrRes, depRes] = await Promise.all([
            axios.get(`https://airlabs.co/api/v9/schedules?arr_icao=VVNB&api_key=${AIRLABS_API_KEY}`),
            axios.get(`https://airlabs.co/api/v9/schedules?dep_icao=VVNB&api_key=${AIRLABS_API_KEY}`)
        ]);
        
        let tempArrivals = [];
        let tempDepartures = [];

        if (arrRes.data && arrRes.data.response) {
            arrRes.data.response.forEach(item => {
                const originCode = item.dep_iata || '';
                if (!originCode || VIETNAM_DOMESTIC_AIRPORTS.includes(originCode)) return;
                const schedTime = item.arr_time; 
                const estTime = item.arr_estimated;
                if (!item.flight_iata || !schedTime) return;

                const baseTimeStr = schedTime.length >= 16 ? schedTime.substring(11, 16) : null;
                const liveTimeStr = (estTime && estTime.length >= 16) ? estTime.substring(11, 16) : baseTimeStr;

                if (baseTimeStr) {
                    tempArrivals.push({
                        time: liveTimeStr, originalTime: baseTimeStr, isDelayed: baseTimeStr !== liveTimeStr,
                        flight: item.flight_iata.replace(/\s/g, ''), airline: item.airline_iata || 'N/A',
                        route: originCode, isKorea: KOREA_AIRPORTS.includes(originCode), seats: estimateSeats(originCode)
                    });
                }
            });
        }

        if (depRes.data && depRes.data.response) {
            depRes.data.response.forEach(item => {
                const destCode = item.arr_iata || '';
                if (!destCode || VIETNAM_DOMESTIC_AIRPORTS.includes(destCode)) return;
                const schedTime = item.dep_time;
                const estTime = item.dep_estimated;
                if (!item.flight_iata || !schedTime) return;

                const baseTimeStr = schedTime.length >= 16 ? schedTime.substring(11, 16) : null;
                const liveTimeStr = (estTime && estTime.length >= 16) ? estTime.substring(11, 16) : baseTimeStr;

                if (baseTimeStr) {
                    tempDepartures.push({
                        time: liveTimeStr, originalTime: baseTimeStr, isDelayed: baseTimeStr !== liveTimeStr,
                        flight: item.flight_iata.replace(/\s/g, ''), airline: item.airline_iata || 'N/A',
                        route: destCode, isKorea: KOREA_AIRPORTS.includes(destCode), seats: estimateSeats(destCode)
                    });
                }
            });
        }

        cachedArrivals = tempArrivals.filter((v,i,a)=>a.findIndex(t=>(t.flight === v.flight))===i).sort((a, b) => a.time.localeCompare(b.time));
        cachedDepartures = tempDepartures.filter((v,i,a)=>a.findIndex(t=>(t.flight === v.flight))===i).sort((a, b) => a.time.localeCompare(b.time));
        lastFetchTimestamp = Date.now();
    } catch (error) {
        console.error('API 호출 실패:', error.message);
    }
}

app.get('/api/hanoi-schedules', async (req, res) => {
    const queryDate = req.query.date; 
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const isToday = (queryDate === todayStr);
    
    // 핵심 로직: 오늘이면 100% 실시간 API 제공, 미래면 고정 스케줄 제공
    if (isToday) {
        const now = Date.now();
        if (now - lastFetchTimestamp > 14400000 || (cachedArrivals.length === 0 && cachedDepartures.length === 0)) {
            await fetchFlightsFromAirLabs();
        }
        res.json({ success: true, arrivals: cachedArrivals, departures: cachedDepartures, isToday: true });
    } else {
        // 미래 날짜 조회 시 예측 고정 스케줄 반환 (지연 없음)
        const futureArrivals = baseArrivalSchedule.map(f => ({...f, originalTime: f.time, isDelayed: false}));
        const futureDepartures = baseDepartureSchedule.map(f => ({...f, originalTime: f.time, isDelayed: false}));
        res.json({ success: true, arrivals: futureArrivals, departures: futureDepartures, isToday: false });
    }
});

// 방문자 카운트 (유지)
app.get('/api/visit', async (req, res) => {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    try {
        const { data } = await axios.get(`${FIREBASE_URL}/visitors.json`);
        let total = (data && data.total) ? data.total : 0;
        let daily = (data && data.daily && data.daily[todayStr]) ? data.daily[todayStr] : 0;
        total++; daily++;
        await axios.patch(`${FIREBASE_URL}/visitors.json`, { total: total, [`daily/${todayStr}`]: daily });
        res.json({ success: true, total, daily });
    } catch (error) {
        res.json({ success: false, total: 0, daily: 0 });
    }
});

app.listen(PORT, () => {
    console.log(`서버 구동 완료 (포트: ${PORT})`);
});
