class Chart {
  constructor(chartOpts) {
    this.directory = chartOpts['stepDir'];
    this.audio = new Audio(chartOpts['audioDir']);
    this.background = chartOpts['bgDir'];
    this.banner = chartOpts['bannerDir'];
    this.metadata = [];
    this.difficulties = [];
    this.isReady = false;
    this.format = null; // Track which format we're using
    
    // Detect file format and parse accordingly
    if (this.directory.endsWith('.ssc')) {
      this.format = 'ssc';
      this.syncChart();
    } else if (this.directory.endsWith('.sm')) {
      this.format = 'sm';
      this.syncSMChart();
    } else {
      console.error('Unsupported chart format:', this.directory);
    }
  }

  // Helper to call the methods below synchronously for .ssc files
  // Not quite sure why this is needed, some JS language behavior to understand.
  // Bottom 3 functions are asnychronous, and this calls them all synchronously?
  async syncChart() {
    await this.getChartInfo(this.directory)
  }
  
  // Helper to call the methods below synchronously for .sm files
  async syncSMChart() {
    await this.getSMChartInfo(this.directory)
  }
  
  async getChartInfo(dir) {
    try {
      // Fetch chart info from file, and then split it into an array where each row
      // is an item in the array.
      let response = await fetch(dir);
      if (!response.ok) {
        throw new Error(`Failed to load chart file: ${response.status} ${response.statusText}`);
      }
      
      let chart = await response.text();
      let chartRows = chart.split("\r\n");
      
      // Handle different line ending formats
      if (chartRows.length === 1) {
        chartRows = chart.split("\n");
      }
      
      let metaAndDiffs = [];
      let breakpoint = 0;
      
      // Segmented incrementation through the chart, creating new arrays based on
      // each section or difficulty of the chart. This is later expanded on with
      // the other helper below.
      let doneParsing = false;
      while (!doneParsing) {
        doneParsing = true;
        let currentPart = [];
        
        // Iterate and populate the current difficulty as rows.
        for(let i = breakpoint; i < chartRows.length; i++) {
          
          // If the difficulty is over, stop iterating and keep track of the breakpoint
          // So that iteration can continue on a new difficulty, on the next loop.
          if (chartRows[i].includes('//--')) {
            breakpoint = i + 1;
            doneParsing = false;
            break;
          }
          currentPart.push(chartRows[i]);
        }
        metaAndDiffs.push(currentPart)
      }

      // Parse metadata from the chart file
      this.metadata = metaAndDiffs[0].map(datum => {
        return datum.slice(1, datum.length - 1)
      });

      // Add difficulty to chart object
      for (let i = 1; i < metaAndDiffs.length; i++) {
        const diff = metaAndDiffs[i];
        if (diff.length > 10) { // Ensure difficulty has enough data
          const parsedDifficulty = this.getMeasures(diff);
          if (parsedDifficulty) {
            this.difficulties.push(parsedDifficulty);
          }
        }
      }
      
      // Mark chart as ready
      this.isReady = true;
      console.log('Chart parsing completed, difficulties:', this.difficulties.length);
      console.log('Available difficulties:', this.difficulties.map(d => ({ rating: d.rating, difficulty: d.difficulty })));
      
    } catch (error) {
      console.error('Error loading chart:', error);
      this.isReady = false;
      throw error;
    }
  }

  // Helper to get the steps from the difficulty chunk.
  getMeasures(difficulty) {
    try {
      let steps = {};
      
      // Validate difficulty data structure
      if (!difficulty || difficulty.length < 10) {
        console.error('Invalid difficulty data structure:', difficulty);
        return null;
      }
      
      // Find difficulty name and rating by searching for the correct tags
      let difficultyName = "Unknown";
      let rating = 1;
      
      for (let line of difficulty) {
        if (line.startsWith('#DIFFICULTY:')) {
          difficultyName = line.slice(12, line.length - 1);
        }
        if (line.startsWith('#METER:')) {
          rating = parseInt(line.slice(7, line.length - 1)) || 1;
        }
      }
      
      // Set new chart object metadata from difficulty chunk.
      let chart = {
        "steps": steps,
        "difficulty": difficultyName,
        "rating": rating,
        "stepCount": 0,
        "mineCount": 0,
        "startPoint": 0
      };

      // Find where the notes section starts
      let notesStartIndex = 0;
      for (let i = 0; i < difficulty.length; i++) {
        if (difficulty[i].startsWith('#NOTES:')) {
          notesStartIndex = i + 1;
          break;
        }
      }
      
      // Initialize measure count, and then iterate through chart where measures
      // exist.
      let measure = 0;
      for (let g = notesStartIndex; g < difficulty.length; g++) {

        // Parse lines into array parts.
        let line = difficulty[g];
        if (line.startsWith(',') || line.startsWith('//')) {
          measure += 1
          continue
        } else if ('01234M'.includes(line[0])) {

          // Find the startpoint of the chart, some charts have empty space before
          // the arrows come. This is necessary because the arrows will not come up
          // on correct time if the empty space is not accurate.
          if (!chart['startPoint'] 
            && (line.includes('1') || line.includes('2') || line.includes('4'))){
            chart['startPoint'] = measure;
            }
          steps[measure] ||= [];
          steps[measure].push(line)

          // Iterate through the line, count the steps and mines for display later.
          for (let i = 0; i < line.length; i++) {
            if (line[i] === '1' || line[i] === '2' || line[i] === '4') {
              chart["stepCount"] += 1
            }
            if (line[i] === 'M') chart["mineCount"] += 1;
          }
        } else {
          continue;
        }
      }

      // Finalize measurecount, and return chart object.
      chart['measureCount'] = measure;
      
      // Validate the chart object
      if (chart.stepCount === 0) {
        console.warn('Warning: Chart has no steps, difficulty:', chart.difficulty, 'rating:', chart.rating);
      }
      
      console.log('Parsed difficulty:', chart.difficulty, 'rating:', chart.rating, 'steps:', chart.stepCount);
      return chart;
      
    } catch (error) {
      console.error('Error parsing difficulty:', error);
      return null;
    }
  }
  
  // Parse .sm format files
  async getSMChartInfo(dir) {
    try {
      // Fetch chart info from file, and then split it into an array where each row
      // is an item in the array.
      let response = await fetch(dir);
      if (!response.ok) {
        throw new Error(`Failed to load chart file: ${response.status} ${response.statusText}`);
      }
      
      let chart = await response.text();
      let chartRows = chart.split("\n");
      
      // Handle different line ending formats
      if (chartRows.length === 1) {
        chartRows = chart.split("\r\n");
      }
      
      // Parse metadata from the chart file
      this.metadata = [];
      let inNotes = false;
      let currentDifficulty = null;
      let currentDifficultyData = [];
      let difficultyCount = 0;
      
      for (let i = 0; i < chartRows.length; i++) {
        let line = chartRows[i].trim();
        
        // Parse metadata
        if (line.startsWith('#TITLE:')) {
          this.metadata.push(line.slice(7, -1));
        } else if (line.startsWith('#ARTIST:')) {
          this.metadata.push(line.slice(8, -1));
        } else if (line.startsWith('#BANNER:')) {
          this.metadata.push(line.slice(8, -1));
        } else if (line.startsWith('#BACKGROUND:')) {
          this.metadata.push(line.slice(12, -1));
        } else if (line.startsWith('#MUSIC:')) {
          this.metadata.push(line.slice(7, -1));
        } else if (line.startsWith('#OFFSET:')) {
          this.metadata.push(line.slice(8, -1));
        } else if (line.startsWith('#BPMS:')) {
          this.metadata.push(line.slice(6, -1));
        } else if (line.startsWith('#DISPLAYBPM:')) {
          this.metadata.push(line.slice(13, -1));
        }
        
        // Check if we're entering the NOTES section
        if (line === '#NOTES:') {
          inNotes = true;
          continue;
        }
        
        // Parse difficulty sections - look for lines with multiple colons
        if (inNotes && line.includes(':') && line.split(':').length >= 4) {
          // This is a difficulty header line like "dance-single: K. Ward: Medium: 5: 0.325,0.000,0.521,0.095,0.000:"
          if (currentDifficulty && currentDifficultyData.length > 0) {
            // Process the previous difficulty
            const parsedDifficulty = this.getSMMeasures(currentDifficultyData, currentDifficulty);
            if (parsedDifficulty) {
              this.difficulties.push(parsedDifficulty);
            }
            currentDifficultyData = [];
          }
          
          // Start new difficulty
          currentDifficulty = line;
          currentDifficultyData = [];
          difficultyCount++;
          continue;
        }
        
        // Collect chart data for current difficulty
        if (inNotes && currentDifficulty && line.match(/^[01M234]{4}$/)) {
          currentDifficultyData.push(line);
        }
      }
      
      // Process the last difficulty
      if (currentDifficulty && currentDifficultyData.length > 0) {
        const parsedDifficulty = this.getSMMeasures(currentDifficultyData, currentDifficulty);
        if (parsedDifficulty) {
          this.difficulties.push(parsedDifficulty);
        }
      }
      
      // Mark chart as ready
      this.isReady = true;
      console.log('SM Chart parsing completed, difficulties:', this.difficulties.length);
      console.log('Available difficulties:', this.difficulties.map(d => ({ rating: d.rating, difficulty: d.difficulty })));
      
    } catch (error) {
      console.error('Error loading SM chart:', error);
      this.isReady = false;
      throw error;
    }
  }
  
  // Helper to get the steps from the difficulty chunk for .sm files
  getSMMeasures(difficulty, header) {
    try {
      let steps = {};
      
      // For .sm files, we need to parse the difficulty header line
      // Format: "dance-single: K. Ward: Hard: 9: 0.615,0.000,0.240,0.094,0.575:"
      let headerParts = header.split(':');
      
      let difficultyName = headerParts[2] ? headerParts[2].trim() : "Unknown";
      let rating = headerParts[3] ? parseInt(headerParts[3].trim()) || 1 : 1;
      
      // Set new chart object metadata from difficulty chunk
      let chart = {
        "steps": steps,
        "difficulty": difficultyName,
        "rating": rating,
        "stepCount": 0,
        "mineCount": 0,
        "startPoint": 0
      };

      // Initialize measure count, and then iterate through chart where measures
      // exist. For .sm files, the data starts after the header
      let measure = 0;
      for (let g = 1; g < difficulty.length; g++) {
        // Parse lines into array parts.
        let line = difficulty[g];
        if (line.startsWith(',') || line.startsWith('//')) {
          measure += 1
          continue
        } else if ('01234M'.includes(line[0])) {

          // Find the startpoint of the chart, some charts have empty space before
          // the arrows come. This is necessary because the arrows will not come up
          // on correct time if the empty space is not accurate.
          if (!chart['startPoint'] 
            && (line.includes('1') || line.includes('2') || line.includes('4'))){
            chart['startPoint'] = measure;
            }
          steps[measure] ||= [];
          steps[measure].push(line)

          // Iterate through the line, count the steps and mines for display later.
          for (let i = 0; i < line.length; i++) {
            if (line[i] === '1' || line[i] === '2' || line[i] === '4') {
              chart["stepCount"] += 1
            }
            if (line[i] === 'M') chart["mineCount"] += 1;
          }
        } else {
          continue;
        }
      }

      // Finalize measurecount, and return chart object.
      chart['measureCount'] = measure;
      
      // Validate the chart object
      if (chart.stepCount === 0) {
        console.warn('Warning: Chart has no steps, difficulty:', chart.difficulty, 'rating:', chart.rating);
      }
      
      console.log('Parsed SM difficulty:', chart.difficulty, 'rating:', chart.rating, 'steps:', chart.stepCount);
      return chart;
      
    } catch (error) {
      console.error('Error parsing SM difficulty:', error);
      return null;
    }
  }
}

module.exports = Chart;