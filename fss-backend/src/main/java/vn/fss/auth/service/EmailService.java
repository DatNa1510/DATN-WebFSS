package vn.fss.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Async
    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Xác thực tài khoản Fashion Shopping Sense (FSS)");

            String verifyLink = frontendUrl + "/verify-email?token=" + token;

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                        .header { background-color: #00168D; padding: 30px; text-align: center; color: white; }
                        .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
                        .button { display: inline-block; background-color: #00168D; color: #ffffff !important; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; margin-top: 20px; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; }
                        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
                        .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">FSS</div>
                            <p style="margin-top: 10px; opacity: 0.8;">Fashion Shopping Sense</p>
                        </div>
                        <div class="content">
                            <h2>Xin chào %s!</h2>
                            <p>Cảm ơn bạn đã đăng ký tài khoản tại hệ thống Fashion Shopping Sense.</p>
                            <p>Để hoàn tất quá trình đăng ký và kích hoạt tài khoản của bạn, vui lòng click vào nút bên dưới:</p>
                            <div style="text-align: center;">
                                <a href="%s" class="button">Xác nhận tài khoản</a>
                            </div>
                            <p style="margin-top: 30px; font-size: 13px; color: #94a3b8;">
                                Hoặc copy đường dẫn này và dán vào trình duyệt của bạn:<br>
                                <a href="%s" style="color: #00168D;">%s</a>
                            </p>
                            <p style="margin-top: 30px; font-size: 13px;">Lưu ý: Đường dẫn này sẽ hết hạn sau 24 giờ.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 Fashion Shopping Sense. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(fullName, verifyLink, verifyLink, verifyLink);

            helper.setText(htmlContent, true); // true = HTML

            javaMailSender.send(message);
            log.info("Verification email sent to {}", toEmail);

        } catch (MessagingException e) {
            log.error("Failed to send email to {}", toEmail, e);
            throw new RuntimeException("Lỗi hệ thống khi gửi email xác thực");
        }
    }

    @Async
    public void sendResetPasswordEmail(String toEmail, String fullName, String token) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Yêu cầu khôi phục mật khẩu Fashion Shopping Sense (FSS)");

            String resetLink = frontendUrl + "/reset-password?token=" + token;

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                        .header { background-color: #e11d48; padding: 30px; text-align: center; color: white; }
                        .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
                        .button { display: inline-block; background-color: #e11d48; color: #ffffff !important; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; margin-top: 20px; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; }
                        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
                        .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">FSS</div>
                            <p style="margin-top: 10px; opacity: 0.8;">Khôi phục mật khẩu</p>
                        </div>
                        <div class="content">
                            <h2>Xin chào %s!</h2>
                            <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn tại hệ thống Fashion Shopping Sense.</p>
                            <p>Vui lòng click vào nút bên dưới để thiết lập mật khẩu mới:</p>
                            <div style="text-align: center;">
                                <a href="%s" class="button">Thiết lập mật khẩu mới</a>
                            </div>
                            <p style="margin-top: 30px; font-size: 13px; color: #94a3b8;">
                                Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.<br>
                                Link này sẽ hết hạn sau 1 giờ.
                            </p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Fashion Shopping Sense. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(fullName, resetLink);

            helper.setText(htmlContent, true); // true = HTML

            javaMailSender.send(message);
            log.info("Reset password email sent to {}", toEmail);

        } catch (MessagingException e) {
            log.error("Failed to send reset email to {}", toEmail, e);
            throw new RuntimeException("Lỗi hệ thống khi gửi email khôi phục mật khẩu");
        }
    }
}
