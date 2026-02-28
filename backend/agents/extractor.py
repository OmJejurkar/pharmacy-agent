import os
import re
import json
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from google import genai
import database
import langfuse_client

# Load environment variables from .env file
load_dotenv()

# Get the API key from environment variables
api_key = os.getenv("GOOGLE_API")

# Configure the API key directly based on user's instruction
client = genai.Client(api_key=api_key)

def get_medicine_catalog_data() -> str:
    try:
        return database.get_medicine_catalog()
    except Exception as e:
        print(f"Error getting catalog: {e}")
        return ""

class OrderExtractorAgent:
    def __init__(self):
        self._medicine_names: Optional[List[str]] = None
        # Use flash model for fast NLP extraction
        self.client = client
        self.model_name = 'gemini-2.5-flash'

    @property
    def medicine_catalog(self):
        if self._medicine_names is None:
            self._medicine_names = get_medicine_catalog_data()
        return self._medicine_names

    def run(self, text: str, user_id: str = "GUEST"):
        # Langfuse trace
        trace = langfuse_client.trace_interaction("OrderExtractor", text, user_id=user_id)
        
        if not self.medicine_catalog:
            self._medicine_names = get_medicine_catalog_data()

        catalog_data = self.medicine_catalog

        # Prompt engineering to handle "messy" NLP, multiple items, and Q&A
        prompt = f"""
        You are 'MedAssist AI', an intelligent and highly capable conversational pharmacy assistant.
        Your task is to parse a user's conversational text, ANSWER any questions they have based on our inventory catalog, AND if they express intent to buy/add items, extract MULTIPLE medicines into the cart array.

        CRITICAL INSTRUCTIONS: 
        1. Read the user's text. If they are asking a question (e.g. "What's the price of X?" or "Do you have Y in stock?"), use the Current Inventory catalog to answer them warmly and politely in the 'answer' field.
        2. If they mention MULTIPLE different items to buy (e.g. "2 packs of aspirin and 1 advil"), you MUST extract BOTH into the 'medicines' array. Do not miss any items!
        3. You MUST map the user's intent to the exact medicine names from our inventory list ONLY. Handle typos gracefully.
        4. If it's completely unclear or not in inventory, provide the closest match in 'suggestions'.
        5. The 'answer' field should summarize what you did or answer their question in a friendly tone (e.g. "I have added 2 Paracetamol to your cart. The total price will be ₹X.").
        
        Our Current Inventory (Name | Price | Stock | Rx Required): 
        {catalog_data}
        
        User Text: "{text}"

        Return ONLY a raw JSON object with the following exact schema, do not include markdown blocks:
        {{
            "answer": "Your friendly conversational response or answer to their question.",
            "medicines": [
                {{
                    "name": "Exact Name From Inventory String",
                    "qty": integer_quantity
                }}
            ],
            "suggestions": ["list", "of", "similar", "medicines", "if", "not", "found"]
        }}
        """

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            # Defensive JSON parsing
            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            
            extracted_data = json.loads(raw_text.strip())
            
            result = {
                "answer": extracted_data.get("answer", "I understood your request."),
                "medicines": extracted_data.get("medicines", []),
                "suggestions": extracted_data.get("suggestions", []),
                "user_id": user_id
            }
        except Exception as e:
            err_str = str(e).lower()
            print(f"Gemini Extraction Failed: {err_str}")
            if "429" in err_str or "exhausted" in err_str:
                result = {"answer": "I'm sorry, my AI rate limit has been reached constraint.", "medicines": [], "suggestions": [], "user_id": user_id, "error": "gemini_rate_limit"}
            else:
                result = {"answer": "I didn't quite catch that. Could you repeat?", "medicines": [], "suggestions": [], "user_id": user_id}

        # Update trace
        if trace:
             trace.update(output=result)
             trace.end()
             
        return result

def extract_from_image(file_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    trace = langfuse_client.trace_interaction("ImageExtractor", "prescription_image")
    
    try:
        meds = get_medicine_names()
    except:
        meds = []
    
    valid_meds_list = ", ".join(meds)
    
    prompt = f"""
    You are an intelligent pharmacy extraction engine.
    Your task is to parse a doctor's handwritten prescription image and identify ALL medical items, dosages, and quantities.
    
    CRITICAL INSTRUCTIONS:
    1. Read the doctor's handwriting carefully to identify the medicine name and dosage (e.g. Paracetamol 500mg).
    2. Try your best to extract every medicine mentioned.
    3. You must map what you read to the closest exact match from our Current Inventory list below. 
    4. Handle plurals, typos, and bad handwriting gracefully.
    
    Current Inventory:
    {valid_meds_list}
    
    Return ONLY a raw JSON object with the following exact schema (no markdown formatting):
    {{
        "medicines": [
            {{
                "name": "Exact Name From Inventory String",
                "qty": integer_quantity
            }}
        ],
        "suggestions": ["List of extracted medicines that did not match inventory"]
    }}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, {'mime_type': mime_type, 'data': file_bytes}]
        )
        
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        
        extracted_data = json.loads(raw_text.strip())
        result = {
            "medicines": extracted_data.get("medicines", []),
            "suggestions": extracted_data.get("suggestions", [])
        }
    except Exception as e:
        print(f"Gemini Image Extraction Failed: {e}")
        result = {"medicines": [], "suggestions": [], "error": str(e)}

    if trace:
        trace.update(output=result)
        trace.end()
        
    return result
