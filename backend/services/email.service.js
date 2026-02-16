import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Check if email is properly configured
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true' &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASSWORD &&
    process.env.EMAIL_USER !== 'your_email@gmail.com';

let transporter = null;

if (EMAIL_ENABLED) {
    // Create reusable transporter only if email is enabled
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // Verify connection configuration
    transporter.verify((error, success) => {
        if (error) {
            console.error('❌ Email service error:', error);
        } else {
            console.log('✅ Email service is ready');
        }
    });
} else {
    console.log('📧 Email service is in MOCK mode (development)');
    console.log('   Set EMAIL_ENABLED=true in .env to enable real emails');
}

/**
 * Send email verification
 */
export const sendVerificationEmail = async (email, fullName, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Email Verification - Web Kutubxona',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📚 Web Kutubxona</h1>
                    </div>
                    <div class="content">
                        <h2>Salom, ${fullName}!</h2>
                        <p>Web Kutubxona platformasiga xush kelibsiz! Ro'yxatdan o'tganingiz uchun rahmat.</p>
                        <p>Hisobingizni faollashtirish uchun quyidagi tugmani bosing:</p>
                        <a href="${verificationUrl}" class="button">Email ni tasdiqlash</a>
                        <p>Yoki quyidagi havolani brauzeringizga nusxalang:</p>
                        <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                        <p>Agar siz bu so'rovni yubormasangiz, bu xabarni e'tiborsiz qoldiring.</p>
                        <p>Hurmat bilan,<br>Web Kutubxona jamoasi</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 Web Kutubxona. Barcha huquqlar himoyalangan.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    // Mock mode - just log the email
    if (!EMAIL_ENABLED || !transporter) {
        console.log('📧 [MOCK] Verification email for:', email);
        console.log('   Token:', verificationToken);
        console.log('   URL:', verificationUrl);
        return true;
    }

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Verification email sent to:', email);
        return true;
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        return false;
    }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, fullName, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Parolni tiklash - Web Kutubxona',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Parolni tiklash</h1>
                    </div>
                    <div class="content">
                        <h2>Salom, ${fullName}!</h2>
                        <p>Parolni tiklash so'rovi oldik. Yangi parol o'rnatish uchun quyidagi tugmani bosing:</p>
                        <a href="${resetUrl}" class="button">Parolni tiklash</a>
                        <p>Yoki quyidagi havolani brauzeringizga nusxalang:</p>
                        <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                        <div class="warning">
                            <strong>⚠️ Diqqat:</strong> Bu havola 1 soat davomida amal qiladi.
                        </div>
                        <p>Agar siz parolni tiklashni so'ramasangiz, bu xabarni e'tiborsiz qoldiring. Sizning parolingiz xavfsiz.</p>
                        <p>Hurmat bilan,<br>Web Kutubxona jamoasi</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 Web Kutubxona. Barcha huquqlar himoyalangan.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    // Mock mode - just log the email
    if (!EMAIL_ENABLED || !transporter) {
        console.log('📧 [MOCK] Password reset email for:', email);
        console.log('   Token:', resetToken);
        console.log('   URL:', resetUrl);
        return true;
    }

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent to:', email);
        return true;
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        return false;
    }
};

/**
 * Send welcome email after verification
 */
export const sendWelcomeEmail = async (email, fullName) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Xush kelibsiz - Web Kutubxona',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                    .feature { margin: 15px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Xush kelibsiz!</h1>
                    </div>
                    <div class="content">
                        <h2>Salom, ${fullName}!</h2>
                        <p>Hisobingiz muvaffaqiyatli faollashtirildi. Endi siz Web Kutubxonaning barcha imkoniyatlaridan foydalanishingiz mumkin!</p>
                        
                        <div class="features">
                            <h3>📚 Nima qilishingiz mumkin:</h3>
                            <div class="feature">✅ Minglab kitoblarni qidiring va o'qing</div>
                            <div class="feature">✅ Kitoblarni yuklab oling</div>
                            <div class="feature">✅ Shaxsiy kutubxonangizni yarating</div>
                            <div class="feature">✅ Kitoblarga sharh va baho qoldiring</div>
                            <div class="feature">✅ O'qish tarixingizni kuzating</div>
                        </div>
                        
                        <a href="${process.env.FRONTEND_URL}" class="button">Platformaga kirish</a>
                        
                        <p>Savollaringiz bo'lsa, biz bilan bog'laning!</p>
                        <p>Hurmat bilan,<br>Web Kutubxona jamoasi</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 Web Kutubxona. Barcha huquqlar himoyalangan.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    // Mock mode - just log the email
    if (!EMAIL_ENABLED || !transporter) {
        console.log('📧 [MOCK] Welcome email for:', email);
        return true;
    }

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent to:', email);
        return true;
    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        return false;
    }
};

export default {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail
};
