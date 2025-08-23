const Options = {
  targetOpts() {
    const targetOpts = {
      imgUrl: 'assets/images/target.png',
      velocity: [0, 0],
      position: [70, 150],
      target: true
    };
    return targetOpts
  },

  bluePopOpts() {
    const popOpts = {
      imgUrl: 'assets/images/bluepop.png',
      velocity: [0, 0],
      position: [70, 150],
      isAPop: true
    };
    return popOpts
  },

  yellowPopOpts() {
    const popOpts = {
      imgUrl: 'assets/images/yellowPop.png',
      velocity: [0, 0],
      position: [70, 150],
      isAPop: true
    };
    return popOpts
  },

  greenPopOpts() {
    const popOpts = {
      imgUrl: 'assets/images/greenPop.png',
      velocity: [0, 0],
      position: [70, 150],
      isAPop: true
    };
    return popOpts
  },

  purplePopOpts() {
    const popOpts = {
      imgUrl: 'assets/images/purplePop.png',
      velocity: [0, 0],
      position: [70, 150],
      isAPop: true
    };
    return popOpts
  },

  brownPopOpts() {
    const popOpts = {
      imgUrl: 'assets/images/brownPop.png',
      velocity: [0, 0],
      position: [70, 150],
      isAPop: true
    };
    return popOpts
  },

  arrowOpts() {
    const arrowOpts = {
      imgUrl: 'assets/images/quarter.png',
      velocity: [0, -5],
      position: [70, 960],
      target: false
    };
    return arrowOpts
  },

  chartOpts(chartName = 'Bumble Bee') {
    let chartOpts;
    
    switch(chartName) {
      case 'drop_pop_candy':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.ssc`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}_bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}_bn.png`
        };
        break;
      case 'Fuse ~ Titancube':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/steps.ssc`,
          audioDir: `assets/chart/${chartName}/Fuse.mp3`,
          bgDir: `assets/chart/${chartName}/Fuse.png`,
          bannerDir: `assets/chart/${chartName}/Fuse.png`
        };
        break;
      case 'Family Farce ~ TSUHSUIXAMUSH':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/steps.ssc`,
          audioDir: `assets/chart/${chartName}/TSUHSUIXAMUSH.mp3`,
          bgDir: `assets/chart/${chartName}/TITLE.png`,
          bannerDir: `assets/chart/${chartName}/TSUHSUIXAMUSH.png`
        };
        break;
      case 'Tribal Style':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Summer Speedy Mix':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Incognito':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'No Princess':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Baby Baby':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Cryosleep':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Clockwork Genesis':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Ize Pie':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Hardcore Symphony':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'High':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Sweet World':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Monolith':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Hillbilly Hardcore':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Birdie':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Agent Blatant':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Fleadh Uncut':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Robotix':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Disconnected Disco':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'One False Move':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Vorsprung Durch Techno':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Soapy Bubble':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Wanna Do':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Hispanic Panic':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Pick Me Up & Tango':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'D-Code':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'VerTex^2':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Spin Chicken':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Music Pleeze':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Renaissance':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Determinator':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Hustle Beach':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Wake Up':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Bloodrush':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'The Message':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Get Happy':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Holy Guacamole':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Lipstick Kiss':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Summer in Belize':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Destiny':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Habanera 1':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Spaceman':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Ride the Bass':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Baby Don\'t You Want Me':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'We Know What To Do':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Funk Factory':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Sunshine':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Typical Tropical':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Psalm Pilot':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Visible Noise':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Little Kitty Mine':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Life of a Butterfly':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'This is Rock & Roll':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Temple of Boom':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Liquid Moon':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'My Life Is So Crazy':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Know Your Enemy':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Bumble Bee':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Amore':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Energizer':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Twilight':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Spacy Crazy Girl':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'July -Euromix-':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Reactor':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Go 60 Go':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      case 'Out Of The Dark':
        chartOpts = {
          stepDir: `assets/chart/${chartName}/${chartName}.sm`,
          audioDir: `assets/chart/${chartName}/${chartName}.ogg`,
          bgDir: `assets/chart/${chartName}/${chartName}-bg.png`,
          bannerDir: `assets/chart/${chartName}/${chartName}-banner.png`
        };
        break;
      default:
        // Fallback to Bumble Bee if chart not found
        chartOpts = {
          stepDir: `assets/chart/Bumble Bee/Bumble Bee.sm`,
          audioDir: `assets/chart/Bumble Bee/Bumble Bee.ogg`,
          bgDir: `assets/chart/Bumble Bee/Bumble Bee-bg.png`,
          bannerDir: `assets/chart/Bumble Bee/Bumble Bee-banner.png`
        };
    }
    
    return chartOpts;
  },

  gameOpts() {
    const gameOpts = {
      numTargets: 4,
      speed: 5,
      chartOpts: this.chartOpts(),
      difficulty: 3
    }
    return gameOpts;
  },

  colors() {
    const colors = {
    FANTASTIC: 'rgba(33, 204, 232, 1)',
    EXCELLENT: 'rgba(226, 156, 24, 1)',
    GREAT: 'rgba(102, 201, 85, 1)',
    DECENT: 'rgba(180, 92, 255, 1)',
    WAYOFF: 'rgba(201, 133, 94, 1)'
    }
    return colors
  }
}

module.exports = Options;