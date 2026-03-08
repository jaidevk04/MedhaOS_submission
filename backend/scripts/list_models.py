#!/usr/bin/env python3
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env')

# Configure API key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ GEMINI_API_KEY not found in environment variables")
    exit(1)

genai.configure(api_key=api_key)

def list_gemini_models():
    """Prints all available Gemini models and their supported methods."""
    print("\n🤖 Available Gemini Models:\n")
    print("=" * 100)
    
    try:
        for model in genai.list_models():
            if 'gemini' in model.name.lower() or 'generate' in str(model.supported_generation_methods):
                print(f"\n✅ Model: {model.name}")
                print(f"   Display Name: {model.display_name}")
                print(f"   Description: {model.description[:100]}...")
                print(f"   Supported Methods: {model.supported_generation_methods}")
                print(f"   Input Token Limit: {model.input_token_limit}")
                print(f"   Output Token Limit: {model.output_token_limit}")
                
    except Exception as e:
        print(f"❌ Error listing models: {e}")
    
    print("\n" + "=" * 100)
    print("\n💡 Recommended for MedhaOS:")
    print("   • For text/audio: Use models with 'generateContent' support")
    print("   • For native audio: Look for models with audio input/output capabilities")
    print()

if __name__ == "__main__":
    list_gemini_models()
