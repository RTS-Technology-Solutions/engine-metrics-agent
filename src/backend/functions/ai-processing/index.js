const admin = require('firebase-admin');
const { VertexAI } = require('@google-cloud/aiplatform');

// Initialize Vertex AI client
const vertex_ai = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || 'chess-engine-metrics-agent',
  location: 'us-central1'
});

async function processDataWithAI(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uploadId, analysisType } = req.body;

    if (!uploadId) {
      return res.status(400).json({ error: 'Upload ID is required' });
    }

    // Retrieve upload data from Firestore
    const uploadDoc = await admin.firestore()
      .collection('uploads')
      .doc(uploadId)
      .get();

    if (!uploadDoc.exists) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    const uploadData = uploadDoc.data();
    
    // Download and process the file
    const processedData = await processFileWithAI(uploadData, analysisType);

    // Store AI analysis results
    const analysisDoc = await admin.firestore()
      .collection('analysis')
      .add({
        uploadId: uploadId,
        analysisType: analysisType || 'comprehensive',
        results: processedData,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

    // Update upload status
    await admin.firestore()
      .collection('uploads')
      .doc(uploadId)
      .update({
        processed: true,
        analysisId: analysisDoc.id,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.status(200).json({
      message: 'AI processing completed',
      analysisId: analysisDoc.id,
      results: processedData
    });

  } catch (error) {
    console.error('AI processing error:', error);
    res.status(500).json({ error: 'AI processing failed' });
  }
}

async function processFileWithAI(uploadData, analysisType) {
  const { filePath, fileType, fileName } = uploadData;

  try {
    // Download file content
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    const [fileContents] = await file.download();
    const content = fileContents.toString();

    // Process based on file type and analysis type
    let aiAnalysis = {};

    switch (fileType) {
      case 'pgn':
        aiAnalysis = await analyzePGNWithAI(content, analysisType);
        break;
      case 'json':
        aiAnalysis = await analyzeJSONWithAI(content, analysisType);
        break;
      case 'md':
        aiAnalysis = await analyzeMarkdownWithAI(content, analysisType);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    return {
      fileName,
      fileType,
      analysisType,
      aiInsights: aiAnalysis,
      processedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
}

async function analyzePGNWithAI(content, analysisType) {
  // Extract game data
  const games = extractGamesFromPGN(content);
  
  // Prepare prompt for AI analysis
  const prompt = `
    Analyze the following chess game data and provide insights:
    
    Total games: ${games.length}
    Game sample: ${JSON.stringify(games.slice(0, 5), null, 2)}
    
    Please provide:
    1. Engine performance summary
    2. Playing strength trends
    3. Key tactical patterns
    4. Recommendations for improvement
    
    Focus on: ${analysisType || 'comprehensive analysis'}
  `;

  try {
    // Use Vertex AI for analysis (simplified for now)
    const analysis = await generateAIResponse(prompt);
    
    return {
      gamesAnalyzed: games.length,
      enginePerformance: calculateEngineStats(games),
      aiInsights: analysis,
      keyMetrics: extractKeyMetrics(games)
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      gamesAnalyzed: games.length,
      enginePerformance: calculateEngineStats(games),
      aiInsights: 'AI analysis temporarily unavailable',
      keyMetrics: extractKeyMetrics(games)
    };
  }
}

async function analyzeJSONWithAI(content, analysisType) {
  try {
    const data = JSON.parse(content);
    
    const prompt = `
      Analyze this JSON performance data:
      ${JSON.stringify(data, null, 2)}
      
      Provide insights on:
      1. Performance trends
      2. Areas for improvement
      3. Comparative analysis
      4. Strategic recommendations
    `;

    const analysis = await generateAIResponse(prompt);
    
    return {
      dataStructure: analyzeJSONStructure(data),
      aiInsights: analysis,
      keyFindings: extractJSONKeyFindings(data)
    };
  } catch (error) {
    throw new Error(`JSON analysis failed: ${error.message}`);
  }
}

async function analyzeMarkdownWithAI(content, analysisType) {
  const prompt = `
    Analyze this chess engine documentation/report:
    
    ${content.substring(0, 2000)}...
    
    Extract:
    1. Key performance indicators
    2. Technical improvements mentioned
    3. Problem areas identified
    4. Future development priorities
  `;

  try {
    const analysis = await generateAIResponse(prompt);
    
    return {
      documentLength: content.length,
      sections: extractMarkdownSections(content),
      aiInsights: analysis,
      keyTopics: extractKeyTopics(content)
    };
  } catch (error) {
    return {
      documentLength: content.length,
      sections: extractMarkdownSections(content),
      aiInsights: 'AI analysis temporarily unavailable',
      keyTopics: extractKeyTopics(content)
    };
  }
}

async function generateAIResponse(prompt) {
  // Simplified AI response - in production, this would use Vertex AI
  // For now, return structured mock response
  return {
    summary: "Analysis completed successfully",
    insights: [
      "Engine performance shows consistent improvement",
      "Tactical accuracy has increased by 15%",
      "Endgame evaluation needs optimization"
    ],
    recommendations: [
      "Focus on time management optimization",
      "Enhance positional evaluation",
      "Improve opening book coverage"
    ],
    confidence: 0.85
  };
}

// Helper functions
function extractGamesFromPGN(content) {
  const games = [];
  const blocks = content.split('\n\n\n').filter(block => block.trim());
  
  blocks.forEach(block => {
    if (block.includes('[Event ')) {
      const game = parseGameHeaders(block);
      if (game) games.push(game);
    }
  });
  
  return games;
}

function parseGameHeaders(block) {
  const headers = {};
  const lines = block.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/\[(\w+)\s+"([^"]+)"\]/);
    if (match) {
      headers[match[1]] = match[2];
    }
  });
  
  if (headers.White && headers.Black && headers.Result) {
    return {
      white: headers.White,
      black: headers.Black,
      result: headers.Result,
      date: headers.Date,
      event: headers.Event,
      timeControl: headers.TimeControl
    };
  }
  
  return null;
}

function calculateEngineStats(games) {
  const stats = {};
  
  games.forEach(game => {
    [game.white, game.black].forEach(engine => {
      if (!stats[engine]) {
        stats[engine] = { wins: 0, draws: 0, losses: 0, total: 0 };
      }
      stats[engine].total++;
      
      if (game.result === '1-0') {
        if (engine === game.white) stats[engine].wins++;
        else stats[engine].losses++;
      } else if (game.result === '0-1') {
        if (engine === game.black) stats[engine].wins++;
        else stats[engine].losses++;
      } else {
        stats[engine].draws++;
      }
    });
  });
  
  return stats;
}

function extractKeyMetrics(games) {
  return {
    totalGames: games.length,
    timeControls: [...new Set(games.map(g => g.timeControl).filter(Boolean))],
    engines: [...new Set([...games.map(g => g.white), ...games.map(g => g.black)])],
    dateRange: {
      earliest: Math.min(...games.map(g => new Date(g.date || '1900-01-01'))),
      latest: Math.max(...games.map(g => new Date(g.date || '1900-01-01')))
    }
  };
}

function analyzeJSONStructure(data) {
  return {
    topLevelKeys: Object.keys(data),
    dataTypes: Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key, 
        Array.isArray(value) ? 'array' : typeof value
      ])
    ),
    complexity: calculateDataComplexity(data)
  };
}

function extractJSONKeyFindings(data) {
  // Extract potential performance metrics from JSON
  const findings = [];
  
  if (data.elo || data.rating) {
    findings.push(`ELO/Rating data detected: ${data.elo || data.rating}`);
  }
  
  if (data.wins || data.losses || data.draws) {
    findings.push(`Game statistics found: W:${data.wins} L:${data.losses} D:${data.draws}`);
  }
  
  return findings;
}

function extractMarkdownSections(content) {
  const sections = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (line.match(/^#+\s/)) {
      const level = (line.match(/^#+/) || [''])[0].length;
      const title = line.replace(/^#+\s*/, '');
      sections.push({ level, title, line: index + 1 });
    }
  });
  
  return sections;
}

function extractKeyTopics(content) {
  const topics = [];
  const keywords = [
    'performance', 'elo', 'rating', 'improvement', 'tactical', 'positional',
    'endgame', 'opening', 'blitz', 'rapid', 'classical', 'engine', 'analysis'
  ];
  
  keywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = content.match(regex);
    if (matches && matches.length > 2) {
      topics.push({ keyword, frequency: matches.length });
    }
  });
  
  return topics.sort((a, b) => b.frequency - a.frequency);
}

function calculateDataComplexity(data) {
  const str = JSON.stringify(data);
  return {
    size: str.length,
    depth: getObjectDepth(data),
    keyCount: countAllKeys(data)
  };
}

function getObjectDepth(obj) {
  if (typeof obj !== 'object' || obj === null) return 0;
  
  let maxDepth = 0;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const depth = getObjectDepth(obj[key]);
      maxDepth = Math.max(maxDepth, depth);
    }
  }
  
  return maxDepth + 1;
}

function countAllKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return 0;
  
  let count = Object.keys(obj).length;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      count += countAllKeys(obj[key]);
    }
  }
  
  return count;
}

module.exports = {
  processDataWithAI
};