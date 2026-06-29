import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
    try {
        let transporter;

        // If environment variables are set, use them. Otherwise, fall back to console logging and test account
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || "smtp.gmail.com",
                port: parseInt(process.env.EMAIL_PORT || "587"),
                secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
        } else {
            console.log("---------------- EMAIL FALLBACK ----------------");
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`HTML: ${html}`);
            console.log("------------------------------------------------");
            
            // Generate SMTP service on the fly for testing
            try {
                const testAccount = await nodemailer.createTestAccount();
                transporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
            } catch (err) {
                // If even ethereal fails, just return
                return { success: true, logged: true };
            }
        }

        const info = await transporter.sendMail({
            from: `"NewJourney Support" <${process.env.EMAIL_USER || "no-reply@newjourney.com"}>`,
            to,
            subject,
            html,
        });

        if (!process.env.EMAIL_USER) {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        return { success: true, info };
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};
