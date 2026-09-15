const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
// 웹사이트 화면 파일(public 폴더)을 방문자에게 제공하도록 설정
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
const AIRLABS_API_KEY = 'd702a552-a0b5-4e04-b840-08cb220cb353'; 

const VIETNAM_DOMESTIC_AIRPORTS = [
    'SGN', 'DAD', 'CXR', 'PQC', 'DLI', 'HUI', 'VDO', 'VDH', 
    'UIH', 'VCL', 'THD', 'VII', 'PXU', 'BMV', 'TBB', 'VKG', 
    'VCA', 'VCS', 'DIN', 'HPH'
];

// (이전과 동일한 baseSchedule 데이터 유지 - 길이상 생략 없이 모두 넣으셔야 합니다)
const baseSchedule = [
    { time: '00:10', flight: 'VJ961', airline: 'VietJetAir', origin: 'ICN', isKorea: true, seats: 200 },
    { time: '00:35', flight: '7C2803', airline: 'Jeju Air', origin: 'ICN', isKorea: true, seats: 189 },
    { time: '01:05', flight: 'TW161', airline: 'T\'way Air', origin: 'ICN', isKorea: true, seats: 189 },
    { time: '01:50', flight: 'LJ057', airline: 'Jin Air', origin: 'ICN', isKorea: true, seats: 189 },
    { time: '07:30', flight: 'VN385', airline: 'Vietnam Airlines', origin: 'HND', isKorea: false, seats: 305 },
    { time: '08:25', flight: 'SU0294', airline: 'Aeroflot', origin: 'SVO', isKorea: false, seats: 300 },
    { time: '09:30', flight: 'VN417', airline: 'Vietnam Airlines', origin: 'ICN', isKorea: true, seats: 305 },
    { time: '09:40', flight: 'TG560', airline: 'Thai Airways', origin: 'BKK', isKorea: false, seats: 280 },
    { time: '10:05', flight: 'CZ8475', airline: 'China Southern', origin: 'CAN', isKorea: false, seats: 189 },
    { time: '10:30', flight: 'OZ727', airline: 'Asiana Airlines', origin: 'ICN', isKorea: true, seats: 280 },
    { time: '10:45', flight: 'KE455', airline: 'Korean Air', origin: 'ICN', isKorea: true, seats: 290 },
    { time: '11:15', flight: 'SQ192', airline: 'Singapore Airlines', origin: 'SIN', isKorea: false, seats: 305 },
    { time: '11:40', flight: 'BR397', airline: 'EVA Air', origin: 'TPE', isKorea: false, seats: 250 },
    { time: '12:05', flight: 'VN427', airline: 'Vietnam Airlines', origin: 'PUS', isKorea: true, seats: 200 },
    { time: '12:30', flight: 'MH752', airline: 'Malaysia Airlines', origin: 'KUL', isKorea: false, seats: 160 },
    { time: '13:10', flight: 'VJ902', airline: 'VietJetAir', origin: 'BKK', isKorea: false, seats: 200 },
    { time: '13:30', flight: 'JL751', airline: 'Japan Airlines', origin: 'NRT', isKorea: false, seats: 290 },
    { time: '14:10', flight: 'CX741', airline: 'Cathay Pacific', origin: 'HKG', isKorea: false, seats: 330 },
    { time: '14:40', flight: 'VJ939', airline: 'VietJetAir', origin: 'TPE', isKorea: false, seats: 200 },
    { time: '15:20', flight: 'TR300', airline: 'Scoot', origin: 'SIN', isKorea: false, seats: 230 },
    { time: '15:50', flight: 'CI793', airline: 'China Airlines', origin: 'TPE', isKorea: false, seats: 300 },
    { time: '16:30', flight: 'AK512', airline: 'AirAsia', origin: 'KUL', isKorea: false, seats: 180 },
    { time: '17:15', flight: 'FD314', airline: 'Thai AirAsia', origin: 'BKK', isKorea: false, seats: 180 },
    { time: '18:10', flight: 'VN311', airline: 'Vietnam Airlines', origin: 'NRT', isKorea: false, seats: 305 },
    { time: '18:40', flight: 'CX743', airline: 'Cathay Pacific', origin: 'HKG', isKorea: false, seats: 330 },
    { time: '19:15', flight: 'JX715', airline: 'STARLUX', origin: 'TPE', isKorea: false, seats: 188 },
    { time: '20:10', flight: 'VN593', airline: 'Vietnam Airlines', origin: 'HKG', isKorea: false, seats: 200 },
    { time: '20:45', flight: 'OZ731', airline: 'Asiana Airlines', origin: 'ICN', isKorea: true, seats: 280 },
    { time: '21:30', flight: 'VN415', airline: 'Vietnam Airlines', origin: 'ICN', isKorea: true, seats: 305 },
    { time: '22:10', flight: 'VJ983', airline: 'VietJetAir', origin: 'PUS', isKorea: true, seats: 200 },
    { time: '22:30', flight: 'BX791', airline: 'Air Busan', origin: 'PUS', isKorea: true, seats: 195 },
    { time: '22:40', flight: '7C2801', airline: 'Jeju Air', origin: 'ICN', isKorea: true, seats: 189 },
    { time: '23:05', flight: 'KE441', airline: 'Korean Air', origin: 'ICN', isKorea: true, seats: 280 },
    { time: '23:15', flight: 'OZ733', airline: 'Asiana Airlines', origin: 'ICN', isKorea: true, seats: 200 },
    { time: '23:25', flight: 'QR976', airline: 'Qatar Airways', origin: 'DOH', isKorea: false, seats: 360 },
    { time: '23:45', flight: 'EK394', airline: 'Emirates', origin: 'DXB', isKorea: false, seats: 360 }
];

let liveFlightsMap = new Map();
let lastFetchTimestamp = 0; 
let lastFetchTimeString = null;

async function fetchFlightsFromAirLabs() {
    try {
        const url = `https://airlabs.co/api/v9/schedules?arr_icao=VVNB&api_key=${AIRLABS_API_KEY}`;
        const response = await axios.get(url);
        
        if (response.data && response.data.response) {
            const arrivals = response.data.response;
            liveFlightsMap.clear();
            
            arrivals.forEach(item => {
                const originCode = item.dep_iata || '';
                if (VIETNAM_DOMESTIC_AIRPORTS.includes(originCode)) return;
                
                const flightNum = item.flight_iata || item.flight_number;
                const estTimeStr = item.arr_estimated || item.arr_time;
                if (!flightNum || !estTimeStr) return;
                
                const timeOnly = estTimeStr.length >= 16 ? estTimeStr.substring(11, 16) : null;
                if (timeOnly) {
                    liveFlightsMap.set(flightNum.replace(/\s/g, ''), timeOnly);
                }
            });
            lastFetchTimestamp = Date.now(); // 타이머 대신 갱신 완료된 정확한 밀리초 저장
            lastFetchTimeString = new Date().toLocaleString();
            console.log(`[데이터 갱신 완료] ${lastFetchTimeString}`);
        }
    } catch (error) {
        console.error('API 호출 실패:', error.message);
    }
}

// 📌 핵심 변경: 타이머(setInterval) 삭제하고 요청이 올 때마다 검사
app.get('/api/hanoi-arrivals', async (req, res) => {
    const queryDate = req.query.date; 
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const isToday = (queryDate === todayStr);
    
    // 오늘 날짜 조회 시, 마지막 갱신으로부터 4시간(14,400,000ms)이 지났거나 데이터가 없으면 API 호출
    if (isToday) {
        const now = Date.now();
        if (now - lastFetchTimestamp > 14400000) {
            await fetchFlightsFromAirLabs();
        }
    }
    
    let finalSchedule = [];

    baseSchedule.forEach(base => {
        let flightTime = base.time;
        let isDelayed = false;

        if (isToday) {
            const liveTime = liveFlightsMap.get(base.flight.replace(/\s/g, ''));
            if (liveTime && liveTime !== base.time) {
                flightTime = liveTime;
                isDelayed = true;
            }
        }

        finalSchedule.push({
            ...base,
            time: flightTime,
            originalTime: base.time,
            isDelayed: isDelayed
        });
    });

    finalSchedule.sort((a, b) => a.time.localeCompare(b.time));

    res.json({
        success: true,
        data: finalSchedule,
        isToday: isToday
    });
});

app.listen(PORT, () => {
    console.log(`서버 구동 완료 (포트: ${PORT})`);
});
