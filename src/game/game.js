const Arrow = require('./arrow.js');
const Options = require('./options.js');
const Chart = require('./chart.js');

const directionToIndex = {left: 0, down: 1, up: 2, right: 3};
const indexToDirection = {0: 'left', 1: 'down', 2: 'up', 3: 'right'}

class Game {
  constructor(gameOpts) {
    this.chart = new Chart(gameOpts['chartOpts']);
    
    this.targets = this.addTargets(gameOpts['numTargets']);
    this.arrows = [];
    this.speed = gameOpts['speed']; // arrow velocity
    this.darkened = 0;
    
    this.isAlive = true;
    this.chartFinished = false;

    this.fps = 75; // this is for requestAnimationFrame

    this.fantastics = 0;
    this.excellents = 0;
    this.greats = 0;
    this.decents = 0;
    this.wayOffs = 0;
    this.misses = 0;
    this.hits = 0;
    this.score = 0;
    this.maxScore;
    this.combo = 0;
    this.minesDodged = 0;
    this.minesTotal = 0;

    this.slayer;
    this.life = 50;
    
    // Load cyberpunk background image
    this.retroBackground = new Image();
    this.retroBackground.src = 'assets/images/cyberpunk-game-background.png';
    this.backgroundLoaded = false;
    this.retroBackground.onload = () => {
      this.backgroundLoaded = true;
      console.log('Cyberpunk background loaded successfully');
    };
    this.retroBackground.onerror = () => {
      console.error('Failed to load cyberpunk background');
    };
  }

  // Helper to create an arrow based on the quantization
  addArrow(arrowDirection, quantColorNum) {
    const arrowOpts = Options.arrowOpts();
    // Choose the appropriate image for it's quantization
    switch (quantColorNum) {
      case 4:
        arrowOpts['imgUrl'] = 'assets/images/quarter.png';
        break;
      case 8:
        arrowOpts['imgUrl'] = 'assets/images/eighth.png';
        break;
      case 16:
        arrowOpts['imgUrl'] = 'assets/images/sixteenth.png';
        break;
      case 'MINE':
        arrowOpts['imgUrl'] = 'assets/images/mine.png';
        arrowOpts['isAMine'] = true;
        break;
    }

    arrowOpts['direction'] = arrowDirection;
    arrowOpts['velocity'] = [0, -this.speed];
    let newArrow = new Arrow(arrowOpts);
    this.arrows.push(newArrow);
  }

  // Helper to deconstruct the chart object into attributes of the game.
  // Sets game metadata for use later.
  getStepsAndCount(rating) {
    console.log('getStepsAndCount called with rating:', rating);
    console.log('this.chart.difficulties:', this.chart.difficulties);
    
    if (!this.chart || !this.chart.difficulties || this.chart.difficulties.length === 0) {
      console.error('Chart or difficulties not available');
      return;
    }
    
    let difficulty;
    let stepCount = 0;
    
    for (let diff of this.chart.difficulties) {
      console.log('Checking difficulty:', diff);
      if (diff["rating"] === rating){
        difficulty = diff;
        stepCount = diff["stepCount"];
        console.log('Found matching difficulty:', difficulty);
        break; // Found the difficulty, no need to continue
      }
    }

    console.log('Final difficulty:', difficulty);
    console.log('Final stepCount:', stepCount);
    
    if (!difficulty) {
      console.error('No difficulty found for rating:', rating);
      console.error('Available difficulties:', this.chart.difficulties);
      return;
    }

    // Set all required properties
    this.difficulty = difficulty;
    this.steps = difficulty["steps"];
    this.minesTotal = difficulty["mineCount"] || 0;
    // Calculate max score based on new point system
    // Each arrow can give max 1000 points (Fantastic)
    this.maxScore = stepCount * 1000;
    
    // Safely parse BPM from metadata
    if (this.chart.metadata && this.chart.metadata[23]) {
      this.bpm = parseInt(this.chart.metadata[23].slice(11)) || 120;
    } else {
      this.bpm = 120; // Default BPM if metadata is missing
    }
    
    console.log('Successfully set difficulty properties');
    console.log('Steps:', this.steps);
    console.log('Mines total:', this.minesTotal);
    console.log('Max score:', this.maxScore);
    console.log('BPM:', this.bpm);
  }

  // Helper to check whether or not an arrow is off-screen
  isOutOfBounds(pos) {
    let [x, y] = pos;
    return (x > 1000 || y > 1000 || x < 0 || y < 90)
  }
  
  // Helper to render all arrows in the game.
  drawArrows() {
    this.arrows.forEach(arrow =>{
      arrow.render(ctx);
    })
  }

  // Helper to render targets, and scale them over time.
  drawTargets() {
    this.targets.forEach(target => {
      this.scaleTarget(target);
      target.render(ctx);
    })
  }

  // Method to draw the lifebar outline in canvas.
  drawLifebar() {
    ctx.beginPath();
    ctx.rect(150, 10, 175, 29); // Y: -10 -> 10 (görünür yapmak için)
    if (this.darkened) {
      ctx.strokeStyle = "#cccccc"
    }
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Method to fill the lifebar
  fillLifebar() {
    ctx.beginPath();
    ctx.rect(150, 10, this.life*1.75, 29); // Y: -10 -> 10 (görünür yapmak için)
    if (this.life === 100) {
      ctx.fillStyle = "#ffffff"
    } else if (this.life > 20) {
      ctx.fillStyle = "#c4c4c4"
    } else {
      ctx.fillStyle = "#940c0c"
    }
    ctx.fill();
  }

  // Method to draw score on canvas
  drawScore(ctx) {
    ctx.textAlign = 'left';
    
    // Üst satır: "Score" yazısı - siyah
    ctx.fillStyle = '#000000'; // Siyah renk
    ctx.font = '24px Wendy';
    ctx.fillText('Score', 30, 15); // Y: -5 -> 15 (görünür yapmak için)
    
    // Alt satır: Sayı - kırmızı
    ctx.fillStyle = '#FF0000'; // Kırmızı renk
    ctx.font = '36px Wendy';
    ctx.fillText(`${this.score}`, 30, 35); // Y: 20 -> 35 (görünür yapmak için)
  }

  // Method to draw retro background in game area
  drawRetroBackground(ctx) {
    if (this.backgroundLoaded && this.retroBackground) {
      // Save current context state
      ctx.save();
      
      // Create clipping path for game area
      ctx.beginPath();
      ctx.rect(40, 80, 400, 800); // Game area bounds
      ctx.clip();
      
      // Draw background image to fit game area
      ctx.drawImage(this.retroBackground, 40, 80, 400, 800);
      
      // Add subtle overlay for better visibility of arrows
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(40, 80, 400, 800);
      
      // Restore context state
      ctx.restore();
    }
  }

  // Method to draw game area border
  drawGameBorder(ctx) {
    // Animasyonlu renkli border için zaman bazlı renk hesaplama
    const time = Date.now() * 0.001; // Saniye cinsinden zaman
    const hue = (time * 60) % 360; // Ana renk
    
    // Sadece tek renkli border (oyun alanını %10 daha büyük çerçevede)
    ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
    ctx.lineWidth = 8; // Daha kalın border
    ctx.setLineDash([]); // Düz çizgi
    
    // Oyun alanı etrafında %10 büyük rectangle
    // Orijinal: x:40, y:80, w:400, h:800
    // %10 büyük: x:20, y:40, w:440, h:880
    ctx.beginPath();
    ctx.rect(20, 40, 440, 880); // %10 büyük
    ctx.stroke();
    
    ctx.setLineDash([]); // Reset line dash
  }

  // Method to draw lane-hider / darken lane
  darkenLane() {
    window.ctx.beginPath();
    window.ctx.rect(12, 0, 435, 960);
    window.ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    window.ctx.fill();
  }

  // Method that re-draws every canvas element.
  step() {
    if (this.life <= 0) {
      this.isAlive = false;
    }

    window.ctx.clearRect(0, 0, 1280, 960);
    
    // Draw retro background first (behind everything)
    this.drawRetroBackground(window.ctx);
    
    if (this.darkened) {
      this.darkenLane();
    }

    this.fillLifebar(window.ctx);
    this.drawLifebar(window.ctx);
    this.drawScore(window.ctx);
    this.drawGameBorder(window.ctx);
    this.drawTargets(window.ctx);
    this.moveArrows();
    this.updateStepStats();
    this.drawArrows(window.ctx);
  }

  // Helper to calculate total points score
  getMoneyScore() {
    return this.score <= 0 ? 0 : this.score;
  }

  // Helper to update step statistics block, and draw combo.
  updateStepStats() {
    const stepStatsGrid = document.getElementsByClassName('ss-judgement-grid');
    stepStatsGrid['fCount'].textContent = `${this.fantastics}`;
    stepStatsGrid['eCount'].textContent = `${this.excellents}`;
    stepStatsGrid['gCount'].textContent = `${this.greats}`;
    stepStatsGrid['dCount'].textContent = `${this.decents}`;
    stepStatsGrid['woCount'].textContent = `${this.wayOffs}`;
    stepStatsGrid['missCount'].textContent = `${this.misses}`;
    stepStatsGrid['mineCount'].textContent = `${this.minesDodged}/${this.minesTotal}`;

    const stepStats = document.getElementsByClassName('ss-judgement');
    stepStats['percentage-score'].textContent = `${this.getMoneyScore()} points`;

    if (this.combo > 0) {
      stepStats['combo-counter'].style.display = 'block'
      stepStats['combo-counter'].textContent = `${this.combo}`;
    } else {
      stepStats['combo-counter'].textContent = 0;
      stepStats['combo-counter'].style.display = 'none'
    }
    
    const chartStats = document.getElementsByClassName('chart-stats');
    chartStats['artist-name'].textContent = `Artist: ${this.chart.metadata[3].slice(7)}`
    chartStats['song-title'].textContent = `Song: ${this.chart.metadata[1].slice(6)}`
    chartStats['difficulty-name'].textContent = `Difficulty: ${this.difficulty["difficulty"]}`
    chartStats['difficulty-rating'].textContent = `Multiple: ${this.difficulty["rating"]}`
  }

  // Method to check arrow collision, out of bounds, and mines.
  moveArrows() {
    this.arrows.forEach(arrow => {
      arrow.move()
      if (this.isOutOfBounds(arrow.pos) && !arrow.isAMine) {
        this.misses += 1;
        this.score += 0; // Miss: 0 points (no score change)
        this.combo = 0;
        this.life -= 10;
        this.setJudgementEle('Miss');
        if (this.life <= 0) {
          this.slayer = arrow;
        }
        this.removeArrow(arrow);
      } else if (this.isOutOfBounds(arrow.pos) && arrow.isAMine) {
        this.minesDodged += 1;
        this.removeArrow(arrow);
      };
    })
  }

  // Method to remove arrow on hit or out of bounds.
  removeArrow(arrow) {
    const removeIndex = this.arrows.indexOf(arrow);
    this.arrows.splice(removeIndex, 1);
  }

  // Method that checks targets upon keypress, to check judgement or mine.
  checkKeyPress(direction) {
    const target = this.targets[directionToIndex[direction]]
    this.hitTarget(target);
    // target indices left: 0, down: 1, up: 2, right: 3
    for (let i = 0; i < this.arrows.length; i++) {
      let arrow = this.arrows[i];

      if (arrow.direction === direction) {
        let distance = target.getDistance(arrow);
        if (distance > 60) break;

        if (arrow.isAMine && (distance >= -19 && distance < -10)) {
          this.combo = 0;
          this.score += 0; // Mine: 0 points (no score change)
          this.life -= 10;

          if (this.life <= 0) {
            this.slayer = arrow
          };
          // Trigger mine hit animation
          arrow.hit();
          // Delay removal to show animation
          setTimeout(() => {
            this.removeArrow(arrow);
          }, 200);
          break;
        };
        this.metricsIni(distance);
        // Trigger hit animation before removing arrow
        arrow.hit();
        // Delay removal to show animation
        setTimeout(() => {
          this.removeArrow(arrow);
        }, 200);
        this.hits += 1;
        break;
      }
    }
  }

  // Helper to enlarge target when pressed
  hitTarget(target) {
    target.scale = .42;
  }
  
  // Helper to incrementally shrink target when frames are drawn.
  scaleTarget(target) {
    if (target.scale - .01 > .35) {
      target.scale -= .01
    } if (target.scale - .01 < .35) {
      target.scale = .35
    }
  }

  // Helper to determine whether or not the player will regain life
  // based on their current combo, and what judgements were gained.
  comboRegainLife(judgement) {
    if (this.combo > 5 && this.life !== 100) {
      switch (judgement) {
        case 'FANTASTIC': case 'EXCELLENT':
          if (this.life + 5 < 100) {
            this.life += 5
          } else {
            this.life = 100;
          }
          break;
        case 'GREAT':
          if (this.life + 3 < 100) {
            this.life += 3
          } else {
            this.life = 100;
          }
          break;
      }
    }
  }

  // Helper to set the text content and color of the judgement element on screen.
  setJudgementEle(judgement) {
    const judgeText = document.getElementById('judgement');
    judgeText.style.display = 'block';
    switch (judgement) {
      case 'Fantastic':
        judgeText.textContent = "Fantastic!"
        judgeText.style.color = '#21CCE8'
        break;
      case 'Excellent':
        judgeText.textContent = "Excellent!"
        judgeText.style.color = '#e29c18'
        break;
      case 'Great':
        judgeText.textContent = "Great!"
        judgeText.style.color = '#66c955'
        break;
      case 'Decent':
        judgeText.textContent = "Decent"
        judgeText.style.color = '#b45cff'
        break;
      case 'Way-Off':
        judgeText.textContent = "Way Off"
        judgeText.style.color = '#c9855e'
        break;
      case 'Miss':
        judgeText.textContent = "MISS"
        judgeText.style.color = '#ff3030'
        break;
    }
  }

  // Method that calculates score, combo, life gain
  // Updated scoring system based on new point values
  metricsIni(distance) {
    if (distance < 0) distance = -distance;
    switch (true) {
      case (distance <= 20):
        this.score += 1000; // Fantastic: +1000 points
        this.fantastics += 1;
        this.combo += 1;
        this.comboRegainLife('FANTASTIC');
        this.setJudgementEle('Fantastic');
        break;
      case (distance <= 30):
        this.score += 800; // Excellent: +800 points
        this.excellents += 1;
        this.combo += 1;
        this.comboRegainLife('EXCELLENT');
        this.setJudgementEle('Excellent');
        break;
      case (distance <= 40):
        this.score += 600; // Great: +600 points
        this.greats += 1;
        this.combo += 1;
        this.comboRegainLife('GREAT');
        this.setJudgementEle('Great');
        break;
      case (distance <= 50):
        this.score += 400; // Decent: +400 points
        this.decents += 1;
        this.combo = 0;
        this.setJudgementEle('Decent');
        break;
      case (distance <= 60):
        this.score += 200; // Way-Off: +200 points
        this.wayOffs += 1;
        this.combo = 0;
        this.setJudgementEle('Way-Off');
        break;
    }
  }

  // Method that creates all 4 targets when game instance is created.
  addTargets(num) {
    const targets = [];
    for (let i = 0; i < num; i++) {
      let target = this.createTarget(i);
      targets.push(target)
    }
    return targets;
  }

  // Helper to create individual targets.
  createTarget(i) {
    const targetOpts = Options.targetOpts()
    switch (i) {
      case 0:
        targetOpts['direction'] = 'left';
        return new Arrow(targetOpts);
      case 1:
        targetOpts['direction'] = 'down';
        return new Arrow(targetOpts);
      case 2:
        targetOpts['direction'] = 'up';
        return new Arrow(targetOpts);
      case 3:
        targetOpts['direction'] = 'right';
        return new Arrow(targetOpts);
    }
  }

  // Helper to get start delay for chart
  getDelay(bpm, quantization) {
    const minuteInMs = 60000;
    return minuteInMs / ((quantization / 4) * bpm) - 1
  }

  // Helper to get the color of the arrow based on it's quantization.
  // Called when creating the arrows
  getQuantColorNum(i, length) {
    if (length >= 16) {
      switch(true) {
        case (i % 4 === 1):
          return 4
        case (i % 4 === 3):
          return 8
        case (i % 2 === 0):
          return 16
      }
    } else if (length === 8) {
      switch(true) {
        case (i % 2 === 1):
          return 4
        case (i % 2 === 0):
          return 8
      }
    } else {
      return 4
    }
  }

  // Helper to synchronously call the below 3 async functions.
  startChart() {
    this.chartIteration();
  }

  async chartIteration() {
    // goes through the chart, needs to wait for the measure
    for (let i = 1; i <= this.difficulty.measureCount; i++) {
      if (!this.isAlive) {
        return;
      }
      const measure = this.steps[`${i}`];
      const quantization = measure.length;
      let delay = this.getDelay(this.bpm, quantization);
      await this.measureIteration(measure, delay);
    }
    this.chartFinished = true;
  }

  async measureIteration(measure, delay) {
    // goes through the measure, needs to wait per note
    const timer = ms => new Promise(res => setTimeout(res, ms))
    for (let j = 0; j < measure.length; j++) {
      if (!this.isAlive) {
        return;
      }
      let beat = measure[j];
      let quantColorNum = this.getQuantColorNum(j + 1, measure.length);
      this.laneIteration(beat, quantColorNum)
      await timer(delay);
    }
  }

  laneIteration(beat, quantColorNum) {
    console.log('Processing beat:', beat, 'with quantization:', quantColorNum);
    
    // Normalize 5-character beat to 4-character by taking only first 4 characters
    const normalizedBeat = beat.slice(0, 4);
    console.log('Normalized beat from', beat, 'to', normalizedBeat);
    
    for (let k = 0; k < normalizedBeat.length; k++) {
      if (!this.isAlive) {
        return;
      }
      if (normalizedBeat[k] === '1' || normalizedBeat[k] === '2' || normalizedBeat[k] === '4') {
        console.log(`Creating arrow at position ${k} (${normalizedBeat[k]}) -> direction: ${indexToDirection[k]}`);
        this.addArrow(indexToDirection[k], quantColorNum)
      }
      if (normalizedBeat[k] === 'M') {
        console.log(`Creating mine at position ${k} -> direction: ${indexToDirection[k]}`);
        this.addArrow(indexToDirection[k], 'MINE')
      }
    }
  }

  // Test function to manually create arrows in specific lanes
  testArrowCreation() {
    console.log('Testing arrow creation in specific lanes...');
    
    // Test left arrow
    const leftArrowOpts = Options.arrowOpts();
    leftArrowOpts['direction'] = 'left';
    leftArrowOpts['imgUrl'] = 'assets/images/quarter.png';
    leftArrowOpts['velocity'] = [0, -this.speed];
    let leftArrow = new Arrow(leftArrowOpts);
    this.arrows.push(leftArrow);
    console.log('Created left arrow at position:', leftArrow.pos);
    
    // Test down arrow
    const downArrowOpts = Options.arrowOpts();
    downArrowOpts['direction'] = 'down';
    downArrowOpts['imgUrl'] = 'assets/images/quarter.png';
    downArrowOpts['velocity'] = [0, -this.speed];
    let downArrow = new Arrow(downArrowOpts);
    this.arrows.push(downArrow);
    console.log('Created down arrow at position:', downArrow.pos);
    
    // Test up arrow
    const upArrowOpts = Options.arrowOpts();
    upArrowOpts['direction'] = 'up';
    upArrowOpts['imgUrl'] = 'assets/images/quarter.png';
    upArrowOpts['velocity'] = [0, -this.speed];
    let upArrow = new Arrow(upArrowOpts);
    this.arrows.push(upArrow);
    console.log('Created up arrow at position:', upArrow.pos);
    
    // Test right arrow
    const rightArrowOpts = Options.arrowOpts();
    rightArrowOpts['direction'] = 'right';
    rightArrowOpts['imgUrl'] = 'assets/images/quarter.png';
    rightArrowOpts['velocity'] = [0, -this.speed];
    let rightArrow = new Arrow(rightArrowOpts);
    this.arrows.push(rightArrow);
    console.log('Created right arrow at position:', rightArrow.pos);
  }

  // Method to change chart
  async changeChart(chartName) {
    this.chartOpts = Options.chartOpts(chartName);
    // Create new chart instance with new options
    this.chart = new Chart(this.chartOpts);
    
    // Wait for chart to be fully loaded
    await this.chart.syncChart();
    console.log('Chart sync completed, difficulties:', this.chart.difficulties.length);
    
    // Wait for chart to be fully loaded before proceeding
    this.chart.audio.addEventListener('canplaythrough', () => {
      console.log('Chart loaded successfully:', chartName);
    });
    
    // Set a timeout to ensure chart is loaded
    setTimeout(() => {
      console.log('Chart loading timeout completed');
    }, 1000);
  }
}
module.exports = Game;