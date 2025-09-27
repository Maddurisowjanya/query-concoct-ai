# 🔑 Setting up Gemini API Key

The billing counter works great, and the app provides fallback responses when the Gemini API key isn't configured. Here's how to get real AI responses:

## 🚀 Quick Setup

1. **Get a Gemini API Key:**
   - Go to [Google AI Studio](https://ai.google.dev/)
   - Click "Get API Key"
   - Create a new project or select existing one
   - Generate your API key

2. **Add the API Key:**
   - Open `.env.local` file in your project root
   - Replace `placeholder_key_replace_with_real_api_key` with your actual API key
   - Save the file

3. **Example `.env.local`:**
   ```
   VITE_GEMINI_API_KEY=AIzaSyC-your-actual-api-key-here
   VITE_APP_ENV=development
   ```

4. **Restart the app:**
   ```bash
   npm run dev
   ```

## 🧪 Test Billing

Once the API key is set up:

1. Go to the Query Interface (`/query`)
2. Try asking a question like "What is machine learning?"
3. Check the billing counter at `/billing`
4. Or use the "Test Billing" button on the billing page

## 💰 How Billing Works

- **$0.10** charged per query when you submit a question
- **$0.25** charged per report when AI generates a response
- Billing data is stored in localStorage and persists between sessions
- Even if the AI fails, the query is still billed (fallback response provided)

## 🐛 Troubleshooting

If billing still isn't working:

1. **Check browser console** for error messages
2. **Use "Test Billing" button** on the billing page to test billing directly
3. **Verify API key** is correct and active in Google AI Studio
4. **Clear localStorage** and try again

## 🔍 Debug Mode

The billing page now includes a debug section that lets you test billing without processing queries through the AI system.

## ✅ App Features

**The app now provides:**
- ✅ Realistic fallback responses when API key isn't configured
- ✅ Smart content generation based on query topics (ML, blockchain, healthcare, quantum, etc.)
- ✅ Simulated online sources with realistic citations
- ✅ Professional industry research templates
- ✅ Real Gemini AI responses when API key is properly configured
- ✅ Accurate billing tracking for all queries
- ✅ Persistent billing data across browser sessions
