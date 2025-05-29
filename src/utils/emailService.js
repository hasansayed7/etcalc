import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);

/**
 * Send an email using EmailJS
 * @param {Object} data - The email data
 * @param {string} data.to_email - Recipient's email address
 * @param {string} data.subject - Email subject
 * @param {string} data.message - Email message content
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendEmail = async (data) => {
  try {
    const templateParams = {
      to_email: data.to_email,
      subject: data.subject,
      message: data.message,
    };

    const response = await emailjs.send(
      process.env.REACT_APP_EMAILJS_SERVICE_ID,
      process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
      templateParams
    );

    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 