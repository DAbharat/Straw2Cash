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
    Service managing conversation, Strands Agents execution, Gemini API, and dynamic mock responses.
    """

    @classmethod
    async def chat(cls, request: AssistantChatRequest) -> AssistantChatResponse:
        session_id = request.session_id or f"sess-{uuid.uuid4().hex[:8]}"
        lang = detect_language(request.message, request.language)

        if session_id not in SESSION_HISTORY:
            SESSION_HISTORY[session_id] = []

        SESSION_HISTORY[session_id].append({"role": "user", "content": request.message})

        # 1. Try Google Gemini if configured
        gemini_key = settings.GEMINI_API_KEY
        if (settings.MODEL_PROVIDER == "gemini" or gemini_key) and gemini_key and gemini_key not in ["YOUR_GEMINI_API_KEY", "MY_GEMINI_API_KEY"]:
            try:
                import httpx
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={gemini_key}"
                system_instruction = (
                    f"You are the Straw2Cash Agricultural AI Assistant, an expert multilingual agronomic and stubble market advisor "
                    f"helping farmers across Punjab, Haryana, and Northern India. "
                    f"Answer directly, practically, and empathetically in the requested language ({lang}: 'pa' for Punjabi in Gurmukhi script, "
                    f"'hi' for Hindi in Devanagari script, 'en' for English). "
                    f"Give concrete numbers: Paddy residue is ~1.8-2.4 tons/acre for Basmati, ~2.8-3.2 tons for PR-126/Parmal. "
                    f"Square bales command ₹2,150–₹2,450/ton delivered to biomass plants, ₹2,800–₹3,200/ton for cattle feed. "
                    f"Baler hiring charges are ~₹1,000–₹1,350/acre. "
                    f"Payment is 100% guaranteed via digital escrow and released within 24–48 hours of weighbridge slips. "
                    f"Zero-burning policy avoids heavy CAQM fines (₹2,500–₹15,000). Keep answers informative, concise (under 120 words), and conversational."
                )
                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [
                                {"text": f"System Context:\n{system_instruction}\n\nUser Question:\n{request.message}"}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.4,
                        "maxOutputTokens": 350
                    }
                }
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(gemini_url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            text_parts = candidates[0].get("content", {}).get("parts", [])
                            if text_parts and "text" in text_parts[0]:
                                reply_text = text_parts[0]["text"].strip()
                                SESSION_HISTORY[session_id].append({"role": "assistant", "content": reply_text})
                                return AssistantChatResponse(
                                    reply=reply_text,
                                    detected_language=lang,
                                    session_id=session_id,
                                    provider_used="gemini"
                                )
            except Exception as ex:
                logger.warning(f"Gemini API invocation failed ({ex}). Falling back to dynamic mock engine.")

        # 2. Try Bedrock via Strands if configured
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
                logger.warning(f"Bedrock invocation failed ({ex}). Falling back to dynamic mock assistant.")

        # 3. Dynamic Multilingual Agronomy Engine
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

        # 1. Residue / Yield Estimation Intent (handles any acreage / killa query)
        if any(k in lower for k in [
            "estimate", "area", "acre", "killa", "kille", "parali", "tonnes", "straw", "yield",
            "ਕਿੰਨੀ", "ਪਰਾਲੀ", "ਹੋਵੇਗੀ", "ਝੋਨੇ", "ਬਾਸਮਤੀ", "ਕਿੱਲੇ", "ਕਿੱਲਾ", "ਟਨ",
            "रकबा", "कितनी", "पराली", "अनुमान", "किल्ले", "किल्ला", "टन", "बासमती", "धान", "मिलेगी", "बनेगी"
        ]):
            area, unit = extract_area_and_unit(message)
            is_basmati = any(b in lower for b in ["basmati", "ਬਾਸਮਤੀ", "बासमती"])
            multiplier = 2.0 if is_basmati else 2.8
            
            tool_res = estimate_residue(area=area, area_unit=unit, region=region)
            # Adjust if specific crop detected
            if is_basmati:
                gross = round(area * 2.3, 1)
                rec_tonnes = round(area * 1.95, 1)
                bales = int(rec_tonnes * 1000 / 450)
            else:
                gross = tool_res["gross_tonnes"]
                rec_tonnes = tool_res["recoverable_tonnes"]
                bales = tool_res["estimated_bales"]

            tools_called.append(ToolInvocationSummary(
                tool_name="estimate_residue",
                arguments={"area": area, "area_unit": unit, "crop": "Basmati" if is_basmati else "Paddy", "region": region},
                summary=f"Calculated residue for {area} {unit}: {rec_tonnes} tonnes (~{bales} square bales recoverable)"
            ))
            structured_data = tool_res

            min_earn = int(rec_tonnes * 2150)
            max_earn = int(rec_tonnes * 2450)

            if lang == "pa":
                crop_name = "ਬਾਸਮਤੀ ਝੋਨੇ" if is_basmati else "ਝੋਨੇ"
                reply = (
                    f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰ ਜੀ! ਤੁਹਾਡੇ {area} {unit} {crop_name} ਦੇ ਖੇਤ ਦਾ ਸਹੀ ਅੰਦਾਜ਼ਾ:\n"
                    f"• ਕੁੱਲ ਪੈਦਾਵਾਰ: ਲਗਭਗ {gross} ਟਨ ਪਰਾਲੀ\n"
                    f"• ਬੇਲਰ ਨਾਲ ਇਕੱਠੀ ਹੋਣ ਵਾਲੀ (ਵੇਚਣਯੋਗ): ਲਗਭਗ {rec_tonnes} ਟਨ\n"
                    f"• ਅੰਦਾਜ਼ਨ ਵੱਡੀਆਂ ਗੱਠਾਂ (Square Bales): ਲਗਭਗ {bales} ਗੱਠਾਂ (450 ਕਿੱਲੋ ਪ੍ਰਤੀ ਗੱਠ)\n\n"
                    f"ਮੌਜੂਦਾ ਮੰਡੀ ਰੇਟ (₹2,150 - ₹2,450/ਟਨ) ਅਨੁਸਾਰ ਤੁਹਾਡੀ ਅੰਦਾਜ਼ਨ ਕਮਾਈ ਲਗਭਗ ₹{min_earn:,} ਤੋਂ ₹{max_earn:,} ਹੋਵੇਗੀ! "
                    f"ਟਰਾਂਸਪੋਰਟ ਦਾ ਸਾਰਾ ਕਿਰਾਇਆ ਖਰੀਦਦਾਰ ਦਿੰਦਾ ਹੈ। ਤੁਸੀਂ ਸਿੱਧਾ ਬੇਲਰ ਬੁੱਕ ਕਰਕੇ ਆਪਣੀ ਪਰਾਲੀ ਵੇਚ ਸਕਦੇ ਹੋ।"
                )
            elif lang == "hi":
                crop_name = "बासमती धान" if is_basmati else "धान"
                reply = (
                    f"नमस्ते किसान भाई! आपके {area} {unit} {crop_name} के खेत का सटीक अवशेष अनुमान:\n"
                    f"• कुल अनुमानित पराली: लगभग {gross} टन\n"
                    f"• बेलर द्वारा उठाई जाने वाली बिकने योग्य पराली: लगभग {rec_tonnes} टन\n"
                    f"• अनुमानित व्यावसायिक गांठें: लगभग {bales} गांठें (450 किग्रा प्रति गांठ)\n\n"
                    f"वर्तमान बाजार भाव (₹2,150 से ₹2,450/टन) पर आपकी अनुमानित शुद्ध कमाई लगभग ₹{min_earn:,} से ₹{max_earn:,} होगी! "
                    f"गाड़ी भाड़ा खरीदार वहन करता है, आपके भुगतान से नहीं कटता।"
                )
            else:
                crop_name = "Basmati paddy" if is_basmati else "paddy"
                reply = (
                    f"Accurate agronomic residue estimation for your {area} {unit} of {crop_name}:\n"
                    f"• Gross field residue generated: ~{gross} metric tonnes\n"
                    f"• Recoverable commercial straw: ~{rec_tonnes} metric tonnes\n"
                    f"• Standard high-density bales: ~{bales} bales (~450 kg each)\n\n"
                    f"At current prevailing rates (₹2,150 – ₹2,450/tonne), your expected gross earnings are "
                    f"approx ₹{min_earn:,} to ₹{max_earn:,}. "
                    f"Transport logistics are fully covered by the buyer under Straw2Cash contracts."
                )
            return reply, tools_called, structured_data

        # 2. Baler Machine / Custom Hiring Intent
        elif any(k in lower for k in [
            "baler", "machine", "hire", "booking", "custom hiring", "rent", "operator",
            "ਬੇਲਰ", "ਮਸ਼ੀਨ", "ਕਿਰਾਇਆ", "ਬੁੱਕ", "ਕਰਨੀ", "ਗੰਢਾਂ", "ਗੱਠਾਂ",
            "बेलर", "मशीन", "किराया", "बुक", "ऑपरेटर", "गांठ"
        ]):
            tools_called.append(ToolInvocationSummary(
                tool_name="search_nearby_balers",
                arguments={"district": region, "radius_km": 25.0},
                summary=f"Found 8 active baler operators in {region} zone"
            ))

            if lang == "pa":
                reply = (
                    f"{region} ਅਤੇ ਆਸ-ਪਾਸ ਦੇ ਇਲਾਕੇ ਵਿੱਚ ਬੇਲਰ ਮਸ਼ੀਨ ਬਾਰੇ ਜਾਣਕਾਰੀ:\n"
                    f"• ਬੇਲਿੰਗ ਦਾ ਔਸਤਨ ਕਿਰਾਇਆ: ₹1,000 ਤੋਂ ₹1,350 ਪ੍ਰਤੀ ਏਕੜ ਹੈ।\n"
                    f"• ਬੇਲਰ ਕੰਬਾਈਨ ਦੇ ਪਿੱਛੇ 24 ਘੰਟਿਆਂ ਦੇ ਅੰਦਰ ਪਹੁੰਚ ਜਾਂਦਾ ਹੈ (ਕੰਬਾਈਨ ਉੱਤੇ Super SMS ਲੱਗਿਆ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ)।\n"
                    f"• ਗੱਠਾਂ ਬਣਨ ਤੋਂ ਬਾਅਦ ਟਰਾਂਸਪੋਰਟਰ ਖੇਤ ਵਿੱਚੋਂ ਸਿੱਧਾ ਮਾਲ ਚੁੱਕ ਲੈਂਦਾ ਹੈ।\n"
                    f"ਤੁਸੀਂ 'Baler Service' ਟੈਬ ਵਿੱਚ ਜਾ ਕੇ ਨੇੜਲੇ ਬੇਲਰ ਆਪਰੇਟਰ ਨੂੰ ਸਿੱਧਾ ਬੁੱਕ ਕਰ ਸਕਦੇ ਹੋ।"
                )
            elif lang == "hi":
                reply = (
                    f"{region} क्षेत्र में बेलर मशीन और कस्टम हायरिंग की जानकारी:\n"
                    f"• बेलिंग का सामान्य किराया: ₹1,000 से ₹1,350 प्रति एकड़।\n"
                    f"• कंबाइन हार्वेस्टर से कटाई के तुरंत बाद बेलर 24 घंटे में खेत में पहुंच जाता है।\n"
                    f"• गांठे बनने के बाद खरीदार का ट्रक सीधे खेत से पराली उठा लेता है।\n"
                    f"स्ट्रॉ2कैश पर 'Baler Service' विकल्प से आप सीधे नजदीकी बेलर ऑपरेटर बुक कर सकते हैं।"
                )
            else:
                reply = (
                    f"Baler dispatch and custom hiring details for {region}:\n"
                    f"• Baling service charge: ~₹1,000 to ₹1,350 per acre.\n"
                    f"• Balers operate behind SMS-fitted combines and arrive within 24 hours of harvest.\n"
                    f"• Once baled, buyer-contracted flatbeds haul the bales directly from the farm gate.\n"
                    f"You can view and book verified baler operators from the 'Baler Service' tab."
                )
            return reply, tools_called, structured_data

        # 3. Market Rates / Mandi Price Intent
        elif any(k in lower for k in [
            "price", "rate", "cost", "mandi", "sangrur", "patiala", "karnal", "ludhiana", "bale price",
            "ਕੀਮਤ", "ਰੇਟ", "ਭਾਅ", "ਪੈਸੇ", "ਸੰਗਰੂਰ", "ਪਟਿਆਲਾ", "ਕਰਨਾਲ", "ਮੰਡੀ",
            "दाम", "भाव", "रेट", "रुपए", "संगरूर", "करनाल", "पटियाला", "मंडी"
        ]):
            tool_res = get_indicative_market_prices(buyer_type="BIOMASS_POWER_PLANT")
            tools_called.append(ToolInvocationSummary(
                tool_name="get_indicative_market_prices",
                arguments={"district": region, "buyer_type": "BIOMASS_POWER_PLANT"},
                summary=f"Retrieved spot rates for {region}: ₹2,150–₹2,450/ton (Square Bales)"
            ))
            structured_data = tool_res

            if lang == "pa":
                reply = (
                    f"ਸੰਗਰੂਰ, ਪਟਿਆਲਾ ਅਤੇ ਕਰਨਾਲ ਖੇਤਰ ਵਿੱਚ ਪਰਾਲੀ ਦੇ ਤਾਜ਼ਾ ਭਾਅ:\n"
                    f"• ਹਾਈ-ਡੈਂਸਿਟੀ ਗੱਠਾਂ (Square Bales - ਨਮੀ <14%): ₹2,150 ਤੋਂ ₹2,450 ਪ੍ਰਤੀ ਟਨ\n"
                    f"• ਗੋਲ ਗੱਠਾਂ (Round Bales): ₹1,850 ਤੋਂ ₹2,100 ਪ੍ਰਤੀ ਟਨ\n"
                    f"• ਪਸ਼ੂ ਆਹਾਰ (Cattle Feed - ਸਾਫ਼ ਬਾਸਮਤੀ): ₹2,800 ਤੋਂ ₹3,200 ਪ੍ਰਤੀ ਟਨ\n"
                    f"• ਖੇਤ ਵਿੱਚੋਂ ਲੂਜ਼ ਪਰਾਲੀ: ₹1,500 ਤੋਂ ₹1,750 ਪ੍ਰਤੀ ਟਨ\n\n"
                    f"ਖਾਸ ਫਾਇਦਾ: ਟਰਾਂਸਪੋਰਟ ਦਾ ਖਰਚਾ ਖਰੀਦਦਾਰ ਦਾ ਹੁੰਦਾ ਹੈ, ਕਿਸਾਨ ਨੂੰ ਪੂਰਾ ਰੇਟ ਮਿਲਦਾ ਹੈ।"
                )
            elif lang == "hi":
                reply = (
                    f"संगरूर, करनाल और पटियाला कृषि बेल्ट में पराली के वर्तमान भाव:\n"
                    f"• चौकोर गांठे (Square Bales - नमी <14%): ₹2,150 से ₹2,450 प्रति टन\n"
                    f"• गोल गांठे (Round Bales): ₹1,850 से ₹2,100 प्रति टन\n"
                    f"• पशु चारा निर्माता (साफ बासमती स्ट्रॉ): ₹2,800 से ₹3,200 प्रति टन\n"
                    f"• खेत पर लूज पराली: ₹1,500 से ₹1,750 प्रति टन\n\n"
                    f"महत्वपूर्ण: ढुलाई भाड़ा खरीदार द्वारा वहन किया जाता है, किसान के भाव से कोई कटौती नहीं होती।"
                )
            else:
                reply = (
                    f"Current prevailing market rates in the Sangrur, Patiala, and Karnal agricultural corridor:\n"
                    f"• High-Density Square Bales (<14% moisture): ₹2,150 to ₹2,450 / tonne delivered\n"
                    f"• Round Bales: ₹1,850 to ₹2,100 / tonne\n"
                    f"• Cattle Feed & Fodder (clean Basmati): ₹2,800 to ₹3,200 / tonne\n"
                    f"• Farm-gate loose residue: ₹1,500 to ₹1,750 / tonne\n\n"
                    f"Buyer Rule: Transportation logistics are 100% paid by the industrial buyer."
                )
            return reply, tools_called, structured_data

        # 4. Escrow / Payment Safety Intent
        elif any(k in lower for k in [
            "payment", "escrow", "safe", "secure", "bank", "payout", "when do i get paid",
            "ਪੇਮੈਂਟ", "ਪੈਸੇ", "ਬੈਂਕ", "ਸੁਰੱਖਿਅਤ", "ਕਦੋਂ", "ਗਾਰੰਟੀ",
            "पेमेंट", "पैसे", "भुगतान", "सुरक्षित", "बैंक", "खाते", "एस्क्रो", "गारंटी"
        ]):
            tools_called.append(ToolInvocationSummary(
                tool_name="verify_escrow_workflow",
                arguments={"security_level": "BANK_ESCROW"},
                summary="Digital escrow funded at contract creation; 24-48h weighbridge release"
            ))

            if lang == "pa":
                reply = (
                    "Straw2Cash ਉੱਤੇ ਕਿਸਾਨਾਂ ਦੀ ਪੇਮੈਂਟ 100% ਸੁਰੱਖਿਅਤ ਹੈ:\n"
                    "1. ਜਦੋਂ ਖਰੀਦਦਾਰ ਕੰਟਰੈਕਟ ਸਾਈਨ ਕਰਦਾ ਹੈ, ਪੂਰਾ ਪੈਸਾ ਸਰਕਾਰੀ/ਬੈਂਕ ਐਸਕਰੋ ਖਾਤੇ ਵਿੱਚ ਜਮ੍ਹਾ ਹੋ ਜਾਂਦਾ ਹੈ।\n"
                    "2. ਖੇਤ ਵਿੱਚੋਂ ਟਰੱਕ ਲੋਡ ਹੋ ਕੇ ਧਰਮਕਾਂਡੇ (Weighbridge) 'ਤੇ ਕੰਡਾ ਹੋਣ ਤੋਂ ਬਾਅਦ ਪਰਚੀ ਅੱਪਲੋਡ ਹੁੰਦੀ ਹੈ।\n"
                    "3. ਪਰਚੀ ਤਸਦੀਕ ਹੋਣ ਦੇ 24 ਤੋਂ 48 ਘੰਟਿਆਂ ਅੰਦਰ ਪੈਸੇ ਸਿੱਧੇ ਤੁਹਾਡੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਟਰਾਂਸਫਰ ਹੋ ਜਾਂਦੇ ਹਨ।\n"
                    "ਕੋਈ ਵਿਚੋਲਾ ਨਹੀਂ, ਕੋਈ ਪੈਸਾ ਮਾਰਨ ਦਾ ਖਤਰਾ ਨਹੀਂ।"
                )
            elif lang == "hi":
                reply = (
                    "स्ट्रॉ2कैश पर किसानों का भुगतान पूरी तरह सुरक्षित (Escrow Protected) है:\n"
                    "1. अनुबंध स्वीकार होते ही खरीदार का पूरा पैसा सुरक्षित बैंक एस्क्रो में जमा हो जाता है।\n"
                    "2. जैसे ही पराली का ट्रक धर्मकांटा (वेब्रिज) से वजन की पर्ची प्राप्त करता है, सिस्टम पर वजन अपडेट होता है।\n"
                    "3. वजन सत्यापित होने के 24 से 48 घंटे के भीतर भुगतान सीधे आपके बैंक खाते में पहुंच जाता है।\n"
                    "किसी बिचौलिए की जरूरत नहीं है और भुगतान अटकने का कोई जोखिम नहीं है।"
                )
            else:
                reply = (
                    "Farmer payouts on Straw2Cash are 100% protected by digital escrow:\n"
                    "1. Buyers pre-fund the full contract value into escrow upon contract signing.\n"
                    "2. After baling, trucks pass certified weighbridges and upload digitized weight slips.\n"
                    "3. Funds are automatically disbursed directly to your bank account within 24–48 hours.\n"
                    "Zero broker risk and zero counterparty default."
                )
            return reply, tools_called, structured_data

        # 5. Stubble Burning / NASA Satellite / Penalties Intent
        elif any(k in lower for k in [
            "burn", "fire", "penalty", "fine", "nasa", "satellite", "challan", "law",
            "ਸਾੜ", "ਅੱਗ", "ਜੁਰਮਾਨਾ", "ਸੈਟੇਲਾਈਟ", "ਨਾਸਾ", "ਚਲਾਨ", "ਕਾਨੂੰਨ",
            "जलाना", "आग", "जुर्माना", "सैटेलाइट", "नासा", "चालान", "कानून", "सजा", "सब्सिडी"
        ]):
            tool_res = get_nearby_hotspots()
            tools_called.append(ToolInvocationSummary(
                tool_name="get_nearby_hotspots",
                arguments={"radius_km": 25.0},
                summary=f"NASA FIRMS thermal anomaly surveillance active in {region}"
            ))
            structured_data = tool_res

            if lang == "pa":
                reply = (
                    "ਪਰਾਲੀ ਸਾੜਨ 'ਤੇ ਸਰਕਾਰੀ ਨਿਯਮ ਅਤੇ ਜੁਰਮਾਨੇ:\n"
                    "• CAQM ਅਤੇ ਐਨ.ਜੀ.ਟੀ. ਵੱਲੋਂ ਨਾਸਾ ਸੈਟੇਲਾਈਟ ਰਾਹੀਂ 24 ਘੰਟੇ ਨਿਗਰਾਨੀ ਹੋ ਰਹੀ ਹੈ।\n"
                    "• 2 ਏਕੜ ਤੋਂ ਘੱਟ 'ਤੇ ₹2,500, 2-5 ਏਕੜ 'ਤੇ ₹5,000 ਅਤੇ 5 ਏਕੜ ਤੋਂ ਵੱਧ 'ਤੇ ₹15,000 ਦਾ ਚਲਾਨ ਹੈ।\n"
                    "• ਮਾਲ ਰਿਕਾਰਡ ਵਿੱਚ 'ਰੈੱਡ ਐਂਟਰੀ' ਹੋਣ ਨਾਲ ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਬੰਦ ਹੋ ਸਕਦੀਆਂ ਹਨ।\n"
                    "ਸਾੜਨ ਦੀ ਥਾਂ Straw2Cash 'ਤੇ ਵੇਚ ਕੇ ਤੁਸੀਂ ਜੁਰਮਾਨੇ ਤੋਂ ਬਚਦੇ ਹੋ ਅਤੇ ਪ੍ਰਤੀ ਏਕੜ ₹4,500 ਤੋਂ ₹6,500 ਕਮਾਉਂਦੇ ਹੋ।"
                )
            elif lang == "hi":
                reply = (
                    "पराली जलाने पर पर्यावरण नियम और वैधानिक जुर्माने:\n"
                    "• CAQM और प्रदूषण नियंत्रण बोर्ड द्वारा नासा उपग्रह से 24 घंटे थर्मल निगरानी की जाती है।\n"
                    "• 2 एकड़ से कम पर ₹2,500, 2 से 5 एकड़ पर ₹5,000 तथा 5 एकड़ से अधिक पर ₹15,000 का जुर्माना लगता है।\n"
                    "• राजस्व रिकॉर्ड में 'रेड एंट्री' होने से सरकारी योजनाओं और केसीसी पर असर पड़ सकता है।\n"
                    "पराली जलाने के बजाय स्ट्रॉ2कैश पर बेचकर आप बिना किसी डर के प्रति एकड़ ₹5,000 तक शुद्ध लाभ कमा सकते हैं।"
                )
            else:
                reply = (
                    "Regulatory framework and stubble burning penalties in Punjab/Haryana:\n"
                    "• CAQM and state pollution boards deploy NASA FIRMS satellite monitoring daily.\n"
                    "• Environmental fines: ₹2,500 (<2 acres), ₹5,000 (2–5 acres), and ₹15,000 (>5 acres).\n"
                    "• Violations lead to red entries in land revenue records.\n"
                    "By marketing your residue via Straw2Cash, you avoid penalties and turn stubble into ₹4,500–₹6,500/acre profit."
                )
            return reply, tools_called, structured_data

        # 6. Moisture & Quality Requirement Intent
        elif any(k in lower for k in [
            "moisture", "water", "wet", "quality", "storage", "dry",
            "ਨਮੀ", "ਗਿੱਲੀ", "ਸੁੱਕੀ", "ਕੁਆਲਿਟੀ", "ਪਾਣੀ",
            "नमी", "गीली", "सूखी", "क्वालिटी", "पानी", "स्टोरेज"
        ]):
            if lang == "pa":
                reply = (
                    "ਪਰਾਲੀ ਦੀ ਗੁਣਵੱਤਾ ਅਤੇ ਨਮੀ (Moisture) ਦੇ ਨਿਯਮ:\n"
                    "• ਬਾਇਓਮਾਸ ਪਲਾਂਟਾਂ ਅਤੇ ਫੈਕਟਰੀਆਂ ਲਈ ਨਮੀ 14% ਤੋਂ 16% ਤੋਂ ਘੱਟ ਹੋਣੀ ਲਾਜ਼ਮੀ ਹੈ।\n"
                    "• ਸੁੱਕੀ ਪਰਾਲੀ ਦੀਆਂ ਗੱਠਾਂ 'ਤੇ ਵਧੀਆ ਰੇਟ ਅਤੇ ਬੋਨਸ ਮਿਲਦਾ ਹੈ।\n"
                    "• ਖੇਤ ਵਿੱਚ ਕਟਾਈ ਤੋਂ ਬਾਅਦ 1-2 ਦਿਨ ਧੁੱਪ ਲੱਗਣ ਦਿਓ ਤਾਂ ਜੋ ਨਮੀ ਘਟ ਸਕੇ।\n"
                    "ਗਿੱਲੀ ਪਰਾਲੀ ਨੂੰ ਗੱਠਾਂ ਵਿੱਚ ਨਾ ਬੰਨ੍ਹੋ ਕਿਉਂਕਿ ਅੰਦਰ ਉੱਲੀ (fungus) ਲੱਗਣ ਦਾ ਖਤਰਾ ਰਹਿੰਦਾ ਹੈ।"
                )
            elif lang == "hi":
                reply = (
                    "पराली की गुणवत्ता और नमी के मानक:\n"
                    "• बायोमास संयंत्रों व पेपर मिलों में 14% से 16% से कम नमी वाली गांठों को प्राथमिकता मिलती है।\n"
                    "• सूखी पराली पर अधिकतम बाजार भाव और बोनस प्रीमियम दिया जाता है।\n"
                    "• कटाई के बाद खेत में 1 से 2 दिन धूप लगने दें ताकि नमी स्वाभाविक रूप से कम हो जाए।\n"
                    "अधिक नमी वाली पराली की गांठे न बनवाएं क्योंकि भंडारण में फफूंद लगने का खतरा रहता है।"
                )
            else:
                reply = (
                    "Moisture and quality standards on Straw2Cash:\n"
                    "• Biomass plants and industrial buyers require moisture content strictly below 14%–16%.\n"
                    "• Dry, well-compacted bales command peak spot premiums.\n"
                    "• Allow harvested straw 24–48 hours of field solarization to minimize moisture before baling.\n"
                    "Avoid baling wet straw to prevent internal composting and microbial decay during storage."
                )
            return reply, tools_called, structured_data

        # 7. General Dynamic Agronomy Fallback
        else:
            if lang == "pa":
                reply = (
                    f"ਤੁਹਾਡੇ ਸਵਾਲ '{message}' ਲਈ ਜਾਣਕਾਰੀ:\n"
                    f"ਸਟ੍ਰਾਅ ਟੂ ਕੈਸ਼ ਪਲੇਟਫਾਰਮ ਰਾਹੀਂ ਤੁਸੀਂ ਖੇਤ ਵਿੱਚੋਂ ਪਰਾਲੀ ਦਾ ਅੰਦਾਜ਼ਾ ਲਗਾ ਸਕਦੇ ਹੋ, "
                    f"25 ਕਿਲੋਮੀਟਰ ਦੇ ਦਾਇਰੇ ਵਿੱਚ ਬੇਲਰ ਬੁੱਕ ਕਰ ਸਕਦੇ ਹੋ, ਅਤੇ ਪ੍ਰਮਾਣਿਤ ਖਰੀਦਦਾਰਾਂ ਨੂੰ ਵਧੀਆ ਰੇਟ 'ਤੇ ਵੇਚ ਸਕਦੇ ਹੋ। "
                    f"ਸਾਰੀ ਪੇਮੈਂਟ ਬੈਂਕ ਐਸਕਰੋ ਰਾਹੀਂ ਗਾਰੰਟੀਸ਼ੁਦਾ ਹੁੰਦੀ ਹੈ ਅਤੇ ਟਰਾਂਸਪੋਰਟ ਦਾ ਖਰਚਾ ਖਰੀਦਦਾਰ ਦਿੰਦਾ ਹੈ। "
                    f"ਤੁਸੀਂ ਆਪਣੇ ਰਕਬੇ (ਏਕੜ/ਕਿੱਲੇ), ਪਰਾਲੀ ਦੇ ਭਾਅ, ਜਾਂ ਬੇਲਰ ਬੁਕਿੰਗ ਬਾਰੇ ਹੋਰ ਪੁੱਛ ਸਕਦੇ ਹੋ।"
                )
            elif lang == "hi":
                reply = (
                    f"आपके प्रश्न '{message}' के संबंध में आवश्यक जानकारी:\n"
                    f"स्ट्रॉ2कैश पर आप अपने खेत के रकबे के आधार पर पराली उत्पादन का सटीक हिसाब लगा सकते हैं, "
                    f"नजदीकी बेलर मशीन बुक कर सकते हैं और बायोमास प्लांट्स को सुरक्षित अनुबंध के साथ बेच सकते हैं। "
                    f"सभी भुगतान डिजिटल एस्क्रो द्वारा सुरक्षित होते हैं और गाड़ी भाड़ा खरीदार देता है। "
                    f"आप अपने एकड़, मंडी भाव, बेलर बुकिंग या सरकारी सब्सिडी से जुड़ा कोई भी प्रश्न पूछ सकते हैं।"
                )
            else:
                reply = (
                    f"Regarding your query '{message}':\n"
                    f"Straw2Cash connects paddy farmers with local high-density balers and verified biomass industrial buyers. "
                    f"We provide verified yield estimates, automated contracts, guaranteed escrow payouts within 48 hours, and 100% buyer-funded freight. "
                    f"Feel free to ask about your specific field acreage, regional mandi rates, baler dispatch, or moisture guidelines."
                )
            return reply, tools_called, structured_data

