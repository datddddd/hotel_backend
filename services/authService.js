const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const authRepository = require("../repositories/authRepository");
const emailService = require("./emailService");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Validate
const validateRegisterInput = ({ user_name, email, password }) => {
  if (!user_name || !password || !email) {
    return "Thiếu thông tin đăng ký!";
  }
  if (password.length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự!";
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return "Email không hợp lệ!";
  }
  return null;
};

// Register
const register = async ({ user_name, email, password }) => {
  const validationError = validateRegisterInput({ user_name, email, password });
  if (validationError) {
    return { badRequest: validationError };
  }

  const existingUser = await authRepository.getUserByEmail(email);
  if (existingUser) {
    return { badRequest: "Email này đã được đăng ký. Vui lòng dùng email khác!" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await authRepository.createUser({
    user_name,
    email,
    password: hashedPassword,
    role_user: "user",
  });

  return { success: true };
};

// Login
const login = async ({ email, password }) => {
  const user = await authRepository.getUserByEmail(email);
  if (!user) {
    return { notFound: true };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { invalidPassword: true };
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role_user,
      user_name: user.user_name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return {
    token,
    user: {
      id: user.id,
      user_name: user.user_name,
      email: user.email,
      role: user.role_user,
    },
  };
};

// Google Login
const googleLogin = async ({ credential }) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await authRepository.getUserByEmail(email);

    if (!user) {
      await authRepository.createUser({
        user_name: name,
        email: email,
        password: await bcrypt.hash(googleId, 10),
        role_user: "user",
      });

      user = await authRepository.getUserByEmail(email);
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required");
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role_user,
        user_name: user.user_name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return {
      token,
      user: {
        id: user.id,
        user_name: user.user_name,
        email: user.email,
        role: user.role_user,
      },
    };
  } catch (error) {
    console.error("Google Auth Error:", error);
    throw new Error("Xác thực Google thất bại");
  }
};

// Forgot Password
const forgotPassword = async (email) => {
  const user = await authRepository.getUserByEmail(email);
  if (!user) {
    throw new Error("Email không tồn tại trong hệ thống");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  const token = jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  await emailService.sendResetPasswordEmail(email, resetLink);

  return { success: true, message: "Email khôi phục đã được gửi" };
};

// Reset Password
const resetPassword = async ({ token, newPassword }) => {
  if (!token || !newPassword) {
    throw new Error("Thiếu token hoặc mật khẩu mới");
  }

  if (newPassword.length < 6) {
    throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await authRepository.updatePassword(decoded.email, hashedPassword);

    return { success: true, message: "Đặt lại mật khẩu thành công" };
  } catch (error) {
    throw new Error("Token không hợp lệ hoặc đã hết hạn");
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
};