    let members = [];
    let historyLastRound = [];
    let groupOfFour = []; 
    let teamSaved = [];   
    let pairHistory = {};    

    window.onload = function() {
        if (localStorage.getItem('badminton_members')) {
            members = JSON.parse(localStorage.getItem('badminton_members'));
            historyLastRound = JSON.parse(localStorage.getItem('badminton_historyLastRound')) || [];
            groupOfFour = JSON.parse(localStorage.getItem('badminton_groupOfFour')) || [];
            teamSaved = JSON.parse(localStorage.getItem('badminton_teamSaved')) || [];
            pairHistory = JSON.parse(localStorage.getItem('badminton_pairHistory')) || {};
            
            if (teamSaved.length === 4) {
                document.getElementById('tA').innerHTML = `${teamSaved[0].name}<br>${teamSaved[1].name}`;
                document.getElementById('tB').innerHTML = `${teamSaved[2].name}<br>${teamSaved[3].name}`;
                document.getElementById('courtArea').style.display = 'block';
            }
            refreshScreen();
        }
    };

    function saveData() {
        localStorage.setItem('badminton_members', JSON.stringify(members));
        localStorage.setItem('badminton_historyLastRound', JSON.stringify(historyLastRound));
        localStorage.setItem('badminton_groupOfFour', JSON.stringify(groupOfFour));
        localStorage.setItem('badminton_teamSaved', JSON.stringify(teamSaved));
        localStorage.setItem('badminton_pairHistory', JSON.stringify(pairHistory));
    }

    function addFriend() {
        const input = document.getElementById('nameIn');
        const name = input.value.trim();
        
        if (name === "") return;
        if (members.some(m => m.name === name)) {
            alert("ชื่อนี้ซ้ำ!");
            return;
        }

        members.push({ name: name, count: 0 });
        pairHistory[name] = {};
        
        input.value = "";
        refreshScreen();
        saveData();
    }

    function removeFriend(targetName) {
        members = members.filter(m => m.name !== targetName);
        historyLastRound = historyLastRound.filter(n => n !== targetName);
        groupOfFour = groupOfFour.filter(m => m.name !== targetName);
        
        delete pairHistory[targetName];
        for (let name in pairHistory) {
            if (pairHistory[name][targetName]) delete pairHistory[name][targetName];
        }
        
        if (teamSaved.some(m => m.name === targetName)) {
            teamSaved = [];
            document.getElementById('courtArea').style.display = 'none';
        }

        refreshScreen();
        saveData();
    }

    function refreshScreen() {
        const container = document.getElementById('showFriends');
        container.innerHTML = "";
        members.forEach(m => {
            container.innerHTML += `
                <span class="player-box">
                    ${m.name}
                    <button class="btn-del" onclick="removeFriend('${m.name}')">×</button>
                </span>`;
        });

        const tableBody = document.getElementById('queueTable');
        tableBody.innerHTML = "";
        
        let sorted = [...members].sort((a,b) => a.count - b.count);
        
        sorted.forEach(m => {
            const statusText = historyLastRound.includes(m.name) 
                ? '<span class="status-playing">กำลังเล่น</span>' 
                : '<span class="status-waiting">รอคิว</span>';
            tableBody.innerHTML += `
                <tr>
                    <td style="text-align: left; padding-left: 20px;"><strong>${m.name}</strong></td>
                    <td><span style="font-weight: 600;">${m.count}</span> เกม</td>
                    <td>${statusText}</td>
                </tr>
            `;
        });
    }

    function startMatch() {
        if (members.length < 4) {
            alert("ต้องมีคนอย่างน้อย 4 คนขึ้นไปตอนนี้มีแค่ " + members.length + " คน");
            return;
        }

        let nonPlayers = [];
        let justPlayed = [];

        members.forEach(m => {
            if (historyLastRound.includes(m.name)) {
                justPlayed.push(m);
            } else {
                nonPlayers.push(m);
            }
        });

        nonPlayers.sort(() => Math.random() - 0.5).sort((a, b) => a.count - b.count);
        justPlayed.sort(() => Math.random() - 0.5).sort((a, b) => a.count - b.count);

        let queue = [...nonPlayers, ...justPlayed];
        groupOfFour = queue.slice(0, 4);

        mixTeams(groupOfFour, true); 
    }

    function redoMatch() {
        if (groupOfFour.length < 4 || teamSaved.length < 4) return;

        minusHistory(teamSaved[0].name, teamSaved[1].name);
        minusHistory(teamSaved[2].name, teamSaved[3].name);

        members.forEach(m => {
            if (historyLastRound.includes(m.name)) m.count -= 1;
        });

        historyLastRound = [];
        mixTeams(groupOfFour, true);
    }

    function mixTeams(fourPeople, counting) {
        let p1 = fourPeople[0], p2 = fourPeople[1], p3 = fourPeople[2], p4 = fourPeople[3];

        function checkPair(a, b) { return pairHistory[a][b] || 0; }

        let s1 = checkPair(p1.name, p2.name) + checkPair(p3.name, p4.name);
        let s2 = checkPair(p1.name, p3.name) + checkPair(p2.name, p4.name);
        let s3 = checkPair(p1.name, p4.name) + checkPair(p2.name, p3.name);

        let ways = [];
        let lowest = Math.min(s1, s2, s3);
        
        if (s1 === lowest) ways.push([p1, p2, p3, p4]);
        if (s2 === lowest) ways.push([p1, p3, p2, p4]);
        if (s3 === lowest) ways.push([p1, p4, p2, p3]);

        let final = ways[Math.floor(Math.random() * ways.length)];
        teamSaved = [...final];

        document.getElementById('tA').innerHTML = `${final[0].name}<br>${final[1].name}`;
        document.getElementById('tB').innerHTML = `${final[2].name}<br>${final[3].name}`;
        document.getElementById('courtArea').style.display = 'block';

        if (counting) {
            addHistory(final[0].name, final[1].name);
            addHistory(final[2].name, final[3].name);

            historyLastRound = final.map(m => m.name);
            members.forEach(m => {
                if (historyLastRound.includes(m.name)) m.count += 1;
            });
            refreshScreen();
        }
        saveData();
    }

    function addHistory(a, b) {
        pairHistory[a][b] = (pairHistory[a][b] || 0) + 1;
        pairHistory[b][a] = (pairHistory[b][a] || 0) + 1;
    }

    function minusHistory(a, b) {
        if (pairHistory[a] && pairHistory[a][b]) pairHistory[a][b] -= 1;
        if (pairHistory[b] && pairHistory[b][a]) pairHistory[b][a] -= 1;
    }

    // ฟังก์ชันสำหรับปุ่ม Reset: ล้างประวัติการเล่น แต่เก็บรายชื่อไว้
    function clearHistoryOnly() {
        if (confirm("ต้องการรีเซ็ตประวัติการจับคู่ใช่ไหม?")) {
            members.forEach(m => m.count = 0);
            historyLastRound = [];
            groupOfFour = [];
            teamSaved = [];
            pairHistory = {};
            members.forEach(m => { pairHistory[m.name] = {}; });
            document.getElementById('courtArea').style.display = 'none';
            refreshScreen();
            saveData();
        }
    }

    // ฟังก์ชันสำหรับปุ่ม Clear: ลบรายชื่อเพื่อนทั้งหมดออกจากระบบ
    function clearEverything() {
        if (confirm("ต้องการลบรายชื่อใช่ไหม?")) {
            members = [];
            historyLastRound = [];
            groupOfFour = [];
            teamSaved = [];
            pairHistory = {};
            document.getElementById('courtArea').style.display = 'none';
            refreshScreen();
            localStorage.clear();
        }
    }