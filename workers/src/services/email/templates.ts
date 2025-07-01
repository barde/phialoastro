import type { ContactFormData } from './types';

interface EmailTemplate {
	subject: string;
	html: string;
	text: string;
}

export function generateContactEmailTemplate(data: ContactFormData): EmailTemplate {
	const isGerman = data.language === 'de';

	// Subject
	const subject = isGerman
		? `Neue Kontaktanfrage: ${data.subject}`
		: `New Contact Request: ${data.subject}`;

	// HTML template
	const html = `
<!DOCTYPE html>
<html lang="${data.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 20px rgba(0,0,0,0.05);
        }
        .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 300;
            letter-spacing: 1px;
        }
        .content {
            padding: 40px 30px;
        }
        .field {
            margin-bottom: 25px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 15px;
        }
        .field:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: 600;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .value {
            font-size: 16px;
            color: #1a1a1a;
            white-space: pre-wrap;
        }
        .footer {
            background-color: #f8f8f8;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .metadata {
            margin-top: 30px;
            padding: 20px;
            background-color: #f8f8f8;
            border-radius: 8px;
            font-size: 12px;
            color: #666;
        }
        .metadata-item {
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Phialo Design</h1>
        </div>
        <div class="content">
            <h2 style="margin-top: 0; color: #1a1a1a; font-weight: 400;">
                ${isGerman ? 'Neue Kontaktanfrage' : 'New Contact Request'}
            </h2>
            
            <div class="field">
                <div class="label">${isGerman ? 'Name' : 'Name'}</div>
                <div class="value">${escapeHtml(data.name)}</div>
            </div>
            
            <div class="field">
                <div class="label">${isGerman ? 'E-Mail' : 'Email'}</div>
                <div class="value"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></div>
            </div>
            
            ${data.phone ? `
            <div class="field">
                <div class="label">${isGerman ? 'Telefon' : 'Phone'}</div>
                <div class="value">${escapeHtml(data.phone)}</div>
            </div>
            ` : ''}
            
            <div class="field">
                <div class="label">${isGerman ? 'Betreff' : 'Subject'}</div>
                <div class="value">${escapeHtml(data.subject)}</div>
            </div>
            
            <div class="field">
                <div class="label">${isGerman ? 'Nachricht' : 'Message'}</div>
                <div class="value">${escapeHtml(data.message)}</div>
            </div>
            
            ${data.metadata ? `
            <div class="metadata">
                <h3 style="margin-top: 0; margin-bottom: 10px; font-weight: 600;">
                    ${isGerman ? 'Zusätzliche Informationen' : 'Additional Information'}
                </h3>
                ${data.metadata.timestamp ? `
                <div class="metadata-item">
                    <strong>${isGerman ? 'Zeitstempel' : 'Timestamp'}:</strong> 
                    ${new Date(data.metadata.timestamp).toLocaleString(data.language === 'de' ? 'de-DE' : 'en-US')}
                </div>
                ` : ''}
                ${data.metadata.ipAddress ? `
                <div class="metadata-item">
                    <strong>${isGerman ? 'IP-Adresse' : 'IP Address'}:</strong> ${escapeHtml(data.metadata.ipAddress)}
                </div>
                ` : ''}
                ${data.metadata.userAgent ? `
                <div class="metadata-item">
                    <strong>${isGerman ? 'Browser' : 'Browser'}:</strong> ${escapeHtml(data.metadata.userAgent)}
                </div>
                ` : ''}
                ${data.metadata.referrer ? `
                <div class="metadata-item">
                    <strong>${isGerman ? 'Referrer' : 'Referrer'}:</strong> ${escapeHtml(data.metadata.referrer)}
                </div>
                ` : ''}
            </div>
            ` : ''}
        </div>
        <div class="footer">
            <p>
                ${isGerman 
                    ? 'Diese E-Mail wurde automatisch vom Kontaktformular auf phialo.de generiert.' 
                    : 'This email was automatically generated from the contact form on phialo.de.'}
            </p>
        </div>
    </div>
</body>
</html>
`;

	// Plain text template
	const text = `
${isGerman ? 'NEUE KONTAKTANFRAGE' : 'NEW CONTACT REQUEST'}
${'='.repeat(50)}

${isGerman ? 'Name' : 'Name'}: ${data.name}
${isGerman ? 'E-Mail' : 'Email'}: ${data.email}
${data.phone ? `${isGerman ? 'Telefon' : 'Phone'}: ${data.phone}\n` : ''}
${isGerman ? 'Betreff' : 'Subject'}: ${data.subject}

${isGerman ? 'Nachricht' : 'Message'}:
${data.message}

${data.metadata ? `
${isGerman ? 'Zusätzliche Informationen' : 'Additional Information'}:
${'-'.repeat(30)}
${data.metadata.timestamp ? `${isGerman ? 'Zeitstempel' : 'Timestamp'}: ${new Date(data.metadata.timestamp).toLocaleString(data.language === 'de' ? 'de-DE' : 'en-US')}\n` : ''}
${data.metadata.ipAddress ? `${isGerman ? 'IP-Adresse' : 'IP Address'}: ${data.metadata.ipAddress}\n` : ''}
${data.metadata.userAgent ? `${isGerman ? 'Browser' : 'Browser'}: ${data.metadata.userAgent}\n` : ''}
${data.metadata.referrer ? `Referrer: ${data.metadata.referrer}\n` : ''}
` : ''}

${'='.repeat(50)}
${isGerman 
	? 'Diese E-Mail wurde automatisch vom Kontaktformular auf phialo.de generiert.' 
	: 'This email was automatically generated from the contact form on phialo.de.'}
`;

	return { subject, html, text };
}

export function generateContactConfirmationTemplate(data: ContactFormData): EmailTemplate {
	const isGerman = data.language === 'de';

	const subject = isGerman
		? 'Ihre Nachricht wurde empfangen - Phialo Design'
		: 'Your message has been received - Phialo Design';

	const html = `
<!DOCTYPE html>
<html lang="${data.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 20px rgba(0,0,0,0.05);
        }
        .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
            letter-spacing: 2px;
        }
        .content {
            padding: 40px 30px;
        }
        .message-box {
            background-color: #f8f8f8;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8f8f8;
            padding: 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
        a {
            color: #1a1a1a;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Phialo Design</h1>
        </div>
        <div class="content">
            <h2 style="margin-top: 0; color: #1a1a1a; font-weight: 400;">
                ${isGerman ? `Liebe/r ${data.name},` : `Dear ${data.name},`}
            </h2>
            
            <p>
                ${isGerman 
                    ? 'vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und werden uns so schnell wie möglich bei Ihnen melden.'
                    : 'thank you for your message. We have received your inquiry and will get back to you as soon as possible.'}
            </p>
            
            <p>
                ${isGerman 
                    ? 'Hier ist eine Kopie Ihrer Nachricht:'
                    : 'Here is a copy of your message:'}
            </p>
            
            <div class="message-box">
                <p><strong>${isGerman ? 'Betreff' : 'Subject'}:</strong> ${escapeHtml(data.subject)}</p>
                <p><strong>${isGerman ? 'Nachricht' : 'Message'}:</strong><br>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
            </div>
            
            <p>
                ${isGerman 
                    ? 'Falls Sie weitere Fragen haben, können Sie uns gerne erneut kontaktieren.'
                    : 'If you have any further questions, please feel free to contact us again.'}
            </p>
            
            <p>
                ${isGerman ? 'Mit freundlichen Grüßen,' : 'Best regards,'}<br>
                <strong>Phialo Design Team</strong>
            </p>
        </div>
        <div class="footer">
            <p>
                ${isGerman 
                    ? 'Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.'
                    : 'This email was automatically generated. Please do not reply directly to this email.'}
            </p>
            <p>
                <a href="https://phialo.de">phialo.de</a> | 
                <a href="mailto:info@phialo.de">info@phialo.de</a>
            </p>
        </div>
    </div>
</body>
</html>
`;

	const text = `
${isGerman ? `Liebe/r ${data.name},` : `Dear ${data.name},`}

${isGerman 
	? 'vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und werden uns so schnell wie möglich bei Ihnen melden.'
	: 'thank you for your message. We have received your inquiry and will get back to you as soon as possible.'}

${isGerman 
	? 'Hier ist eine Kopie Ihrer Nachricht:'
	: 'Here is a copy of your message:'}

${'-'.repeat(50)}
${isGerman ? 'Betreff' : 'Subject'}: ${data.subject}
${isGerman ? 'Nachricht' : 'Message'}:
${data.message}
${'-'.repeat(50)}

${isGerman 
	? 'Falls Sie weitere Fragen haben, können Sie uns gerne erneut kontaktieren.'
	: 'If you have any further questions, please feel free to contact us again.'}

${isGerman ? 'Mit freundlichen Grüßen,' : 'Best regards,'}
Phialo Design Team

--
${isGerman 
	? 'Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.'
	: 'This email was automatically generated. Please do not reply directly to this email.'}

phialo.de | info@phialo.de
`;

	return { subject, html, text };
}

function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	};
	return text.replace(/[&<>"']/g, m => map[m]);
}