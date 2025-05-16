const { evaluate } = require('mathjs');

function Calculator(message) {
    try {
        // Only allow numbers and basic math operators
        if (/^[\d+\-*/().\s]+$/.test(message)) {
            const result = evaluate(message);
            return `Result: ${result}`;
        } else {
            return 'Invalid input. Please enter a valid math expression (e.g., 2+2).';
        }
    } catch (error) {
        return 'Error calculating the expression.';
    }
}

module.exports = { Calculator };

// // In your message handler
// if (/^[\d+\-*/().\s]+$/.test(msg.text)) {
//     Calculator(msg.chat.id, msg.text, bot);
// }