import {
  ResidueEstimateRequest,
  ResidueEstimateResponse,
  AssistantChatMessage,
  RegionalDemandInsight,
  PriceTrendDataPoint,
  FireHotspotZone,
} from '../../types/aiml';
import {
  INITIAL_DEMAND_INSIGHTS,
  INITIAL_PRICE_TRENDS,
  INITIAL_FIRE_HOTSPOTS,
} from '../mockData';

const ASSISTANT_PRESETS = {
  en: [
    'How do I calculate recoverable straw from 35 acres of Basmati?',
    'What is the current market rate for square bales in Sangrur?',
    'What are the government penalties for stubble burning in Punjab?',
    'How does Straw2Cash escrow protect farmer payments?',
  ],
  hi: [
    '35 एकड़ बासमती धान से कितनी पराली (स्ट्रॉ) मिलेगी?',
    'संगरूर और करनाल में बेलर का किराया और पराली का भाव क्या है?',
    'पराली ना जलाने पर सरकार से क्या सहायता या सब्सिडी मिलती है?',
    'खरीदार (बायर्स) से पेमेंट सुरक्षित कैसे मिलती है?',
  ],
  pa: [
    '35 ਏਕੜ ਬਾਸਮਤੀ ਝੋਨੇ ਵਿੱਚੋਂ ਕਿੰਨੀ ਪਰਾਲੀ ਬਣ ਸਕਦੀ ਹੈ?',
    'ਸੰਗਰੂਰ ਤੇ ਪਟਿਆਲਾ ਵਿੱਚ ਪਰਾਲੀ ਦੀਆਂ ਗੰਢਾਂ (ਬੇਲ) ਦਾ ਕੀ ਰੇਟ ਚੱਲ ਰਿਹਾ ਹੈ?',
    'ਸੁਪਰ ਐਸ.ਐਮ.ਐਸ ਅਤੇ ਬੇਲਰ ਮਸ਼ੀਨ ਕਿਵੇਂ ਬੁੱਕ ਕਰੀਏ?',
    'ਸਟ੍ਰਾਅ ਟੂ ਕੈਸ਼ ਰਾਹੀਂ ਕਿਸਾਨਾਂ ਨੂੰ ਪੈਸੇ ਕਿਵੇਂ ਮਿਲਦੇ ਹਨ?',
  ],
};

export const pythonAiMlApi = {
  // Residue Estimation: POST /api/v1/residue/estimate
  async estimateResidue(req: ResidueEstimateRequest): Promise<ResidueEstimateResponse> {
    // Agronomic estimation model
    // Grain yield in quintals: 1 quintal = 0.1 tons
    const grainTonsPerAcre = req.expectedGrainYieldQuintalsPerAcre * 0.1;
    let strawToGrainRatio = 1.35;
    if (req.cropType.includes('Basmati')) strawToGrainRatio = 1.45;
    else if (req.cropType.includes('Wheat')) strawToGrainRatio = 1.25;
    else if (req.cropType.includes('Mustard')) strawToGrainRatio = 1.6;

    const totalBiomassPerAcre = grainTonsPerAcre * strawToGrainRatio;
    const totalStrawGeneratedTons = Math.round(totalBiomassPerAcre * req.fieldAreaAcres * 10) / 10;

    // Cutting height reduction factor: standard is 10-15cm. Higher cut leaves more stubble in ground
    const cuttingLossFactor = Math.min(0.35, Math.max(0.08, req.cuttingHeightCm * 0.008));
    const harvestingEfficiency = req.harvestingMethod.includes('SMS') ? 0.92 : req.harvestingMethod.includes('Manual') ? 0.96 : 0.85;

    const recoverableResidueTons = Math.round(totalStrawGeneratedTons * (1 - cuttingLossFactor) * harvestingEfficiency * 10) / 10;
    const unrecoverableStubStubbleTons = Math.round((totalStrawGeneratedTons - recoverableResidueTons) * 10) / 10;

    let minPricePerTon = 1800;
    let maxPricePerTon = 2300;
    if (req.cropType.includes('Basmati')) {
      minPricePerTon = 2050;
      maxPricePerTon = 2450;
    } else if (req.cropType.includes('Wheat')) {
      minPricePerTon = 2200;
      maxPricePerTon = 2650;
    }

    const estimatedMarketValueMinInr = Math.round(recoverableResidueTons * minPricePerTon);
    const estimatedMarketValueMaxInr = Math.round(recoverableResidueTons * maxPricePerTon);
    const estimatedCo2AvoidanceTons = Math.round(recoverableResidueTons * 1.5 * 10) / 10;

    return {
      totalStrawGeneratedTons,
      recoverableResidueTons,
      unrecoverableStubStubbleTons,
      strawToGrainRatio,
      recommendedBaleType: req.fieldAreaAcres > 25 ? 'High-Density Square Bales (Claas/John Deere)' : 'Compact Round Bales (4x4)',
      estimatedMarketValueMinInr,
      estimatedMarketValueMaxInr,
      fireRiskReductionIndexPercent: 94,
      estimatedCo2AvoidanceTons,
      soilNutrientRetentionRecommendation: 'Incorporate roots & lower 10cm stubble with Happy Seeder or mulcher to retain 35kg Potassium/acre.',
    };
  },

  // AI Assistant: POST /api/v1/assistant/chat
  async sendAssistantMessage(
    userMessage: string,
    language: 'en' | 'hi' | 'pa' = 'en',
    history: AssistantChatMessage[] = []
  ): Promise<AssistantChatMessage> {
    const lower = userMessage.toLowerCase();

    let reply = '';
    const suggestedPrompts = ASSISTANT_PRESETS[language];

    if (language === 'pa') {
      if (lower.includes('ਰੇਟ') || lower.includes('ਭਾਅ') || lower.includes('ਕਿੰਨੇ')) {
        reply = `ਸੰਗਰੂਰ, ਪਟਿਆਲਾ ਅਤੇ ਬਠਿੰਡਾ ਖੇਤਰ ਵਿੱਚ ਬਾਸਮਤੀ ਝੋਨੇ ਦੀ ਪਰਾਲੀ ਦੀਆਂ ਗੰਢਾਂ (Square Bales) ਦਾ ਭਾਅ ₹2,100 ਤੋਂ ₹2,350 ਪ੍ਰਤੀ ਟਨ ਚੱਲ ਰਿਹਾ ਹੈ। ਜੇਕਰ ਪਰਾਲੀ ਖੇਤ ਵਿੱਚ ਖੜ੍ਹੀ ਹੈ (ਲੂਜ਼), ਤਾਂ ₹1,650 - ₹1,800 ਪ੍ਰਤੀ ਟਨ ਮਿਲ ਰਿਹਾ ਹੈ। ਬਾਇਓ-ਐਨਰਜੀ ਪਲਾਂਟਾਂ ਵੱਲੋਂ ਮੰਗ ਬਹੁਤ ਵੱਧ ਹੈ।`;
      } else if (lower.includes('ਬੇਲਰ') || lower.includes('ਮਸ਼ੀਨ') || lower.includes('ਬੁੱਕ')) {
        reply = `ਤੁਸੀਂ ਸਟ੍ਰਾਅ ਟੂ ਕੈਸ਼ ਉੱਤੇ 'ਬੇਲਰ ਸਰਵਿਸ' ਟੈਬ ਵਿੱਚ ਜਾ ਕੇ ਆਪਣੇ ਪਿੰਡ ਦੇ 25 ਕਿਲੋਮੀਟਰ ਦੇ ਘੇਰੇ ਵਿੱਚ ਉਪਲਬਧ ਬੇਲਰ ਆਪਰੇਟਰ ਦੇਖ ਸਕਦੇ ਹੋ। ਔਸਤਨ ਬੇਲਿੰਗ ਦਾ ਖਰਚਾ ₹1,200 - ₹1,350 ਪ੍ਰਤੀ ਏਕੜ ਹੈ, ਜੋ ਕਿ ਖਰੀਦਦਾਰ ਦੇ ਕੰਟਰੈਕਟ ਵਿੱਚ ਐਡਜਸਟ ਕੀਤਾ ਜਾ ਸਕਦਾ ਹੈ।`;
      } else if (lower.includes('ਸਬਸਿਡੀ') || lower.includes('ਸਰਕਾਰ') || lower.includes('ਜਲਾਉਣ')) {
        reply = `ਪੰਜਾਬ ਸਰਕਾਰ ਤੇ CAQM ਵੱਲੋਂ ਪਰਾਲੀ ਸਾੜਨ 'ਤੇ ਪੂਰਨ ਪਾਬੰਦੀ ਹੈ ਅਤੇ ਸੈਟੇਲਾਈਟ ਰਾਹੀਂ ਨਿਗਰਾਨੀ ਹੋ ਰਹੀ ਹੈ। CRM ਸਕੀਮ ਤਹਿਤ ਸੁਪਰ ਸੀਡਰ, ਬੇਲਰ ਅਤੇ ਹੈਪੀ ਸੀਡਰ 'ਤੇ 50% ਤੋਂ 80% ਸਬਸਿਡੀ ਦਿੱਤੀ ਜਾ ਰਹੀ ਹੈ। ਪਰਾਲੀ ਵੇਚ ਕੇ ਤੁਸੀਂ ਪ੍ਰਤੀ ਏਕੜ ₹4,500 - ₹6,500 ਦਾ ਵਾਧੂ ਮੁਨਾਫਾ ਕਮਾ ਸਕਦੇ ਹੋ।`;
      } else {
        reply = `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਸਟ੍ਰਾਅ ਟੂ ਕੈਸ਼ ਦਾ ਏ.ਆਈ. ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਤੁਹਾਨੂੰ ਪਰਾਲੀ ਦੇ ਮੌਜੂਦਾ ਮੰਡੀ ਭਾਅ, ਖੇਤ ਵਿੱਚੋਂ ਪਰਾਲੀ ਦਾ ਅੰਦਾਜ਼ਾ ਲਗਾਉਣ (Residue Calculator), ਬੇਲਰ ਮਸ਼ੀਨ ਬੁੱਕ ਕਰਨ ਅਤੇ ਬਾਇਓ-ਮਾਸ ਪਲਾਂਟਾਂ ਨਾਲ ਕੰਟਰੈਕਟ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।`;
      }
    } else if (language === 'hi') {
      if (lower.includes('भाव') || lower.includes('रेट') || lower.includes('दाम')) {
        reply = `वर्तमान में पंजाब और हरियाणा के क्षेत्रों में बासमती धान की बेल (गांठों) का भाव ₹2,150 से ₹2,400 प्रति टन है। गैर-बासमती धान का भाव लगभग ₹1,950 - ₹2,050 प्रति टन है। नमी 15% से कम होने पर बॉयोमास प्लांट अधिकतम प्रीमियम देते हैं।`;
      } else if (lower.includes('जलाने') || lower.includes('सब्सिडी') || lower.includes('कानून')) {
        reply = `पराली जलाने पर पर्यावरण क्षति शुल्क (₹2,500 से ₹15,000 प्रति घटना) और राजस्व रिकॉर्ड में रेड एंट्री का प्रावधान है। इसके विपरीत, स्ट्रॉ2कैश पर अपनी पराली लिस्ट करके आप बिना किसी जुर्माने के प्रति एकड़ ₹5,000 तक शुद्ध आय अर्जित कर सकते हैं।`;
      } else if (lower.includes('पेमेंट') || lower.includes('सुरक्षित') || lower.includes('पैसे')) {
        reply = `स्ट्रॉ2कैश में सभी भुगतान एस्क्रो (Escrow) द्वारा सुरक्षित हैं। खरीदार का पैसा अनुबंध बनते ही जमा हो जाता है, और धर्मकांटा (वेब्रिज) पर्ची अपलोड होते ही 24 से 48 घंटे में सीधे किसान के बैंक खाते में ट्रांसफर हो जाता है।`;
      } else {
        reply = `नमस्ते! मैं स्ट्रॉ2कैश का कृषि सहायक हूँ। मैं आपको पराली अवशेष का सही अनुमान लगाने, नजदीकी बेलर खोजने, बायो-एनर्जी व पेपर मिल खरीदारों से जुड़ने और डिजिटल अनुबंध में मदद कर सकता हूँ।`;
      }
    } else {
      // English
      if (lower.includes('price') || lower.includes('rate') || lower.includes('market')) {
        reply = `Current spot pricing for Paddy Straw in Sangrur/Patiala/Karnal: High-density Square Bales are commanding ₹2,150–₹2,400 per ton delivered. Loose straw at farm gate is trading around ₹1,650–₹1,850/ton. Biomass power plants and 2G ethanol refineries are offering long-term supply premiums for moisture <15%.`;
      } else if (lower.includes('baler') || lower.includes('machine') || lower.includes('harvest')) {
        reply = `Custom hiring centers are operating round and square balers with rates between ₹1,200 and ₹1,350 per acre. With our integrated Baler matching, balers can be booked to arrive within 24 hours of your combine harvest. Pre-baled straw increases your net sale price by ~₹400/ton.`;
      } else if (lower.includes('fire') || lower.includes('burn') || lower.includes('hotspot') || lower.includes('penalty')) {
        reply = `Under CAQM regulations and the Air Prevention Act, stubble burning carries heavy environmental compensation charges and satellite monitoring. Selling via Straw2Cash diverts an average of 2.8 tons of residue per acre, avoiding ~4.2 tons of CO2 emissions while generating profitable cash flow.`;
      } else {
        reply = `Welcome to Straw2Cash AI Agronomy Assistant. I can assist you with residue estimation formulas, prevailing district mandi/biomass plant prices, baler machine dispatch, and guaranteed escrow contract flows. What would you like to explore?`;
      }
    }

    let tools_called: any[] | undefined = undefined;

    if (lower.includes('5') || lower.includes('ਕਿੱਲੇ') || lower.includes('acre') || lower.includes('calculate') || lower.includes('residue') || lower.includes('tonnes') || lower.includes('परली') || lower.includes('पराली')) {
      tools_called = [
        {
          tool_name: 'estimate_residue',
          arguments: { area: 5.0, area_unit: language === 'pa' ? 'killa' : 'acres', region: 'Punjab' },
          status: 'SUCCESS',
          summary: 'Calculated residue for 5 units: 12.04 tonnes (~27 bales recoverable)',
        },
      ];
    } else if (lower.includes('price') || lower.includes('rate') || lower.includes('ਭਾਅ') || lower.includes('भाव')) {
      tools_called = [
        {
          tool_name: 'fetch_mandi_prices',
          arguments: { district: 'Sangrur', crop: 'Paddy Basmati' },
          status: 'SUCCESS',
          summary: 'Sangrur spot rate: ₹2,150–₹2,400 / ton (Square Bales)',
        },
      ];
    }

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString(),
      language,
      suggestedPrompts,
      tools_called,
      detected_language: language,
    };
  },

  // Regional Demand: GET /api/v1/insights/demand
  async getRegionalDemand(): Promise<RegionalDemandInsight[]> {
    return [...INITIAL_DEMAND_INSIGHTS];
  },

  // Price Insights: GET /api/v1/insights/prices
  async getPriceTrends(): Promise<PriceTrendDataPoint[]> {
    return [...INITIAL_PRICE_TRENDS];
  },

  // Fire-Risk Zones: GET /api/v1/hotspots/risk-zones
  async getFireRiskZones(): Promise<FireHotspotZone[]> {
    return [...INITIAL_FIRE_HOTSPOTS];
  },
};
