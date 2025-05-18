//learning function using telegraf


const { Telegraf, Markup, session } = require('telegraf');
require('dotenv').config();

// Initialize bot (ALWAYS use environment variables for tokens!)
const bot = new Telegraf(process.env.BOT_TOKEN || '7433555703:AAEXMi6pPKY87UN50wPMEvhj2j2hM-j-Evg');

// ==============================================
// 1. SESSION SETUP
// ==============================================
bot.use(session({
  defaultSession: () => ({
    order: {
      type: null,
      size: null,
      toppings: []
    }
  })
}));

// ==============================================
// 2. COMMAND HANDLERS
// ==============================================

// START COMMAND - Entry point
bot.command('start', (ctx) => {
  ctx.session.order = { type: null, size: null, toppings: [] }; // Reset order
  showPizzaMenu(ctx);
});

// CANCEL COMMAND - Reset order
bot.command('cancel', (ctx) => {
  ctx.session.order = { type: null, size: null, toppings: [] };
  ctx.reply('❌ Order cancelled. Use /start to begin again.');
});

// EXPLAIN COMMAND - Show bot functionality
bot.command('explain', (ctx) => {
  const explanation = `
🤖 <b>How this Pizza Bot works:</b>

1. <b>Session System</b>:
- Stores your order details (type, size, toppings)
- Uses Telegraf's session middleware

2. <b>Command Handlers</b>:
- /start - Begin new order
- /cancel - Reset current order
- /explain - This message

3. <b>Action Handlers</b>:
- Pizza type selection (Margherita/Pepperoni/Veggie)
- Size selection (Small/Medium/Large)
- Toppings selection (multi-choice)
- Order confirmation

4. <b>Features</b>:
- Interactive inline keyboards
- Real-time order updates
- Visual feedback (✅ marks)
- Price calculation
`;
  ctx.replyWithHTML(explanation);
});

// ==============================================
// 3. PIZZA ORDER FLOW
// ==============================================

// Show pizza menu
function showPizzaMenu(ctx) {
  ctx.reply('Welcome to PizzaBot! 🍕\nChoose your pizza:', 
    Markup.inlineKeyboard([
      [Markup.button.callback('Margherita', 'pizza_margherita')],
      [Markup.button.callback('Pepperoni', 'pizza_pepperoni')],
      [Markup.button.callback('Veggie', 'pizza_veggie')]
    ])
  );
}

// Handle pizza selection
bot.action(/^pizza_(margherita|pepperoni|veggie)$/, (ctx) => {
  ctx.session.order.type = ctx.match[1]; // Store selected pizza
  
  // Show size selection
  ctx.reply('Select size:',
    Markup.inlineKeyboard([
      [Markup.button.callback('Small ($8)', 'size_small')],
      [Markup.button.callback('Medium ($12)', 'size_medium')],
      [Markup.button.callback('Large ($16)', 'size_large')]
    ])
  );
});

// Handle size selection
bot.action(/^size_(small|medium|large)$/, (ctx) => {
  ctx.session.order.size = ctx.match[1]; // Store selected size
  showToppingsMenu(ctx);
});

// Show toppings menu with visual feedback
function showToppingsMenu(ctx) {
  const { toppings } = ctx.session.order;
  const isSelected = (t) => toppings.includes(t);
  
  ctx.reply('Select toppings (multiple allowed):',
    Markup.inlineKeyboard([
      [
        Markup.button.callback(isSelected('mushroom') ? '✅ Mushrooms' : 'Mushrooms', 'topping_mushroom'),
        Markup.button.callback(isSelected('olives') ? '✅ Olives' : 'Olives', 'topping_olives')
      ],
      [
        Markup.button.callback(isSelected('cheese') ? '✅ Extra Cheese' : 'Extra Cheese', 'topping_cheese'),
        Markup.button.callback('🚀 Done', 'toppings_done')
      ]
    ])
  );
}

// Handle toppings selection
bot.action(/^topping_(.+)$/, (ctx) => {
  const topping = ctx.match[1];
  const { toppings } = ctx.session.order;
  
  // Toggle topping
  if (!toppings.includes(topping)) {
    toppings.push(topping);
  } else {
    ctx.session.order.toppings = toppings.filter(t => t !== topping);
  }
  
  // Update menu
  showToppingsMenu(ctx);
});

// Handle order completion
bot.action('toppings_done', (ctx) => {
  const { type, size, toppings } = ctx.session.order;
  
  // Validate order
  if (!type || !size) {
    return ctx.reply('Please complete your order first!');
  }
  
  // Calculate price
  const sizePrices = { small: 8, medium: 12, large: 16 };
  const price = sizePrices[size] + (toppings.length * 1.5);
  
  // Send confirmation
  ctx.replyWithHTML(
    `✅ <b>Order Confirmed!</b>\n\n` +
    `🍕 <b>Type:</b> ${type.charAt(0).toUpperCase() + type.slice(1)}\n` +
    `📏 <b>Size:</b> ${size.charAt(0).toUpperCase() + size.slice(1)}\n` +
    `🧀 <b>Toppings:</b> ${toppings.length ? toppings.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ') : 'None'}\n` +
    `💵 <b>Total:</b> $${price.toFixed(2)}\n\n` +
    `Estimated delivery time: ${estimateDeliveryTime(size)}\n\n` +
    `Thank you for your order!`
  );
  
  // Reset session
  ctx.session.order = { type: null, size: null, toppings: [] };
});

// Helper function for delivery estimate
function estimateDeliveryTime(size) {
  const times = { small: '15-20', medium: '20-25', large: '25-30' };
  return `${times[size]} minutes`;
}

// ==============================================
// 4. ERROR HANDLING AND LAUNCH
// ==============================================

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('⚠️ An error occurred. Please try /start again.');
});

// Start bot
bot.launch()
  .then(() => console.log('🍕 PizzaBot is running!'))
  .catch(err => console.error('Launch error:', err));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));