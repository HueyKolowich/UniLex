require('dotenv').config({ path: __dirname + '/.env' });

const postmark = require('postmark');

const postmarkClient = new postmark.ServerClient(process.env.POSTMARK_SERVER_API_TOKEN);

class ContactService {
    sendEmail(toAddress, subject, body) {
        postmarkClient.sendEmail({
            "From": "contact@unilexlanguage.com",
            "To": toAddress,
            "Subject": subject,
            "TextBody": body,
            "MessageStream": "outbound"
        });
    }
}

module.exports = {
    ContactService
};