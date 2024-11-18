// Зареждане на начални данни за играта от localStorage
const gameData = JSON.parse(localStorage.getItem("gameData")) || { pawnsCount: 3 };
let isMoveDone = false; // Променлива за следене дали е направен валиден ход
let selectedStartPoint = null;
let isMovingPhase = false; // Следене на фазата на преместване
let currentPlayer = 1; // Следене на текущия играч
let captureOptions = []; // Опции за кацане при улавяне
let X = false; // Променлива, указваща дали е необходимо прескачане
let Y = false; // Променлива, указваща дали е направен изборът за кацане

const players = { 
  1: { color: "blue", remainingPawns: gameData.pawnsCount },
  2: { color: "green", remainingPawns: gameData.pawnsCount }
};

// Прави връзките двупосочни
function makeConnectionsBidirectional(points) {
  const pointMap = {}; // Карта на точките по ID за лесно намиране
  points.forEach(point => pointMap[point.id] = point);
  points.forEach(point => {
    point.connections.forEach(connectionId => {
      const connectedPoint = pointMap[connectionId];
      // Ако свързаната точка няма тази точка в своите връзки, добавете я
      if (connectedPoint && !connectedPoint.connections.includes(point.id)) {
        connectedPoint.connections.push(point.id);
      }
    });
  });
}

// Стартиране на функцията за осигуряване на двупосочни връзки
makeConnectionsBidirectional(pointsData);

// Инициализиране на предупреждение за уведомяване на играчите за старта на разпределянето на пуловете
alert("Започва разполагането на пулове за двама играчи!");

// Създаване на карта за следене на пуловете на всяка точка
const pawnsOnPoints = {};
const pointNames = {}; // Създаване на обект за имена на точките

// Обработчик на събития за избиране на точка
function selectPoint(pointId) {
  if (captureOptions.length > 0) {
    handleCaptureChoice(pointId);
    return;
  }

  console.log(`Точка избрана: ${pointId}`);
  if (!isMovingPhase) {
    placePawns(pointId);
  } else {
    if (!selectedStartPoint) {
      selectedStartPoint = pointId;
      alert(`Начална точка избрана: ${pointNames[pointId]}. Сега изберете дестинацията.`);
    } else {
      const destinationPoint = pointId;
      if (selectedStartPoint === destinationPoint) {
        alert("Избрахте една и съща точка. Изберете друга точка за дестинация");
        selectedStartPoint = null;
        return;
      }
      movePawns(selectedStartPoint, destinationPoint);
      selectedStartPoint = null;
    }
  }
}
// Функция за разпределяне на пуловете върху кликната точка
function placePawns(pointId) {
  const player = players[currentPlayer];
  if (player.remainingPawns <= 0) {
    alert("Не ви остават повече пулове");
    return;
  }
  if (pawnsOnPoints[pointId] && pawnsOnPoints[pointId].owner && pawnsOnPoints[pointId].owner !== currentPlayer) {
    alert("Точката е заета от другия играч!");
    return;
  }

  const numPawns = 1;

  // Инициализиране на точката, ако е първото поставяне на пулове там
  if (!pawnsOnPoints[pointId]) {
    pawnsOnPoints[pointId] = { pawns: 0, owner: null };
  }

  pawnsOnPoints[pointId].pawns += numPawns;
  player.remainingPawns -= numPawns;
  pawnsOnPoints[pointId].owner = currentPlayer;

  updatePointDisplay(pointId);

  // Превключване на редовете между играчите
  if (players[1].remainingPawns === 0 && players[2].remainingPawns === 0) {
    alert("Разполагането на пулове приключи! Вече можете да ги местите!");
    isMovingPhase = true;
  } else {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    alert(`Сега е ред на играч ${currentPlayer}`);
  }
}

// Функция за преместване на пулове между точки
function movePawns(startPointId, destinationPointId) {
  const startPoint = pointsData.find(p => p.id === startPointId);
  const destinationPoint = pointsData.find(p => p.id === destinationPointId);

  if (!startPoint || !destinationPoint) {
    alert("Избрана е невалидна точка.");
    return;
  }
  if (!startPoint.connections.includes(destinationPointId)) {
    alert("Тези точки не са свързани. Изберете свързана точка");
    return;
  }

  if (pawnsOnPoints[startPointId].owner !== currentPlayer) {
    alert("Можете да местите само своите пулове.");
    return;
  }

  const numPawns = 1; // Може да се премести само един пул наведнъж

  // Актуализиране на броя пулове за преместването
  pawnsOnPoints[startPointId].pawns -= numPawns;
  if (pawnsOnPoints[startPointId].pawns === 0) {
    pawnsOnPoints[startPointId].owner = null;
    console.log(`Пулове на точка ${startPointId} бяха преместени.`);
  }

  if (!pawnsOnPoints[destinationPointId]) {
    pawnsOnPoints[destinationPointId] = { pawns: 0, owner: null };
  }

  if (pawnsOnPoints[destinationPointId].owner && pawnsOnPoints[destinationPointId].owner !== currentPlayer) {
    X = true; // Поставяне на X на true при прескачане

    // Логика за прескачане и улавяне
    const capturePoints = destinationPoint.connections.filter(pointId => {
      const point = pointsData.find(p => p.id === pointId);
      return point && (!pawnsOnPoints[pointId] || pawnsOnPoints[pointId].pawns === 0);
    });

    if (capturePoints.length > 0) {
      captureOptions = capturePoints.map(pointId => pointId);
      captureOptions.forEach(option => {
        highlightCaptureOption(option);
      });

      // Премахване на противниковите пулове
      pawnsOnPoints[destinationPointId] = { pawns: 0, owner: null };
      console.log(`Пулове на точка ${destinationPointId} бяха изтрити, защото бяха прескочени.`);
      updatePointDisplay(destinationPointId);

      alert("Изберете точка за кацане");

      captureOptions.forEach(option => {
        document.getElementById(option).addEventListener("click", () => {
          handleCaptureChoice(option);
        });
      });

      return; // Изчаква избор на точка за кацане
    } else {
      alert("Няма празни точки за кацане.");
      pawnsOnPoints[startPointId].pawns += numPawns;
      if (pawnsOnPoints[startPointId].pawns === 1) {
        pawnsOnPoints[startPointId].owner = currentPlayer;
      }

      isMoveDone = false; // Ходът е неуспешен
      return;
    }
  } else {
    pawnsOnPoints[destinationPointId].pawns += numPawns;
    pawnsOnPoints[destinationPointId].owner = currentPlayer;
    isMoveDone = true; // Установяване на isMoveDone на true при успешно местене
  }

  updatePointDisplay(startPointId);
  updatePointDisplay(destinationPointId);

  // Проверка за победа
  const allPoints = Object.values(pawnsOnPoints);
  const allBlue = allPoints.every(point => point.owner === 1);
  const allGreen = allPoints.every(point => point.owner === 2);

  if (allBlue) {
    alert("Играч 1 печели играта!");
    return;
  } else if (allGreen) {
    alert("Играч 2 печели играта!");
    return;
  }

  // Превключване на редовете между играчите
  if (isMoveDone) {
    switchTurn();
  }
}

// Превключване на редовете между играчите
function switchTurn() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  alert(`Сега е ред на играч ${currentPlayer} да мести пуловете си.`);
  
  // Премахване на текста от всички точки
  Object.keys(pawnsOnPoints).forEach(pointId => {
    const point = document.getElementById(pointId);
    if (point) {
      const textElement = point.querySelector('text');
      if (textElement) {
        point.removeChild(textElement);
        console.log(`Точката ${pointId} е скрита по време на преминаване на хода.`);
      }
    }
  });

  X = false;
  Y = false;
  isMoveDone = false; // Нулиране на isMoveDone в началото на хода на следващия играч
}

// Функция за обработка на избора на точка за кацане при улавяне
function handleCaptureChoice(pointId) {
  const validChoice = captureOptions.find(option => option === pointId);
  if (!validChoice) {
    alert("Невалидна точка за кацане. Моля, изберете валидна точка.");
    return;
  }

  captureOptions.forEach(option => {
    const circle = document.getElementById(option);
    if (circle) {
      circle.setAttribute("r", 7); // Връщане към нормален радиус
      circle.setAttribute("fill", "red");
    }
  });

  pawnsOnPoints[validChoice] = { pawns: 1, owner: currentPlayer };
  updatePointDisplay(validChoice);
  captureOptions = [];

  Y = true; // Поставяне на Y на true след избора

  if (X && Y) {
    X = false;
    Y = false; // Нулиране на Y след обработка на улавянето
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    alert(`Сега е ред на играч ${currentPlayer} да мести пуловете си.`);
  }
}

// Функция за подчертаване на опция за кацане при улавяне
function highlightCaptureOption(pointId) {
  const point = pointsData.find(p => p.id === pointId);
  if (point) {
    const circle = document.getElementById(point.id);
    circle.setAttribute("fill", "yellow");
    circle.setAttribute("r", 10); // Увеличаване на радиуса на точката
  }
}

// Функция за актуализиране на визуализацията на точка според броя пулове
function updatePointDisplay(pointId) {
  const pawnsGroup = document.getElementById("pawns");
  const point = pointsData.find(p => p.id === pointId);
  if (!point) {
    console.error(`Точка с id ${pointId} не е намерена`);
    return;
  }

  // Премахване на съществуващото изображение
  const existingDisplay = pawnsGroup.querySelector(`[data-point-id="${pointId}"]`);
  if (existingDisplay) {
    pawnsGroup.removeChild(existingDisplay);
  }

  const pawnCount = pawnsOnPoints[pointId].pawns;

  if (pawnCount > 0) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("data-point-id", pointId);
    group.addEventListener("click", () => selectPoint(pointId)); // Добавяне на клик събитие към групата

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", 16); // Увеличаване на радиуса на кръга
    circle.setAttribute("fill", pawnsOnPoints[pointId].owner === 1 ? "blue" : "green");
    circle.style.cursor = "pointer"; // Настройка на курсора на pointer

    group.appendChild(circle);

    if (!Y) { // Премахване на текста, ако Y е true
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", point.x);
      text.setAttribute("y", point.y + 5); // Настройка за центриране на текста
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("fill", "white");
      text.setAttribute("font-size", "14"); // Увеличаване на размера на шрифта
      text.textContent = pawnCount;
      group.appendChild(text);
    }

    pawnsGroup.appendChild(group);
  } else {
    const circle = document.getElementById(point.id);
    if (circle) {
      circle.setAttribute("r", 7); // Начален радиус
      circle.setAttribute("fill", "red");
      circle.style.cursor = "pointer"; // Настройка на курсора на pointer
    }
    console.log(`Точката ${pointId} е скрита, защото няма пулове.`);
  }
}
// Функция за рендиране на точки, връзки и добавяне на пулове
function renderMapElements() {
  const pointsGroup = document.getElementById("points");
  const connectionsGroup = document.getElementById("connections");
  const pointMap = {};
  pointsData.forEach(point => {
    pointMap[point.id] = point;

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", 7); // Начален радиус
    circle.setAttribute("fill", "red");
    circle.setAttribute("id", point.id);
    circle.style.cursor = "pointer"; // Настройка на курсора на pointer
    circle.addEventListener("click", () => selectPoint(point.id)); // Добавяне на клик събитие към точката
    pointsGroup.appendChild(circle);

    pawnsOnPoints[point.id] = { pawns: 0, owner: null };
    pointNames[point.id] = `Точка ${String.fromCharCode(65 + Object.keys(pointNames).length)}`; // Даване на име на точката (Точка А, Точка Б и т.н.)
  });

  pointsData.forEach(point => {
    point.connections.forEach(connectionId => {
      const targetPoint = pointMap[connectionId];
      if (targetPoint) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", point.x);
        line.setAttribute("y1", point.y);
        line.setAttribute("x2", targetPoint.x);
        line.setAttribute("y2", targetPoint.y);
        line.setAttribute("stroke", "black");
        line.setAttribute("stroke-width", 2);
        connectionsGroup.appendChild(line);
      }
    });
  });
}

// Инициализиране на играта
renderMapElements();
