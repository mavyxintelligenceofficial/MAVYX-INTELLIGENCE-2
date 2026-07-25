/**
 * AI Assistant — Platform-aware conversational AI
 * Knows everything about Mavyx Intelligence
 * Can help navigate, explain features, answer questions
 * Fun, playful, like ChatGPT/Claude
 */

const PLATFORM_KNOWLEDGE = `
ABOUT MAVYX INTELLIGENCE:
- Mavyx Intelligence is an AI-powered Forex market intelligence platform
- It does NOT execute trades — it provides intelligence to help traders make better decisions
- It uses 11 specialist AI agents that analyze markets from different perspectives
- An Executive Decision Engine synthesizes all agent findings into one recommendation
- Every recommendation is evidence-based and explainable

THE 11 AI AGENTS:
1. Technical Analysis Agent — Reads charts, indicators, price action, trends
2. Market Structure Agent — Analyzes Smart Money/ICT concepts (BOS, CHoCH, order blocks, FVGs)
3. Fundamental Analysis Agent — Macroeconomic factors, central banks, interest rates
4. Sentiment Agent — Market sentiment, risk-on/off, positioning
5. Liquidity Intelligence Agent — Maps buy/sell liquidity, stop hunts, sweeps
6. Historical Pattern Agent — Compares current conditions to historical setups
7. Risk Management Agent — Evaluates risk/reward, can reject trades
8. Psychology Agent — Studies the USER's trading behavior and discipline
9. Devil's Advocate Agent — Tries to find reasons NOT to trade (challenges everything)
10. Market Behavior Agent — Session analysis, market phase, trend character
11. Recommendation Agent — Suggests entry/exit/SL/TP based on all findings

EXECUTIVE DECISION ENGINE:
- Receives reports from all 11 agents
- Measures agreement and disagreement
- Calculates confidence from evidence quality
- Produces: Buy / Sell / Wait / No Trade recommendation
- Includes confidence score, evidence, risk warnings, suggested action

CONFIDENCE RING:
- Shows 0-100% confidence
- Calculated from evidence quality, agent agreement, data completeness
- Higher confidence = stronger evidence supporting the recommendation
- Lower confidence = conflicting signals or missing information

EVIDENCE CARDS:
- Each agent produces an evidence card showing their signal and confidence
- Click any card to see the agent's detailed reasoning
- Green = bullish, Red = bearish, Grey = neutral

SUGGESTED ACTION:
- Entry Zone: Where to consider entering
- Stop Loss: Where to place stop loss
- Take Profit 1 & 2: Where to take profits
- These are suggestions only — the trader decides

PAGES:
- Dashboard: Overview of markets, recent analyses, quick actions
- Workspace: Main intelligence workspace with live chart + AI panel
- Markets: View all available currency pairs with live prices
- Watchlist: Save your favorite pairs for quick access
- Journal: Every analysis is saved here as a research case
- Analytics: Performance metrics, agent accuracy, recommendation distribution
- Settings: Account settings, display name, security
- System Health: Monitor all service statuses

IMPORTANT DISCLAIMERS:
- Mavyx is NOT a trading bot — it does not execute trades
- Mavyx is NOT financial advice — it's intelligence to help decision-making
- The human trader always makes the final decision
- Past performance does not guarantee future results
`;

interface ChatContext {
  symbol?: string;
  result?: any;
  userName?: string;
}

export function generateAssistantResponse(
  userMessage: string,
  context: ChatContext,
  chatHistory: Array<{ role: string; text: string }>
): string {
  const msg = userMessage.toLowerCase().trim();
  const { symbol, result, userName } = context;

  // ─── Greetings ─────────────────────────────────────────────
  if (msg.match(/^(hi|hello|hey|sup|yo|greetings)/)) {
    const greetings = [
      `Hey there! 👋 I'm your Mavyx AI assistant. I can help you understand market analysis, explain how the platform works, or just chat about trading. What's on your mind?`,
      `Hello! Welcome to Mavyx Intelligence. I'm here to help you navigate the platform and understand your analyses. Ask me anything!`,
      `Hey! 🚀 Ready to dive into some market intelligence? I can explain any feature, break down an analysis, or help you find what you need.`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // ─── How are you / Personal ────────────────────────────────
  if (msg.match(/how are you|how's it going|what's up/)) {
    return `I'm doing great! Running on 11 specialist agents and ready to analyze some markets. 😄 How can I help you today?`;
  }

  // ─── What are you / Who are you ────────────────────────────
  if (msg.match(/who are you|what are you|what do you do/)) {
    return `I'm the Mavyx AI Assistant — think of me as your personal trading intelligence advisor. 🧠\n\nI have access to:\n• All 11 specialist AI agents\n• Your analysis history\n• Market data\n• The entire Mavyx platform\n\nI can explain analyses, help you navigate, answer questions about trading concepts, or just chat. I'm here to make your experience better!`;
  }

  // ─── What is Mavyx ─────────────────────────────────────────
  if (msg.match(/what is mavyx|what does mavyx|mavyx intelligence|about (this|the) platform/)) {
    return `Mavyx Intelligence is an AI-powered Forex market intelligence platform. Here's the cool part:\n\n🧠 **11 AI Agents** — Each one is a specialist (technical analysis, sentiment, risk, etc.)\n⚡ **Executive Decision Engine** — Synthesizes all agents into one clear recommendation\n📊 **Evidence-Based** — Every recommendation comes with evidence and confidence scores\n🔍 **Transparent** — You can see exactly WHY each agent reached its conclusion\n\nWe don't execute trades — we give you the intelligence to make better decisions. Think of it as having an institutional research team in your pocket! 💼`;
  }

  // ─── How does it work ──────────────────────────────────────
  if (msg.match(/how does (it|this) work|how do (i|you) use|explain how/)) {
    return `Here's how Mavyx works:\n\n1️⃣ **Choose a currency pair** (like EUR/USD) in the Workspace\n2️⃣ **Click "Run Analysis"** — this deploys all 11 AI agents\n3️⃣ **Wait 30-60 seconds** — agents analyze in parallel\n4️⃣ **Read the Executive Brief** — see the recommendation, confidence, evidence\n5️⃣ **Check each agent** — click any evidence card to see their reasoning\n6️⃣ **Make your decision** — the AI advises, YOU decide\n\nEvery analysis is automatically saved to your Journal for future review! 📝`;
  }

  // ─── Agents / How many agents ──────────────────────────────
  if (msg.match(/agent|how many|specialist/)) {
    return `We have **11 specialist AI agents**, each an expert in their domain:\n\n📈 **Technical Analysis** — Charts, indicators, trends\n🏗️ **Market Structure** — Smart Money/ICT concepts\n📰 **Fundamentals** — Central banks, economics\n💭 **Sentiment** — Market mood, risk-on/off\n💧 **Liquidity** — Stop hunts, liquidity maps\n📚 **Historical** — Compares to past setups\n⚠️ **Risk** — Evaluates risk/reward, can reject trades\n🧠 **Psychology** — Studies YOUR behavior\n😈 **Devil's Advocate** — Tries to disprove everything\n📊 **Market Behavior** — Sessions, phases\n🎯 **Recommendation** — Suggests entry/exit levels\n\nEach agent runs independently, then the Executive Engine synthesizes everything!`;
  }

  // ─── Confidence ────────────────────────────────────────────
  if (msg.match(/confidence|what.*mean.*confidence/)) {
    if (result) {
      return `The current confidence is **${result.confidence}%**.\n\nThis is calculated from:\n• ${result.successful_agents} specialist agents contributing\n• Agent consensus: ${result.agent_consensus?.bullish || 0} bullish, ${result.agent_consensus?.bearish || 0} bearish, ${result.agent_consensus?.neutral || 0} neutral\n• Evidence quality from each agent\n\nHigher confidence = agents agree and evidence is strong.\nLower confidence = agents disagree or data is limited.\n\nConfidence is NOT a prediction of success — it's a measure of how strong the evidence is right now.`;
    }
    return `Confidence is a score from 0-100% that measures how strong the evidence is for a recommendation.\n\n• **70-100%** = Strong evidence, agents agree\n• **50-69%** = Moderate evidence, some disagreement\n• **30-49%** = Weak evidence, mixed signals\n• **0-29%** = Insufficient data\n\nRun an analysis first, then ask me about the confidence and I'll break it down for you!`;
  }

  // ─── Risk ──────────────────────────────────────────────────
  if (msg.match(/risk|risk.*warning|what.*could go wrong/)) {
    if (result?.risk_warnings?.length > 0) {
      return `⚠️ **Risk Warnings for ${result.symbol}:**\n\n${result.risk_warnings.map((w: string) => `• ${w}`).join('\n')}\n\nRemember: Risk management is the most important part of trading. Never risk more than you can afford to lose!`;
    }
    return `Risk management is crucial in trading. Here are the basics:\n\n• Never risk more than 1-2% of your account per trade\n• Always use a stop loss\n• Risk/reward ratio should be at least 1:2\n• Don't revenge trade after losses\n• The Risk Management Agent in Mavyx can REJECT trades if risk is too high! ⚠️`;
  }

  // ─── Evidence ──────────────────────────────────────────────
  if (msg.match(/evidence|why.*recommend|support/)) {
    if (result?.key_evidence?.length > 0) {
      return `📋 **Key Evidence for ${result.symbol}:**\n\n${result.key_evidence.map((e: string) => `✅ ${e}`).join('\n')}\n\nThis evidence comes from the specialist agents' independent analyses. Each piece is verified and weighted by the Executive Engine.`;
    }
    return `Evidence is the foundation of every Mavyx recommendation. Each agent provides findings, and the Executive Engine evaluates:\n• Quality of evidence\n• How many agents agree\n• How fresh the data is\n• Whether evidence contradicts\n\nRun an analysis and I'll show you the specific evidence!`;
  }

  // ─── What should I trade ───────────────────────────────────
  if (msg.match(/what should|should i (trade|buy|sell)|recommend/)) {
    if (result) {
      return `Based on the current ${result.symbol} analysis:\n\n🎯 **Recommendation:** ${result.recommendation?.toUpperCase()}\n📊 **Confidence:** ${result.confidence}%\n\n${result.executive_summary?.substring(0, 200) || ''}\n\nRemember: This is intelligence, not advice. YOU make the final decision! 🧠`;
    }
    return `I can't tell you what to trade — that's YOUR decision! But I can help you get the intelligence you need.\n\nGo to the **Workspace**, select a currency pair, and click **Run Analysis**. The 11 agents will analyze the market and give you an evidence-based recommendation.\n\nThen come back and ask me about it! 📊`;
  }

  // ─── Help / Navigation ─────────────────────────────────────
  if (msg.match(/help|navigate|where|find|page|section/)) {
    return `Here's what you can find in Mavyx:\n\n◈ **Workspace** — Main intelligence hub with live chart + AI analysis\n▦ **Dashboard** — Market overview, recent analyses, quick actions\n◇ **Markets** — View all currency pairs with live prices\n◻ **Watchlist** — Your saved favorite pairs\n◫ **Journal** — Every analysis saved as a research case\n◬ **Analytics** — Your performance metrics and agent accuracy\n⚙ **Settings** — Account, display name, security\n⊕ **System** — Health status of all services\n\nWhat are you looking for? I can guide you! 🗺️`;
  }

  // ─── Chart / TradingView ───────────────────────────────────
  if (msg.match(/chart|tradingview|candle|price/)) {
    return `The chart in the Workspace is powered by **TradingView** — the same charting platform used by professional traders worldwide! 📈\n\nFeatures:\n• Real-time live price updates\n• All timeframes (1m to 1M)\n• Drawing tools and indicators\n• Professional candlestick display\n\nThe chart updates in real-time — no refresh needed!`;
  }

  // ─── Journal ───────────────────────────────────────────────
  if (msg.match(/journal|history|past.*analysis|previous/)) {
    return `The **Journal** (◫ in the sidebar) stores every analysis you run as a research case.\n\nEach entry includes:\n• The recommendation and confidence\n• All agent findings\n• Key evidence and risk warnings\n• Timestamp\n\nYou can click any entry to expand it and see the full breakdown. Use it to review past analyses and learn from patterns! 📝`;
  }

  // ─── Watchlist ──────────────────────────────────────────────
  if (msg.match(/watchlist|favorite|save.*pair|track/)) {
    return `The **Watchlist** (◻ in the sidebar) lets you save your favorite currency pairs for quick access.\n\n• Click "Add" to add a symbol (like EUR/USD)\n• See live prices for all your saved pairs\n• Click any pair to go to the Workspace and analyze it\n• Remove pairs you no longer want to track\n\nYour watchlist is saved to your account! 👁️`;
  }

  // ─── Fun / Jokes ───────────────────────────────────────────
  if (msg.match(/joke|funny|laugh|humor/)) {
    const jokes = [
      `Why did the trader break up with the indicator? Because it kept giving mixed signals! 😄`,
      `What's the difference between a trader and a pizza? A pizza can feed a family of four! 😂 (Just kidding — that's why we have risk management!)`,
      `I asked the Devil's Advocate agent what it thought about my trade idea. It said "No." Then I asked again. It said "Still no." That agent doesn't mess around! 😈`,
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  // ─── Thanks ────────────────────────────────────────────────
  if (msg.match(/thank|thanks|thx|appreciate/)) {
    const thanks = [
      `You're welcome! That's what I'm here for. Let me know if you need anything else! 😊`,
      `Anytime! Happy to help you make better trading decisions. 🚀`,
      `No problem! Remember, I'm always here if you have questions. Good luck with your analysis! 📊`,
    ];
    return thanks[Math.floor(Math.random() * thanks.length)];
  }

  // ─── Bye ───────────────────────────────────────────────────
  if (msg.match(/bye|goodbye|see you|later|cya/)) {
    return `See you later! Remember to check your Journal for past analyses and keep learning. Good trading! 👋📈`;
  }

  // ─── Default — Contextual response ─────────────────────────
  if (result) {
    return `Based on the current ${symbol || result.symbol} analysis:\n\n• **Recommendation:** ${result.recommendation?.toUpperCase()}\n• **Confidence:** ${result.confidence}%\n• **Agents:** ${result.agent_consensus?.bullish || 0} bullish, ${result.agent_consensus?.bearish || 0} bearish\n\n${result.executive_summary?.substring(0, 200) || ''}\n\nAsk me about confidence, risk, evidence, agents, or how the platform works! I'm here to help. 😊`;
  }

  return `That's an interesting question! I'm the Mavyx AI Assistant and I can help with:\n\n• **Understanding analyses** — Ask "explain the confidence" or "what's the risk?"\n• **Platform navigation** — Ask "how do I use the workspace?" or "where's my journal?"\n• **Trading concepts** — Ask "what are order blocks?" or "how does risk/reward work?"\n• **General chat** — I'm friendly! Ask me anything 😊\n\nWhat would you like to know?`;
}
