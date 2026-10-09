"""
Multilingual Farmer AI Assistant Service using Strands Agents SDK.
Provides Amazon Bedrock support, Ollama fallback, and a robust deterministic offline mock engine.
"""

import re
import uuid
from typing import Dict, Any, List, Tuple, Optional
from app.core.config import settings
from app.core.logging import logger
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse, ToolInvocationSummary
from app.agents.tools import (
    estimate_residue,
    get_nearby_hotspots,
    get_buyer_demand,
    get_indicative_market_prices,
    explain_listing_steps,
    ASSISTANT_TOOLS,
)
from app.agents.prompts import FARMER_ASSISTANT_SYSTEM_PROMPT, PROMPTS_BY_LANGUAGE

# In-memory session store (isolated per session ID)
SESSION_HISTORY: Dict[str, List[Dict[str, str]]] = {}


def detect_language(text: str, preferred: str) -> str:
    """
    Detects Hindi (Devanagari), Punjabi (Gurmukhi), or English.
    """
    if preferred in ["hi", "pa", "en"]:
        return preferred

    # Check for Gurmukhi Unicode block (U+0A00 to U+0A7F)
    if any("\u0A00" <= ch <= "\u0A7F" for ch in text):
        return "pa"

    # Check for Devanagari Unicode block (U+0900 to U+097F)
    if any("\u0900" <= ch <= "\u097F" for ch in text):
        return "hi"

    # Check common Romanized Punjabi/Hindi words
    lower = text.lower()
    if any(w in lower for w in ["kisan", "parali", "kille", "killa", "sat sri akal", "tuhanu", "kinni", "vechni", "kheti"]):
        return "pa"
    if any(w in lower for w in ["namaste", "bhai", "kitna", "bhechna", "khet", "dam", "mulya"]):
        return "hi"

    return "en"


def extract_area_and_unit(text: str) -> Tuple[float, str]:
    """Extracts numeric area and unit from user text or returns default."""
    numbers = re.findall(r"\b\d+(?:\.\d+)?\b", text)
    area = float(numbers[0]) if numbers else 5.0  # default 5 acres/killa

    lower = text.lower()
    if "killa" in lower or "ਕਿੱਲ" in lower or "किल्ला" in lower:
        unit = "killa"
    elif "hectare" in lower or "ਹੈਕਟੇਅਰ" in lower or "हेक्टेयर" in lower:
        unit = "hectares"
    elif "bigha" in lower or "ਬੀਘਾ" in lower or "बीघा" in lower:
        unit = "bigha"
    else:
        unit = "acres"

    return area, unit


class AssistantService:
    """
    Service managing conversation, Strands Agents execution, and mock responses.
    """

    @classmethod
    async def chat(cls, request: AssistantChatRequest) -> AssistantChatResponse:
        session_id = request.session_id or f"sess-{uuid.uuid4().hex[:8]}"
        lang = detect_language(request.message, request.language)

        if session_id not in SESSION_HISTORY:
            SESSION_HISTORY[session_id] = []

        SESSION_HISTORY[session_id].append({"role": "user", "content": request.message})

        # Try real Bedrock / Ollama via Strands if configured
        if settings.MODEL_PROVIDER == "bedrock" and settings.AWS_ACCESS_KEY_ID:
            try:
                from strands import Agent
                from strands.models.bedrock import BedrockModel

                logger.info(f"Invoking Amazon Bedrock model ({settings.BEDROCK_MODEL_ID}) via Strands Agent")
                bedrock_model = BedrockModel(
                    region_name=settings.BEDROCK_REGION,
                    model_id=settings.BEDROCK_MODEL_ID
                )
                agent = Agent(
                    model=bedrock_model,
                    tools=ASSISTANT_TOOLS,
                    system_prompt=FARMER_ASSISTANT_SYSTEM_PROMPT
                )
                result = await agent.invoke_async(f"[Language: {lang}] {request.message}")
                reply_text = str(result.output if hasattr(result, "output") else result)
                
                SESSION_HISTORY[session_id].append({"role": "assistant", "content": reply_text})
                return AssistantChatResponse(
                    reply=reply_text,
                    detected_language=lang,
                    session_id=session_id,
                    provider_used="bedrock"
                )
            except Exception as ex:
                logger.warning(f"Bedrock invocation failed ({ex}). Falling back to deterministic assistant.")

        # Deterministic Multilingual Mock Engine
        reply, tools_called, structured_data = cls._generate_mock_reply(request.message, lang, request.location_region or "Punjab")
        
        SESSION_HISTORY[session_id].append({"role": "assistant", "content": reply})

        return AssistantChatResponse(
            reply=reply,
            detected_language=lang,
            session_id=session_id,
            tools_called=tools_called,
            structured_data=structured_data,
            provider_used="mock"
        )

    @classmethod
    def _generate_mock_reply(
        cls, 
        message: str, 
        lang: str, 
        region: str
    ) -> Tuple[str, List[ToolInvocationSummary], Optional[Dict[str, Any]]]:
        lower = message.lower()
        tools_called: List[ToolInvocationSummary] = []
        structured_data: Optional[Dict[str, Any]] = None

        # 1. Residue Estimation Intent
        if any(k in lower for k in ["estimate", "area", "acre", "killa", "kille", "parali", "tonnes", "ਕਿੰਨੀ", "ਪਰਾਲੀ", "ਹੋਵੇਗੀ", "रकबा", "कितनी", "पराली", "अनुमान", "किल्ले", "किल्ला"]):
            area, unit = extract_area_and_unit(message)
            tool_res = estimate_residue(area=area, area_unit=unit, region=region)
            tools_called.append(ToolInvocationSummary(
                tool_name="estimate_residue",
                arguments={"area": area, "area_unit": unit, "region": region},
                summary=f"Calculated residue for {area} {unit}: {tool_res['recoverable_tonnes']} tonnes ({tool_res['estimated_bales']} bales)"
            ))
            structured_data = tool_res

            rec_tonnes = tool_res["recoverable_tonnes"]
            bales = tool_res["estimated_bales"]
            gross = tool_res["gross_tonnes"]

            if lang == "pa":
                reply = (
                    f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰ ਜੀ! ਤੁਹਾਡੇ {area} {unit} ਝੋਨੇ ਦੇ ਖੇਤ ਵਿੱਚੋਂ:\n"
                    f"• ਕੁੱਲ ਪੈਦਾ ਹੋਣ ਵਾਲੀ ਪਰਾਲੀ: ਲਗਭਗ {gross} ਟਨ\n"
                    f"• ਬੇਲਰ ਨਾਲ ਇਕੱਠੀ ਹੋਣ ਵਾਲੀ ਵੇਚਣਯੋਗ ਪਰਾਲੀ: ਲਗਭਗ {rec_tonnes} ਟਨ\n"
                    f"• ਅੰਦਾਜ਼ਨ ਗੱਠਾਂ (Bales): ਲਗਭਗ {bales} ਗੱਠਾਂ (450 ਕਿੱਲੋ ਪ੍ਰਤੀ ਗੱਠ)\n\n"
                    f"ਜੇਕਰ ਤੁਸੀਂ ਇਹ ਪਰਾਲੀ ਬਾਇਓਮਾਸ ਪਲਾਂਟ (₹2,500/ਟਨ) ਜਾਂ ਪਸ਼ੂ ਫੀਡ ਵਾਲਿਆਂ (₹3,000/ਟਨ) ਨੂੰ ਵੇਚਦੇ ਹੋ, "
                    f"ਤਾਂ ਤੁਹਾਨੂੰ ਲਗਭਗ ₹{int(rec_tonnes * 2500):,} ਤੋਂ ₹{int(rec_tonnes * 3000):,} ਦੀ ਸ਼ੁੱਧ ਕਮਾਈ ਹੋ ਸਕਦੀ ਹੈ! "
                    f"ਟਰਾਂਸਪੋਰਟ ਦਾ ਖਰਚਾ ਖਰੀਦਦਾਰ ਦੇਵੇਗਾ। ਕੀ ਤੁਸੀਂ ਪਰਾਲੀ ਲਿਸਟ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?"
                )
            elif lang == "hi":
                reply = (
                    f"नमस्ते किसान भाई! आपके {area} {unit} धान के खेत से:\n"
                    f"• कुल अनुमानित पराली: लगभग {gross} टन\n"
                    f"• बेलर द्वारा उठाई जा सकने वाली बिकने योग्य पराली: लगभग {rec_tonnes} टन\n"
                    f"• अनुमानित व्यावसायिक गांठे: लगभग {bales} गांठे (450 किग्रा प्रति गांठ)\n\n"
                    f"बायोमास प्लांट (₹2,500/टन) या पशु चारा निर्माता (₹3,000/टन) को बेचकर आप "
                    f"लगभग ₹{int(rec_tonnes * 2500):,} से ₹{int(rec_tonnes * 3000):,} तक कमा सकते हैं। "
                    f"गाड़ी भाड़ा खरीदार देता है, आपके पैसे से नहीं कटता। क्या आप लिस्टिंग दर्ज करना चाहते हैं?"
                )
            else:
                reply = (
                    f"For your {area} {unit} of paddy cultivation:\n"
                    f"• Gross residue produced: ~{gross} metric tonnes\n"
                    f"• Recoverable commercial straw: ~{rec_tonnes} metric tonnes\n"
                    f"• Estimated standard round bales: ~{bales} bales (~450 kg each)\n\n"
                    f"At current market rates (₹2,500 - ₹3,000/tonne), your estimated net income is "
                    f"approx ₹{int(rec_tonnes * 2500):,} to ₹{int(rec_tonnes * 3000):,}. "
                    f"Transport is paid by the buyer. Would you like to create a listing?"
                )
            return reply, tools_called, structured_data

        # 2. Price / Rate Intent
        elif any(k in lower for k in ["price", "rate", "cost", "paisa", "rupee", "ਕੀਮਤ", "ਰੇਟ", "ਭਾਅ", "ਪੈਸੇ", "दाम", "भाव", "रुपए"]):
            tool_res = get_indicative_market_prices(buyer_type="BIOMASS_POWER_PLANT")
            tools_called.append(ToolInvocationSummary(
                tool_name="get_indicative_market_prices",
                arguments={"buyer_type": "BIOMASS_POWER_PLANT"},
                summary="Retrieved Java rules service base rates and buyer categories"
            ))
            structured_data = tool_res

            if lang == "pa":
                reply = (
                    "Straw2Cash ਉੱਤੇ ਪਰਾਲੀ ਦੇ ਮੌਜੂਦਾ ਅੰਦਾਜ਼ਨ ਰੇਟ:\n"
                    "• ਬਾਇਓਮਾਸ ਪਾਵਰ ਪਲਾਂਟ: ₹2,500 ਪ੍ਰਤੀ ਟਨ (ਸਥਿਰ ਵੱਡੀ ਮੰਗ, ਨਮੀ 14% ਤੋਂ ਘੱਟ)\n"
                    "• ਪਸ਼ੂ ਆਹਾਰ (Cattle Feed): ₹3,000 ਪ੍ਰਤੀ ਟਨ (ਸਾਫ਼ ਗ੍ਰੇਡ-ਏ ਪਰਾਲੀ ਲਈ ਸਭ ਤੋਂ ਵੱਧ ਰੇਟ)\n"
                    "• ਗੱਤਾ ਫੈਕਟਰੀ / ਪੇਪਰ ਮਿੱਲ: ₹2,200 ਪ੍ਰਤੀ ਟਨ\n"
                    "• ਇੱਟਾਂ ਦੇ ਭੱਠੇ: ₹1,800 ਪ੍ਰਤੀ ਟਨ\n\n"
                    "ਜ਼ਰੂਰੀ ਨਿਯਮ: ਟਰਾਂਸਪੋਰਟ ਦਾ ਸਾਰਾ ਕਿਰਾਇਆ ਖਰੀਦਦਾਰ ਦਿੰਦਾ ਹੈ! ਕਿਸਾਨ ਦੇ ਖਾਤੇ ਵਿੱਚੋਂ ਕੋਈ ਕਟੌਤੀ ਨਹੀਂ ਹੁੰਦੀ।"
                )
            elif lang == "hi":
                reply = (
                    "स्ट्रॉ2कैश पर वर्तमान अनुमानित भाव (प्रति टन):\n"
                    "• बायोमास पावर प्लांट: ₹2,500 / टन (स्थिर मांग, 14% से कम नमी)\n"
                    "• पशु चारा निर्माता: ₹3,000 / टन (साफ ग्रेड-A पराली का सबसे बढ़िया भाव)\n"
                    "• पेपर मिल: ₹2,200 / टन\n"
                    "• ईंट भट्ठा: ₹1,800 / टन\n\n"
                    "खास बात: गाड़ी का पूरा भाड़ा खरीदार देता है! किसान की कमाई से एक भी रुपया नहीं काटा जाता।"
                )
            else:
                reply = (
                    "Current indicative market rates on Straw2Cash:\n"
                    "• Biomass Power Plants: ₹2,500 / tonne (high volume demand, <14% moisture)\n"
                    "• Cattle Feed Manufacturers: ₹3,000 / tonne (highest rate for clean Grade-A straw)\n"
                    "• Paper Mills: ₹2,200 / tonne\n"
                    "• Brick Kilns: ₹1,800 / tonne\n\n"
                    "Key Platform Rule: Transport costs are paid by the buyer and NEVER deducted from the farmer's price."
                )
            return reply, tools_called, structured_data

        # 3. Buyer Demand Intent
        elif any(k in lower for k in ["buyer", "demand", "khareeddar", "who buys", "ਮੰਗ", "ਖਰੀਦਦਾਰ", "ਕੌਣ", "खरीदार", "मांग"]):
            tool_res = get_buyer_demand(region=region)
            tools_called.append(ToolInvocationSummary(
                tool_name="get_buyer_demand",
                arguments={"region": region},
                summary="Retrieved regional buyer demand requirements"
            ))
            structured_data = tool_res

            if lang == "pa":
                reply = (
                    f"{region} ਅਤੇ ਆਸ-ਪਾਸ ਦੇ ਇਲਾਕੇ ਵਿੱਚ ਪਰਾਲੀ ਦੀ ਵੱਡੀ ਮੰਗ ਹੈ:\n"
                    "• ਬਾਇਓਮਾਸ ਪਾਵਰ ਪਲਾਂਟਾਂ ਨੂੰ ਲਗਭਗ 450 ਟਨ ਪਰਾਲੀ ਦੀ ਤੁਰੰਤ ਲੋੜ ਹੈ।\n"
                    "• ਗੱਤਾ ਫੈਕਟਰੀਆਂ ਨੂੰ 200 ਟਨ ਅਤੇ ਪਸ਼ੂ ਖੁਰਾਕ ਯੂਨਿਟਾਂ ਨੂੰ 120 ਟਨ ਚਾਹੀਦੀ ਹੈ।\n\n"
                    "ਜੇਕਰ ਤੁਸੀਂ ਆਪਣੀ ਪਰਾਲੀ ਹੁਣੇ ਲਿਸਟ ਕਰਦੇ ਹੋ, ਤਾਂ ਸਾਡਾ ਸਿਸਟਮ ਨੇੜਲੇ ਖਰੀਦਦਾਰ ਅਤੇ ਬੇਲਰ ਨਾਲ ਤੁਰੰਤ ਮੈਚ ਕਰ ਦੇਵੇਗਾ।"
                )
            elif lang == "hi":
                reply = (
                    f"{region} और आसपास के क्षेत्र में पराली की भारी मांग है:\n"
                    "• बायोमास बिजली घरों को लगभग 450 टन पराली की तत्काल आवश्यकता है।\n"
                    "• पेपर मिलों को 200 टन और पशु आहार निर्माताओं को 120 टन चाहिए।\n\n"
                    "अपनी लिस्टिंग दर्ज करने पर हमारा सिस्टम आपको नजदीकी खरीदार और बेलर से तुरंत जोड़ देगा।"
                )
            else:
                reply = (
                    f"Strong buyer demand is active in the {region} region:\n"
                    "• Biomass Power Plants require ~450 metric tonnes.\n"
                    "• Paper Mills require ~200 tonnes.\n"
                    "• Cattle Feed Manufacturers require ~120 tonnes.\n\n"
                    "Listing your crop residue connects your field to verified nearby buyers immediately."
                )
            return reply, tools_called, structured_data

        # 4. Fire / Hotspot / NASA Satellite Intent
        elif any(k in lower for k in ["fire", "burn", "hotspot", "satellite", "nasa", "ਅੱਗ", "ਸਾੜ", "ਸੈਟੇਲਾਈਟ", "आग", "जलाना", "उपग्रह"]):
            tool_res = get_nearby_hotspots()
            tools_called.append(ToolInvocationSummary(
                tool_name="get_nearby_hotspots",
                arguments={"radius_km": 25.0},
                summary=f"Retrieved {tool_res['total_hotspots_detected']} thermal detections within 25km"
            ))
            structured_data = tool_res

            if lang == "pa":
                reply = (
                    "ਨਾਸਾ (NASA FIRMS) ਸੈਟੇਲਾਈਟ ਰਾਹੀਂ ਜ਼ਮੀਨ ਦੀ ਤਪਸ਼ ਅਤੇ ਅੱਗ ਵਾਲੇ ਖੇਤਰਾਂ ਦੀ ਨਿਗਰਾਨੀ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ।\n"
                    "ਪਰਾਲੀ ਸਾੜਨ ਨਾਲ ਜ਼ਮੀਨ ਦੇ ਮਿੱਤਰ ਕੀੜੇ ਮਰਦੇ ਹਨ ਅਤੇ ਹਵਾ ਜ਼ਹਿਰੀਲੀ ਹੁੰਦੀ ਹੈ।\n"
                    "Straw2Cash ਰਾਹੀਂ ਪਰਾਲੀ ਵੇਚ ਕੇ ਤੁਸੀਂ ਜੁਰਮਾਨੇ ਜਾਂ ਧੂੰਏਂ ਦੀ ਬਜਾਏ ਹਰ ਏਕੜ ਤੋਂ ₹5,000 ਤੋਂ ₹7,000 ਦੀ ਸਿੱਧੀ ਕਮਾਈ ਕਰ ਸਕਦੇ ਹੋ। "
                    "ਕੀ ਤੁਸੀਂ ਬੇਲਰ ਬੁੱਕ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?"
                )
            elif lang == "hi":
                reply = (
                    "नासा (NASA FIRMS) उपग्रह द्वारा थर्मल हॉटस्पॉट पर लगातार नजर रखी जा रही है।\n"
                    "पराली जलाने से खेत की उपजाऊ मिट्टी कमजोर होती है और वातावरण प्रदूषित होता है।\n"
                    "स्ट्रॉ2कैश पर पराली बेचकर आप जुर्माने से बचते हैं और प्रति एकड़ ₹5,000 से ₹7,000 तक शुद्ध मुनाफा कमाते हैं। "
                    "क्या आप बेलर बुक कराने की प्रक्रिया जानना चाहते हैं?"
                )
            else:
                reply = (
                    "NASA FIRMS satellites monitor regional thermal hotspots. "
                    "Burning straw damages soil organic matter and triggers regulatory fines. "
                    "By selling your paddy straw through Straw2Cash, you avoid smoke and earn ₹5,000 to ₹7,000 per acre in clean income. "
                    "Would you like to book a baler?"
                )
            return reply, tools_called, structured_data

        # 5. Default / Listing Guidance
        else:
            tool_res = explain_listing_steps(language=lang)
            tools_called.append(ToolInvocationSummary(
                tool_name="explain_listing_steps",
                arguments={"language": lang},
                summary="Provided step-by-step Straw2Cash seller workflow"
            ))
            reply = tool_res["steps_text"]
            return reply, tools_called, structured_data
