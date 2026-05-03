const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendBookingConfirmation = async (email, bookingDetails) => {
  try {
    const mailOptions = {
      from: `"LakeSide Hotel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🏨 Xác nhận đặt phòng #${bookingDetails.bookingId} - LakeSide Hotel`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <div style="background-color: #2c3e50; padding: 30px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">XÁC NHẬN ĐẶT PHÒNG</h1>
            <p style="opacity: 0.8; margin-top: 10px;">Cảm ơn bạn đã lựa chọn LakeSide Hotel</p>
          </div>

          <!-- Body -->
          <div style="padding: 30px; color: #444; line-height: 1.6;">
            <p>Chào <strong>${bookingDetails.customerName || 'quý khách'}</strong>,</p>
            <p>Đơn đặt phòng của bạn đã được hệ thống ghi nhận thành công. Dưới đây là thông tin chi tiết cho kỳ nghỉ sắp tới:</p>

            <!-- Details Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fcfcfc; border-radius: 5px;">
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; color: #777;">Mã đơn hàng</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #2c3e50;">#${bookingDetails.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; color: #777;">Ngày nhận phòng</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${bookingDetails.checkInDate}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; color: #777;">Ngày trả phòng</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${bookingDetails.checkOutDate}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; color: #777;">Trạng thái</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
                  <span style="background-color: #d4edda; color: #155724; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                    ${bookingDetails.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN' : 'ĐÃ ĐẶT CỌC'}
                  </span>
                </td>
              </tr>
              <tr style="font-size: 18px;">
                <td style="padding: 15px; color: #2c3e50; font-weight: bold;">Tổng cộng</td>
                <td style="padding: 15px; text-align: right; color: #e67e22; font-weight: bold;">
                  ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookingDetails.totalPrice)}
                </td>
              </tr>
            </table>

            <div style="padding: 20px; border-left: 4px solid #2c3e50; background-color: #f8f9fa; font-size: 13px;">
              <strong>Lưu ý:</strong> Quý khách vui lòng mang theo CMND/CCCD hoặc Hộ chiếu khi làm thủ tục nhận phòng. Thời gian check-in tiêu chuẩn là 14:00.
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888;">
            <p style="margin: 5px 0;">Hotline hỗ trợ: <strong>0123 456 789</strong></p>
            <p style="margin: 5px 0;">Địa chỉ: 123 Đường Hồ Tây, Hà Nội, Việt Nam</p>
            <div style="margin-top: 15px;">
              <a href="#" style="margin: 0 10px; color: #888; text-decoration: none;">Facebook</a> | 
              <a href="#" style="margin: 0 10px; color: #888; text-decoration: none;">Instagram</a> | 
              <a href="#" style="margin: 0 10px; color: #888; text-decoration: none;">Website</a>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};


const sendResetPasswordEmail = async (to, resetLink) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0;">
      <div style="background-color: #1a73e8; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Hệ Thống Hotel</h1>
      </div>
      
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #333;">Khôi phục mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấn vào nút bên dưới để tiến hành thay đổi mật khẩu:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #1a73e8; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
             Đặt lại mật khẩu ngay
          </a>
        </div>
        
        <p style="font-size: 0.9em; color: #666;">
          Nếu nút trên không hoạt động, bạn có thể copy và dán đường dẫn này vào trình duyệt: <br>
          <a href="${resetLink}" style="color: #1a73e8;">${resetLink}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="font-size: 0.8em; color: #999;">
          Nếu bạn không yêu cầu thay đổi này, hãy bỏ qua email này. Tài khoản của bạn vẫn sẽ được bảo mật.
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #777;">
        &copy; ${new Date().getFullYear()} Hotel System. All rights reserved. <br>
        Địa chỉ: 123 Đường ABC, Quận 1, TP. Hồ Chí Minh
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: '"Hệ thống Hotel" <no-reply@hotel.com>',
    to,
    subject: "Yêu cầu khôi phục mật khẩu",
    html: htmlContent,
  });
};

module.exports = {
  sendBookingConfirmation,
  sendResetPasswordEmail,
};
