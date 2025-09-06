(async() => {
    const { PublicKey, Connection, Transaction, SystemProgram, TransactionInstruction } = solanaWeb3;

    const MOVES = {
        0: "Rock",
        1: "Paper",
        2: "Scissors"
    }
    const PROGRAM_ID = new PublicKey("BEGGHHUjM1u3okqQreDkqM11y7hhk1amfBrWDQTN4XhJ");
    const NETWORK = "https://crimson-withered-aura.solana-devnet.quiknode.pro/d77410756a6a1e3b01afdb3a3d008812c6bba779/";
    const connection = new Connection(NETWORK, "confirmed");

    const connectBtn = document.getElementById("connectBtn");

    document.querySelectorAll(".connectBtn").forEach(btn => {
        btn.onclick = connectBtn.onclick;
    });

    const walletInfo = document.getElementById("walletInfo");
    const walletBalance = document.getElementById("walletBalance");
    const gameDiv = document.getElementById("game");
    const moveSelect = document.getElementById("moveSelect");
    const playBtn = document.getElementById("playBtn");
    const resultDiv = document.getElementById("result");
    const scoreDiv = document.getElementById("score");
    const SRC = document.getElementById("SRC");
    const historyListDiv = document.getElementById("historyList"); 
    const firebaseSection = document.getElementById("firebaseSection");
    const nicknameInput = document.getElementById("nicknameInput");
    const registerFirebaseBtn = document.getElementById("registerFirebaseBtn");
    const firebaseStatus = document.getElementById("firebaseStatus");

    const rankingTable = document.getElementById("rankingTable");
    const rankingBody = document.getElementById("rankingBody");
    const rankingStatus = document.getElementById("rankingStatus");
    const refreshRankingBtn = document.getElementById("refreshRankingBtn");

    const SCORE_SIZE = 8;
    const HISTORY_SIZE = 10;
    const RECORD_SIZE = 3;
    const DATA_SIZE = SCORE_SIZE + 1 + (HISTORY_SIZE * RECORD_SIZE);

    let provider = null;
    let publicKey = null;

    //==========================================================================// 

    function getPDA(userPubkey) {
        return PublicKey.findProgramAddress(
            [new TextEncoder().encode("score"), userPubkey.toBuffer()],
            PROGRAM_ID
        );
    }

    //==========================================================================// 

    function parseScore(data) {
        if (data.length < SCORE_SIZE) return 0;
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const low = view.getUint32(0, true);
        const high = view.getUint32(4, true);
        return high * 2 ** 32 + low;
    }

    //==========================================================================// 

    function parseHistory(data) {
        console.log(data)
        if (data.length < DATA_SIZE) return [];

        const history_len = data[SCORE_SIZE];
        if (history_len === 0) return [];

        const history = [];
        const movesMap = ["Rock", "Paper", "Scissors"];
        const resultsMap = ["Lost", "Draw", "Won"];

        for (let i = 0; i < history_len; i++) {
            const base = SCORE_SIZE + 1 + i * RECORD_SIZE;
            const player_move = data[base];
            const program_move = data[base + 1];
            const result = data[base + 2];

            history.push({
                round: i + 1,
                playerMove: movesMap[player_move]??"?",
                programMove: movesMap[program_move]??"?",
                result: resultsMap[result]??"?"
            });
        }

        return history;
    }

    //==========================================================================// 
    function renderCharts(history) {
    const choiceCounts = { Rock: 0, Paper: 0, Scissors: 0 };
    const winCounts = { Rock: 0, Paper: 0, Scissors: 0 };

    // contabiliza histórico
    history.forEach(({ playerMove, result }) => {
        if (choiceCounts[playerMove] !== undefined) {
            choiceCounts[playerMove]++;
            if (result === "Won") {
                winCounts[playerMove]++;
            }
        }
    });

    // dados
    const labels = ["Rock", "Paper", "Scissors"];
    const choicesValues = [choiceCounts.Rock, choiceCounts.Paper, choiceCounts.Scissors];
    const winsValues = [winCounts.Rock, winCounts.Paper, winCounts.Scissors];
    const colors = ["#8aa6e6", "#d0aa68", "#eb7494"];

    // ============================
    // gráfico 1 - Player Choices
    // ============================
    var chartDom1 = document.getElementById("choicesChart");
    var choicesChart = echarts.init(chartDom1);
    var option1 = {
        aria: {
    show: true
  },
        title: {
            text: "Player Choices",
            left: "center",
            textStyle: {
                color: "#fec76f",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: 18
            }
        },
        tooltip: {},
        grid: {
    left: '0%',
    right: '5%',
    bottom: '0%',
    containLabel: true
  },
        xAxis: {
            type: "category",
            data: labels,
            axisLabel: {
                color: "#616161",
                fontFamily: "Orbitron, Arial, sans-serif",
                fontWeight: "bold"
            },
            axisLine: { lineStyle: { color: "#616161" } },
        },
        yAxis: {
            type: "value",
            minInterval: 1,
            axisLabel: {
                color: "#616161",
                fontFamily: "Orbitron, Arial, sans-serif",
                fontWeight: "bold"
            },
            splitLine: { lineStyle: { color: "#616161" } }
        },
        series: [{
            data: choicesValues,
            type: "bar",
            itemStyle: {
                color: function(params) {
                    return colors[params.dataIndex];
                }
            }
        }]
    };

    choicesChart.setOption(option1);

    // ============================
    // gráfico 2 - Wins per Choice
    // ============================
    var chartDom2 = document.getElementById("winsChart");
    var winsChart = echarts.init(chartDom2);

    var option2 = {
        aria: {
        show: true
            },
        title: {
            text: "Wins per Choice",
            left: "center",
            textStyle: {
                color: "#fec76f",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: 18
            }
        },
        tooltip: {},
        grid: {
    left: '0%',
    right: '5%',
    bottom: '0%',
    containLabel: true
  },
        xAxis: {
            type: "category",
            data: labels,
            axisLabel: {
                color: "#616161",
                fontFamily: "Orbitron, Arial, sans-serif",
                fontWeight: "bold"
            },
            axisLine: { lineStyle: { color: "#616161" } },
        },
        yAxis: {
            type: "value",
            minInterval: 1,
            axisLabel: {color: "#616161", fontFamily: "Orbitron, Arial, sans-serif", fontWeight: "bold"},
            splitLine: {lineStyle:{color:"#616161"} } },
        series: [{
            data: winsValues,
            type: "bar",
            itemStyle: {
                color: function(params) {
                    return colors[params.dataIndex];
                }
            }
        }]
    };

    winsChart.setOption(option2);

    // resize responsivo
    window.addEventListener('resize', function () {
        choicesChart.resize({});
        winsChart.resize({});
    });
}


    //==========================================================================// 

    async function updateScore() {
        const [pda] = await getPDA(publicKey);
        try {
            const accountInfo = await connection.getAccountInfo(pda);

            if (!accountInfo) {
                scoreDiv.innerText = "Score: 0 (conta PDA não existe)";
                return 0;
            }

            const score = parseScore(accountInfo.data);
            scoreDiv.innerHTML = `<div class="scoretop">Score</div><div>${score}</div>`;
            return score;
        } catch (e) {
            scoreDiv.innerText = "Erro ao buscar score";
            return 0;
        }
    }

    //==========================================================================//  

    let currentPage = 1;
    const recordsPerPage = 10;
    let fullHistory = [];

    //==========================================================================// 
    function renderHistoryPage(page) {
        const start = (page - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const pageHistory = fullHistory.slice(start, end);

        let tableHTML = `
    <table class="history-table">
      <thead>
        <tr>
          <th>Round</th>
          <th>Your Move</th>
          <th>Program Move</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
  `;

        pageHistory.forEach((entry, index) => {
            const globalIndex = start + index;
            const roundNumber = fullHistory.length - globalIndex;

            tableHTML += `
      <tr>
        <td>${roundNumber}</td>
        <td>${entry.playerMove}</td>
        <td>${entry.programMove}</td>
        <td>${entry.result}</td>
      </tr>
    `;
        });

        tableHTML += "</tbody></table>";

        historyListDiv.innerHTML = tableHTML;
const totalPlays = fullHistory.length;
updatePlaysProgress(totalPlays);
        document.getElementById("prevBtn").disabled = (page === 1);
        document.getElementById("nextBtn").disabled = (end >= fullHistory.length);

    }

const levels = [
  { name: "01", plays: 3 },
  { name: "02", plays: 6 },
  { name: "03", plays: 15 },
  { name: "04", plays: 20 },
  { name: "05", plays: 30 },
  { name: "06", plays: 40 },
  { name: "07", plays: 55 },
  { name: "08", plays: 70 },
  { name: "09", plays: 80 },
  { name: "10", plays: 100 }
];

function updatePlaysProgress(totalPlays) {
  const progressBar = document.getElementById("playsProgressBar");

  const markersDiv = document.getElementById("levelMarkers");
const lvlppDiv = document.getElementById("lvlpp");
  // Atualiza a barra
  const percentage = Math.min((totalPlays / 100) * 100, 100);
  progressBar.style.width = percentage + "%";

  // Limpa marcadores antigos
  markersDiv.innerHTML = "";

  levels.forEach(level => {
    const marker = document.createElement("div");
    marker.innerText = level.name;
    marker.style.position = "absolute";
    marker.style.top = "19px"; // acima da barra
    marker.style.display = "flex";
    marker.style.transform = "translateX(-50%)";
    marker.style.fontSize = "0.8rem";
    marker.style.fontWeight = "bold";
    marker.style.height = "30px";
    marker.style.width = "30px";
    marker.style.textAlign = "center";
    marker.style.alignItems = "center";
    marker.style.justifyContent = "center";
    marker.style.borderRadius = "20px";
    marker.style.border = "1px solid black";

    // posição horizontal
    const markerPercent = Math.min((level.plays / 100) * 100, 100);
    marker.style.left = markerPercent + "%";

    // cor: verde se atingiu, cinza se não
    marker.style.background = totalPlays >= level.plays ? "rgb(76, 175, 80)" : "#888";
    marker.style.color = "#fff";

    markersDiv.appendChild(marker);
  });
  // === Calcula o nível atual do jogador ===
  let currentLevel = "00"; // padrão antes do lvl 1
  for (const level of levels) {
    if (totalPlays >= level.plays) {
      currentLevel = level.name;
    }
  }

  // Atualiza o HTML do nível
  lvlppDiv.innerHTML = `
    <div class="lvlp">Level</div><div>${currentLevel}</div>
  `;
}
    //==========================================================================//  

    async function updateHistory() {
        const [pda] = await getPDA(publicKey);
        try {
            const accountInfo = await connection.getAccountInfo(pda);
            if (!accountInfo) {
                historyListDiv.innerHTML = "<em>No history available.</em>";
                return;
            }
            const history = parseHistory(accountInfo.data);
            if (history.length === 0) {
                historyListDiv.innerHTML = "<em>No history available.</em>";
                return;
            }

            fullHistory = history.slice().reverse();

            currentPage = 1;
            renderHistoryPage(currentPage);

            renderCharts(fullHistory);

        } catch (e) {
            historyListDiv.innerHTML = "<em>Error fetching history</em>";
        }
    }

    //==========================================================================//  

    document.getElementById("prevBtn").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderHistoryPage(currentPage);
        }
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
        if (currentPage * recordsPerPage < fullHistory.length) {
            currentPage++;
            renderHistoryPage(currentPage);
        }
    });

    //==========================================================================//  

    function createInstruction(playerPubkey, playerMove) {
        const data = new Uint8Array([playerMove]);

        return (async() => {
            const [pda, bump] = await getPDA(playerPubkey);

            const keys = [
                { pubkey: playerPubkey, isSigner: true, isWritable: true },
                { pubkey: pda, isSigner: false, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"), isSigner: false, isWritable: false },
                { pubkey: new PublicKey("SysvarC1ock11111111111111111111111111111111"), isSigner: false, isWritable: false },
            ];

            return new TransactionInstruction({
                keys,
                programId: PROGRAM_ID,
                data,
            });
        })();
    }

    //==========================================================================// 
    document.querySelectorAll(".moveBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
        const playerMove = parseInt(btn.getAttribute("data-move"));
        btn.disabled = true;

    // abrir modal
    const modal = document.getElementById("gameModal");
    let playerMoveDisplay = document.getElementById("playerMoveDisplay");
    let contractMoveDisplay = document.getElementById("contractMoveDisplay");
    let roundResult = document.getElementById("roundResult");
    showGameModal()
    // modal.classList.remove('hidden'); 
    // modal.style.display = "block";
    const moveImages = {
      Rock: "rock.png",
      Paper: "paper.png",
      Scissors: "SS.png"
    };
    
          
    // let moves = ["Rock", "Paper", "Scissors"];
    
    // player move
    let playerChoice = MOVES[parseInt(playerMove)];
    playerMoveDisplay.innerHTML = `<img src="${moveImages[playerChoice]}" alt="${playerChoice}" width="80">`;
    
    // limpa o resultado
    roundResult.innerText = "";
    
    // anima alternando o contrato
    let idx = 0;
    const interval = setInterval(() => {
    let currentMove = MOVES[idx % 3];
      contractMoveDisplay.innerHTML = `<img src="${moveImages[currentMove]}" alt="${currentMove}" width="80">`;
      idx++;
    }, 
    300);        

    try {
      // envia transação
      const instruction = await createInstruction(publicKey, playerMove);
      const transaction = new Transaction().add(instruction);
      transaction.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      const signedTx = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, "confirmed");

      clearInterval(interval);

      const txDetails = await connection.getTransaction(signature, { commitment: "confirmed" });
      let tx_result = txDetails.transaction.message.instructions[2];

      // aqui supondo que o contrato retorna um log com o move
      // const logs = txDetails.meta?.logMessages || [];

        
      await updateScore();
      await updateHistory();

      let pk = new PublicKey(publicKey);
      let [pda] = await getPDA(pk);
      let accountInfo = await connection.getAccountInfo(pda);
      let last_result = await parseHistory(accountInfo);

      console.log(last_result)
      const contractMove = last_result[last_result.length-1].programMove
        
      // para a animação e mostra o resultado real
      
      // contractMoveDisplay.innerText = contractMove;
        
      // resultado da rodada
      // const RESULT_BOARD = {
      //     0: "Lose",
      //     1: "Draw",
      //     2: "Won"
      // };
      let outcome = last_result[last_result.length-1].result
      // roundResult.innerText = outcome;

     let logHtml = `
              <div class="tx-logint">
                <h3>Transaction Log</h3>
                <p><strong>Signature:</strong> ${signature}</p>
                <p><strong>Slot:</strong> ${txDetails.slot}</p>
                <p><strong>Status:</strong> ${txDetails.meta?.err ? "Failed" : "Confirmed"}</p>
                <p><strong>Fee paid:</strong> ${(txDetails.meta?.fee || 0) / 1e9} SOL</p>

                <h4>Program Logs</h4>
                <pre>${(txDetails.meta?.logMessages || []).join("\n")}</pre>

                <p><a href="https://explorer.solana.com/tx/${signature}?cluster=devnet" target="_blank">
                  View on Solana Explorer
                </a></p>
              </div>
            `;

      contractMoveDisplay.innerHTML = `<img src="${moveImages[contractMove]}" alt="${contractMove}" width="80">`;
      document.getElementById("txLog").innerHTML = logHtml;  
    

    } catch (e) {
          clearInterval(interval);
          contractMoveDisplay.innerText = "Error";
          roundResult.innerText = e.message;
    } finally {
      btn.disabled = false;
    }
  });
});

// fechar modal
// document.getElementById("closeModal").onclick = () => {
//   document.getElementById("gameModal").classList.add('hidden');};
    
    const closeModal = document.getElementById("closeModal");

  
   function showGameModal() {
            gameModal.classList.remove('hidden');
            document.body.classList.add('modal-open');
        }

        function hideGameModal() {
            document.getElementById("gameModal").classList.add('hidden');
            document.body.classList.remove('modal-open');
        }
    closeModal.addEventListener('click', hideGameModal);

    // document.querySelectorAll(".moveBtn").forEach(btn => {
    //     btn.addEventListener("click", async() => {
    //         const playerMove = parseInt(btn.getAttribute("data-move"));
    //         resultDiv.innerText = "Sending move...";
    //         btn.disabled = true;

    //         try {
    //             const instruction = await createInstruction(publicKey, playerMove);

    //             const transaction = new Transaction().add(instruction);
    //             transaction.feePayer = publicKey;
    //             const { blockhash } = await connection.getLatestBlockhash();
    //             transaction.recentBlockhash = blockhash;

    //             const signedTx = await provider.signTransaction(transaction);
    //             const signature = await connection.sendRawTransaction(signedTx.serialize());
    //             await connection.confirmTransaction(signature, "confirmed");

    //             await updateScore();
    //             await updateHistory();

    //             const txDetails = await connection.getTransaction(signature, { commitment: "confirmed" });

    //             let logHtml = `
    //               <div class="tx-logint">
    //                 <h3>Transaction Log</h3>
    //                 <p><strong>Signature:</strong> ${signature}</p>
    //                 <p><strong>Slot:</strong> ${txDetails.slot}</p>
    //                 <p><strong>Status:</strong> ${txDetails.meta?.err ? "Failed" : "Confirmed"}</p>
    //                 <p><strong>Fee paid:</strong> ${(txDetails.meta?.fee || 0) / 1e9} SOL</p>

    //                 <h4>Program Logs</h4>
    //                 <pre>${(txDetails.meta?.logMessages || []).join("\n")}</pre>

    //                 <p><a href="https://explorer.solana.com/tx/${signature}?cluster=devnet" target="_blank">
    //                   View on Solana Explorer
    //                 </a></p>
    //               </div>
    //             `;

    //             document.getElementById("txLog").innerHTML = logHtml;

    //             resultDiv.innerText = `Move sent: ${["Rock", "Paper", "Scissors"][playerMove]}`;
    //         } catch (e) {
    //             resultDiv.innerText = "Error: " + e.message;
    //         } finally {
    //             btn.disabled = false;
    //         }
    //     });
    // });

    //==========================================================================// 

        const overlay = document.getElementById('intro-overlay');
        const closeBtn = document.getElementById('close-overlay');
        const enterBtn = document.getElementById('enter-btn');
        const skipOnce = document.getElementById('skip-once');
        const dontShow = document.getElementById('dont-show');

async function handleWalletConnect(clickedBtn) {
    if ("solana" in window) {
        provider = window.solana;

        if (!provider.isPhantom) {
            alert("Por favor, use a carteira Phantom.");
            return;
        }

        try {
            const resp = await provider.connect();
            publicKey = resp.publicKey;

            walletInfo.innerText = `Wallet: ${publicKey.toString()}`;
            clickedBtn.style.background = "green";
            clickedBtn.style.color = "wallet";

            gameDiv.style.display = "block";
            firebaseSection.style.display = "block";
            document.getElementById("chartsSection").classList.remove("hidden");
            document.getElementById("chartsSection2").classList.remove("hidden");
            document.getElementById("txLog").classList.remove("hidden");
            document.getElementById("historyList").classList.remove("hidden");
            document.getElementById("hbtng").classList.remove("hidden");
            document.getElementById("score").classList.remove("hidden");
            document.getElementById("walletGroup").classList.remove("hidden");
            document.getElementById("SRC").classList.remove("hidden");

            // abre o modal
            // const overlay = document.getElementById("intro-overlay");
            // overlay.classList.remove("hidden");
            showOverlay();
            // pega todos os botões do modal
            const modalButtons = overlay.querySelectorAll("button, a");

            // desabilita / bloqueia cliques por 5 segundos
            modalButtons.forEach(btn => {
                btn.setAttribute("disabled", "true");
                btn.style.pointerEvents = "none";
                btn.style.opacity = "0.5";
            });

            // habilita após 5 segundos
            setTimeout(() => {
                modalButtons.forEach(btn => {
                    btn.removeAttribute("disabled");
                    btn.style.pointerEvents = "auto";
                    btn.style.opacity = "1";
                });
            }, 5000);

            const balanceLamports = await connection.getBalance(new PublicKey(publicKey));
            const balanceSOL = balanceLamports / solanaWeb3.LAMPORTS_PER_SOL;
            document.getElementById("walletBalance").innerText = `Balance: ${balanceSOL.toFixed(4)} SOL`;

            await updateScore();
            await updateHistory();
            await loadRanking();
        } catch (err) {
            alert("Falha na conexão com carteira: " + err.message);
        }
    } else {
        alert("Phantom Wallet não detectada.");
    }
}

document.querySelectorAll(".connectBtn").forEach(btn => {
    btn.onclick = () => handleWalletConnect(btn);
});

      function showOverlay() {
            overlay.classList.remove('hidden');
            overlay.removeAttribute('aria-hidden');
            document.body.classList.add('modal-open');
            // Foco acessível no botão Fechar
            setTimeout(() => closeBtn.focus(), 0);
        }

        function hideOverlay() {
            overlay.classList.add('hidden');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
        }

         overlay.addEventListener('touchmove', (e) => {
            e.stopPropagation();
        }, {
            passive: false
        });

           // Ações
        closeBtn.addEventListener('click', hideOverlay);
        enterBtn.addEventListener('click', hideOverlay);
        skipOnce.addEventListener('click', (e) => {
            e.preventDefault();
            hideOverlay();
        });
        dontShow.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem(STORAGE_KEY, '1');
            hideOverlay();
        });

        // Fechar com ESC
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') hideOverlay();
        });
// async function handleWalletConnect(clickedBtn) {
//     if ("solana" in window) {
//         provider = window.solana;

//         if (!provider.isPhantom) {
//             alert("Por favor, use a carteira Phantom.");
//             return;
//         }

//         try {
//             const resp = await provider.connect();
//             publicKey = resp.publicKey;

//             walletInfo.innerText = `Wallet: ${publicKey.toString()}`;
//             clickedBtn.style.background = "green";
//             clickedBtn.style.color = "wallet";

//             gameDiv.style.display = "block";
//             firebaseSection.style.display = "block";
//             document.getElementById("chartsSection").classList.remove("hidden");
//             document.getElementById("chartsSection2").classList.remove("hidden");
//             document.getElementById("txLog").classList.remove("hidden");
//             document.getElementById("historyList").classList.remove("hidden");
//             document.getElementById("hbtng").classList.remove("hidden");
//             document.getElementById("score").classList.remove("hidden");
//             document.getElementById("walletGroup").classList.remove("hidden");
//             document.getElementById("SRC").classList.remove("hidden");
//             document.getElementById("intro-overlay").classList.remove("hidden");
//             const balanceLamports = await connection.getBalance(new PublicKey(publicKey));
//             const balanceSOL = balanceLamports / solanaWeb3.LAMPORTS_PER_SOL;
//             document.getElementById("walletBalance").innerText = `Balance: ${balanceSOL.toFixed(4)} SOL`;

//             await updateScore();
//             await updateHistory();
//             await loadRanking();
//         } catch (err) {
//             alert("Falha na conexão com carteira: " + err.message);
//         }
//     } else {
//         alert("Phantom Wallet não detectada.");
//     }
// }

// document.querySelectorAll(".connectBtn").forEach(btn => {
//     btn.onclick = () => handleWalletConnect(btn);
// });
    //==========================================================================// 

    registerFirebaseBtn.onclick = async() => {
        if (!publicKey) {
            alert("Conecte sua carteira primeiro.");
            return;
        }

        firebaseStatus.style.color = "black";
        firebaseStatus.innerText = "Register in progress";

        try {
            const nickname = nicknameInput.value.trim() || null;
            const score = await updateScore();

            const col = window._firestoreFuncs.collection(window._firestore, "players");
            const docRef = window._firestoreFuncs.doc(col, publicKey.toString());

            await window._firestoreFuncs.setDoc(docRef, {
                pubkey: publicKey.toString(),
                nickname,
                score,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            firebaseStatus.style.color = "green";
            firebaseStatus.innerText = "Done!";
            await loadRanking();
        } catch (e) {
            firebaseStatus.style.color = "red";
            firebaseStatus.innerText = "Erro ao registrar no Firebase: " + e.message;
        }
    };

    //==========================================================================// 
    function maskPubkey(pk) {
      if (typeof pk !== "string") return pk;
      if (pk.length <= 8) return pk;
      return pk.slice(0, 4) + "..." + pk.slice(-4);
    }

    function formatDate(date) {
      if (!(date instanceof Date)) return "";
      const dia = String(date.getDate()).padStart(2, "0");
      const mes = String(date.getMonth() + 1).padStart(2, "0");
      const hora = String(date.getHours()).padStart(2, "0");
      const minuto = String(date.getMinutes()).padStart(2, "0");
      return `${dia}/${mes} ${hora}:${minuto}`;
    }

    async function loadRanking() {
    rankingStatus.innerText = "Carregando ranking...";
    rankingTable.style.display = "none";
    rankingBody.innerHTML = "";

    try {
        const col = window._firestoreFuncs.collection(window._firestore, "players");
        const q = window._firestoreFuncs.query(col, window._firestoreFuncs.orderBy("score", "desc"));
        const querySnapshot = await window._firestoreFuncs.getDocs(q);

        if (querySnapshot.empty) {
            rankingStatus.innerText = "Nenhum jogador registrado ainda.";
            return;
        }

        let rank = 1;
        let myRank = null;
        let myScore = null;
        let myNickname = null;

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const pubkey = data.pubkey || docSnap.id;
            const nickname = data.nickname || "";
            const score = data.score ?? 0;
            const updatedAt = data.updatedAt ? formatDate(new Date(data.updatedAt)) : "";

            // cria linha na tabela
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${rank}</td>
              <td class="col-pubkey"style="font-family: monospace; font-size: 0.85rem; word-break: break-all;"title="${pubkey}"data-full-pubkey="${pubkey}">${maskPubkey(pubkey)}</td>
              <td>${nickname}</td>
              <td>${score}</td>
              <td>${updatedAt}</td>
            `;

            // verifica se é a carteira conectada
            if (publicKey && pubkey === publicKey.toString()) {
                myRank = rank;
                myScore = score;
                myNickname = nickname || "(sem apelido)";
                tr.style.backgroundColor = "rgba(0, 200, 0, 0.25)"; // verde claro
                tr.style.fontWeight = "bold"; // destaque extra
            }

            rankingBody.appendChild(tr);
            rank++;
        });

        rankingTable.style.display = "table";
        rankingStatus.innerText = "";
        // pegar os top 3
        const docs = querySnapshot.docs;
        const top3 = docs.slice(0, 3).map((doc, i) => {
            const data = doc.data();
            return {
                rank: i + 1,
                pubkey: data.pubkey || doc.id,
                nickname: data.nickname || "(sem apelido)",
                score: data.score ?? 0
            };
        });

        // preencher cada div (se existir no HTML)
        if (top3[0]) {
            document.getElementById("primeiro").innerHTML = `
                    <div class="rtopplace"><h3>1º</h3></div>
                    <div>
                     <div class="rtopnick"><p> ${top3[0].nickname}</p></div>
                    <div class="rtopk"><p> ${maskPubkey(top3[0].pubkey)}</p></div>
                    </div>
                    <div class="rtopp"><p><b>Points:</b> ${top3[0].score}</p></div>
                    
               
            `;
        }
        if (top3[1]) {
            document.getElementById("segundo").innerHTML = `
              
                    <div class="rtopplace"><h3>2º</h3></div>
                    <div>
                    <div class="rtopnick"><p> ${top3[1].nickname}</p></div>
                    <div class="rtopk"><p> ${maskPubkey(top3[1].pubkey)}</p></div>
                    </div>
                    <div class="rtopp"><p><b>Points:</b> ${top3[1].score}</p></div>
                    
               
            `;
        }
        if (top3[2]) {
            document.getElementById("terceiro").innerHTML = `

                    <div class="rtopplace"><h3>3º</h3></div>
                    <div>
                     <div class="rtopnick"><p> ${top3[2].nickname}</p></div>
                    <div class="rtopk"><p> ${maskPubkey(top3[2].pubkey)}</p></div>
                    </div>
                    <div class="rtopp"><p><b>Points:</b> ${top3[2].score}</p></div>
            `;
        }

        // exibe posição do usuário logado
        if (myRank !== null) {
            document.getElementById("myRankingDiv").innerHTML =
                `<div class="scoretop">Ranking</div><div>${myRank}</div>`;
        } else {
            document.getElementById("myRankingDiv").innerText =
                "Sua carteira ainda não está registrada no ranking.";
        }

        } catch (e) {
        rankingStatus.innerText = "Error: " + e.message;
        }
    }
    refreshRankingBtn.onclick = loadRanking;
    window.addEventListener("DOMContentLoaded", () => {
    loadRanking();
});

})();
