const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
// 본인의 AirLabs API 키를 아래에 입력하세요.
const AIRLABS_API_KEY = 'd702a552-a0b5-4e04-b840-08cb220cb353'; 

const VIETNAM_DOMESTIC_AIRPORTS = [
    'SGN', 'DAD', 'CXR', 'PQC', 'DLI', 'HUI', 'VDO', 'VDH', 
    'UIH', 'VCL', 'THD', 'VII', 'PXU', 'BMV', 'TBB', 'VKG', 
    'VCA', 'VCS', 'DIN', 'HPH'
];

// 1. 하노이 공항 T2 국제선 도착(Arrival) 스케줄 전체 (사실을 바탕으로 한 예상 통계치)
const baseArrivalSchedule = [
    { time: '00:10', flight: 'VJ961', airline: 'VietJetAir', route: 'ICN', isKorea: true, seats: 200 },
    { time: '00:35', flight: '7C2803', airline: 'Jeju Air', route: 'ICN', isKorea: true, seats: 189 },
    { time: '01:05', flight: 'TW161', airline: 'T\'way Air', route: 'ICN', isKorea: true, seats: 189 },
    { time: '01:50', flight: 'LJ057', airline: 'Jin Air', route: 'ICN', isKorea: true, seats: 189 },
    { time: '07:30', flight: 'VN385', airline: 'Vietnam Airlines', route: 'HND', isKorea: false, seats: 305 },
    { time: '08:25', flight: 'SU0294', airline: 'Aeroflot', route: 'SVO', isKorea: false, seats: 300 },
    { time: '09:30', flight: 'VN417', airline: 'Vietnam Airlines', route: 'ICN', isKorea: true, seats: 305 },
    { time: '09:40', flight: 'TG560', airline: 'Thai Airways', route: 'BKK', isKorea: false, seats: 280 },
    { time: '10:05', flight: 'CZ8475', airline: 'China Southern', route: 'CAN', isKorea: false, seats: 189 },
    { time: '10:30', flight: 'OZ727', airline: 'Asiana Airlines', route: 'ICN', isKorea: true, seats: 280 },
    { time: '10:45', flight: 'KE455', airline: 'Korean Air', route: 'ICN', isKorea: true, seats: 290 },
    { time: '11:15', flight: 'SQ192', airline: 'Singapore Airlines', route: 'SIN', isKorea: false, seats: 305 },
    { time: '11:40', flight: 'BR397', airline: 'EVA Air', route: 'TPE', isKorea: false, seats: 250 },
    { time: '12:05', flight: 'VN427', airline: 'Vietnam Airlines', route: 'PUS', isKorea: true, seats: 200 },
    { time: '12:30', flight: 'MH752', airline: 'Malaysia Airlines', route: 'KUL', isKorea: false, seats: 160 },
    { time: '13:10', flight: 'VJ902', airline: 'VietJetAir', route: 'BKK', isKorea: false, seats: 200 },
    { time: '13:30', flight: 'JL751', airline: 'Japan Airlines', route: 'NRT', isKorea: false, seats: 290 },
    { time: '14:10', flight: 'CX741', airline: 'Cathay Pacific', route: 'HKG', isKorea: false, seats: 330 },
    { time: '14:40', flight: 'VJ939', airline: 'VietJetAir', route: 'TPE', isKorea: false, seats: 200 },
    { time: '15:20', flight: 'TR300', airline: 'Scoot', route: 'SIN', isKorea: false, seats: 230 },
    { time: '15:50', flight: 'CI793', airline: 'China Airlines', route: 'TPE', isKorea: false, seats: 300 },
    { time: '16:30', flight: 'AK512', airline: 'AirAsia', route: 'KUL', isKorea: false, seats: 180 },
    { time: '17:15', flight: 'FD314', airline: 'Thai AirAsia', route: 'BKK', isKorea: false, seats: 180 },
    { time: '18:10', flight: 'VN311', airline: 'Vietnam Airlines', route: 'NRT', isKorea: false, seats: 305 },
    { time: '18:40', flight: 'CX743', airline: 'Cathay Pacific', route: 'HKG', isKorea: false, seats: 330 },
    { time: '19:15', flight: 'JX715', airline: 'STARLUX', route: 'TPE', isKorea: false, seats: 188 },
    { time: '20:10', flight: 'VN593', airline: 'Vietnam Airlines', route: 'HKG', isKorea: false, seats: 200 },
    { time: '20:45', flight: 'OZ731', airline: 'Asiana Airlines', route: 'ICN', isKorea: true, seats: 280 },
    { time: '21:30', flight: 'VN415', airline: 'Vietnam Airlines', route: 'ICN', isKorea: true, seats: 305 },
    { time: '22:10', flight: 'VJ983', airline: 'VietJetAir', route: 'PUS', isKorea: true, seats: 200 },
    { time: '22:30', flight: 'BX791', airline: 'Air Busan', route: 'PUS', isKorea: true, seats: 195 },
    { time: '22:40', flight: '7C2801', airline: 'Jeju Air', route: 'ICN', isKorea: true, seats: 189 },
    { time: '23:05', flight: 'KE441', airline: 'Korean Air', route: 'ICN', isKorea: true, seats: 280 },
    { time: '23:15', flight: 'OZ733', airline: 'Asiana Airlines', route: 'ICN', isKorea: true, seats: 200 },
    { time: '23:25', flight: 'QR976', airline: 'Qatar Airways', route: 'DOH', isKorea: false, seats: 360 },
    { time: '23:45', flight: 'EK394', airline: 'Emirates', route: 'DXB', isKorea: false, seats: 360 }
];

// 2. 하노이 공항 T2 국제선 출발(Departure) 스케줄 추가 (예상 통계치)
const baseDepartureSchedule = [
    { time: '00:30', flight: 'VJ960', airline: 'VietJetAir', route: 'ICN', isKorea: true, seats: 200 },
    { time: '01:15', flight: 'KE442', airline: 'Korean Air', route: 'ICN', isKorea: true, seats: 280 },
    { time: '01:50', flight: '7C2804', airline: 'Jeju Air', route: 'ICN', isKorea: true, seats: 189 },
    { time: '08:15', flight: 'VN384', airline: 'Vietnam Airlines', route: 'HND', isKorea: false, seats: 305 },
    { time: '10:05', flight: 'VN416', airline: 'Vietnam Airlines', route: 'ICN', isKorea: true, seats: 305 },
    { time: '12:00', flight: 'OZ728', airline: 'Asiana Airlines', route: 'ICN', isKorea: true, seats: 280 },
    { time: '14:30', flight: 'JL752', airline: 'Japan Airlines', route: 'NRT', isKorea: false, seats: 290 },
    { time: '23:15', flight: 'VN414', airline: 'Vietnam Airlines', route: 'ICN', isKorea: true, seats: 305 },
    { time: '23:50', flight: 'OZ734', airline: 'Asiana Airlines', route: 'ICN', isKorea: true, seats: 200 }
];

let liveArrivalsMap = new Map();
let liveDeparturesMap = new Map();
let lastFetchTimestamp = 0; 
let lastFetchTimeString = null;

async function fetchFlightsFromAirLabs() {
    try {
        const [arrRes, depRes] = await Promise.all([
            axios.get(`https://airlabs.co/api/v9/schedules?arr_icao=VVNB&api_key=${AIRLABS_API_KEY}`),
            axios.get(`https://airlabs.co/api/v9/schedules?dep_icao=VVNB&api_key=${AIRLABS_API_KEY}`)
        ]);
        
        liveArrivalsMap.clear();
        if (arrRes.data && arrRes.data.response) {
            arrRes.data.response.forEach(item => {
                const originCode = item.dep_iata || '';
                if (VIETNAM_DOMESTIC_AIRPORTS.includes(originCode)) return;
                const timeOnly = item.arr_estimated || item.arr_time;
                if (item.flight_iata && timeOnly) {
                    liveArrivalsMap.set(item.flight_iata.replace(/\s/g, ''), timeOnly.length >= 16 ? timeOnly.substring(11, 16) : null);
                }
            });
        }

        liveDeparturesMap.clear();
        if (depRes.data && depRes.data.response) {
            depRes.data.response.forEach(item => {
                const destCode = item.arr_iata || '';
                if (VIETNAM_DOMESTIC_AIRPORTS.includes(destCode)) return;
                const timeOnly = item.dep_estimated || item.dep_time;
                if (item.flight_iata && timeOnly) {
                    liveDeparturesMap.set(item.flight_iata.replace(/\s/g, ''), timeOnly.length >= 16 ? timeOnly.substring(11, 16) : null);
                }
            });
        }

        lastFetchTimestamp = Date.now();
        lastFetchTimeString = new Date().toLocaleString();
        console.log(`[데이터 갱신 완료] ${lastFetchTimeString}`);
    } catch (error) {
        console.error('API 호출 실패:', error.message);
    }
}

app.get('/api/hanoi-schedules', async (req, res) => {
    const queryDate = req.query.date; 
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const isToday = (queryDate === todayStr);
    
    if (isToday) {
        const now = Date.now();
        if (now - lastFetchTimestamp > 14400000) {
            await fetchFlightsFromAirLabs();
        }
    }
    
    let finalArrivals = [];
    baseArrivalSchedule.forEach(base => {
        let flightTime = base.time;
        let isDelayed = false;
        if (isToday) {
            const liveTime = liveArrivalsMap.get(base.flight.replace(/\s/g, ''));
            if (liveTime && liveTime !== base.time) { flightTime = liveTime; isDelayed = true; }
        }
        finalArrivals.push({ ...base, time: flightTime, originalTime: base.time, isDelayed: isDelayed });
    });

    let finalDepartures = [];
    baseDepartureSchedule.forEach(base => {
        let flightTime = base.time;
        let isDelayed = false;
        if (isToday) {
            const liveTime = liveDeparturesMap.get(base.flight.replace(/\s/g, ''));
            if (liveTime && liveTime !== base.time) { flightTime = liveTime; isDelayed = true; }
        }
        finalDepartures.push({ ...base, time: flightTime, originalTime: base.time, isDelayed: isDelayed });
    });

    finalArrivals.sort((a, b) => a.time.localeCompare(b.time));
    finalDepartures.sort((a, b) => a.time.localeCompare(b.time));

    res.json({
        success: true,
        arrivals: finalArrivals,
        departures: finalDepartures,
        isToday: isToday
    });
});

app.listen(PORT, () => {
    console.log(`서버 구동 완료 (포트: ${PORT})`);
});
