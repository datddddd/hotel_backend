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
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Xác nhận đặt phòng thành công - LakeSide Hotel",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2c3e50; text-align: center;">Cảm ơn bạn đã đặt phòng!</h2>
          <p>Chào bạn,</p>
          <p>Chúng tôi xin xác nhận việc đặt phòng của bạn tại <strong>LakeSide Hotel</strong> đã thành công.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Chi tiết đơn đặt phòng:</h3>
            <p><strong>Mã đặt phòng:</strong> #${bookingDetails.bookingId}</p>
            <p><strong>Ngày nhận phòng:</strong> ${bookingDetails.checkInDate}</p>
            <p><strong>Ngày trả phòng:</strong> ${bookingDetails.checkOutDate}</p>
            <p><strong>Tổng tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookingDetails.totalPrice)}</p>
            <p><strong>Trạng thái thanh toán:</strong> ${bookingDetails.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Đã đặt cọc'}</p>
          </div>
          
          <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua hotline: <strong>0123 456 789</strong>.</p>
          <p>Hẹn gặp lại bạn sớm!</p>
          <p>Trân trọng,<br>Đội ngũ LakeSide Hotel</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};

module.exports = {
  sendBookingConfirmation,
};
