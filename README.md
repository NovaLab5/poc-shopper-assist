# SweetDill - Voice Shopping Assistant

## Quick Start

```bash
docker-compose up --build
```

Open http://localhost:8080 in your browser.

# Log-in
### Enter this credential:
    paul@gmail.com
    password: abc123



# chat with me
### Conversation: Housewarming Grill Scenario
    User clicks "Chat with me"
      ↓
    Loading: "SweetDill AI is Preparing the conversation..."
      ↓
    AI: "Hey! What are you looking for today? How can I help you?"
      ↓
    User types
      ↓
    User: "Hi! I'm visiting a friend who just bought a new house and I want to bring them a gift. Can you help me find something nice?"
      ↓
    Loading: "SweetDill AI is on live search mode..."
      ↓
    AI: "That's wonderful! Housewarming gifts are always special! I'd love to help you find the perfect gift. To give you the best recommendations, could you tell me a bit more about your friend? What are their interests or hobbies?"
      ↓
    User types
      ↓
    User: "My friend is James, he's 35 years old, He absolutely loves cooking, especially foods that prepared on BBQ."
      ↓
    Loading: "SweetDill AI is finding best categories for Housewarming gifts.."
      ↓
    AI: "Perfect ,how do you think about the GRILL for housewarming gift? I can help you find a great grill that James will love! What's your budget for this gift?"
      ↓
    User types
      ↓
    User: "I want a good quality grill from a reputable brand. My budget is max $400, not more than that."
      ↓
    Loading: "SweetDill AI is Finding the best products for you..."
      ↓
    [Detailed Loading Screen with Progress:]
      ✓ Checking 2000+ products
      ✓ Evaluating product attributes
      ✓ Choosing 400+ customer reviews
      ✓ Comparing prices
      ✓ Checking return rates
      [Progress Bar: 0% → 100%]
      ↓
    AI: "Got it! A quality charcoal grill under $400 from a reputable brand for James's housewarming. I've found some excellent options that match your criteria perfectly. These are all highly-rated grills from trusted brands, well within your budget:"
      ↓
    Shows 6 Grill Products (filtered by $400 budget) [SHOW_PRODUCTS:grills]
      ↓
    Done!

[SHOWS 6 GRILL PRODUCTS]:

###### Weber Original Kettle Premium 22" - $189 (Amazon) ⭐4.8 
###### Char-Griller E1515 Patio Pro - $169 (Home Depot) ⭐4.5 
###### Royal Gourmet CD1824A Charcoal - $199 (Walmart) ⭐4.6
###### Weber Master-Touch Charcoal 22" - $359 (Amazon) ⭐4.9
###### Napoleon Charcoal Kettle Grill - $299 (Amazon) ⭐4.7
###### Oklahoma Joe's Highland Smoker - $349 (Lowes) ⭐4.6

--------------------
# Browse & Select
### Myself
    #### Browse & Select → Myself → Budget → Categories → Subcategories → Results

### Mother
    #### Browse & Select → Others → Mother → Age → Budget → Occasion → Categories → Subcategories → Results

### Friend (KNOWN FRIEND - James)
    #### Browse & Select → Others → Friend → YES → Select James → Budget → Occasion → Categories → Subcategories → Results

### Friend (NEW FRIEND)
    #### Browse & Select → Others → Friend → NO → Gender → Age → Interests → Budget → Occasion → Categories → Subcategories → Results

### Browsing
    #### Browse & Select → Browsing → Budget → Categories → Subcategories → Results

-------------------
# Talk to me
### Click on "Let's find a deal" to start the conversation
### each time after AI finished talking, Just click "Tap to respond" to continue the conversation.

### simple flow:
    User clicks "Let's Find a Deal"
      ↓
    Loading: "SweetDill AI is preparing the Voice"
      ↓
    AI: "Hi Paul! How can I help you find something today?"
      ↓
    User taps mic
      ↓
    User: "Hi! I want to buy a gift for my friend."
      ↓
    Loading: "SweetDill AI is collecting past conversation about friends..."
      ↓
    AI: "That's wonderful! Is this someone I know? What's their name?"
      ↓
    User taps mic
      ↓
    User: "Yes, it's James! Remember we bought him a grill?"
      ↓
    Loading: "SweetDill AI is retrives {frind Name} related data..."
      ↓
    AI: "I know James! He loves grilling and watches. What's the occasion?"
      ↓
    User taps mic
      ↓
    User: "Its his birthday"
      ↓
    Loading: "SweetDill AI is thinking..."
      ↓
    AI: "Birthday! That's a great occasion. what is the budget you have in mind?"
      ↓
    User taps mic
      ↓
    User: "I think max 600$, what do you think will be the best gift for him?"
      ↓
    Loading: "SweetDill AI is checking historical conversations..."
      ↓
    AI: "Since you already bought him a grill, and he loves technology and watche how about an Apple Watch?"
      ↓
    User taps mic 
      ↓
    User: "Sure, that's a good choice"
      ↓
    Loading: "SweetDill AI is preparing the products..."
      ↓
    AI: "Great! I think we can find a great Apple Watch for James, within your budget. Let me show you some options."
      ↓
    Loading: "SweetDill searching for the best products..."
      ↓
    [Detailed Loading Screen with Progress:]
      ✓ Checking 2000+ products
      ✓ Evaluating product attributes
      ✓ Choosing 400+ customer reviews
      ✓ Comparing prices
      ✓ Checking return rates
      [Progress Bar: 0% → 100%]
      ↓
    Shows 4 Apple Watch Products (filtered by $600 budget) [SHOW_PRODUCTS:apple_watch]
      ↓
    Done!