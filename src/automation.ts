import * as nodemailer from 'nodemailer'

// Your email configuration - hardcoded from your settings
const EMAIL_CONFIG = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "noelmbewe879@gmail.com",
    pass: "ifxvwpeqdrjspwxe"
  },
  tls: {
    rejectUnauthorized: false
  }
}

// Create transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG)

// Define the automation step definition
export const definition = {
  name: "Send Custom Email",
  tagline: "Send emails using Gmail SMTP",
  icon: "Email",
  description: "Send custom emails through your Gmail SMTP configuration",
  type: "action",
  stepId: "SEND_CUSTOM_EMAIL",
  inputs: {
    properties: {
      recipientEmail: {
        type: "string",
        title: "Recipient Email",
        description: "Email address to send to"
      },
      recipientName: {
        type: "string",
        title: "Recipient Name", 
        description: "Name of the recipient (optional)"
      },
      emailSubject: {
        type: "string",
        title: "Email Subject",
        description: "Subject line of the email"
      },
      emailBody: {
        type: "string",
        title: "Email Body",
        description: "HTML or plain text content of the email"
      },
      isHtml: {
        type: "boolean",
        title: "HTML Email",
        description: "Whether the email body contains HTML",
        default: true
      },
      ccEmails: {
        type: "string",
        title: "CC Emails",
        description: "Comma-separated list of CC email addresses"
      },
      bccEmails: {
        type: "string", 
        title: "BCC Emails",
        description: "Comma-separated list of BCC email addresses"
      }
    },
    required: ["recipientEmail", "emailSubject", "emailBody"]
  },
  outputs: {
    properties: {
      success: {
        type: "boolean",
        description: "Whether the email was sent successfully",
      },
      messageId: {
        type: "string",
        description: "Email message ID from the server",
      },
      error: {
        type: "string",
        description: "Error message if sending failed",
      },
      recipientEmail: {
        type: "string", 
        description: "The email address that was sent to",
      }
    },
    required: ["success"],
  },
}

// Helper functions
const parseEmailList = (emailString?: string): string[] => {
  if (!emailString) return []
  return emailString.split(',').map(email => email.trim()).filter(email => email)
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Main automation function
export async function run(params: { inputs: any }): Promise<any> {
  const { inputs } = params
  try {
    console.log('Email automation inputs:', inputs)
    
    const {
      recipientEmail,
      recipientName,
      emailSubject,
      emailBody,
      isHtml = true,
      ccEmails,
      bccEmails
    } = inputs

    // Validate required inputs
    if (!recipientEmail || !emailSubject || !emailBody) {
      return {
        success: false,
        error: "Missing required fields: recipientEmail, emailSubject, or emailBody",
        recipientEmail: recipientEmail || "unknown"
      }
    }

    // Validate email format
    if (!isValidEmail(recipientEmail)) {
      return {
        success: false,
        error: "Invalid recipient email format",
        recipientEmail
      }
    }

    // Parse CC and BCC emails
    const ccList = parseEmailList(ccEmails)
    const bccList = parseEmailList(bccEmails)

    // Validate CC and BCC emails
    for (const email of [...ccList, ...bccList]) {
      if (!isValidEmail(email)) {
        return {
          success: false,
          error: `Invalid email format in CC/BCC: ${email}`,
          recipientEmail
        }
      }
    }

    // Verify SMTP connection
    await transporter.verify()

    // Prepare email options
    const mailOptions: any = {
      from: `"AD-StdConsentTest" <noelmbewe879@gmail.com>`,
      to: recipientName ? `"${recipientName}" <${recipientEmail}>` : recipientEmail,
      subject: emailSubject,
      [isHtml ? 'html' : 'text']: emailBody
    }

    // Add CC and BCC if provided
    if (ccList.length > 0) {
      mailOptions.cc = ccList.join(', ')
    }
    if (bccList.length > 0) {
      mailOptions.bcc = bccList.join(', ')
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    console.log('Email sent successfully:', info.messageId)

    return {
      success: true,
      messageId: info.messageId,
      recipientEmail,
      error: null
    }

  } catch (error: any) {
    console.error('Email sending failed:', error)
    
    return {
      success: false,
      messageId: null,
      error: error.message || 'Unknown error occurred while sending email',
      recipientEmail: inputs.recipientEmail || "unknown"
    }
  }
}

// Default export for the automation - Budibase expects this structure
export default {
  definition,
  run
}